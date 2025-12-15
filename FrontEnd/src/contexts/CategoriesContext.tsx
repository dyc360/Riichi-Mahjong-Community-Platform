import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// 分类接口
export interface Category {
    id: number;
    name: string;
    slug: string;
    label?: string;
    description: string;
}

// 获取分类的显示名称
export function getCategoryDisplayName(category: Category): string {
    return category.label || category.name;
}

interface CategoriesContextType {
    categories: Category[];
    loading: boolean;
    error: string | null;
    refreshCategories: () => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

// 缓存键名
const CACHE_KEY = 'news_categories_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

interface CachedData {
    data: Category[];
    timestamp: number;
}

export function CategoriesProvider({ children }: { children: ReactNode }) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = async (useCache: boolean = true) => {
        try {
            // 尝试从缓存读取
            if (useCache) {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    try {
                        const cachedData: CachedData = JSON.parse(cached);
                        const now = Date.now();
                        if (now - cachedData.timestamp < CACHE_DURATION) {
                            setCategories(cachedData.data);
                            setLoading(false);
                            setError(null);
                            return;
                        }
                    } catch (e) {
                        // 缓存解析失败
                        console.warn('缓存解析失败，从服务器获取分类列表');
                    }
                }
            }

            setLoading(true);
            setError(null);

            const response = await axios.get<Category[]>(`${API_BASE_URL}/news_api/categories/`);
            const data = response.data;

            setCategories(data);

            // 保存到缓存
            const cacheData: CachedData = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } catch (err: any) {
            console.error('获取分类列表失败:', err);
            setError('获取分类列表失败，请稍后重试');

            // 如果请求失败，尝试使用缓存
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                try {
                    const cachedData: CachedData = JSON.parse(cached);
                    setCategories(cachedData.data);
                    console.warn('使用过期缓存数据');
                } catch (e) {
                    setCategories([]);
                }
            } else {
                setCategories([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const refreshCategories = async () => {
        await fetchCategories(false);
    };

    useEffect(() => {
        fetchCategories(true);
    }, []);

    return (
        <CategoriesContext.Provider value={{ categories, loading, error, refreshCategories }}>
            {children}
        </CategoriesContext.Provider>
    );
}

export function useCategories() {
    const context = useContext(CategoriesContext);
    if (context === undefined) {
        throw new Error('useCategories must be used within a CategoriesProvider');
    }
    return context;
}

