from django.urls import path
from .views import (
    MahjongTileView, MahjongPointView, MahjongEfficiencyView, MahjongChinitsuView,
    Naze300QuestionViewSet, Naze300QuestionDetailView, Naze300QuestionSubmitView, Naze300ProgressView
)

urlpatterns = [
    path('images/<str:tiles>/', MahjongTileView.as_view(), name='mahjong-tiles'), # 匹配类似 /api/mahjong/images/123m456p/ 的路径
    path('points/', MahjongPointView.as_view(), name='mahjong-points'),
    path('efficiency/', MahjongEfficiencyView.as_view(), name='mahjong-efficiency'),
    path('chinitsu/', MahjongChinitsuView.as_view(), name='mahjong-efficiency-chinitsu'),

    # 何切300问相关路由
    path('naze300/', Naze300QuestionViewSet.as_view({'get': 'list', 'post': 'create'}), name='naze300-list'),
    path('naze300/<int:question_id>/', Naze300QuestionViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='naze300-detail'),
    path('naze300/<int:question_id>/submit/', Naze300QuestionSubmitView.as_view(), name='naze300-submit'),
    path('naze300/progress/', Naze300ProgressView.as_view(), name='naze300-progress'),
]
