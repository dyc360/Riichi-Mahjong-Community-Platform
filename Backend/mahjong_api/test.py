import pytest
from unittest.mock import patch, MagicMock
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
import requests

# 假设你的 urls.py 中定义了如下 name
# path('tile/<str:tiles>/', MahjongTileView.as_view(), name='mahjong-tile')
# path('point/', MahjongPointView.as_view(), name='mahjong-point')
# path('efficiency/', MahjongEfficiencyView.as_view(), name='mahjong-efficiency')

@pytest.fixture
def api_client():
    return APIClient()

class TestMahjongTileView:
    """测试图片代理功能"""
    
    @patch('requests.get')
    def test_get_image_success(self, mock_get, api_client):
        # 1. 模拟上游服务返回 200 和图片二进制流
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {'Content-Type': 'image/png'}
        mock_response.iter_content.return_value = [b'fake', b'image', b'data']
        mock_get.return_value = mock_response

        # 2. 发起请求
        tiles_str = "123m456p789s11z"
        url = reverse('mahjong-tiles', kwargs={'tiles': tiles_str})
        response = api_client.get(url)

        # 3. 断言
        assert response.status_code == 200
        assert response['Content-Type'] == 'image/png'
        # 验证是否透传了参数
        mock_get.assert_called_with(
            f"http://localhost:8081/{tiles_str}", 
            params={}, 
            stream=True
        )

    @patch('requests.get')
    def test_upstream_service_error(self, mock_get, api_client):
        # 模拟上游挂了 (502)
        mock_response = MagicMock()
        mock_response.status_code = 502
        mock_get.return_value = mock_response

        url = reverse('mahjong-tiles', kwargs={'tiles': "123m"})
        response = api_client.get(url)

        assert response.status_code == 502
        assert response.data['error'] == "Failed to generate image from upstream service"
        
    @patch('mahjong_api.views.requests.get') 
    def test_get_image_service_unavailable(self, mock_get, api_client):
        """
        测试当上游 Go 服务连接失败（抛出异常）时，后端应返回 503
        """
        mock_get.side_effect = requests.RequestException("Connection refused to Mahjim Service")
        tiles_str = "123m"
        url = reverse('mahjong-tiles', kwargs={'tiles': tiles_str})

        response = api_client.get(url)

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert response.data['error'] == "Service unavailable: Connection refused to Mahjim Service"

        mock_get.assert_called_once()

