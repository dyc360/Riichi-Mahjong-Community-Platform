import requests
from django.http import HttpResponse
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from auth_api.permissions import IsPracticeEditor, HasPracticePermissions
from rest_framework.response import Response
from rest_framework import status
from rest_framework.viewsets import ModelViewSet
from rest_framework.generics import RetrieveAPIView
from .models import Naze300Question, UserNazeProgress
from .serializers import Naze300QuestionSerializer
from rest_framework.decorators import action
from rest_framework.viewsets import ModelViewSet
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Case, When, BooleanField
import urllib.parse
import traceback

from .models import Naze300Question, UserNazeProgress

from mahjong_utils.majhand_generator.majhand_generator_normal import generate_normal_hand
from mahjong_utils.majhand_generator.majhand_generator_chiitoitsu import generate_chiitoitsu_hand
from mahjong_utils.majhand_generator.majhand_generator_kokushimusou import generate_kokushimusou_hand
from mahjong_utils.majhand_generator.majhand_generator_win import generate_win_majhand
from mahjong_utils.mahjong.mahjong.hand_calculating.fu import FuCalculator
from mahjong_utils.majhand_generator.majhand_generator_efficiency import process_efficiency
from mahjong_utils.majhand_generator.majhand_generator_chinitsu import process_efficiency_chinitsu

from mahjong.tile import TilesConverter
from mahjong.meld import Meld

