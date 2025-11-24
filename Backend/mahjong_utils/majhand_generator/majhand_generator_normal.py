import random
# 确保路径已设置（如果作为脚本直接运行，__init__.py 不会被执行，所以需要手动调用）
# try:
#     from . import path_setup
# except ImportError:
#     # 如果作为主程序运行，需要手动设置路径
#     import path_setup
#     path_setup.setup_paths()

from mahjong.meld import Meld
from .utils import WinHandTemplate, generate_dora_indicators, make_meld
from mahjong.hand_calculating.hand_config import HandConfig, OptionalRules
from mahjong.agari import Agari
from mahjong.constants import EAST, SOUTH, WEST, NORTH
from mahjong.hand_calculating.hand import HandCalculator
from mahjong.tile import TilesConverter

def generate_shuntsu(tile_num: list[int], mentsu_num: int, tiles: dict[str, str], melds: list[Meld],
                     mentsu_type: int, is_menzen: bool, hand_without_melds: dict[str, str], aka_dora_exist: list[int]):
    suit = random.choice([0, 1, 2])  # 0: 万子, 1: 筒子, 2: 索子
    start_tile = random.randint(1, 7)
    start_tile_34 = start_tile + suit * 9
    if tile_num[start_tile_34] >= 1 and tile_num[start_tile_34 + 1] >= 1 and tile_num[start_tile_34 + 2] >= 1:
        if is_menzen and mentsu_type == 1:  
            pass
        mentsu_num -= 1
        
        tiles_str = ""
        for i in range(3):
            t = start_tile + i
            if t == 5 and aka_dora_exist[suit]: 
                if random.choices([True, False], weights=[0.3, 0.7], k=1)[0] or tile_num[start_tile_34 + i] == 1:
                    tiles_str += "0"
                    aka_dora_exist[suit] = 0
                else:
                    tiles_str += "5"
            else:
                tiles_str += str(t)
            tile_num[start_tile_34 + i] -= 1
        
        # print(f'shuntsu_str: {tiles_str}{["m", "p", "s"][suit]}')
        tiles[['man', 'pin', 'sou'][suit]] += tiles_str
        if mentsu_type == 1 and not is_menzen:  # 明顺子，加入melds
            melds.append(make_meld(
                meld_type='chi',
                is_open=True,
                man=tiles_str if suit == 0 else '',
                pin=tiles_str if suit == 1 else '',
                sou=tiles_str if suit == 2 else '',
                honors="",
                called_tile=0
            ))
        elif mentsu_type == 0:
            hand_without_melds[['man', 'pin', 'sou'][suit]] += tiles_str
    return mentsu_num
            
def generate_kotsu(tile_num: list[int], mentsu_num: int, tiles: dict[str, str], melds: list[Meld],
                   mentsu_type: int, is_menzen: bool, hand_without_melds: dict[str, str], aka_dora_exist: list[int]):
    suit = random.choice([0, 1, 2, 3])  # 0: 万子, 1: 筒子, 2: 索子, 3: 字牌
    tile = -1
    if suit == 3:
        tile_34 = random.randint(28, 34)
    else:
        tile = random.randint(1, 9)
        tile_34 = tile + suit * 9
    if tile_num[tile_34] >= 3:
        mentsu_num -= 1
        
        tiles_str = ""
        if suit < 3 and tile == 5 and aka_dora_exist[suit]:
            if random.choices([True, False], weights=[0.3, 0.7], k=1)[0] or tile_num[tile_34] == 3:
                tiles_str = "055"
                aka_dora_exist[suit] = 0
            else:
                tiles_str = "555"
        else:
            if suit == 3:
                tiles_str = str(tile_34 - 27) * 3
            else:
                tiles_str = str(tile) * 3
        tile_num[tile_34] -= 3

        # print(f'kotsu_str: {tiles_str}{["m", "p", "s", "z"][suit]}')
        tiles[['man', 'pin', 'sou', 'honor'][suit]] += tiles_str
        if mentsu_type == 3 and not is_menzen:  # 明刻子，加入melds
            melds.append(make_meld(
                meld_type='pon',
                is_open=True,
                man=tiles_str if suit == 0 else '',
                pin=tiles_str if suit == 1 else '',
                sou=tiles_str if suit == 2 else '',
                honors=tiles_str if suit == 3 else '',
                called_tile=random.randint(0,2)
            ))
        elif mentsu_type == 2:
            melds.append(make_meld(
                meld_type='pon',
                is_open=False,
                man=tiles_str if suit == 0 else '',
                pin=tiles_str if suit == 1 else '',
                sou=tiles_str if suit == 2 else '',
                honors=tiles_str if suit == 3 else '',
                called_tile=random.randint(0,2)
            ))
            hand_without_melds[['man', 'pin', 'sou', 'honor'][suit]] += tiles_str
    return mentsu_num
            