class TestMahjongPointView:
    """测试点数计算功能"""

    @patch('mahjong_api.views.generate_win_majhand')
    def test_practice_point_serialization_no_meld(self, mock_generate, api_client):
        """
        核心测试：验证后端是否能正确将 Hand 对象序列化为前端需要的 JSON 格式
        我们需要 Mock 掉 generate_win_majhand，让它返回固定数据
        """
        # 1. 构造 Mock 的 Hand 和 Agari 对象
        mock_hand = MagicMock()
        mock_hand.hand = "123m406p66789s111z"
        mock_hand.win_tile = "0p"
        mock_hand.win_tile_is_aka = True
        mock_hand.melds = [] 
        mock_hand.dora_indicators = "2z"
        mock_hand.num_indicators = 1
        mock_hand.ura_dora_indicators = "3z"
        mock_hand.hand_type = "normal"
        mock_hand.hand_config.is_tsumo = True
        mock_hand.hand_config.is_riichi = False
        mock_hand.hand_config.is_daburu_riichi = False
        mock_hand.hand_config.is_ippatsu = False
        mock_hand.hand_config.is_rinshan = False
        mock_hand.hand_config.is_haitei = False
        mock_hand.hand_config.is_houtei = False
        mock_hand.hand_config.is_chankan = False
        mock_hand.hand_config.round_wind = "East" 
        mock_hand.hand_config.player_wind = "South" 
        mock_hand.hand_config.tsumi_number = 0
        

        mock_agari = MagicMock()
        mock_agari.cost = {"total": 8000, "main": 4000}
        mock_agari.fu_details = [{"fu": 30, "reason": "base"}] # 对应 FuCalculator.BASE
        yaku_mock = MagicMock()
        yaku_mock.name = "Riichi"
        yaku_mock.chinese_name = "立直"
        yaku_mock.han_closed = 1
        yaku_mock.han_open = 0  # <--- 必须显式加上这一行！
        yaku_mock.is_yakuman = False
        
        mock_fu = MagicMock()
        mock_fu = {"fu": 25, "reason": "base"}
        mock_agari.fu_details = [mock_fu]
        mock_agari.yaku = [yaku_mock]
        mock_agari.han = 3
        mock_agari.fu = 30
        mock_agari.error = None
        
        # 让 Mock 函数返回这两个对象
        mock_generate.return_value = (mock_hand, mock_agari)

        # 2. 发起请求
        url = reverse('mahjong-points')
        data = {
            "type": "practice_point",
            "hand_type": "normal"
        }
        response = api_client.post(url, data, format='json')

        # 3. 断言
        assert response.status_code == 200
        res_data = response.json()
        
        # 验证关键字段是否存在且正确
        assert res_data['hand'] == "123m406p66789s111z"
        assert res_data['win_tile'] == "0p"
        assert res_data['points']['total'] == 8000
        assert len(res_data['points']['fu_details']) > 0
        
    @patch('mahjong_api.views.generate_win_majhand')
    def test_practice_point_serialization_meld_and_fu(self, mock_generate, api_client):
        """
        核心测试：验证后端是否能正确将 Hand 对象序列化为前端需要的 JSON 格式
        我们需要 Mock 掉 generate_win_majhand，让它返回固定数据
        """
        # 1. 构造 Mock 的 Hand 和 Agari 对象
        mock_hand = MagicMock()
        mock_hand.hand = "11112223456666m50s"
        mock_hand.win_tile = "0s"
        mock_hand.win_tile_is_aka = True
        
        mock_meld_kan = MagicMock()
        mock_meld_kan.type = "kan"
        mock_meld_kan.tiles = [0, 1, 2, 3]  # 代表 1111m
        mock_meld_kan.opened = True
        mock_meld_kan.called_tile = 0  # 代表 1m
        mock_meld_kan.who = 0
        mock_meld_kan.from_who = 1
        mock_hand.melds = [mock_meld_kan]
        
        mock_meld_pon = MagicMock()
        mock_meld_pon.type = "pon"
        mock_meld_pon.tiles = [4, 5, 6]  # 代表 222m
        mock_meld_pon.opened = False
        mock_meld_pon.called_tile = 5  # 代表 2m
        mock_meld_pon.who = 0
        mock_meld_pon.from_who = 2
        mock_hand.melds.append(mock_meld_pon)
        
        mock_meld_chi = MagicMock()
        mock_meld_chi.type = "chi"
        mock_meld_chi.tiles = [8, 12, 16]  # 代表 345m
        mock_meld_chi.opened = True
        mock_meld_chi.called_tile = 16  # 代表 5m
        mock_meld_chi.who = 0
        mock_meld_chi.from_who = 1
        mock_hand.melds.append(mock_meld_chi)
        
        mock_meld_closed_kan = MagicMock()
        mock_meld_closed_kan.type = "kan"
        mock_meld_closed_kan.tiles = [20, 21, 22, 23]  # 代表 6666m
        mock_meld_closed_kan.opened = False
        mock_meld_closed_kan.called_tile = 21  # 代表 6m
        mock_meld_closed_kan.who = 0
        mock_meld_closed_kan.from_who = 1
        mock_hand.melds.append(mock_meld_closed_kan)
        
        mock_hand.dora_indicators = "2z"
        mock_hand.num_indicators = 1
        mock_hand.ura_dora_indicators = ""
        mock_hand.hand_type = "normal"
        mock_hand.hand_config.is_tsumo = True
        mock_hand.hand_config.is_riichi = False
        mock_hand.hand_config.is_daburu_riichi = False
        mock_hand.hand_config.is_ippatsu = False
        mock_hand.hand_config.is_rinshan = False
        mock_hand.hand_config.is_haitei = False
        mock_hand.hand_config.is_houtei = False
        mock_hand.hand_config.is_chankan = False
        mock_hand.hand_config.round_wind = "East" 
        mock_hand.hand_config.player_wind = "South" 
        mock_hand.hand_config.tsumi_number = 0
        

        mock_agari = MagicMock()
        mock_agari.cost = {"total": 8000, "main": 4000}
        yaku_mock = MagicMock()
        yaku_mock.name = "Rinshan"
        yaku_mock.chinese_name = "岭上开花"
        yaku_mock.han_closed = 1
        yaku_mock.han_open = None
        yaku_mock.is_yakuman = False
        
        mock_agari.yaku = [yaku_mock]
        mock_agari.han = 3
        mock_agari.fu = 30
        mock_agari.error = None
        mock_agari.is_open_hand = True
        
        mock_fu_1 = MagicMock()
        mock_fu_1 = {"fu": 2, "reason": "hand_without_fu"}
        mock_fu_2 = MagicMock()
        mock_fu_2 = {"fu": 8, "reason": "closed_terminal_pon"}
        mock_fu_3 = MagicMock()
        mock_fu_3 = {"fu": 2, "reason": "penchan"}
        mock_fu_4 = MagicMock()
        mock_fu_4 = {"fu": 10, "reason": "tsumo"}
        mock_fu_5 = MagicMock()
        mock_fu_5 = {"fu": 2, "reason": "pair_wait"}
        mock_fu_6 = MagicMock()
        mock_fu_6 = {"fu": 30, "reason": "base"}
        mock_fu_7 = MagicMock()
        mock_fu_7 = {"fu": 2, "reason": "valued_pair"}
        mock_fu_8 = MagicMock()
        mock_fu_8 = {"fu": 8, "reason": "open_terminal_kan"}
        mock_fu_9 = MagicMock()
        mock_fu_9 = {"fu": 2, "reason": "kanchan"}
        mock_agari_details = MagicMock()
        mock_agari_details = [mock_fu_1, mock_fu_2, mock_fu_3, mock_fu_4, mock_fu_5, mock_fu_6, mock_fu_7, mock_fu_8, mock_fu_9]
        mock_agari.fu_details = mock_agari_details
        
        # 让 Mock 函数返回这两个对象
        mock_generate.return_value = (mock_hand, mock_agari)

        # 2. 发起请求
        url = reverse('mahjong-points')
        data = {
            "type": "practice_point",
            "hand_type": "normal"
        }
        response = api_client.post(url, data, format='json')

        # 3. 断言
        assert response.status_code == 200
        res_data = response.json()
        
        # 验证关键字段是否存在且正确
        assert res_data['hand'] == "11112223456666m50s"
        assert res_data['win_tile'] == "0s"
        assert res_data['points']['total'] == 8000
        assert len(res_data['points']['fu_details']) > 0
        
    @patch('mahjong_api.views.generate_win_majhand')
    def test_practice_point_serialization_pen_and_kan(self, mock_generate, api_client):
        """
        核心测试：验证后端是否能正确将 Hand 对象序列化为前端需要的 JSON 格式
        我们需要 Mock 掉 generate_win_majhand，让它返回固定数据
        """
        # 1. 构造 Mock 的 Hand 和 Agari 对象
        mock_hand = MagicMock()
        mock_hand.hand = "123456m789s11122z"
        mock_hand.win_tile = "3m"
        mock_hand.win_tile_is_aka = False
        mock_hand.melds = []
        
        
        mock_hand.dora_indicators = "2z"
        mock_hand.num_indicators = 1
        mock_hand.ura_dora_indicators = "3z"
        mock_hand.hand_type = "normal"
        mock_hand.hand_config.is_tsumo = True
        mock_hand.hand_config.is_riichi = False
        mock_hand.hand_config.is_daburu_riichi = False
        mock_hand.hand_config.is_ippatsu = False
        mock_hand.hand_config.is_rinshan = False
        mock_hand.hand_config.is_haitei = False
        mock_hand.hand_config.is_houtei = False
        mock_hand.hand_config.is_chankan = False
        mock_hand.hand_config.round_wind = "East" 
        mock_hand.hand_config.player_wind = "South" 
        mock_hand.hand_config.tsumi_number = 0
        

        mock_agari = MagicMock()
        mock_agari.cost = {"total": 8000, "main": 4000}
        yaku_mock = MagicMock()
        yaku_mock.name = "Rinshan"
        yaku_mock.chinese_name = "岭上开花"
        yaku_mock.han_closed = 1
        yaku_mock.han_open = 0  
        yaku_mock.is_yakuman = False
        
        mock_agari.yaku = [yaku_mock]
        mock_agari.han = 3
        mock_agari.fu = 30
        mock_agari.error = None
        mock_agari.is_open_hand = False
        
        mock_fu_1 = MagicMock()
        mock_fu_1 = {"fu": 2, "reason": "hand_without_fu"}
        mock_fu_2 = MagicMock()
        mock_fu_2 = {"fu": 8, "reason": "closed_terminal_pon"}
        mock_fu_3 = MagicMock()
        mock_fu_3 = {"fu": 2, "reason": "penchan"}
        mock_fu_4 = MagicMock()
        mock_fu_4 = {"fu": 10, "reason": "tsumo"}
        mock_fu_5 = MagicMock()
        mock_fu_5 = {"fu": 2, "reason": "pair_wait"}
        mock_fu_6 = MagicMock()
        mock_fu_6 = {"fu": 20, "reason": "base"}
        mock_fu_7 = MagicMock()
        mock_fu_7 = {"fu": 2, "reason": "valued_pair"}
        mock_fu_8 = MagicMock()
        mock_fu_8 = {"fu": 8, "reason": "open_terminal_kan"}
        mock_fu_9 = MagicMock()
        mock_fu_9 = {"fu": 2, "reason": "kanchan"}
        mock_agari_details = MagicMock()
        mock_agari_details = [mock_fu_1, mock_fu_2, mock_fu_3, mock_fu_4, mock_fu_5, mock_fu_6, mock_fu_7, mock_fu_8, mock_fu_9]
        mock_agari.fu_details = mock_agari_details
        
        # 让 Mock 函数返回这两个对象
        mock_generate.return_value = (mock_hand, mock_agari)

        # 2. 发起请求
        url = reverse('mahjong-points')
        data = {
            "type": "practice_point",
            "hand_type": "normal"
        }
        response = api_client.post(url, data, format='json')

        # 3. 断言
        assert response.status_code == 200
        res_data = response.json()
        
        # 验证关键字段是否存在且正确
        assert res_data['hand'] == "123456m789s11122z"
        assert res_data['win_tile'] == "3m"
        assert res_data['points']['total'] == 8000
        assert len(res_data['points']['fu_details']) > 0
        
    @patch('mahjong_api.views.generate_win_majhand') 
    def test_practice_point_internal_error(self, mock_generate, api_client):
        """
        测试当后端逻辑发生未捕获异常时，View 应捕获并返回 500 错误
        """
        error_message = "Unexpected calculation error in core logic"
        mock_generate.side_effect = Exception(error_message)

        # 1. 准备请求数据
        # 必须是 practice_point 类型，才能走进调用 generate_win_majhand 的逻辑
        data = {
            "type": "practice_point",
            "hand_type": "normal"
        }
        url = reverse('mahjong-points') # 请确保你的 urls.py 里 name='mahjong-points'

        # 2. 发起请求
        response = api_client.post(url, data, format='json')

        # 3. 验证断言
        # 验证状态码是否为 500
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        
        # 验证 View 是否正确把异常信息包装到了 JSON 里
        assert response.data['error'] == error_message
        
        # 验证 traceback 字段是否存在 (你的代码中包含了 traceback)
        assert 'traceback' in response.data
        assert len(response.data['traceback']) > 0

        # 验证 Mock 函数确实被调用了
        mock_generate.assert_called_once()


