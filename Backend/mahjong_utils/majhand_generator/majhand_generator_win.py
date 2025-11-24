import random

from .majhand_generator_normal import generate_normal_hand
from .majhand_generator_chiitoitsu import generate_chiitoitsu_hand
from .majhand_generator_kokushimusou import generate_kokushimusou_hand
    
HandType = ['normal', 'chiitoitsu', 'kokushimusou']

# 随机选择一种类型生成，normal概率最高，其他两种类型概率较低
def generate_random_hand_type():
    weights = [0.8999, 0.1, 0.0001]  # chiitoitsu:9.9%, kokushimusou:0.001%
    return random.choices(HandType, weights=weights, k=1)[0]

def generate_win_majhand(hand_type=None, allow_no_yaku=False):

    if hand_type is None:
        hand_type = generate_random_hand_type()

    if hand_type == 'normal':
        return generate_normal_hand(allow_no_yaku=allow_no_yaku)
    elif hand_type == 'chiitoitsu':
        return generate_chiitoitsu_hand()
    elif hand_type == 'kokushimusou':
        return generate_kokushimusou_hand()
    else:
        raise ValueError(f"Unknown hand type: {hand_type}")

if __name__ == "__main__":
    # 测试生成随机和牌
    for _ in range(5):
        hand, agari = generate_win_majhand(allow_no_yaku=False)
        print(hand.hand_type)
        print(hand.hand)
        print(hand.win_tile)
        print(hand.win_tile_is_aka)
        # print(hand.hand_config)
        print(hand.melds)
        print(hand.dora_indicators)
        print(agari.cost, agari.yaku, agari.error, agari.fu, agari.han)
        print("-----")
    # generate_chiitoitsu_hand()
    # generate_kokushimusou_hand()