def generate_kantsu(tile_num: list[int], mentsu_num: int, tiles: dict[str, str], melds: list[Meld],
                    mentsu_type: int, is_menzen: bool, hand_without_melds: dict[str, str], aka_dora_exist: list[int]):
    suit = random.choice([0, 1, 2, 3])  # 0: 万子, 1: 筒子, 2: 索子, 3: 字牌
    rinshan_weight = 0.07
    is_rinshan = random.choices([True, False], weights=[rinshan_weight, 1 - rinshan_weight], k=1)[0]
    tile = -1
    if suit == 3:
        tile_34 = random.randint(28, 34)
    else:
        tile = random.randint(1, 9)
        tile_34 = tile + suit * 9
    if tile_num[tile_34] >= 4:
        tile_num[tile_34] -= 4
        mentsu_num -= 1
        
        tiles_str = ""
        if suit < 3 and tile == 5 and aka_dora_exist[suit]:
            tiles_str = "0555"
            aka_dora_exist[suit] = 0
        else:
            if suit == 3:
                tiles_str = str(tile_34 - 27) * 4
            else:
                tiles_str = str(tile) * 4

        tiles[['man', 'pin', 'sou', 'honor'][suit]] += tiles_str
        if mentsu_type == 5 and not is_menzen:  # 明杠，加入melds
            melds.append(make_meld(
                meld_type='kan' if random.choice([True, False]) else 'shouminkan',
                is_open=True,
                man=tiles_str if suit == 0 else '',
                pin=tiles_str if suit == 1 else '',
                sou=tiles_str if suit == 2 else '',
                honors=tiles_str if suit == 3 else '',
                called_tile=random.randint(0,3)
            ))
        else:
            melds.append(make_meld(
                meld_type='kan',
                is_open=False,
                man=tiles_str if suit == 0 else '',
                pin=tiles_str if suit == 1 else '',
                sou=tiles_str if suit == 2 else '',
                honors=tiles_str if suit == 3 else '',
                called_tile=random.randint(0,3)
            ))
    return mentsu_num, is_rinshan