class TestMahjongEfficiencyView:
    """测试牌效（何切）计算功能"""

    @patch('mahjong_api.views.process_efficiency')
    def test_efficiency_calculation(self, mock_process, api_client):
        """
        测试 View 是否正确处理了 process_efficiency 的返回值并进行了排序逻辑
        """
        # 1. 模拟 process_efficiency 的返回值
        # 返回值签名: tile_34_array, tile_num, tile_13_in_hand, new_ukeire_tile, shanten_numbers, waiting_tiles, is_tenpai
        
        mock_tile_34 = [0, 0, 2, 0, 0, 0, 2, 0, 1, 1, 0, 2, 0, 0, 0, 1, 0, 0, 0, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        mock_tile_num = [3, 4, 2, 4, 4, 4, 2, 4, 3, 3, 4, 2, 4, 4, 4, 3, 4, 4, 4, 2, 3, 4, 3, 4, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4]
        mock_tile_13_in_hand = [2, 2, 6, 6, 8, 9, 11, 11, 15, 19, 19, 20, 22]
        mock_new_ukeire = 24 
        mock_shanten_numbers = [3, 3, 3, 3, 2, 2, 3, 3, 2, 3, 3, 2, 2, 2]
        
        # waiting_tiles 是一个 list of list
        # 假设切掉 1m 后，听 3m (index 2)
        mock_waiting_tiles = [[2, 8, 9, 15, 20, 22, 24], [2, 8, 9, 15, 20, 22, 24], [2, 6, 7, 8, 9, 10, 11, 15, 18, 19, 20, 21, 22, 23, 24], [2, 6, 7, 8, 9, 10, 11, 15, 18, 19, 20, 21, 22, 23, 24], [9, 15, 20, 22, 24], [8, 15, 20, 22, 24], [2, 6, 7, 8, 9, 10, 11, 15, 18, 19, 20, 21, 22, 23, 24], [2, 6, 7, 8, 9, 10, 11, 15, 18, 19, 20, 21, 22, 23, 24], [8, 9, 20, 22, 24], [2, 6, 7, 8, 9, 10, 11, 15, 18, 19, 20, 21, 22, 23, 24], [2, 6, 7, 8, 9, 10, 11, 15, 18, 19, 20, 21, 22, 23, 24], [8, 9, 15, 22, 24], [8, 9, 15, 20, 24], [8, 9, 15, 20, 22]]
        mock_is_tenpai = False

        mock_process.return_value = (
            mock_tile_34, mock_tile_num, mock_tile_13_in_hand, 
            mock_new_ukeire, mock_shanten_numbers, mock_waiting_tiles, mock_is_tenpai
        )

        # 2. 构造请求数据
        url = reverse('mahjong-efficiency')
        data = {
            "hand_34_array": [0]*34, # 简化传参
            "tile_13_in_hand": ["1m", "2m"], # 前端可能传字符串数组，View里有转换逻辑
            "ukeire_tile": 0
        }
        response = api_client.post(url, data, format='json')

        # 3. 断言
        assert response.status_code == 200
        res_data = response.json()

        # 验证 View 中的排序和筛选逻辑
        # index 0 (1m) 的向听数是 1，原始是 2 (假设逻辑)，或者看 View 里的逻辑
        # 在 View 代码中: original_shanten_number = shanten_numbers[-1]
        # mock 数据中 shanten_numbers = [1, 2]，最后一个是 2。
        # index 0 的值是 1， 1 < 2，所以应该是 "Improved"
        
        tile_info = res_data['tile_info']
        # 只有前两个有数据，因为我们只 mock 了 2 张牌的数据，虽然 tile_info 长度通常是 14
        assert tile_info[0]['improves_shanten'] == "Worsened"
        
        # 验证 best_options
        # 因为 index 0 进张改良了，所以 best_options 应该包含 0
        assert 4 in res_data['all_options']
    
    @patch('mahjong_api.views.process_efficiency')
    def test_efficiency_calculation_internal_error(self, mock_process, api_client):
        """
        测试牌效计算逻辑发生崩溃时，后端应返回 500 及错误堆栈
        """
        # --- 核心步骤：制造崩溃 ---
        error_message = "Calculation algorithm crashed!"
        # 使用 side_effect 模拟函数抛出异常
        mock_process.side_effect = ValueError(error_message)

        # 2. 准备请求数据
        # 即使数据是合法的，因为我们 mock 了核心函数让它报错，所以依然会触发 500
        data = {
            "hand_34_array": [0] * 34,
            "tile_13_in_hand": [], 
            "ukeire_tile": -1,
            # 其他参数可选，只要能通过 request.data.get 即可
        }
        
        # 确保你的 urls.py 里有 name='mahjong-efficiency' (或者你定义的其他名字)
        url = reverse('mahjong-efficiency') 

        # 3. 发起请求
        response = api_client.post(url, data, format='json')

        # 4. 验证断言
        # 验证状态码是否为 500
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        
        # 验证返回的 JSON 是否包含了我们设定的错误信息
        assert response.data['error'] == error_message
        
        # 验证是否包含 traceback 字段 (这是你在 except 块里写的逻辑)
        assert 'traceback' in response.data
        # 简单的检查 traceback 字符串不为空
        assert len(response.data['traceback']) > 0

        # 验证 View 确实尝试调用了核心算法
        mock_process.assert_called_once()