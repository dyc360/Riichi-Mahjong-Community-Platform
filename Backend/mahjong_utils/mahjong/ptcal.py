from mahjong.hand_calculating.hand import HandCalculator
from mahjong.tile import TilesConverter
from mahjong.hand_calculating.hand_config import HandConfig
from mahjong.meld import Meld
from mahjong.hand_calculating.hand_config import OptionalRules
import re

calculator = HandCalculator()

myOptions = OptionalRules(
                has_open_tanyao=True, # 允许食断
                has_aka_dora=True, # 允许赤宝牌
                kiriage=True # 切上満貫
            )

config=HandConfig(options=myOptions)

def hand_parser(hand_string):
    pattern = re.compile(r'(\d+)m|(\d+)p|(\d+)s|(\d+)z')
    man, pin, sou, honors = '', '', '', ''
    for match in pattern.finditer(hand_string):
        if match.group(1):
            man += match.group(1)
        elif match.group(2):
            pin += match.group(2)
        elif match.group(3):
            sou += match.group(3)
        elif match.group(4):
            honors += match.group(4)
    return man, pin, sou, honors

def calculate_hand_points(hand_string, win_tile_string, win_tile_is_dora=False, agari_types={}, dora_indicator_tiles=[], melds=[]):
    man, pin, sou, honors = hand_parser(hand_string)
    tiles = TilesConverter.string_to_136_array(man=man, pin=pin, sou=sou, honors=honors, has_aka_dora=True)
    win_tile = TilesConverter.string_to_136_array(sou=win_tile_string, has_aka_dora=win_tile_is_dora)[0]
    dora_indicators = [TilesConverter.string_to_136_array(sou=tile_str, has_aka_dora=True)[0] for tile_str in dora_indicator_tiles]
    result = calculator.estimate_hand_value(
        tiles, win_tile, melds=melds, dora_indicators=dora_indicators,
        config=HandConfig(
            is_tsumo=agari_types.get('is_tsumo', False),
            is_riichi=agari_types.get('is_riichi', False),
            is_daburu_riichi=agari_types.get('is_daburu_riichi', False),
            is_ippatsu=agari_types.get('is_ippatsu', False),
            is_rinshan=agari_types.get('is_rinshan', False),
            options=myOptions
        )
    )
    return result


# # we had to use all 14 tiles in that array
# tiles = TilesConverter.string_to_136_array(man='22444', pin='333567', sou='444')
# win_tile = TilesConverter.string_to_136_array(sou='4')[0]

# result = calculator.estimate_hand_value(tiles, win_tile)

# print(result.han, result.fu)
# print(result.cost['main'])
# print(result.yaku)
# for fu_item in result.fu_details:
#     print(fu_item)