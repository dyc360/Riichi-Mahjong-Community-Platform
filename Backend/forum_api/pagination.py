from rest_framework.pagination import PageNumberPagination


class ForumPostPagination(PageNumberPagination):
    """论坛帖子分页配置"""
    page_size = 10  # 每页默认10条
    page_size_query_param = 'page_size'  # 允许前端指定每页数量
    max_page_size = 50  # 最大每页数量
    page_query_param = 'page'  # 页码参数名


class ForumSectionPagination(PageNumberPagination):
    """论坛板块分页配置（板块数量通常较少，可以不分页或使用较大页面）"""
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'

