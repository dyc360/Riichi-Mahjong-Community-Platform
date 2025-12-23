import random

from mahjong.tile import TilesConverter
from mahjong.shanten import Shanten

# 不考虑字牌生成
# tile表示选取[0,33]

def generate_efficiency_hand(num: int):
    tile_34_array = [0] * 34  # 记录34种牌的数量
    tile_num = [4] * 34 # 记录34种牌剩下的张数
    tile_13_in_hand = [] # 记录手牌中13张牌对应的34牌面索引
    while num > 0:
        tile_choice = random.randint(0, 26)  # 只选择万子、筒子、索子
        if tile_num[tile_choice] > 0:
            tile_13_in_hand.append(tile_choice)
            tile_num[tile_choice] -= 1
            tile_34_array[tile_choice] += 1
            num -= 1
    # shanten = Shanten()
    # shantan_number_at_begin = shanten.calculate_shanten(tile_34_array)
    return tile_34_array, tile_num, sorted(tile_13_in_hand)
# , shantan_number_at_begin

def generate_ukeire(tile_num: list[int]) -> int:
    ukeire_tile = -1
    while True:
        ukeire_tile = random.randint(0, 26)
        if tile_num[ukeire_tile] > 0:
            tile_num[ukeire_tile] -= 1
            break
            # tiles_34_array[ukeire_tile - 1] += 1
    return ukeire_tile


def calculate_hand_shanten(tiles_34_array: list[int], ukeire_tile: int, tile_13_in_hand: list[int]) -> list[int]:
    '''
    计算丢弃每张牌后手牌的向听数
    '''
    # 创建tiles_34_array的副本
    tiles_34_copy = tiles_34_array[:]
    
    shanten = Shanten()
    shanten_number_at_begin = shanten.calculate_shanten(tiles_34_copy)
    shanten_number = [0] * 14
    
    # tile_34_array是不含ukeire_tile的
    tiles_34_copy[ukeire_tile] += 1
    for i in range(13):
        tile = tile_13_in_hand[i]
        tiles_34_copy[tile] -= 1
        shanten_number[i] = shanten.calculate_shanten(tiles_34_copy)
        tiles_34_copy[tile] += 1
    tiles_34_copy[ukeire_tile] -= 1
    
    shanten_number[13] = shanten_number_at_begin
    return shanten_number


def calculate_hand_waiting_tiles(tile_34_array: list[int], ukeire_tile: int, tile_13_in_hand: list[int]) -> list[list[int]]:
    waiting_tiles = [[] for _ in range(14)]
    
    shanten = Shanten()
    
    # 创建tile_34_array的副本
    tile_34_copy = tile_34_array[:]
    
    
    # 使用副本进行操作
    for i in range(14):
        sutehai = tile_13_in_hand[i] if i < 13 else ukeire_tile
        tile_34_copy[sutehai] -= 1
        tile_34_copy[ukeire_tile] += 1
        
        shanten_number_at_begin = shanten.calculate_shanten(tile_34_copy)
        
        current_shanten = [0] * 34
        for j in range(34):
            tile_34_copy[j] += 1
            current_shanten[j] = shanten.calculate_shanten(tile_34_copy)
            if current_shanten[j] < shanten_number_at_begin:
                waiting_tiles[i].append(j)
            tile_34_copy[j] -= 1
            
        tile_34_copy[ukeire_tile] -= 1
        tile_34_copy[sutehai] += 1
    
    return waiting_tiles


def init_problem():
    tiles_34_array, tile_num, tile_13_in_hand = generate_efficiency_hand(13)
    ukeire_tile = generate_ukeire(tile_num)
    shanten_numbers = calculate_hand_shanten(tiles_34_array, ukeire_tile, tile_13_in_hand)
    waiting_tiles = calculate_hand_waiting_tiles(tiles_34_array, ukeire_tile, tile_13_in_hand)
    return tiles_34_array, tile_num, tile_13_in_hand, ukeire_tile, shanten_numbers, waiting_tiles

# 主处理程序
def process_efficiency(tile_34_array: list[int], tile_num: list[int], tile_13_in_hand: list[int],
                         ukeire_tile: int, sutehai_index: int):
    is_tenpai = False
    if tile_34_array == None or tile_num == None or tile_13_in_hand == None \
        or ukeire_tile == None or sutehai_index == None:
        print("Initializing new problem")
        tile_34_array, tile_num, tile_13_in_hand, new_ukeire_tile, shanten_numbers, waiting_tiles = init_problem()
        is_tenpai = shanten_numbers[-1] == 0
    else:
        if sutehai_index < 0 or sutehai_index >= 14:
            raise ValueError("sutehai_index must be between 0 and 13 inclusive.")
        elif sutehai_index < 13:
            sutehai = tile_13_in_hand[sutehai_index]
            tile_34_array[sutehai] -= 1 
            tile_34_array[ukeire_tile] += 1
            tile_13_in_hand.remove(sutehai)
            tile_13_in_hand.append(ukeire_tile)
            tile_13_in_hand = sorted(tile_13_in_hand)
        else:
            sutehai = ukeire_tile
        
        new_ukeire_tile = generate_ukeire(tile_num)
        # print(f"New ukeire tile: {new_ukeire_tile}")
        if new_ukeire_tile == -1:
            return tile_34_array, tile_num, tile_13_in_hand, new_ukeire_tile, [], [], is_tenpai
        shanten_numbers = calculate_hand_shanten(tile_34_array, new_ukeire_tile, tile_13_in_hand)
        waiting_tiles = calculate_hand_waiting_tiles(tile_34_array, new_ukeire_tile, tile_13_in_hand)
        is_tenpai = shanten_numbers[-1] == 0

    return tile_34_array, tile_num, tile_13_in_hand, new_ukeire_tile, shanten_numbers, waiting_tiles, is_tenpai

def convert_num_to_str(tile_13_in_hand: list[int]) -> list[str]:
    tiles_34_array = [0] * 34
    for tile in tile_13_in_hand:
        # print(tile)
        tiles_34_array[tile] += 1
    tiles_136_array = TilesConverter.to_136_array(tiles_34_array)
    tile_strs = TilesConverter.to_one_line_string(tiles_136_array)
    return tile_strs

def convert_waiting_tiles_num_to_str(waiting_tiles: list[list[int]]) -> list[list[str]]:
    waiting_tiles_str = [[] for _ in range(14)]
    for waiting_tile in range(14):
        waiting_tiles_str[waiting_tile] = convert_num_to_str(waiting_tiles[waiting_tile])
    return waiting_tiles_str

if __name__ == "__main__":
    tiles_34_array, tile_num, tile_13_in_hand = generate_efficiency_hand(13)
    ukeire_tile = generate_ukeire(tile_num)
    ukeire_tile_str = convert_num_to_str([ukeire_tile])
    shanten_numbers = calculate_hand_shanten(tiles_34_array, ukeire_tile, tile_13_in_hand)
    waiting_tiles = calculate_hand_waiting_tiles(tiles_34_array, ukeire_tile, tile_13_in_hand)
    waiting_tiles_str = convert_waiting_tiles_num_to_str(waiting_tiles)
    print(f"Tiles 34 array: {TilesConverter.to_one_line_string(TilesConverter.to_136_array(tiles_34_array))}")
    # print(f"Tile 13 in hand: {tile_13_in_hand}")
    print(f"Ukeire tile: {ukeire_tile_str}")
    print(f"Shanten numbers after discarding each tile: {shanten_numbers}")
    print(f"Waiting tiles: {waiting_tiles_str}")
    print(f"tile num: {tile_num}")