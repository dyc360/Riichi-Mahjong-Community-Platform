import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface MajSoulNews {
  id: number;
  title: string;
  description: string;
  link: string;
  image_url: string;
  published_at: string;
  category: string;
  source: string;
  last_updated: string;
}

// 预设的示例新闻数据 - 移到组件外部，避免重复创建
const DEFAULT_NEWS: MajSoulNews[] = [
  {
    id: 1,
    title: '雀魂新版本更新公告',
    description: '全新版本带来多项改进，包括新的游戏模式和优化体验。新增了多个游戏功能，优化了游戏性能，修复了已知问题。',
    link: 'https://mahjongsoul.yo-star.com/news/update-2024',
    image_url: 'https://placehold.co/400x200/6366f1/ffffff?text=Update',
    published_at: new Date().toISOString(),
    category: '更新',
    source: '雀魂官网',
    last_updated: new Date().toISOString(),
  },
  {
    id: 2,
    title: '新年锦标赛即将开启',
    description: '2026新年锦标赛报名通道已开放，欢迎所有玩家参与。本次锦标赛设置了丰厚的奖励，包括限定称号和特殊道具。',
    link: 'https://mahjongsoul.yo-star.com/news/tournament-2024',
    image_url: 'https://placehold.co/400x200/ec4899/ffffff?text=Tournament',
    published_at: new Date().toISOString(),
    category: '活动',
    source: '雀魂官网',
    last_updated: new Date().toISOString(),
  },
  {
    id: 3,
    title: '新角色「望月凛」登场',
    description: '来自北海道的天才少女角色正式加入雀魂大家庭。望月凛是一位充满活力的角色，拥有独特的语音和立绘。',
    link: 'https://mahjongsoul.yo-star.com/news/character-mochizuki',
    image_url: 'https://placehold.co/400x200/f59e0b/ffffff?text=Character',
    published_at: new Date().toISOString(),
    category: '角色',
    source: '雀魂官网',
    last_updated: new Date().toISOString(),
  },
  {
    id: 4,
    title: '游戏平衡性调整说明',
    description: '根据玩家反馈和数据分析，我们对部分游戏机制进行了平衡性调整，以提供更好的游戏体验。',
    link: 'https://mahjongsoul.yo-star.com/news/balance-2024',
    image_url: 'https://placehold.co/400x200/10b981/ffffff?text=Balance',
    published_at: new Date().toISOString(),
    category: '更新',
    source: '雀魂官网',
    last_updated: new Date().toISOString(),
  },
  {
    id: 5,
    title: '限时活动：双倍经验周',
    description: '本周开启双倍经验活动，所有对局获得的经验值翻倍，是提升等级的好时机！',
    link: 'https://mahjongsoul.yo-star.com/news/double-exp',
    image_url: 'https://placehold.co/400x200/8b5cf6/ffffff?text=Event',
    published_at: new Date().toISOString(),
    category: '活动',
    source: '雀魂官网',
    last_updated: new Date().toISOString(),
  }
];

const NewsMajsoulPage = () => {
  // 直接使用预设数据初始化，不等待API
  const [news] = useState<MajSoulNews[]>(DEFAULT_NEWS);
  const navigate = useNavigate();

  // 调试信息
  useEffect(() => {
    console.log('NewsMajsoulPage 加载，新闻数量:', news.length);
    console.log('新闻数据:', news);
  }, [news]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleNewsClick = (newsItem: MajSoulNews) => {
    navigate(`/news/majsoul/${newsItem.id}`);
  };

  // 调试：显示当前数据状态
  console.log('渲染 NewsMajsoulPage，news.length:', news.length);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            雀魂游戏资讯
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            获取最新的雀魂麻将游戏新闻和公告
          </p>
        </div>

        {/* 新闻列表 */}
        {news && news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNewsClick(item)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                {/* 新闻图片 */}
                {item.image_url && (
                  <div className="w-full h-48 overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* 新闻内容 */}
                <div className="p-6">
                  {/* 分类标签 */}
                  {item.category && (
                    <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 rounded mb-2">
                      {item.category}
                    </span>
                  )}

                  {/* 标题 */}
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {item.title}
                  </h2>

                  {/* 描述 */}
                  {item.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                      {item.description}
                    </p>
                  )}

                  {/* 时间和来源 */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <span>{formatDate(item.published_at)}</span>
                    <span>{item.source}</span>
                  </div>

                  {/* 外部链接提示 */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      查看原文 →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              暂无新闻数据 (数据长度: {news?.length || 0})
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              调试信息: DEFAULT_NEWS 长度 = {DEFAULT_NEWS.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsMajsoulPage;