class MahjongTileView(APIView):
    # 根据需求，可以设置为 IsAuthenticated 或 AllowAny
    # 如果希望只有登录用户才能生成图片，使用 IsAuthenticated
    permission_classes = [AllowAny] 

    def get(self, request, tiles):
        """
        代理请求到 Mahjim Go 服务生成麻将牌图片
        """
        # 获取 Mahjim 服务的地址，默认为本地 8081 端口
        mahjim_service_url = getattr(settings, 'MAHJIM_SERVICE_URL', 'http://localhost:8081')
        
        # 构建目标 URL
        # Mahjim 的 API 格式是 http://host:port/<tiles>
        # 同时需要透传查询参数（如果有的话，比如样式配置）
        target_url = f"{mahjim_service_url}/{tiles}"
        
        try:
            # 发起请求到 Go 服务
            # stream=True 用于处理二进制流，避免一次性加载大文件到内存
            response = requests.get(target_url, params=request.GET, stream=True)
            
            # 检查上游服务响应状态
            if response.status_code != 200:
                return Response(
                    {"error": "Failed to generate image from upstream service"}, 
                    status=status.HTTP_502_BAD_GATEWAY
                )
            
            # 直接将上游的响应流式传输回前端
            return HttpResponse(
                response.iter_content(chunk_size=8192),
                content_type=response.headers.get('Content-Type', 'image/png'),
                status=response.status_code
            )
            
        except requests.RequestException as e:
            return Response(
                {"error": f"Service unavailable: {str(e)}"}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

class MahjongPointView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # 禁用认证以跳过 CSRF 检查

    def post(self, request):
        """
        计算麻将手牌点数
        请求体应包含：
        - type: 请求类型。如果为"practice"，则不需要后面的参数，
        - hand: 手牌字符串表示
        - win_tile: 和牌的牌字符串表示
        - win_tile_is_dora: 和牌是否为宝牌（可选，默认 False）
        - agari_types: 和牌类型字典（可选）
        - melds: 明杠、碰等副露信息列表（可选）
        """
        try:
            data = request.data
            request_type = data.get('type', 'practice')
            response_data = {}
            if request_type == 'practice_point':
                # 练习模式，生成随机和牌并计算点数
                hand_type = data.get('hand_type', None)  # 可选指定手牌类型
                allow_no_yaku = data.get('allow_no_yaku', False)  # 是否允许无役和牌

                hand, agari = generate_win_majhand(hand_type=hand_type, allow_no_yaku=allow_no_yaku)

                # Ensure melds is a list
                melds = hand.melds if hand.melds else []

                # Serialize melds
                serialized_melds = []
                for meld in melds:
                    serialized_melds.append({
                        "type": meld.type,
                        "tiles": meld.tiles,
                        "opened": meld.opened,
                        "called_tile": meld.called_tile,
                        "who": meld.who,
                        "from_who": meld.from_who
                    })
                
                # 5. Format melds
                melds_str_list = []
                meld_str_with_closed_pon = []
                for meld in melds:
                    m_tiles = sorted(meld.tiles)
                    called_idx = -1
                    if meld.called_tile in m_tiles:
                        called_idx = m_tiles.index(meld.called_tile)
                    
                    vals = []
                    suffix = ""
                    
                    meld_in_normal_representation = TilesConverter.to_one_line_string(m_tiles, print_aka_dora=True)
                    def get_tile_suffix(meld_in_normal_representation):
                        if meld_in_normal_representation[-1] in ['m', 'p', 's', 'z']:
                            return meld_in_normal_representation[-1]
                        return ''
                    
                    meld_string = ""
                    if not meld.opened:
                        # Closed Kan: + 1 1 +
                        if len(m_tiles) == 4:
                            v1 = meld_in_normal_representation[0]
                            v2 = meld_in_normal_representation[1]
                            suffix = get_tile_suffix(meld_in_normal_representation)
                            meld_string = f"+{v1}{v2}{suffix}+"
                        elif len(m_tiles) == 3:
                            meld_str_with_closed_pon.append(meld_in_normal_representation)
                    else:
                        meld_string = meld_in_normal_representation[:called_idx] + "_" + meld_in_normal_representation[called_idx] + meld_in_normal_representation[called_idx+1:]
                    
                    melds_str_list.append(meld_string)
                    meld_str_with_closed_pon.append(meld_string)

                def get_kotsu_34_str_in_melds_str_list(tile_str: str, meld_str_with_closed_pon: list) -> str:
                    # print(tile_str)
                    # kotsu_str = TilesConverter.to_one_line_string([TilesConverter.to_136_array([tile_str])[0]], print_aka_dora=True)
                    # print(f"kotsu_str: {kotsu_str}")
                    tile_34 = int(tile_str)
                    suit = tile_34 // 9
                    index_in_suit = tile_34 % 9 + 1
                    kotsu_str = f"{index_in_suit}{['m','p','s','z'][suit]}"
                    for meld_str in meld_str_with_closed_pon:
                        if kotsu_str in meld_str:
                            return meld_str
                    return f'{kotsu_str}{kotsu_str}{kotsu_str}'
                
                def convert_fu_reason_to_chinese(fu_reason: str) -> str:
                    mapping = {
                        FuCalculator.PENCHAN: "边张",
                        FuCalculator.KANCHAN: "坎张",
                        FuCalculator.VALUED_PAIR: "役牌雀头",
                        FuCalculator.DOUBLE_VALUED_PAIR: "连风雀头",
                        FuCalculator.PAIR_WAIT: "单骑听牌",
                        FuCalculator.CLOSED_PON: "中张暗刻",
                        FuCalculator.OPEN_PON: "中张明刻",
                        FuCalculator.CLOSED_TERMINAL_PON: "幺九暗刻",
                        FuCalculator.OPEN_TERMINAL_PON: "幺九明刻",
                        FuCalculator.CLOSED_KAN: "中张暗杠",
                        FuCalculator.OPEN_KAN: "中张明杠",
                        FuCalculator.CLOSED_TERMINAL_KAN: "幺九暗杠",
                        FuCalculator.OPEN_TERMINAL_KAN: "幺九明杠",
                        FuCalculator.BASE: "底符",
                        FuCalculator.TSUMO: "自摸",
                        FuCalculator.HAND_WITHOUT_FU: "副露平和型荣和‌",
                    }
                    return mapping.get(fu_reason, fu_reason)
                
                
                # Serialize fu details
                fu_details = []
                for fu_detail in agari.fu_details:
                    fu_url = ""
                    reason = fu_detail.get("reason", "")
                    description = ""
                    if reason == FuCalculator.PENCHAN:
                        tile = hand.win_tile
                        suit = tile[1]
                        if tile[0] == '3':
                            fu_url = f'12{suit}|{tile}'
                            fu_url = urllib.parse.quote_plus(fu_url)
                        elif tile[0] == '7':
                            fu_url = f'{tile}|89{suit}'
                            fu_url = urllib.parse.quote_plus(fu_url)
                    elif reason == FuCalculator.KANCHAN:
                        tile = hand.win_tile
                        suit = tile[1]
                        number = tile[0] if tile[0] != '0' else '5'
                        fu_url = f'{str(int(number)-1)}{suit}{str(int(number)+1)}{suit}|{tile}'
                        fu_url = urllib.parse.quote_plus(fu_url)
                    elif reason == FuCalculator.VALUED_PAIR or reason == FuCalculator.DOUBLE_VALUED_PAIR:
                        pair = hand.pair_string
                        fu_url = f'{pair}'
                        fu_url = urllib.parse.quote_plus(fu_url)
                    elif reason == FuCalculator.PAIR_WAIT:
                        tile = hand.win_tile
                        if tile[0] == '0':  # aka dora
                            tile_another = '5' + tile[1]
                            fu_url = f'{tile_another}|{tile}'
                        else:
                            fu_url = f'{tile}|{tile}'
                        fu_url = urllib.parse.quote_plus(fu_url)
                    elif reason == FuCalculator.CLOSED_PON or reason == FuCalculator.OPEN_PON \
                        or reason == FuCalculator.OPEN_TERMINAL_PON or reason == FuCalculator.CLOSED_TERMINAL_PON:
                        tile = fu_detail.get("tile", -1)
                        fu_url = get_kotsu_34_str_in_melds_str_list(tile, meld_str_with_closed_pon)
                    elif reason == FuCalculator.CLOSED_KAN or reason == FuCalculator.OPEN_KAN \
                        or reason == FuCalculator.CLOSED_TERMINAL_KAN or reason == FuCalculator.OPEN_TERMINAL_KAN:
                        tile = fu_detail.get("tile", -1)
                        fu_url = get_kotsu_34_str_in_melds_str_list(tile, meld_str_with_closed_pon)
                    elif reason == FuCalculator.BASE:
                        if fu_detail.get("fu", 0) == 20:
                            description = "底符20符"
                        if fu_detail.get("fu", 0) == 30:
                            description = "门清荣和底符30符"
                        if fu_detail.get("fu", 0) == 25:
                            description = "七对子底符25符"
                    elif reason == FuCalculator.TSUMO:
                        description = "自摸加2符"
                    elif reason == FuCalculator.HAND_WITHOUT_FU:
                        description = "强制加2符"
                    fu_details.append({
                        "fu": fu_detail.get("fu", 0),
                        "reason": convert_fu_reason_to_chinese(reason),
                        "description": description,
                        "fu_url": fu_url
                    })

                # Generate display_hand string for mahjim
                # 1. Parse full hand string to 136 array
                full_hand_tiles = TilesConverter.one_line_string_to_136_array(hand.hand, has_aka_dora=True)
                
                # 2. Identify tiles in melds
                meld_tiles_flat = []
                for meld in melds:
                    if meld.opened or (not meld.opened and meld.type == 'kan'):
                        meld_tiles_flat.extend(meld.tiles)
                
                # 3. Remove meld tiles from full hand to get closed tiles
                closed_tiles = list(full_hand_tiles)
                for t in meld_tiles_flat:
                    if t in closed_tiles:
                        closed_tiles.remove(t)
                        
                # 把胡牌的牌也从手牌中移除
                win_tile_136 = TilesConverter.string_to_136_array(
                    man=hand.win_tile[0] if hand.win_tile.endswith('m') else "",
                    pin=hand.win_tile[0] if hand.win_tile.endswith('p') else "",
                    sou=hand.win_tile[0] if hand.win_tile.endswith('s') else "",
                    honors=hand.win_tile[0] if hand.win_tile.endswith('z') else "",
                    has_aka_dora=True
                )[0]
                # print(f"win_tile_136: {win_tile_136}, closed_tiles before removal: {closed_tiles}")
                closed_tiles.remove(win_tile_136)
                
                # 4. Convert closed tiles to string
                closed_hand_str = TilesConverter.to_one_line_string(closed_tiles, print_aka_dora=True)
                win_tile_str = hand.win_tile

                display_hand = closed_hand_str + "2|" + win_tile_str
                if melds_str_list:
                    display_hand += "3|"  + "|".join(melds_str_list)
                encoded_display_hand = urllib.parse.quote_plus(display_hand)

                # 处理宝牌
                dora_display = hand.dora_indicators + "+" * (5 - hand.num_indicators)
                if hand.ura_dora_indicators == "":
                    ura_dora_display = "+" * 5
                else:
                    ura_dora_display = hand.ura_dora_indicators + "+" * (5 - hand.num_indicators)
                dora_all = dora_display
                encoded_dora = urllib.parse.quote_plus(dora_all + "?scale=0.8")
                ura_dora_all = ura_dora_display
                encoded_ura_dora = urllib.parse.quote_plus(ura_dora_all + "?scale=0.8")
                yaku_hanshu = []
                if agari.yaku:
                    if agari.is_open_hand:
                        for y in agari.yaku:
                            if y.han_open is None:
                                yaku_hanshu.append(y.han_closed)
                            else:
                                yaku_hanshu.append(y.han_open)
                    else:
                        for y in agari.yaku:
                            yaku_hanshu.append(y.han_closed)
                
                response_data = {
                    "hand_type": hand.hand_type,
                    "hand": hand.hand,
                    "display_hand": encoded_display_hand,
                    "win_tile": hand.win_tile,
                    "win_tile_is_aka": hand.win_tile_is_aka,
                    "melds": serialized_melds,
                    "dora_indicators": encoded_dora,
                    "ura_dora_indicators": encoded_ura_dora,
                    "num_indicators": hand.num_indicators,
                    "points": {
                        "main_cost": agari.cost.get("main", 0),
                        "additional_cost": agari.cost.get("additional", 0),
                        "main_bonus": agari.cost.get("main_bonus", 0),
                        "additional_bonus": agari.cost.get("additional_bonus", 0),
                        "kyoutaku_bonus": agari.cost.get("kyoutaku_bonus", 0),
                        "total": agari.cost.get("total", 0),
                        "yaku_level": agari.cost.get("yaku_level", 0),
                        "yaku_name": [getattr(y, 'chinese_name', getattr(y, 'name', str(y))) for y in agari.yaku] if agari.yaku else [],
                        "yaku_hanshu": yaku_hanshu,
                        "error": agari.error,
                        "fu": agari.fu,
                        "han": agari.han,
                        "fu_details": fu_details
                    },
                    "hand_config": {
                        "is_tsumo": hand.hand_config.is_tsumo,
                        "is_riichi": hand.hand_config.is_riichi,
                        "is_daburu_riichi": hand.hand_config.is_daburu_riichi,
                        "is_ippatsu": hand.hand_config.is_ippatsu,
                        "is_rinshan": hand.hand_config.is_rinshan,
                        "is_haitei": hand.hand_config.is_haitei,
                        "is_houtei": hand.hand_config.is_houtei,
                        "is_chankan": hand.hand_config.is_chankan,
                        "is_rinshan": hand.hand_config.is_rinshan,
                        "round_wind": hand.hand_config.round_wind,
                        "player_wind": hand.hand_config.player_wind,
                        "tsumi_number": hand.hand_config.tsumi_number
                    }
                }
                return Response(response_data)
            return Response(response_data)
        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e), "traceback": traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class MahjongEfficiencyView(APIView):       
    permission_classes = [AllowAny]
    authentication_classes = []  # 禁用认证以跳过 CSRF 检查

    def post(self, request):
        """
        计算牌效率处理
        请求体应包含：
        - hand: 手牌字符串表示
        - melds: 明杠、碰等副露信息列表（可选）
        """
        try:
            data = request.data
            hand_34_array = data.get('hand_34_array', '')
            ukeire_tile = data.get('ukeire_tile', '')
            sutehai = data.get('sutehai', '')
            tile_num = data.get('tile_num', '')
            tile_13_in_hand = data.get('tile_13_in_hand', '')

            # Convert string tiles to 34-indices if necessary
            if isinstance(tile_13_in_hand, list) and len(tile_13_in_hand) > 0 and isinstance(tile_13_in_hand[0], str):
                def str_to_34(s):
                    if not s: return -1
                    suit = s[-1]
                    num = int(s[:-1])
                    if suit == 'm': return num - 1
                    if suit == 'p': return 9 + num - 1
                    if suit == 's': return 18 + num - 1
                    if suit == 'z': return 27 + num - 1
                    return -1
                tile_13_in_hand = [str_to_34(s) for s in tile_13_in_hand]

            tile_34_array, tile_num, tile_13_in_hand, new_ukeire_tile, shanten_numbers, waiting_tiles, is_tenpai \
                = process_efficiency(hand_34_array, tile_num, tile_13_in_hand, ukeire_tile, sutehai)

            def convert_tile_in_hand_to_str(tile_in_hand: list[int]) -> list[str]:
                result = []
                for i in tile_in_hand:
                    suit = i // 9
                    index_in_suit = i % 9 + 1
                    result.append(f"{index_in_suit}{['m','p','s','z'][suit]}")
                return result
            
            tile_in_hand_str_list = convert_tile_in_hand_to_str(tile_13_in_hand)
            ukeire_tile_str = ""
            if new_ukeire_tile != -1:
                ukeire_tile_str = convert_tile_in_hand_to_str([new_ukeire_tile])[0]
                
            # 一次性在后端处理完所有逻辑
            tile_info = [{} for _ in range(14)]
            all_options = []
            best_options = []
            full_hand_str = ""

            if shanten_numbers:
                original_shanten_number = shanten_numbers[-1]
                for i in range(14):
                    if shanten_numbers[i] < original_shanten_number:
                        tile_info[i]['improves_shanten'] = "Improved"
                        all_options.append(i)
                    elif shanten_numbers[i] == original_shanten_number:
                        tile_info[i]['improves_shanten'] = "No Change"
                    else:
                        tile_info[i]['improves_shanten'] = "Worsened"
                    tile_info[i]['shanten_number'] = shanten_numbers[i]
                    tile_info[i]['waiting_tiles'] = convert_tile_in_hand_to_str(waiting_tiles[i])
                    tile_info[i]['num_waiting_tiles'] = [tile_num[t] for t in waiting_tiles[i]]
                    tile_info[i]['total_waiting_tiles'] = sum(tile_info[i]['num_waiting_tiles'])
                    
                if len(all_options) == 0:
                    for i in range(14):
                        if tile_info[i]['improves_shanten'] == "No Change":
                            all_options.append(i)
                
                # 按照all_options中每个options的num_waiting_tiles总和进行排序
                all_options.sort(key=lambda x: tile_info[x]['total_waiting_tiles'], reverse=True)
                # 把all_options中进张数最多的某几张添加到best_options中
                if len(all_options) > 0:
                    max_waiting_tiles = tile_info[all_options[0]]['total_waiting_tiles']
                    for option in all_options:
                        if tile_info[option]['total_waiting_tiles'] == max_waiting_tiles:
                            best_options.append(option)
                        else:
                            break
                
                tile_34_array_copy = tile_34_array[:]
                tile_34_array_copy[new_ukeire_tile] += 1
                full_hand_str = TilesConverter.array_34_to_one_line_string(tile_34_array_copy)
            else:
                # Handle case where no tiles left (End of Deck)
                # We still return the current hand state, but with empty analysis
                full_hand_str = TilesConverter.array_34_to_one_line_string(tile_34_array)

            response_data = {
                "tile_in_hand_str_list": tile_in_hand_str_list,
                "hand_34_array": tile_34_array,
                "tile_num": tile_num,
                "tile_13_in_hand": tile_in_hand_str_list,
                "ukeire_tile_str": ukeire_tile_str,
                "ukeire_tile": new_ukeire_tile,
                "shanten_numbers": shanten_numbers,
                "tile_info": tile_info,
                "all_options": all_options,
                "is_tenpai": is_tenpai,
                "full_hand_str": full_hand_str,
                "best_options": best_options
            }
            return Response(response_data)
        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e), "traceback": traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class MahjongChinitsuView(APIView):       
    permission_classes = [AllowAny]
    authentication_classes = []  # 禁用认证以跳过 CSRF 检查

    def post(self, request):
        """
        计算牌效率处理
        请求体应包含：
        - hand: 手牌字符串表示
        - melds: 明杠、碰等副露信息列表（可选）
        """
        try:
            data = request.data
            hand_34_array = data.get('hand_34_array', '')
            ukeire_tile = data.get('ukeire_tile', '')
            sutehai = data.get('sutehai', '')
            tile_num = data.get('tile_num', '')
            tile_13_in_hand = data.get('tile_13_in_hand', '')

            # Convert string tiles to 34-indices if necessary
            if isinstance(tile_13_in_hand, list) and len(tile_13_in_hand) > 0 and isinstance(tile_13_in_hand[0], str):
                def str_to_34(s):
                    if not s: return -1
                    suit = s[-1]
                    num = int(s[:-1])
                    if suit == 'm': return num - 1
                    if suit == 'p': return 9 + num - 1
                    if suit == 's': return 18 + num - 1
                    if suit == 'z': return 27 + num - 1
                    return -1
                tile_13_in_hand = [str_to_34(s) for s in tile_13_in_hand]

            tile_34_array, tile_num, tile_13_in_hand, new_ukeire_tile, shanten_numbers, waiting_tiles, is_tenpai \
                = process_efficiency_chinitsu(hand_34_array, tile_num, tile_13_in_hand, ukeire_tile, sutehai)

            def convert_tile_in_hand_to_str(tile_in_hand: list[int]) -> list[str]:
                result = []
                for i in tile_in_hand:
                    suit = i // 9
                    index_in_suit = i % 9 + 1
                    result.append(f"{index_in_suit}{['m','p','s','z'][suit]}")
                return result
            
            tile_in_hand_str_list = convert_tile_in_hand_to_str(tile_13_in_hand)
            ukeire_tile_str = ""
            if new_ukeire_tile != -1:
                ukeire_tile_str = convert_tile_in_hand_to_str([new_ukeire_tile])[0]
                
            # 一次性在后端处理完所有逻辑
            tile_info = [{} for _ in range(14)]
            all_options = []
            best_options = []
            full_hand_str = ""

            if shanten_numbers:
                original_shanten_number = shanten_numbers[-1]
                for i in range(14):
                    if shanten_numbers[i] < original_shanten_number:
                        tile_info[i]['improves_shanten'] = "Improved"
                        all_options.append(i)
                    elif shanten_numbers[i] == original_shanten_number:
                        tile_info[i]['improves_shanten'] = "No Change"
                    else:
                        tile_info[i]['improves_shanten'] = "Worsened"
                    tile_info[i]['shanten_number'] = shanten_numbers[i]
                    tile_info[i]['waiting_tiles'] = convert_tile_in_hand_to_str(waiting_tiles[i])
                    tile_info[i]['num_waiting_tiles'] = [tile_num[t] for t in waiting_tiles[i]]
                    tile_info[i]['total_waiting_tiles'] = sum(tile_info[i]['num_waiting_tiles'])
                    
                if len(all_options) == 0:
                    for i in range(14):
                        if tile_info[i]['improves_shanten'] == "No Change":
                            all_options.append(i)
                
                # 按照all_options中每个options的num_waiting_tiles总和进行排序
                all_options.sort(key=lambda x: tile_info[x]['total_waiting_tiles'], reverse=True)
                # 把all_options中进张数最多的某几张添加到best_options中
                if len(all_options) > 0:
                    max_waiting_tiles = tile_info[all_options[0]]['total_waiting_tiles']
                    for option in all_options:
                        if tile_info[option]['total_waiting_tiles'] == max_waiting_tiles:
                            best_options.append(option)
                        else:
                            break
                
                tile_34_array_copy = tile_34_array[:]
                tile_34_array_copy[new_ukeire_tile] += 1
                full_hand_str = TilesConverter.array_34_to_one_line_string(tile_34_array_copy)
            else:
                # Handle case where no tiles left (End of Deck)
                # We still return the current hand state, but with empty analysis
                full_hand_str = TilesConverter.array_34_to_one_line_string(tile_34_array)

            response_data = {
                "tile_in_hand_str_list": tile_in_hand_str_list,
                "hand_34_array": tile_34_array,
                "tile_num": tile_num,
                "tile_13_in_hand": tile_in_hand_str_list,
                "ukeire_tile_str": ukeire_tile_str,
                "ukeire_tile": new_ukeire_tile,
                "shanten_numbers": shanten_numbers,
                "tile_info": tile_info,
                "all_options": all_options,
                "is_tenpai": is_tenpai,
                "full_hand_str": full_hand_str,
                "best_options": best_options
            }
            return Response(response_data)
        except Exception as e:
            traceback.print_exc()
            return Response({"error": str(e), "traceback": traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """
    允许访问管理员用户。
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)


class Naze300QuestionViewSet(ModelViewSet):
    """何切300问题目视图集"""
    queryset = Naze300Question.objects.all()
    serializer_class = Naze300QuestionSerializer
    lookup_field = 'question_id'

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # 管理操作需要练习编辑者或更高权限
            return [IsAuthenticated(), HasPracticePermissions()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = Naze300Question.objects.all()
        if self.action == 'list':
            # 列表视图支持过滤
            category = self.request.query_params.get('category', None)
            difficulty = self.request.query_params.get('difficulty', None)

            if category:
                queryset = queryset.filter(category=category)
            if difficulty:
                queryset = queryset.filter(difficulty=difficulty)

        return queryset.order_by('question_id')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        data = []

        for question in queryset:
            # 如果用户已登录，获取用户进度
            user_progress = None
            if request.user.is_authenticated:
                user_progress = UserNazeProgress.objects.filter(
                    user=request.user,
                    question=question
                ).first()

            data.append({
                'id': question.question_id,
                'question_id': question.question_id,
                'title': question.title,
                'difficulty': question.difficulty,
                'category': question.category,
                'status': user_progress.status if user_progress else 'not_started',
                'total_attempts': question.total_attempts,
                'correct_attempts': question.correct_attempts,
                'correct_rate': question.get_correct_rate(),
            })

        return Response({
            'count': len(data),
            'results': data
        })


class Naze300QuestionDetailView(RetrieveAPIView):
    """何切300问题目详情视图"""
    permission_classes = [AllowAny]
    queryset = Naze300Question.objects.all()
    serializer_class = Naze300QuestionSerializer
    lookup_field = 'question_id'

    def retrieve(self, request, *args, **kwargs):
        question = self.get_object()

        # 如果用户已登录，获取用户进度
        user_progress = None
        if request.user.is_authenticated:
            user_progress = UserNazeProgress.objects.filter(
                user=request.user,
                question=question
            ).first()

        serializer = self.get_serializer(question)
        data = serializer.data
        data['user_progress'] = {
            'status': user_progress.status if user_progress else 'not_started',
            'attempts_count': user_progress.attempts_count if user_progress else 0,
            'is_correct': user_progress.is_correct if user_progress else None,
        } if request.user.is_authenticated else None

        return Response(data)


class Naze300QuestionSubmitView(APIView):
    """何切300问答案提交视图"""
    permission_classes = [IsAuthenticated]

    def post(self, request, question_id):
        try:
            question = get_object_or_404(Naze300Question, question_id=question_id)
            selected_discard = request.data.get('selected_discard')

            if not selected_discard:
                return Response(
                    {'error': '必须选择要切的牌'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            is_correct = selected_discard == question.correct_discard

            # 获取或创建用户进度记录
            progress, created = UserNazeProgress.objects.get_or_create(
                user=request.user,
                question=question,
                defaults={'status': 'in_progress'}
            )

            # 记录这次尝试
            progress.record_attempt(is_correct)

            return Response({
                'is_correct': is_correct,
                'correct_discard': question.correct_discard,
                'correct_reason': question.correct_reason,
                'additional_notes': question.additional_notes,
                'attempts_count': progress.attempts_count,
                'question_stats': {
                    'total_attempts': question.total_attempts,
                    'correct_attempts': question.correct_attempts,
                    'correct_rate': question.get_correct_rate(),
                }
            })

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class Naze300ProgressView(APIView):
    """用户何切300问进度统计视图"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # 总体统计
        total_questions = Naze300Question.objects.count()
        completed_questions = UserNazeProgress.objects.filter(
            user=user,
            status='completed'
        ).count()

        # 按难度统计
        difficulty_stats = {}
        for difficulty in ['easy', 'medium', 'hard']:
            total = Naze300Question.objects.filter(difficulty=difficulty).count()
            completed = UserNazeProgress.objects.filter(
                user=user,
                question__difficulty=difficulty,
                status='completed'
            ).count()
            difficulty_stats[difficulty] = {
                'total': total,
                'completed': completed,
                'completion_rate': round((completed / total * 100), 1) if total > 0 else 0
            }

        # 按分类统计
        category_stats = {}
        for category in ['basic', 'intermediate', 'advanced']:
            total = Naze300Question.objects.filter(category=category).count()
            completed = UserNazeProgress.objects.filter(
                user=user,
                question__category=category,
                status='completed'
            ).count()
            category_stats[category] = {
                'total': total,
                'completed': completed,
                'completion_rate': round((completed / total * 100), 1) if total > 0 else 0
            }

        return Response({
            'total_questions': total_questions,
            'completed_questions': completed_questions,
            'completion_rate': round((completed_questions / total_questions * 100), 1) if total_questions > 0 else 0,
            'difficulty_stats': difficulty_stats,
            'category_stats': category_stats,
        })
