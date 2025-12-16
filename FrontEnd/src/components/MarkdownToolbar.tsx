import { useState, useRef, useEffect } from 'react';

interface MarkdownToolbarProps {
	content: string;
	setContent: (content: string) => void;
	textareaRef: React.RefObject<HTMLTextAreaElement | null>;
	imageInputRef?: React.RefObject<HTMLInputElement | null>; // 可选，如果不提供则组件内部创建
	fetchPosts?: (params?: any) => Promise<any[]>; // 兼容不同的 fetchPosts 签名，使用 any 以支持各种参数类型
	compact?: boolean; // 是否使用紧凑模式（用于回复）
}

export default function MarkdownToolbar({
	content,
	setContent,
	textareaRef,
	imageInputRef: externalImageInputRef,
	fetchPosts,
	compact = false
}: MarkdownToolbarProps) {
	const internalImageInputRef = useRef<HTMLInputElement>(null);
	const imageInputRef = externalImageInputRef || internalImageInputRef;
	const [showImageDialog, setShowImageDialog] = useState(false);
	const [imageUrl, setImageUrl] = useState("");
	const [showLinkDialog, setShowLinkDialog] = useState(false);
	const [linkType, setLinkType] = useState<'external' | 'post'>('external');
	const [linkUrl, setLinkUrl] = useState("");
	const [postSearchQuery, setPostSearchQuery] = useState("");
	const [postSearchResults, setPostSearchResults] = useState<any[]>([]);
	const [isSearchingPosts, setIsSearchingPosts] = useState(false);
	const searchTimeoutRef = useRef<number | null>(null);

	// 清理搜索 timeout
	useEffect(() => {
		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, []);

	// 插入格式标记的辅助函数
	const insertFormat = (before: string, after: string = '', placeholder: string = '') => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = content.substring(start, end);
		const textBefore = content.substring(0, start);
		const textAfter = content.substring(end);

		const insertText = selectedText || placeholder;
		const newContent = textBefore + before + insertText + after + textAfter;
		
		setContent(newContent);

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
	const handleFormatLink = () => setShowLinkDialog(true);
	const handleFormatImage = () => setShowImageDialog(true);
	const handleFormatCode = () => insertFormat('`', '`', '代码');
	const handleFormatCodeBlock = () => insertFormat('```\n', '\n```', '代码块');
	const handleFormatQuote = () => insertFormat('> ', '', '引用文本');
	const handleFormatDivider = () => insertFormat('\n---\n', '', '');

	// 搜索帖子
	const handleSearchPosts = async (query: string) => {
		if (!query.trim() || !fetchPosts) {
			setPostSearchResults([]);
			return;
		}

		setIsSearchingPosts(true);
		try {
			const posts = await fetchPosts({ sort: 'latest', page: 1 });
			const filtered = posts.filter(post => 
				post.title.toLowerCase().includes(query.toLowerCase())
			).slice(0, 10);
			setPostSearchResults(filtered);
		} catch (error) {
			console.error('搜索帖子失败:', error);
			setPostSearchResults([]);
		} finally {
			setIsSearchingPosts(false);
		}
	};

	// 处理通过外部 URL 插入链接
	const handleInsertExternalLink = () => {
		if (!linkUrl.trim()) {
			alert('请输入链接 URL');
			return;
		}

		try {
			new URL(linkUrl);
		} catch {
			alert('请输入有效的 URL');
			return;
		}

		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = content.substring(start, end);
		const textBefore = content.substring(0, start);
		const textAfter = content.substring(end);

		const linkText = selectedText || linkUrl.trim();
		const linkMarkdown = `[${linkText}](${linkUrl.trim()})`;
		
		const newContent = textBefore + linkMarkdown + textAfter;
		
		setContent(newContent);

		setTimeout(() => {
			textarea.focus();
			const newCursorPos = start + linkMarkdown.length;
			textarea.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);

		setShowLinkDialog(false);
		setLinkUrl("");
	};

	// 处理通过帖子插入链接
	const handleInsertPostLink = (post: any) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = content.substring(start, end);
		const textBefore = content.substring(0, start);
		const textAfter = content.substring(end);

		const postUrl = `/forum/post/${encodeURIComponent(post.title)}`;
		const linkText = selectedText || post.title;
		const linkMarkdown = `[${linkText}](${postUrl})`;
		
		const newContent = textBefore + linkMarkdown + textAfter;
		
		setContent(newContent);

		setTimeout(() => {
			textarea.focus();
			const newCursorPos = start + linkMarkdown.length;
			textarea.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);

		setShowLinkDialog(false);
		setPostSearchQuery("");
		setPostSearchResults([]);
	};

	// 处理通过 URL 插入图片
	const handleInsertImageByUrl = () => {
		if (!imageUrl.trim()) {
			alert('请输入图片 URL');
			return;
		}

		try {
			new URL(imageUrl);
		} catch {
			alert('请输入有效的图片 URL');
			return;
		}

		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const textBefore = content.substring(0, start);
		const textAfter = content.substring(end);

		const imageHtml = `\n<img src="${imageUrl.trim()}" alt="图片" style="max-width: 100%; height: auto; display: block; margin: 1rem auto;" />\n`;
		
		const newContent = textBefore + imageHtml + textAfter;
		
		setContent(newContent);

		setTimeout(() => {
			textarea.focus();
			const newCursorPos = start + imageHtml.length;
			textarea.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);

		setShowImageDialog(false);
		setImageUrl("");
	};

	// 处理图片文件选择
	const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			alert('请选择图片文件');
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			alert('图片大小不能超过 5MB');
			return;
		}

		const reader = new FileReader();
		reader.onload = (event) => {
			const base64 = event.target?.result as string;
			if (!base64) return;

			const textarea = textareaRef.current;
			if (!textarea) return;

			const start = textarea.selectionStart;
			const end = textarea.selectionEnd;
			const textBefore = content.substring(0, start);
			const textAfter = content.substring(end);

			const imageHtml = `\n<img src="${base64}" alt="图片" style="max-width: 100%; height: auto; display: block; margin: 1rem auto;" />\n`;
			const newContent = textBefore + imageHtml + textAfter;
			
			setContent(newContent);

			setTimeout(() => {
				textarea.focus();
				const newCursorPos = start + imageHtml.length;
				textarea.setSelectionRange(newCursorPos, newCursorPos);
			}, 0);
		};

		reader.onerror = () => {
			alert('读取图片文件失败，请重试');
		};

		reader.readAsDataURL(file);
		e.target.value = '';
	};

	const buttonSize = compact ? 'p-1.5' : 'p-2';
	const iconSize = compact ? 'w-3.5 h-3.5' : 'w-4 h-4';
	const dividerHeight = compact ? 'h-4' : 'h-6';
	const dividerMargin = compact ? 'mx-0.5' : 'mx-1';

	return (
		<>
			{/* 隐藏的文件输入，用于选择图片 */}
			{!externalImageInputRef && (
				<input
					ref={internalImageInputRef}
					type="file"
					accept="image/*"
					onChange={handleImageSelect}
					className="hidden"
				/>
			)}
			<div className={`flex flex-wrap items-center gap-1 ${buttonSize} bg-slate-50 dark:bg-slate-900 border-b border-gray-300 dark:border-slate-600`}>
			{/* 文本格式 */}
			<button
				type="button"
				onClick={handleFormatBold}
				title="粗体"
				className={`${buttonSize} rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors`}
			>
				<svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
				</svg>
			</button>
			<button
				type="button"
				onClick={handleFormatItalic}
				title="斜体"
				className={`${buttonSize} rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors`}
			>
				<svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h6M7 20h10M7 4l-3 16M17 4l3 16" />
				</svg>
			</button>
			<div className={`w-px ${dividerHeight} bg-gray-300 dark:bg-slate-600 ${dividerMargin}`}></div>
			
			{/* 标题 */}
			<button
				type="button"
				onClick={() => handleFormatHeading(1)}
				title="一级标题"
				className={`${buttonSize} rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors font-bold ${compact ? 'text-xs' : 'text-sm'}`}
			>
				H1
			</button>
			<button
				type="button"
				onClick={() => handleFormatHeading(2)}
				title="二级标题"
				className={`${buttonSize} rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors font-bold text-xs`}
			>
				H2
			</button>
			<button
				type="button"
				onClick={() => handleFormatHeading(3)}
				title="三级标题"
				className={`${buttonSize} rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors font-bold text-xs`}
			>
				H3
			</button>
			<div className={`w-px ${dividerHeight} bg-gray-300 dark:bg-slate-600 ${dividerMargin}`}></div>
			
			{/* 列表 */}
			<button
				type="button"
				onClick={() => handleFormatList(false)}
				title="无序列表"
				className={`${buttonSize} rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors`}
			>
				<svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13m-13 6h13M3 6h.01M3 12h.01M3 18h.01" />
				</svg>
			</button>
			<button
				type="button"
				onClick={() => handleFormatList(true)}
				title="有序列表"
				className={`${buttonSize} rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors`}
			>
				<svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
				</svg>
			</button>
			<div className={`w-px ${dividerHeight} bg-gray-300 dark:bg-slate-600 ${dividerMargin}`}></div>
			
			{/* 链接和图片 */}
			<div className="relative">
				<button
					type="button"
					onClick={handleFormatLink}
					title="插入链接"
					className={`${buttonSize} rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors`}
				>
					<svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
					</svg>
				</button>

				{/* 链接插入对话框 */}
				{showLinkDialog && (
					<>
						<div 
							className="fixed inset-0 z-40" 
							onClick={() => {
								setShowLinkDialog(false);
								setLinkUrl("");
								setPostSearchQuery("");
								setPostSearchResults([]);
							}}
						/>
						<div 
							className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg p-4 min-w-[400px] max-w-[500px]"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="space-y-3">
								<div className="flex items-center justify-between mb-2">
									<h3 className="text-sm font-medium text-slate-900 dark:text-white">插入链接</h3>
									<button
										type="button"
										onClick={() => {
											setShowLinkDialog(false);
											setLinkUrl("");
											setPostSearchQuery("");
											setPostSearchResults([]);
										}}
										className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>

								{/* 链接类型选择 */}
								<div className="flex gap-2 mb-3">
									<button
										type="button"
										onClick={() => {
											setLinkType('external');
											setPostSearchQuery("");
											setPostSearchResults([]);
										}}
										className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
											linkType === 'external'
												? 'bg-indigo-600 text-white'
												: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
										}`}
									>
										外部链接
									</button>
									<button
										type="button"
										onClick={() => {
											setLinkType('post');
											setLinkUrl("");
										}}
										disabled={!fetchPosts}
										className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
											linkType === 'post'
												? 'bg-indigo-600 text-white'
												: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
										} ${!fetchPosts ? 'opacity-50 cursor-not-allowed' : ''}`}
									>
										链接到帖子
									</button>
								</div>

								{/* 外部链接输入 */}
								{linkType === 'external' && (
									<div>
										<label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
											链接 URL
										</label>
										<div className="flex gap-2">
											<input
												type="text"
												value={linkUrl}
												onChange={(e) => setLinkUrl(e.target.value)}
												placeholder="https://example.com"
												onKeyDown={(e) => {
													if (e.key === 'Enter') {
														handleInsertExternalLink();
													}
												}}
												onClick={(e) => e.stopPropagation()}
												className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
											/>
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													handleInsertExternalLink();
												}}
												disabled={!linkUrl.trim()}
												className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
											>
												插入
											</button>
										</div>
									</div>
								)}

								{/* 帖子链接搜索 */}
								{linkType === 'post' && fetchPosts && (
									<div>
										<label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
											搜索帖子
										</label>
										<input
											type="text"
											value={postSearchQuery}
											onChange={(e) => {
												const query = e.target.value;
												setPostSearchQuery(query);
												if (searchTimeoutRef.current) {
													clearTimeout(searchTimeoutRef.current);
												}
												searchTimeoutRef.current = setTimeout(() => {
													handleSearchPosts(query);
												}, 300) as any;
											}}
											placeholder="输入帖子标题搜索..."
											onClick={(e) => e.stopPropagation()}
											className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
										/>

										{/* 搜索结果列表 */}
										{isSearchingPosts && (
											<div className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">
												搜索中...
											</div>
										)}

										{!isSearchingPosts && postSearchResults.length > 0 && (
											<div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-lg">
												{postSearchResults.map((post) => (
													<button
														key={post.id}
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															handleInsertPostLink(post);
														}}
														className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-gray-200 dark:border-slate-700 last:border-b-0 transition-colors"
													>
														<div className="text-sm font-medium text-slate-900 dark:text-white truncate">
															{post.title}
														</div>
														<div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
															作者: {post.author_name} · {post.views} 浏览
														</div>
													</button>
												))}
											</div>
										)}

										{!isSearchingPosts && postSearchQuery && postSearchResults.length === 0 && (
											<div className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">
												未找到相关帖子
											</div>
										)}
									</div>
								)}
							</div>
						</div>
					</>
				)}
			</div>
			<div className="relative">
				<button
					type="button"
					onClick={handleFormatImage}
					title="插入图片"
					className={`${buttonSize} rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors`}
				>
					<svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</button>

				{/* 图片插入对话框 */}
				{showImageDialog && (
					<>
						<div 
							className="fixed inset-0 z-40" 
							onClick={() => {
								setShowImageDialog(false);
								setImageUrl("");
							}}
						/>
						<div 
							className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg p-4 min-w-[320px]"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="space-y-3">
								<div className="flex items-center justify-between mb-2">
									<h3 className="text-sm font-medium text-slate-900 dark:text-white">插入图片</h3>
									<button
										type="button"
										onClick={() => {
											setShowImageDialog(false);
											setImageUrl("");
										}}
										className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>

								{/* URL 输入方式 */}
								<div>
									<label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
										图片 URL
									</label>
									<div className="flex gap-2">
										<input
											type="text"
											value={imageUrl}
											onChange={(e) => setImageUrl(e.target.value)}
											placeholder="https://example.com/image.jpg"
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													handleInsertImageByUrl();
												}
											}}
											onClick={(e) => e.stopPropagation()}
											className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
										/>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												handleInsertImageByUrl();
											}}
											disabled={!imageUrl.trim()}
											className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
										>
											插入
										</button>
									</div>
								</div>

								{/* 分隔线 */}
								<div className="flex items-center gap-2">
									<div className="flex-1 h-px bg-gray-300 dark:bg-slate-600"></div>
									<span className="text-xs text-slate-500 dark:text-slate-400">或</span>
									<div className="flex-1 h-px bg-gray-300 dark:bg-slate-600"></div>
								</div>

								{/* 文件选择方式 */}
								<div>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											imageInputRef.current?.click();
											setShowImageDialog(false);
										}}
										className="w-full px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors flex items-center justify-center gap-2"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
										</svg>
										从文件选择
									</button>
								</div>
							</div>
						</div>
					</>
				)}
			</div>
			<div className={`w-px ${dividerHeight} bg-gray-300 dark:bg-slate-600 ${dividerMargin}`}></div>
			
			{/* 代码 */}
			<button
				type="button"
				onClick={handleFormatCode}
				title="行内代码"
				className={`${buttonSize} rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors`}
			>
				<svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
				</svg>
			</button>
			<button
				type="button"
				onClick={handleFormatCodeBlock}
				title="代码块"
				className={`${buttonSize} rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors`}
			>
				<svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</button>
			<div className={`w-px ${dividerHeight} bg-gray-300 dark:bg-slate-600 ${dividerMargin}`}></div>
			
			{/* 引用和分隔线 */}
			<button
				type="button"
				onClick={handleFormatQuote}
				title="引用"
				className={`${buttonSize} rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors`}
			>
				<svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
				</svg>
			</button>
			<button
				type="button"
				onClick={handleFormatDivider}
				title="分隔线"
				className={`${buttonSize} rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors`}
			>
				<svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
				</svg>
			</button>
		</div>
		</>
	);
}
