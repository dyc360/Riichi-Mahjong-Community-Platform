from django.urls import path

from . import views

urlpatterns = [
    # 板块
    path("sections/", views.ForumSectionListView.as_view(), name="forum-section-list"),
    # 帖子
    path("posts/", views.ForumPostListView.as_view(), name="forum-post-list"),
    path("posts/create/", views.ForumPostCreateView.as_view(), name="forum-post-create"),
    path("posts/latest/", views.ForumPostLatestView.as_view(), name="forum-post-latest"),
    path("posts/hot/", views.ForumPostHotView.as_view(), name="forum-post-hot"),
    path("posts/<int:pk>/", views.ForumPostDetailView.as_view(), name="forum-post-detail"),
    path("posts/<int:pk>/update/", views.ForumPostUpdateView.as_view(), name="forum-post-update"),
    path("posts/by-title/<str:title>/", views.ForumPostDetailByTitleView.as_view(), name="forum-post-detail-by-title"),
    path("posts/<int:post_id>/replies/", views.ForumReplyCreateView.as_view(), name="forum-reply-create"),
    path("posts/<int:post_id>/like/", views.toggle_post_like, name="forum-post-like"),
    # 回复点赞
    path("replies/<int:reply_id>/like/", views.toggle_reply_like, name="forum-reply-like"),
]
