import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useAuth } from '../contexts/AuthContext';
import { useForum } from '../contexts/ForumContext';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import MarkdownToolbar from '../components/MarkdownToolbar';

export default function CreatePostPage() {
	const { user } = useAuth();
	const { sections, fetchSections, createPost, fetchPosts } = useForum();
	const navigate = useNavigate();

	// 表单状态
	const [formData, setFormData] = useState({
		title: "",
		sectionId: 0,
		content: "",
		tags: [] as string[]
	});
	const [tagInput, setTagInput] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editorMode, setEditorMode] = useState<'edit' | 'preview' | 'split'>('split'); // 编辑器模式：编辑、预览、分屏
	const contentTextareaRef = useRef<HTMLTextAreaElement>(null); // 用于操作文本区域
	const imageInputRef = useRef<HTMLInputElement>(null); // 用于文件选择
	const searchTimeoutRef = useRef<number | null>(null); // 用于存储搜索防抖的 timeout ID
	const [showImageDialog, setShowImageDialog] = useState(false); // 图片插入对话框显示
	const [imageUrl, setImageUrl] = useState(""); // 图片URL输入
	const [showLinkDialog, setShowLinkDialog] = useState(false); // 链接插入对话框显示
	const [linkType, setLinkType] = useState<'external' | 'post'>('external'); // 链接类型
	const [linkUrl, setLinkUrl] = useState(""); // 外部链接URL
	const [postSearchQuery, setPostSearchQuery] = useState(""); // 帖子搜索关键词
	const [postSearchResults, setPostSearchResults] = useState<any[]>([]); // 帖子搜索结果
	const [isSearchingPosts, setIsSearchingPosts] = useState(false); // 是否正在搜索帖子

	// 加载板块列表
	useEffect(() => {
		fetchSections().catch(console.error);
	}, [fetchSections]);

	// 设置默认板块
	useEffect(() => {
		if (sections.length > 0 && formData.sectionId === 0) {
			setFormData(prev => ({ ...prev, sectionId: sections[0].id }));
		}
	}, [sections, formData.sectionId]);

	// 清理搜索timeout
	useEffect(() => {
		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, []);

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
		} else if (formData.content.length < 1) {
			newErrors.content = "内容不能为空";
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
			const newPost = await createPost({
				section_id: formData.sectionId,
				title: formData.title,
				content: formData.content,
				tags: formData.tags,
			});

			// 跳转到帖子详情页（
			navigate(`/forum/post/${encodeURIComponent(newPost.title)}`, { replace: true });
		} catch (error: any) {
			console.error("提交失败:", error);
			const errorMessage = error?.message || "发布帖子失败，请稍后重试";
			alert(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleGoBack = () => {
		navigate(-1);
	};

	// 插入格式标记的辅助函数
	const insertFormat = (before: string, after: string = '', placeholder: string = '') => {
		const textarea = contentTextareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = formData.content.substring(start, end);
		const textBefore = formData.content.substring(0, start);
		const textAfter = formData.content.substring(end);

		// 如果有选中文本，用标记包裹；否则插入标记和占位符
		const insertText = selectedText || placeholder;
		const newContent = textBefore + before + insertText + after + textAfter;

		setFormData(prev => ({ ...prev, content: newContent }));

		// 恢复焦点并设置光标位置
		setTimeout(() => {
			textarea.focus();
			const newCursorPos = start + before.length + insertText.length;
			textarea.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);
	};

	// 格式化按钮处理函数
	const handleFormatBold = () => insertFormat('**', '**', '粗体文本');
	const handleFormatItalic = () => insertFormat('*', '*', '斜体文本');
	const handleFormatHeading = (level: number) => {
		const prefix = '#'.repeat(level) + ' ';
		insertFormat(prefix, '', '标题');
	};
	const handleFormatList = (ordered: boolean = false) => {
		if (ordered) {
			insertFormat('1. ', '', '列表项');
		} else {
			insertFormat('- ', '', '列表项');
		}
	};
	const handleFormatLink = () => {
		// 显示链接插入对话框
		setShowLinkDialog(true);
	};

	// 搜索帖子
	const handleSearchPosts = async (query: string) => {
		if (!query.trim()) {
			setPostSearchResults([]);
			return;
		}

		setIsSearchingPosts(true);
		try {
			// 获取最新帖子列表
			const posts = await fetchPosts({ sort: 'latest', page: 1 });
			const filtered = posts.filter(post =>
				post.title.toLowerCase().includes(query.toLowerCase())
			).slice(0, 10); // 最多显示10个结果
			setPostSearchResults(filtered);
		} catch (error) {
			console.error('搜索帖子失败:', error);
			setPostSearchResults([]);
		} finally {
			setIsSearchingPosts(false);
		}
	};

	// 通过外部 URL 插入链接
	const handleInsertExternalLink = () => {
		if (!linkUrl.trim()) {
			alert('请输入链接 URL');
			return;
		}

		// 验证URL格式
		try {
			new URL(linkUrl);
		} catch {
			alert('请输入有效的 URL');
			return;
		}

		const textarea = contentTextareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = formData.content.substring(start, end);
		const textBefore = formData.content.substring(0, start);
		const textAfter = formData.content.substring(end);

		// 如果有选中文本，将其作为链接文本；否则使用 URL 作为链接文本
		const linkText = selectedText || linkUrl.trim();
		const linkMarkdown = `[${linkText}](${linkUrl.trim()})`;

		const newContent = textBefore + linkMarkdown + textAfter;

		setFormData(prev => ({ ...prev, content: newContent }));

		// 恢复焦点并设置光标位置
		setTimeout(() => {
			textarea.focus();
			const newCursorPos = start + linkMarkdown.length;
			textarea.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);

		// 关闭对话框并清空输入
		setShowLinkDialog(false);
		setLinkUrl("");
	};

	// 处理通过帖子插入链接
	const handleInsertPostLink = (post: any) => {
		const textarea = contentTextareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = formData.content.substring(start, end);
		const textBefore = formData.content.substring(0, start);
		const textAfter = formData.content.substring(end);

		// 生成内部链接
		const postUrl = `/forum/post/${encodeURIComponent(post.title)}`;
		const linkText = selectedText || post.title;
		const linkMarkdown = `[${linkText}](${postUrl})`;

		const newContent = textBefore + linkMarkdown + textAfter;

		setFormData(prev => ({ ...prev, content: newContent }));

		// 恢复焦点并设置光标位置
		setTimeout(() => {
			textarea.focus();
			const newCursorPos = start + linkMarkdown.length;
			textarea.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);

		// 关闭对话框并清空搜索
		setShowLinkDialog(false);
		setPostSearchQuery("");
		setPostSearchResults([]);
	};
	const handleFormatCode = () => insertFormat('`', '`', '代码');
	const handleFormatCodeBlock = () => insertFormat('```\n', '\n```', '代码块');
	const handleFormatQuote = () => insertFormat('> ', '', '引用文本');
	const handleFormatImage = () => {
		// 显示图片插入对话框
		setShowImageDialog(true);
	};

	// 处理通过 URL 插入图片
	const handleInsertImageByUrl = () => {
		if (!imageUrl.trim()) {
			alert('请输入图片 URL');
			return;
		}

		// 验证 URL 格式
		try {
			new URL(imageUrl);
		} catch {
			alert('请输入有效的图片 URL');
			return;
		}

		const textarea = contentTextareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const textBefore = formData.content.substring(0, start);
		const textAfter = formData.content.substring(end);

		// 使用HTML img标签插入图片
		const imageHtml = `\n<img src="${imageUrl.trim()}" alt="图片" style="max-width: 100%; height: auto; display: block; margin: 1rem auto;" />\n`;

		const newContent = textBefore + imageHtml + textAfter;

		setFormData(prev => ({ ...prev, content: newContent }));

		// 恢复焦点并设置光标位置
		setTimeout(() => {
			textarea.focus();
			const newCursorPos = start + imageHtml.length;
			textarea.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);

		// 关闭对话框并清空输入
		setShowImageDialog(false);
		setImageUrl("");
	};

	// 处理通过文件选择插入图片
	const handleInsertImageByFile = () => {
		imageInputRef.current?.click();
		setShowImageDialog(false);
	};

	// 处理图片文件选择
	const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// 检查文件类型
		if (!file.type.startsWith('image/')) {
			alert('请选择图片文件');
			return;
		}

		// 检查文件大小
		if (file.size > 5 * 1024 * 1024) {
			alert('图片大小不能超过 5MB');
			return;
		}

		// 读取文件并转换为 base64
		const reader = new FileReader();
		reader.onload = (event) => {
			const base64 = event.target?.result as string;
			if (!base64) return;

			const textarea = contentTextareaRef.current;
			if (!textarea) return;

			const start = textarea.selectionStart;
			const end = textarea.selectionEnd;
			const textBefore = formData.content.substring(0, start);
			const textAfter = formData.content.substring(end);

			// 使用 HTML img 标签插入图片，确保格式正确
			// 添加换行确保图片独立成行，避免与其他内容混在一起
			const imageHtml = `\n<img src="${base64}" alt="图片" style="max-width: 100%; height: auto; display: block; margin: 1rem auto;" />\n`;

			const newContent = textBefore + imageHtml + textAfter;

			setFormData(prev => ({ ...prev, content: newContent }));

			// 恢复焦点并设置光标位置
			setTimeout(() => {
				textarea.focus();
				const newCursorPos = start + imageHtml.length;
				textarea.setSelectionRange(newCursorPos, newCursorPos);
			}, 0);

			// 关闭对话框（如果打开的话）
			setShowImageDialog(false);
		};

		reader.onerror = () => {
			alert('读取图片文件失败，请重试');
		};

		reader.readAsDataURL(file);

		e.target.value = '';
	};
	const handleFormatDivider = () => insertFormat('\n---\n', '', '');

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
										className={`w-full px-4 py-2 rounded-lg border ${errors.title
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
										disabled={sections.length === 0}
									>
										{sections.length === 0 ? (
											<option value={0}>加载中...</option>
										) : (
											sections.map(section => (
												<option key={section.id} value={section.id}>
													{section.title}
												</option>
											))
										)}
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
									<div className="flex items-center justify-between mb-1">
										<label htmlFor="content" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
											帖子内容 <span className="text-red-500">*</span>
										</label>
										{/* 编辑器模式切换 */}
										<div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
											<button
												type="button"
												onClick={() => setEditorMode('edit')}
												className={`px-3 py-1 text-xs rounded transition-colors ${editorMode === 'edit'
														? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
														: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
													}`}
											>
												编辑
											</button>
											<button
												type="button"
												onClick={() => setEditorMode('preview')}
												className={`px-3 py-1 text-xs rounded transition-colors ${editorMode === 'preview'
														? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
														: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
													}`}
											>
												预览
											</button>
											<button
												type="button"
												onClick={() => setEditorMode('split')}
												className={`px-3 py-1 text-xs rounded transition-colors ${editorMode === 'split'
														? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
														: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
													}`}
											>
												分屏
											</button>
										</div>
									</div>

									{/* 编辑器区域 */}
									<div className="border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden">
										{/* 隐藏的文件输入，用于选择图片（MarkdownToolbar 组件内部也会创建，但这里保留以兼容现有代码） */}
										<input
											ref={imageInputRef}
											type="file"
											accept="image/*"
											onChange={handleImageSelect}
											className="hidden"
										/>

										{/* 格式化工具栏 */}
										{(editorMode === 'edit' || editorMode === 'split') && (
											<MarkdownToolbar
												content={formData.content}
												setContent={(content) => setFormData(prev => ({ ...prev, content }))}
												textareaRef={contentTextareaRef}
												imageInputRef={imageInputRef}
												fetchPosts={fetchPosts}
											/>
										)}

										{editorMode === 'edit' && (
											<textarea
												ref={contentTextareaRef}
												id="content"
												name="content"
												value={formData.content}
												onChange={handleInputChange}
												placeholder="支持 Markdown 和 HTML 格式...&#10;&#10;Markdown 示例：&#10;# 标题&#10;**粗体** *斜体*&#10;- 列表项 1&#10;- 列表项 2&#10;&#10;HTML 示例：&#10;&lt;h1&gt;标题&lt;/h1&gt;&#10;&lt;div&gt;内容&lt;/div&gt;"
												className={`w-full px-4 py-3 ${errors.content
													? 'border-red-500 dark:border-red-500'
													: ''
													} bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-[400px] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm`}
											/>
										)}

										{editorMode === 'preview' && (
											<div className="min-h-[400px] px-4 py-3 bg-white dark:bg-slate-800 overflow-y-auto">
												{formData.content.trim() ? (
													<div className="prose prose-sm dark:prose-invert max-w-none
														prose-headings:text-slate-900 dark:prose-headings:text-white
														prose-p:text-slate-700 dark:prose-p:text-slate-300
														prose-strong:text-slate-900 dark:prose-strong:text-white
														prose-a:text-indigo-600 dark:prose-a:text-indigo-400
														prose-code:text-slate-800 dark:prose-code:text-slate-200
														prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900
														prose-img:max-w-full prose-img:h-auto prose-img:my-4">
														{formData.content.includes('<img') ? (
															// 如果包含 HTML img 标签，直接使用 dangerouslySetInnerHTML 渲染
															<div dangerouslySetInnerHTML={{ __html: formData.content }} />
														) : (
															// 否则使用 ReactMarkdown 渲染
															<ReactMarkdown
																rehypePlugins={[rehypeRaw]}
															>
																{formData.content}
															</ReactMarkdown>
														)}
													</div>
												) : (
													<p className="text-slate-400 dark:text-slate-500 text-sm">预览将显示在这里...</p>
												)}
											</div>
										)}

										{editorMode === 'split' && (
											<div className="grid grid-cols-2 gap-0">
												<textarea
													ref={contentTextareaRef}
													id="content"
													name="content"
													value={formData.content}
													onChange={handleInputChange}
													placeholder="支持 Markdown 和 HTML 格式..."
													className={`px-4 py-3 border-r border-gray-300 dark:border-slate-600 ${errors.content
														? 'border-red-500 dark:border-red-500'
														: ''
														} bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-[400px] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm`}
												/>
												<div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 overflow-y-auto min-h-[400px]">
													{formData.content.trim() ? (
														<div className="prose prose-sm dark:prose-invert max-w-none
															prose-headings:text-slate-900 dark:prose-headings:text-white
															prose-p:text-slate-700 dark:prose-p:text-slate-300
															prose-strong:text-slate-900 dark:prose-strong:text-white
															prose-a:text-indigo-600 dark:prose-a:text-indigo-400
															prose-code:text-slate-800 dark:prose-code:text-slate-200
															prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900
															prose-img:max-w-full prose-img:h-auto prose-img:my-4">
															{formData.content.includes('<img') ? (
																// 如果包含 HTML img 标签，直接使用 dangerouslySetInnerHTML 渲染
																<div dangerouslySetInnerHTML={{ __html: formData.content }} />
															) : (
																// 否则使用 ReactMarkdown 渲染
																<ReactMarkdown
																	rehypePlugins={[rehypeRaw]}
																>
																	{formData.content}
																</ReactMarkdown>
															)}
														</div>
													) : (
														<p className="text-slate-400 dark:text-slate-500 text-sm">预览将显示在这里...</p>
													)}
												</div>
											</div>
										)}
									</div>

									{errors.content && (
										<p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.content}</p>
									)}
									<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
										内容不能为空，支持 Markdown 和 HTML 格式。可使用上方工具栏快速插入格式，或直接输入 Markdown/HTML 代码。
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