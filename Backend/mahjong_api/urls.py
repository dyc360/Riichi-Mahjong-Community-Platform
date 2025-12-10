from django.urls import path
from .views import MahjongTileView, MahjongPointView, MahjongEfficiencyView

urlpatterns = [
    path('images/<str:tiles>/', MahjongTileView.as_view(), name='mahjong-tiles'), # 匹配类似 /api/mahjong/images/123m456p/ 的路径
    path('points/', MahjongPointView.as_view(), name='mahjong-points'),
    path('efficiency/', MahjongEfficiencyView.as_view(), name='mahjong-efficiency'),
]