def generate_normal_hand(allow_no_yaku: bool = False):
    # 这里是生成普通手牌的逻辑
    # 先生成最基础的dora指示牌
    aka_dora_exist = [1, 1, 1]  # 红宝牌是否已存在的标记，分别对应m,p,s
    dora_indicators, num_indicators, selected_tiles = generate_dora_indicators(least_num=1, max_num=4, exist_aka_dara=aka_dora_exist)
    
    # 返回一个表示手牌的字符串或数据结构
    is_menzen = random.choice([True, False])
    is_tsumo=random.choice([True, False])
    is_riichi = False if not is_menzen else random.choice([True, False])
    daburu_riichi_weight = 0.005 if is_riichi else 0.0
    is_daburu_riichi = random.choices([True, False], weights=[daburu_riichi_weight,1 - daburu_riichi_weight], k=1)[0] if is_riichi else False
    ippatsu_weight = 0.1 if is_riichi else 0.0
    is_ippatsu = False if not is_riichi else random.choices([True, False], weights=[ippatsu_weight,1 - ippatsu_weight], k=1)[0]
    haitei_weight = 0.005 if is_tsumo else 0.0
    houtei_weight = 0.005 if not is_tsumo else 0
    is_haitei=random.choices([True, False], weights=[haitei_weight, 1 - haitei_weight], k=1)[0] if is_tsumo and not (is_ippatsu and is_daburu_riichi) else False
    is_houtei=random.choices([True, False], weights=[houtei_weight, 1 - houtei_weight], k=1)[0] if not is_tsumo and not (is_ippatsu and is_daburu_riichi) else False
    chankan_weight = 0.03 if not is_houtei and not is_haitei and not is_tsumo else 0.0
    is_chankan=random.choices([True, False], weights=[chankan_weight, 1 - chankan_weight], k=1)[0] if not is_houtei and not is_haitei and not is_tsumo else False
    # is_dealer = random.choice([True, False])
    hand_config = HandConfig(
        is_tsumo=is_tsumo,
        is_riichi=is_riichi,
        is_daburu_riichi=is_daburu_riichi,
        is_ippatsu=is_ippatsu,
        is_rinshan=False,
        is_haitei=is_haitei,
        is_houtei=is_houtei,
        is_chankan=is_chankan,
        round_wind=random.choice([EAST, SOUTH]),
        player_wind=random.choice([EAST, SOUTH, WEST, NORTH]),
        options=OptionalRules(has_aka_dora=True, has_open_tanyao=True),
        tsumi_number=random.choices(range(0, 8), weights=[0.5, 0.3, 0.1, 0.06, 0.03, 0.005, 0.003, 0.002], k=1)[0]
    )
    # print(hand_config.is_haitei, hand_config.is_houtei, hand_config.is_chankan, hand_config.is_tsumo)
    
    # 里宝牌
    ura_dora_indicators, ura_num_indicators, ura_selected_tiles = \
        generate_dora_indicators(least_num=num_indicators, max_num=num_indicators, exist_aka_dara=aka_dora_exist) \
        if is_riichi else ([], 0, [])
    
    mentsu_num = 4
    mentsu_types = [0, 1, 2, 3, 4, 5]  # 0,1: 顺子, 2,3:刻子, 4，5: 杠子。前一个是暗，后一个是明
    tile_num = [4] * 35 # 记录34种牌剩下的张数,选取1-34索引对应牌面，0索引不使用
    for i in selected_tiles:
        tile_num[i] -= 1
    for i in ura_selected_tiles:
        tile_num[i] -= 1
    tiles = {'man':'', 'pin':'', 'sou':'', 'honor':''}
    melds = []
    num_indicators_tmp = num_indicators
    hand_without_melds = {'man':'', 'pin':'', 'sou':'', 'honor':''}
    while mentsu_num > 0:
        mentsu_type_weightes = [0.65, 0.1, 0.1, 0.1, 0.03, 0.02] if is_menzen else [0.55, 0.2, 0.15, 0.07, 0.02, 0.01]
        mentsu_type = random.choices(mentsu_types, weights=mentsu_type_weightes, k=1)[0]
        if mentsu_type in [0, 1]:  # 顺子
            # print("Generating shuntsu\n")
            mentsu_num = generate_shuntsu(tile_num, mentsu_num, tiles, melds, mentsu_type, is_menzen, hand_without_melds, aka_dora_exist)
        elif mentsu_type in [2, 3]:  # 刻子
            # print("Generating kotsu\n")
            mentsu_num = generate_kotsu(tile_num, mentsu_num, tiles, melds, mentsu_type, is_menzen, hand_without_melds, aka_dora_exist)
        elif mentsu_type in [4, 5] and num_indicators_tmp > 1:  # 杠子
            # print("Generating kantsu\n")
            mentsu_num, is_rinshan = generate_kantsu(tile_num, mentsu_num, tiles, melds, mentsu_type, is_menzen, hand_without_melds, aka_dora_exist)
            num_indicators_tmp -= 1  # 每个杠子消耗一个宝牌指示牌
            hand_config.is_rinshan = is_rinshan
    
    # 生成雀头
    pair_found = False
    pair_string = ""
    while not pair_found:
        suit = random.choice([0, 1, 2, 3])  # 0: 万子, 1: 筒子, 2: 索子, 3: 字牌
        tile = -1
        if suit == 3:
            tile_34 = random.randint(28, 34)
        else:
            tile = random.randint(1, 9)
            tile_34 = tile + suit * 9
        if tile_num[tile_34] >= 2:
            tiles_str = ""
            if suit < 3 and tile == 5 and aka_dora_exist[suit]:
                if random.choice([True, False]) or tile_num[tile_34] == 2:
                    tiles_str = "05"
                    aka_dora_exist[suit] = 0
                else:
                    tiles_str = "55"
            else:
                if suit == 3:
                    tiles_str = str(tile_34 - 27) * 2
                else:
                    tiles_str = str(tile) * 2
            
            tile_num[tile_34] -= 2
            tiles[['man', 'pin', 'sou', 'honor'][suit]] += tiles_str
            hand_without_melds[['man', 'pin', 'sou', 'honor'][suit]] += tiles_str
            pair_found = True
            pair_string = f'{tiles_str}{["m","p","s","z"][suit]}'
    # print("Generated pair\n")
    # print(tiles)
    
    # 生成和牌牌
    win_tile_found = False
    win_tile_is_aka = False
    win_tile_suit = -1
    # print("Generating win tile\n")
    while not win_tile_found:
        # print("Trying to generate win tile")
        win_tile_suit = random.choice([0, 1, 2, 3])  # 0: 万子, 1: 筒子, 2: 索子, 3: 字牌
        tiles_select = hand_without_melds.get(['man', 'pin', 'sou', 'honor'][win_tile_suit])
        if tiles_select != '':
            win_tile = random.choice(hand_without_melds.get(["man", "pin", "sou", "honor"][win_tile_suit]))
            win_tile_string = f'{win_tile}{["m","p","s","z"][win_tile_suit]}'
            if win_tile == '0':
                win_tile_is_aka = True
            # print(f"Selected win tile: {win_tile_string}")
            win_tile_found = True
    # print(f"Generated win tile: {win_tile_string}\n")
    
    # 生成普通手牌的hand表示
    mantsu = sorted(tiles['man'])
    pinzu = sorted(tiles['pin'])
    souzu = sorted(tiles['sou'])
    honors = sorted(tiles['honor'])
    hand_string = ''.join(mantsu) + 'm' + ''.join(pinzu) + 'p' + ''.join(souzu) + 's' + ''.join(honors) + 'z'   
    
    hand_calculator = HandCalculator()
    tiles_converter = TilesConverter()
    
    # 组装WinHandTemplate
    winhand = WinHandTemplate(
        hand_type='normal',
        hand=hand_string,
        win_tile=win_tile_string,
        win_tile_is_aka=win_tile_is_aka,
        hand_config=hand_config,
        melds=melds,
        dora_indicators=tiles_converter.to_one_line_string(dora_indicators),
        ura_dora_indicators=tiles_converter.to_one_line_string(ura_dora_indicators),
        num_indicators=num_indicators,
        pair_string=pair_string
    )    
    
    # 计算点数
    estimate_hand = tiles_converter.string_to_136_array(sou=souzu, man=mantsu, pin=pinzu, honors=honors, has_aka_dora=True)
    if win_tile_suit == 0:
        estimate_win_tile = tiles_converter.string_to_136_array(man = win_tile, has_aka_dora=True)[0]
    elif win_tile_suit == 1:
        estimate_win_tile = tiles_converter.string_to_136_array(pin = win_tile, has_aka_dora=True)[0]
    elif win_tile_suit == 2:
        estimate_win_tile = tiles_converter.string_to_136_array(sou = win_tile, has_aka_dora=True)[0]
    elif win_tile_suit == 3:
        estimate_win_tile = tiles_converter.string_to_136_array(honors = win_tile, has_aka_dora=True)[0]
    agari = hand_calculator.estimate_hand_value(
        tiles=estimate_hand,
        win_tile=estimate_win_tile,
        melds=melds,
        dora_indicators=dora_indicators + ura_dora_indicators,
        config=hand_config
    )
    
    if not allow_no_yaku and agari.error == HandCalculator.ERR_NO_YAKU:
        # print("Regenerating hand due to no yaku")
        return generate_normal_hand(allow_no_yaku)
    
    # 打印结果
    # if agari.error == HandCalculator.ERR_HAND_NOT_WINNING:
    # print("Generated melds:")
    # for meld in melds:
    #     print(meld.__dict__)
    # print(f"Dora indicators: {tiles_converter.to_one_line_string(dora_indicators + ura_dora_indicators)}")
    # print(f"Hand string: {hand_string}")
    # print(f"Win tile: {win_tile_string}, is dora: {win_tile_is_aka}")
    # print(f"Hand config: ")
    # # print(f'yaku: {hand_config.yaku.__dict__}')
    # print(f'is_tsumo: {hand_config.is_tsumo}, is_riichi: {hand_config.is_riichi}, is_daburu_riichi: {hand_config.is_daburu_riichi}, is_ippatsu: {hand_config.is_ippatsu}, is_rinshan: {hand_config.is_rinshan}, is_haitei: {hand_config.is_haitei}, is_houtei: {hand_config.is_houtei}, is_chankan: {hand_config.is_chankan}')
    # print(f'round_wind: {hand_config.round_wind}, player_wind: {hand_config.player_wind}')
    # print(f"Generated Normal hand: {hand_string}, win tile: {win_tile_string}, agari: {agari}")
    # print(agari.cost, agari.yaku, agari.error, agari.fu, agari.han)
    return winhand, agari

if __name__ == "__main__":
    # while True:
    #     _, error = generate_normal_hand()
    #     if error == "hand_not_winning":
    #         break
    generate_normal_hand(allow_no_yaku=False)

