import random

from .utils import WinHandTemplate, generate_dora_indicators
from mahjong.hand_calculating.hand_config import HandConfig,OptionalRules
from mahjong.constants import EAST, SOUTH, WEST, NORTH
from mahjong.hand_calculating.hand import HandCalculator
from mahjong.tile import TilesConverter

def generate_kokushimusou_hand():
    # 这里是生成国士无双手牌的逻辑
    # 返回一个表示手牌的字符串或数据结构
    possible_win_tiles = ["1m","9m","1p","9p","1s","9s","1z","2z","3z","4z","5z","6z","7z"]  # 国士无双的和牌可能是任意一种幺九牌
    exist_aka_dara = [1, 1, 1]  # 红宝牌是否已存在的标记，分别对应m,p,s
    
    # 随机生成和牌配置
    is_riichi = random.choice([True, False])
    is_daburu_riichi = random.choice([True, False]) if is_riichi else False
    is_ippatsu = False if not is_riichi else random.choice([True, False])
    is_tsumo = random.choice([True, False])
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
    dora_indicators, num_indicators, _ = generate_dora_indicators(least_num=0, max_num=4, exist_aka_dara=exist_aka_dara)
    ura_dora_indicators, ura_num_indicators, ura_selected_tiles = \
        generate_dora_indicators(least_num=num_indicators, max_num=num_indicators, exist_aka_dara=exist_aka_dara) \
        if is_riichi else ([], 0, [])
    
    # 生成国士无双牌型
    kokushitiles = {'man':'19', 'pin':'19', 'sou':'19', 'honor':'1234567'}
    
    # 随机选择一个幺九牌作为多的牌
    extra_tile = random.randint(1,13)  
    extra_tile_str = possible_win_tiles[extra_tile - 1]
    if extra_tile_str.endswith('m'):
        kokushitiles['man'] += extra_tile_str[0]
        win_tile = extra_tile_str[0]
    elif extra_tile_str.endswith('p'):   
        kokushitiles['pin'] += extra_tile_str[0]
        win_tile = extra_tile_str[0]
    elif extra_tile_str.endswith('s'):   
        kokushitiles['sou'] += extra_tile_str[0]
        win_tile = extra_tile_str[0]
    elif extra_tile_str.endswith('z'):   
        kokushitiles['honor'] += extra_tile_str[0]
        win_tile = extra_tile_str[0]
        
    # 随机选择和牌
    win_tile_found = False
    win_tile_str = ""
    win_tile_suit = -1
    # print("Generating win tile\n")
    while not win_tile_found:
        # print("Trying to generate win tile")
        win_tile_suit = random.choice([0, 1, 2, 3])  # 0: 万子, 1: 筒子, 2: 索子, 3: 字牌
        tiles_select = kokushitiles.get(['man', 'pin', 'sou', 'honor'][win_tile_suit])
        if tiles_select != '':
            win_tile = random.choice(kokushitiles.get(["man", "pin", "sou", "honor"][win_tile_suit]))
            win_tile_str = f'{win_tile}{["m","p","s","z"][win_tile_suit]}'
            if win_tile == '0':
                win_tile_is_aka = True
            # print(f"Selected win tile: {win_tile_string}")
            win_tile_found = True
    
    # 生成普通手牌的hand表示
    mantsu = sorted(kokushitiles['man'])
    pinzu = sorted(kokushitiles['pin'])
    souzu = sorted(kokushitiles['sou'])
    honors = sorted(kokushitiles['honor'])
    hand_string = f"{kokushitiles['man']}m{kokushitiles['pin']}p{kokushitiles['sou']}s{kokushitiles['honor']}z"
    
    winhand = WinHandTemplate(
        hand_type='kokushimusou',
        hand=hand_string,  # 示例手牌字符串
        win_tile=win_tile_str, # 示例和牌字符串,
        win_tile_is_aka=False,
        hand_config=hand_config,
        melds=None,
        dora_indicators=tiles_converter.to_one_line_string(dora_indicators),
        ura_dora_indicators=tiles_converter.to_one_line_string(ura_dora_indicators),
        num_indicators=num_indicators
    )
    # print(f"Generated Kokushimusou hand: {winhand.hand}, win tile: {winhand.win_tile}")
    
    # 计算手牌点数
    hand_calculator = HandCalculator()
    tiles_converter = TilesConverter()
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
    # print(f"Win tile: {win_tile_str}, is aka: {False}")
    # print(f"Hand config: ")
    # # print(f'yaku: {hand_config.yaku.__dict__}')
    # print(f'is_tsumo: {hand_config.is_tsumo}, is_riichi: {hand_config.is_riichi}, is_daburu_riichi: {hand_config.is_daburu_riichi}, is_ippatsu: {hand_config.is_ippatsu}, is_rinshan: {hand_config.is_rinshan}, is_haitei: {hand_config.is_haitei}, is_houtei: {hand_config.is_houtei}, is_chankan: {hand_config.is_chankan}')
    # print(f'round_wind: {hand_config.round_wind}, player_wind: {hand_config.player_wind}')
    # print(f"Generated Normal hand: {hand_string}, win tile: {win_tile_str}, agari: {agari}")
    
    return winhand, agari

if __name__ == "__main__":
    generate_kokushimusou_hand()