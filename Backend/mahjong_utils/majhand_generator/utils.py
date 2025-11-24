from mahjong.meld import Meld
from mahjong.hand_calculating.hand_config import HandConfig
from mahjong.tile import TilesConverter
import random
from typing import Optional

class WinHandTemplate:
    def __init__(self, hand_type: str, hand: str, win_tile: str,
                 win_tile_is_aka: bool = False, hand_config: HandConfig = None, melds: Meld = None,
                 dora_indicators: list[str] = [], ura_dora_indicators: list[str] = [],
                 num_indicators: Optional[int] = None, pair_string: Optional[str] = None):
        self.hand_type = hand_type  # 'normal', 'chiitoitsu', 'kokushimusou'
        self.hand = hand            # 手牌字符串表示
        self.win_tile = win_tile    # 和牌字符串表示
        self.win_tile_is_aka = win_tile_is_aka  # 和牌是否为宝牌，默认为 False
        self.hand_config = hand_config  # 手牌配置
        self.melds = melds             # 明杠、碰等副露信息列表
        self.dora_indicators = dora_indicators  # 宝牌指示牌列表
        self.ura_dora_indicators = ura_dora_indicators  # 里宝牌指示牌列表
        self.num_indicators = num_indicators  # 宝牌指示牌数量
        self.pair_string = pair_string  # 七对子中作为雀头的牌的字符串表示

def make_meld(
    meld_type: str,
    is_open: bool = True,
    man: Optional[str] = "",
    pin: Optional[str] = "",
    sou: Optional[str] = "",
    honors: Optional[str] = "",
    called_tile: Optional[int] = None,
    who: int = 0
) -> Meld:
    tiles = TilesConverter.string_to_136_array(man=man, pin=pin, sou=sou, honors=honors, has_aka_dora=True)
    meld = Meld(meld_type=meld_type, tiles=tiles, opened=is_open, called_tile=tiles[called_tile], who=0)
    return meld

def generate_dora_indicators(least_num: int, max_num: int, exist_aka_dara: list[int]) -> list[str]:
    assert least_num >= 0 and max_num <= 4 and least_num <= max_num, "Invalid least_num or max_num for dora indicators"
    weightes = [0.7, 0.2, 0.07, 0.03]  # 1张:70%, 2张:20%, 3张:7%, 4张:3%
    num_indicators = random.choices([1, 2, 3, 4], weights=weightes, k=1)[0]
    if num_indicators < least_num:
        num_indicators = least_num
    if num_indicators > max_num:
        num_indicators = max_num
    all_tiles = [i+1 for i in range(34)]
    selected_tiles = random.sample(all_tiles, num_indicators)
    dora_indictors = []
    for tile in selected_tiles:
        if tile == 5 and exist_aka_dara[0] == 1:
            if random.choice([True, False]):
                dora_indictors.append(TilesConverter.string_to_136_array(man="5", has_aka_dora=True)[0])
            else:
                dora_indictors.append(TilesConverter.string_to_136_array(man="0", has_aka_dora=True)[0])
                exist_aka_dara[0] = 0
        elif tile == 14 and exist_aka_dara[1] == 1:
            if random.choice([True, False]):
                dora_indictors.append(TilesConverter.string_to_136_array(pin="5", has_aka_dora=True)[0])
            else:
                dora_indictors.append(TilesConverter.string_to_136_array(pin="0", has_aka_dora=True)[0])
                exist_aka_dara[1] = 0
        elif tile == 23 and exist_aka_dara[2] == 1:
            if random.choice([True, False]):
                dora_indictors.append(TilesConverter.string_to_136_array(sou="5", has_aka_dora=True)[0])
            else:
                dora_indictors.append(TilesConverter.string_to_136_array(sou="0", has_aka_dora=True)[0])
                exist_aka_dara[2] = 0
        else:
            if 1 <= tile <= 9:
                dora_indictors.append(TilesConverter.string_to_136_array(man=f"{tile}", has_aka_dora=True)[0])
            elif 10 <= tile <= 18:
                dora_indictors.append(TilesConverter.string_to_136_array(pin=f"{tile - 9}", has_aka_dora=True)[0])
            elif 19 <= tile <= 27:
                dora_indictors.append(TilesConverter.string_to_136_array(sou=f"{tile - 18}", has_aka_dora=True)[0])
            elif 28 <= tile <= 34:
                dora_indictors.append(TilesConverter.string_to_136_array(honors=f"{tile - 27}", has_aka_dora=True)[0])
    return dora_indictors, num_indicators, selected_tiles