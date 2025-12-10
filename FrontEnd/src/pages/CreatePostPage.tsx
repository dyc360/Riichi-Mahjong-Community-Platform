import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// 从现有数据获取论坛板块列表
import { FORUM_SECTIONS } from './ForumPage';

export default function CreatePostPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: "",
    sectionId: FORUM_SECTIONS[0].id,
    content: "",
    tags: ["技术"]
  });
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 检查用户是否登录
  if (!user) {
    navigate('/login?redirect=/forum/create-post', { replace: true });
    return null;
  }

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 添加标签
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim()) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  // 移除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "请输入帖子标题";
    } else if (formData.title.length > 100) {
      newErrors.title = "标题长度不能超过100个字符";
    }
    
    if (!formData.content.trim()) {
      newErrors.content = "请输入帖子内容";
    } else if (formData.content.length < 20) {
      newErrors.content = "内容长度不能少于20个字符";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 实际项目中这里会调用API提交数据
      console.log("提交帖子:", {
        ...formData,
        author: user.username,
        authorId: user.id
      });
      
      // 提交成功后跳转到帖子详情页
      navigate('/forum', { replace: true });
    } catch (error) {
      console.error("提交失败:", error);
      alert("发布帖子失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <>
      <HomePageHeader />
      
      <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGoBack}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <svg className="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回上一页
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">发布新帖</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 表单主体 */}
          <div className="lg:col-span-2">
            <ModuleContainer title="">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 标题 */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    帖子标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="请输入标题..."
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.title 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-300 dark:border-slate-600'
                    } bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.title}</p>
                  )}
                </div>
                
                {/* 板块选择 */}
                <div>
                  <label htmlFor="sectionId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    所属板块 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="sectionId"
                    name="sectionId"
                    value={formData.sectionId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {FORUM_SECTIONS.map(section => (
                      <option key={section.id} value={section.id}>
                        {section.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 标签 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    标签
                  </label>
                  <div className="flex gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full text-sm"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    
                    <div className="flex-1 max-w-xs">
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="添加标签..."
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddTag}
                          disabled={!tagInput.trim() || formData.tags.includes(tagInput.trim()) || formData.tags.length >= 5}
                          className="px-2 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
                        >
                          添加
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        最多添加5个标签，按Enter键快速添加
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* 内容 */}
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    帖子内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="请详细描述你的内容，可以包含麻将战术讨论、问题求助、经验分享等..."
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.content 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-300 dark:border-slate-600'
                    } bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-[300px] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none`}
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.content}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    内容长度至少20个字符，支持基本HTML格式
                  </p>
                </div>
                
                {/* 提交按钮 */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <Link
                    to="/forum"
                    className="px-6 py-2.5 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    取消
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="inline-block w-4 h-4 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        发布中...
                      </>
                    ) : (
                      "发布帖子"
                    )}
                  </button>
                </div>
              </form>
            </ModuleContainer>
          </div>
          
          {/* 侧边栏提示 */}
          <div className="lg:col-span-1">
            <ModuleContainer title="发帖须知">
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    请选择合适的板块发布内容，无关内容可能会被移动或删除
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    禁止发布广告、色情、暴力等违规内容，违者将被封号处理
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    优质原创内容将获得额外曝光和奖励，欢迎分享你的麻将经验
                  </p>
                </div>
              </div>
            </ModuleContainer>
            
            <ModuleContainer title="热门标签" className="mt-6">
              <div className="flex flex-wrap gap-2 p-2">
                {["何切", "M-League", "雀魂", "役满", "防守", "牌效", "新手教程", "线下聚会", "战术", "番种"].map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (!formData.tags.includes(tag) && formData.tags.length < 5) {
                        setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                      }
                    }}
                    className="px-2.5 py-1 text-xs rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </ModuleContainer>
          </div>
        </div>
      </main>
    </>
  );
}