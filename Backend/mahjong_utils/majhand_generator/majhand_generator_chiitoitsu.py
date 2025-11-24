import random

from .utils import WinHandTemplate, generate_dora_indicators
from mahjong.hand_calculating.hand_config import HandConfig, OptionalRules
from mahjong.constants import EAST, SOUTH, WEST, NORTH
from mahjong.hand_calculating.hand import HandCalculator
from mahjong.tile import TilesConverter

def generate_chiitoitsu_hand():
    # 这里是生成七对子手牌的逻辑
    toitsutiles = {'man':'', 'pin':'', 'sou':'', 'honor':''}
    exist_aka_dara = [1, 1, 1]  # 红宝牌是否已存在的标记，分别对应m,p,s

    # 随机生成和牌配置
    is_riichi = random.choice([True, False])
    is_tsumo = random.choice([True, False])
    is_daburu_riichi = random.choice([True, False]) if is_riichi else False
    is_ippatsu = False if not is_riichi else random.choice([True, False])   
    is_haitei=random.choice([True, False]) if is_tsumo and not (is_ippatsu and is_daburu_riichi) else False
    is_houtei=random.choice([True, False]) if not is_tsumo and not (is_ippatsu and is_daburu_riichi) else False
    is_chankan=random.choice([True, False]) if not is_houtei and not is_haitei and not is_tsumo else False 
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
        # is_dealer=is_dealer,
        round_wind=random.choice([EAST, SOUTH]),
        player_wind=random.choice([EAST, SOUTH, WEST, NORTH]),
        options=OptionalRules(has_aka_dora=True, has_open_tanyao=True),
        tsumi_number=random.choices(range(0, 8), weights=[0.7, 0.2, 0.05, 0.03, 0.01, 0.005, 0.003, 0.002], k=1)[0]
    )    
    
    # 生成宝牌指示牌
    dora_indicators, num_indicators, selected_tiles = generate_dora_indicators(least_num=0, max_num=4, exist_aka_dara=exist_aka_dara)
    ura_dora_indicators, ura_num_indicators, ura_selected_tiles = \
        generate_dora_indicators(least_num=num_indicators, max_num=num_indicators, exist_aka_dara=exist_aka_dara) \
        if is_riichi else ([], 0, [])
        
    # 记录张数
    tile_num = [4] * 35 # 记录34种牌剩下的张数,选取1-34索引对应牌面，0索引不使用
    for i in selected_tiles:
        tile_num[i] -= 1
    for i in ura_selected_tiles:
        tile_num[i] -= 1
    
    # 生成七对子牌型
    toitsenum = []
    while True:
        toitsenum  = random.sample(range(1, 34), 7)
        for tile in toitsenum:
            if tile_num[tile] < 2:
                continue
        break
    
    estimate_hand = None
    for tile in toitsenum:
        if 1 <= tile <= 8:
            if tile == 5:
                if random.choice([True, False]):
                    toitsutiles['man'] = toitsutiles.get('man', '') + str(tile) * 2
                else:
                    toitsutiles['man'] = toitsutiles.get('man', '') + '5' + '0'
                    exist_aka_dara[0] = 0
            else:
                toitsutiles['man'] = toitsutiles.get('man', '') + str(tile) * 2
            tile_num[tile] -= 2
        elif 9 <= tile <= 17:
            if tile == 13:
                if random.choice([True, False]):
                    toitsutiles['pin'] = toitsutiles.get('pin', '') + str(tile - 8) * 2
                else:
                    toitsutiles['pin'] = toitsutiles.get('pin', '') + '5' + '0'
                    exist_aka_dara[1] = 0
            else:
                toitsutiles['pin'] = toitsutiles.get('pin', '') + str(tile - 8) * 2
            tile_num[tile] -= 2
        elif 18 <= tile <= 26:
            if tile == 22:
                if random.choice([True, False]):
                    toitsutiles['sou'] = toitsutiles.get('sou', '') + str(tile - 17) * 2
                else:
                    toitsutiles['sou'] = toitsutiles.get('sou', '') + '5' + '0'
                    exist_aka_dara[2] = 0
            else:
                toitsutiles['sou'] = toitsutiles.get('sou', '') + str(tile - 17) * 2
            tile_num[tile] -= 2
        elif 27 <= tile <= 34:
            toitsutiles['honor'] = toitsutiles.get('honor', '') + str(tile - 26) * 2
            tile_num[tile] -= 2
            
    # hand_string = f"{toitsutiles['man']}m{toitsutiles['pin']}p{toitsutiles['sou']}s{toitsutiles['honor']}z"
    
    # 随机选择和牌
    win_tile_found = False
    win_tile_is_aka = False
    win_tile_suit = -1
    # print("Generating win tile\n")
    while not win_tile_found:
        # print("Trying to generate win tile")
        win_tile_suit = random.choice([0, 1, 2, 3])  # 0: 万子, 1: 筒子, 2: 索子, 3: 字牌
        tiles_select = toitsutiles.get(['man', 'pin', 'sou', 'honor'][win_tile_suit])
        if tiles_select != '':
            win_tile = random.choice(toitsutiles.get(["man", "pin", "sou", "honor"][win_tile_suit]))
            win_tile_string = f'{win_tile}{["m","p","s","z"][win_tile_suit]}'
            if win_tile == '0':
                win_tile_is_aka = True
            # print(f"Selected win tile: {win_tile_string}")
            win_tile_found = True
        
    # 生成普通手牌的hand表示
    mantsu = sorted(toitsutiles['man'])
    pinzu = sorted(toitsutiles['pin'])
    souzu = sorted(toitsutiles['sou'])
    honors = sorted(toitsutiles['honor'])
    hand_string = ''.join(mantsu) + 'm' + ''.join(pinzu) + 'p' + ''.join(souzu) + 's' + ''.join(honors) + 'z'  
    # print(f"Generated chiitoitsu hand: {hand_string}, win tile: {win_tile_string}")
    
    hand_calculator = HandCalculator()
    tiles_converter = TilesConverter()
    winhand = WinHandTemplate(
        hand_type='chiitoitsu',
        hand=hand_string,  # 示例手牌字符串
        win_tile=win_tile_string,
        win_tile_is_aka=win_tile_is_aka,
        hand_config=hand_config,
        melds=None,
        dora_indicators=tiles_converter.to_one_line_string(dora_indicators),
        ura_dora_indicators=tiles_converter.to_one_line_string(ura_dora_indicators),
        num_indicators=num_indicators
    )
    
    # 计算点数
    estimate_hand = tiles_converter.string_to_136_array(sou=souzu, man=mantsu, pin=pinzu, honors=honors, has_aka_dora=True)
    estimate_win_tile = None
    if win_tile_suit == 0:
        estimate_win_tile = tiles_converter.string_to_136_array(man = win_tile, has_aka_dora=True)[0]
    elif win_tile_suit == 1:
        estimate_win_tile = tiles_converter.string_to_136_array(pin = win_tile, has_aka_dora=True)[0]
    elif win_tile_suit == 2:
        estimate_win_tile = tiles_converter.string_to_136_array(sou = win_tile, has_aka_dora=True)[0]
    elif win_tile_suit == 3:
        estimate_win_tile = tiles_converter.string_to_136_array(honors = win_tile, has_aka_dora=True)[0]
        
    # print(estimate_hand)
    # print(estimate_win_tile)
    # print(dora_indicators + ura_dora_indicators)
    agari = hand_calculator.estimate_hand_value(
        tiles=estimate_hand,
        win_tile=estimate_win_tile,
        melds=None,
        dora_indicators=dora_indicators + ura_dora_indicators,
        config=hand_config
    )
    
    # 打印结果
    # print(f"Dora indicators: {tiles_converter.to_one_line_string(dora_indicators + ura_dora_indicators)}")
    # print(f"Hand string: {hand_string}")
    # print(f"Win tile: {win_tile_string}, is dora: {win_tile_is_aka}")
    # print(f"Hand config: ")
    # # print(f'yaku: {hand_config.yaku.__dict__}')
    # print(f'is_tsumo: {hand_config.is_tsumo}, is_riichi: {hand_config.is_riichi}, is_daburu_riichi: {hand_config.is_daburu_riichi}, is_ippatsu: {hand_config.is_ippatsu}, is_rinshan: {hand_config.is_rinshan}, is_haitei: {hand_config.is_haitei}, is_houtei: {hand_config.is_houtei}, is_chankan: {hand_config.is_chankan}')
    # print(f'round_wind: {hand_config.round_wind}, player_wind: {hand_config.player_wind}')
    # print(f"Generated Normal hand: {hand_string}, win tile: {win_tile_string}, agari: {agari}")
    
    
    # print(f"Generated Chiitoitsu hand: {hand_string}, win tile: {win_tile_string}")
    return winhand, agari

if __name__ == "__main__":
    generate_chiitoitsu_hand()