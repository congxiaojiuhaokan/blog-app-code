"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { debounce } from '../utils/debounce';

import dynamic from 'next/dynamic';

// 动态导入 Markdown 编辑器，避免 SSR 问题
const MarkdownEditor = dynamic(() => import('@uiw/react-markdown-editor').then((mod) => mod.default), {
  ssr: false,
});

// 动态导入 Markdown 渲染器，避免 SSR 问题
const MarkdownRenderer = dynamic(() => import('../components/MarkdownRenderer'), {
  ssr: false,
});

// 导入统一的Markdown样式
import '../components/MarkdownStyles.css';

// 导入Markdown插件
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

// 内部组件，包含所有逻辑
const DashboardContent: React.FC = () => {
  const { data: session, status } = useSession();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 网络状态监测
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // 网络恢复时，尝试同步本地存储的数据
      syncLocalDataToServer();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // 使用useRef存储表单数据，避免因状态变化而重新创建autoSave函数
  const formDataRef = React.useRef({
    title: '',
    content: '',
    category: '',
    editingId: null as string | null,
    draftId: null as string | null
  });
  
  // 同步表单数据到ref
  React.useEffect(() => {
    formDataRef.current = {
      title,
      content,
      category,
      editingId,
      draftId
    };
  }, [title, content, category, editingId, draftId]);

  // 提取API调用逻辑为单独的函数
  const saveBlog = async (data: {
    id?: string;
    title: string;
    content: string;
    category: string;
    status: 'draft' | 'published';
    isPrivate: boolean;
  }) => {
    const url = '/api/blogs';
    const method = data.id ? 'PUT' : 'POST';
    
    // 构建请求体，根据状态区分处理
    const body = data.id ? {
      id: data.id,
      title: data.title || '', // 允许空标题
      content: data.content || '', // 允许空内容
      category: data.category || '其他', // 如果没有选择分类，默认使用'其他'
      status: data.status,
      isPrivate: data.isPrivate,
    } : {
      title: data.title || '', // 允许空标题
      content: data.content || '', // 允许空内容
      category: data.category || '其他', // 如果没有选择分类，默认使用'其他'
      status: data.status,
      isPrivate: data.isPrivate,
    };

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const result = await response.json();
      // 处理返回数组的情况
      return Array.isArray(result) && result.length > 0 ? result[0] : result;
    }
    
    return response;
  };

  // 使用useRef存储表单数据的上一个值，用于检测变化
  const prevFormDataRef = React.useRef({
    title: '',
    content: '',
    category: ''
  });

  // 使用useRef存储debounce实例
  const debouncedAutoSaveRef = React.useRef<ReturnType<typeof debounce> | null>(null);

  // 保存数据到本地存储
  const saveToLocalStorage = (data: {
    title: string;
    content: string;
    category: string;
    editingId?: string | null;
    draftId?: string | null;
  }) => {
    try {
      const localData = {
        ...data,
        lastModified: new Date().toISOString(),
        isDraft: true
      };
      localStorage.setItem('blog-draft', JSON.stringify(localData));
      console.log('数据已保存到本地存储');
    } catch (error) {
      console.error('保存到本地存储失败:', error);
    }
  };

  // 从本地存储读取数据
  const getFromLocalStorage = () => {
    try {
      const data = localStorage.getItem('blog-draft');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('从本地存储读取失败:', error);
      return null;
    }
  };

  // 清除本地存储的数据
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem('blog-draft');
      console.log('本地存储已清除');
    } catch (error) {
      console.error('清除本地存储失败:', error);
    }
  };

  // 同步本地数据到服务器
  const syncLocalDataToServer = async () => {
    try {
      const localData = getFromLocalStorage();
      if (!localData) {
        return;
      }

      const { title, content, category, editingId, draftId } = localData;

      // 检查是否有实际内容
      if (!title.trim() && !content.trim()) {
        clearLocalStorage();
        return;
      }

      // 尝试同步到服务器
      const result = await saveBlog({
        id: editingId || draftId || undefined,
        title,
        content,
        category,
        status: 'draft',
        isPrivate: false,
      });

      if (result && result.id) {
        // 同步成功，清除本地存储
        clearLocalStorage();
        console.log('本地数据已同步到服务器');
      }
    } catch (error) {
      console.error('同步本地数据到服务器失败:', error);
    }
  };

  // 自动保存函数
  const autoSave = useCallback(() => {
    // 取消之前的自动保存
    if (debouncedAutoSaveRef.current) {
      debouncedAutoSaveRef.current.cancel();
    }

    // 创建新的debounce函数并保存实例
    const debouncedSave = debounce(async () => {
      const { title, content, category, editingId, draftId } = formDataRef.current;
      
      // 只有当有内容时才自动保存
      if (!title.trim() && !content.trim()) {
        return;
      }

      // 检查表单数据是否有变化
      if (
        title === prevFormDataRef.current.title &&
        content === prevFormDataRef.current.content &&
        category === prevFormDataRef.current.category
      ) {
        return;
      }

      try {
        // 无论网络状态如何，先保存到本地存储
        saveToLocalStorage({
          title,
          content,
          category,
          editingId,
          draftId
        });

        // 如果网络在线，尝试同步到服务器
        if (isOnline) {
          setAutoSaveStatus('saving');
          const result = await saveBlog({
            id: editingId || draftId || undefined,
            title,
            content,
            category,
            status: 'draft',
            isPrivate: false,
          });

          if (result && result.id) {
            // 保存草稿ID，用于后续更新
            if (!draftId && !editingId) {
              setDraftId(result.id);
            }
            setAutoSaveStatus('saved');
            setLastSaved(new Date());
            
            // 更新上一个表单数据值
            prevFormDataRef.current = {
              title,
              content,
              category
            };
            
            // 同步成功，清除本地存储
            clearLocalStorage();
            
            // 3秒后重置自动保存状态
              setAutoSaveStatus('idle');
          }
        } else {
          // 网络离线，只保存到本地存储
          setAutoSaveStatus('saved');
          setLastSaved(new Date());
          
          // 更新上一个表单数据值
          prevFormDataRef.current = {
            title,
            content,
            category
          };
          
          // 3秒后重置自动保存状态

            setAutoSaveStatus('idle');

        }
      } catch (err) {
        console.error('自动保存失败:', err);
        setAutoSaveStatus('idle');
      }
    }, 10000); // 10秒自动保存一次 - 当用户停止输入10秒后才触发

    // 保存debounce实例
    debouncedAutoSaveRef.current = debouncedSave;

    // 执行debounce函数
    debouncedSave();
  }, [isOnline]); // 添加isOnline作为依赖

  // 监听表单数据变化，触发自动保存
  useEffect(() => {
    autoSave();
  }, [title, content, category, autoSave]);

  // 提交表单（带防抖）
  const handleSubmit = useCallback(
    debounce(async (e: React.FormEvent, saveAsDraft = false) => {
      e.preventDefault();
      setError('');
      setSuccess('');
      setOfflineMessage(null);

      // 取消自动保存，避免同时生成草稿和博客
      if (debouncedAutoSaveRef.current) {
        debouncedAutoSaveRef.current.cancel();
      }

      // 表单验证 - 只在发布时验证，保存草稿时不验证
      if (!saveAsDraft) {
        if (!title.trim()) {
          setError('请输入博客标题');
          return;
        }
        
        if (title.trim().length < 3) {
          setError('标题长度至少为3个字符');
          return;
        }
        
        if (title.trim().length > 100) {
          setError('标题长度不能超过100个字符');
          return;
        }

        if (!content.trim()) {
          setError('请输入博客内容');
          return;
        }
        
        if (content.trim().length < 10) {
          setError('内容长度至少为10个字符');
          return;
        }

        if (!category) {
          setError('请选择博客分类');
          return;
        }
      }

      try {
        setSubmitting(true);

        // 检查网络状态
        if (!isOnline) {
          // 网络离线，保存到本地存储
          saveToLocalStorage({
            title,
            content,
            category,
            editingId,
            draftId
          });

          // 显示离线提示
          setOfflineMessage('当前处于离线状态，内容已保存到本地。网络恢复后将自动同步到草稿箱。');
          
          // 断网本地保存时不清空表单内容
          setSubmitting(false);
          return;
        }

        // 网络在线，正常提交
        const response = await saveBlog({
          id: editingId || draftId || undefined,
          title,
          content,
          category,
          status: saveAsDraft ? 'draft' : 'published',
          isPrivate: saveAsDraft ? false : isPrivate,
        });
        if (typeof response.ok === 'boolean' && !response.ok) {
          throw new Error(editingId ? 'Failed to update blog' : 'Failed to create blog');
        }

        const message = editingId 
          ? (saveAsDraft ? '草稿更新成功！' : '博客更新成功！')
          : (saveAsDraft ? '草稿保存成功！' : '博客发布成功！');
        
        setSuccess(message);
        
        // 清除本地存储
        clearLocalStorage();
        
        // 重置表单
        setTitle('');
        setContent('');
        setCategory('');
        setIsPrivate(false);
        setEditingId(null);
        setDraftId(null); // 重置draftId，确保创建新博客时重新创建草稿
        
        // 请求成功后立即跳转到我的博客页面，不需要延迟
        router.push('/my-blogs');
      } catch (err) {
        const message = saveAsDraft ? '保存草稿时出错' : '发布博客时出错';
        setError(message);
        console.error(err);
        // 只有在出错时才设置submitting为false，让按钮重新变为可点击状态
        setSubmitting(false);
      }
      // 成功时不执行finally，让按钮保持禁用状态直到跳转完成
    }, 1000),
    [title, content, category, isPrivate, editingId, draftId, router, isOnline]
  );

  // 定义分类列表
  const categories = [
    'HTML',
    'CSS',
    'JavaScript',
    'React',
    'Vue',
    'Python',
    'Java',
    '其他'
  ];

  // 检查是否有编辑参数
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      loadBlogForEditing(editId);
    }
  }, [searchParams]);

  // 加载博客数据用于编辑
  const loadBlogForEditing = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/blogs?id=${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch blog');
      }
      let blog = await response.json();
      
      // 处理 API 返回数组的情况
      if (Array.isArray(blog) && blog.length > 0) {
        blog = blog[0];
      }
      
      // 检查博客是否存在且属于当前用户
      if (blog && blog.user && blog.user.id === (session?.user as any)?.id) {
        setEditingId(id);
        setTitle(blog.title);
        setContent(blog.content);
        setCategory(blog.category);
        setIsPrivate(blog.isPrivate || false);
        
        // 初始化prevFormDataRef，避免编辑模式初始加载时误触发自动保存
        prevFormDataRef.current = {
          title: blog.title,
          content: blog.content,
          category: blog.category
        };
      } else {
        setError('无权编辑此博客');
      }
    } catch (err) {
      setError('加载博客失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 检查用户是否登录
  if (status === 'loading') {
    // 会话加载中，显示加载状态
    return (
      <div className="  flex items-center justify-center">
        <div className="text-center">
          <p>加载中...</p>
        </div>
      </div>
    );
  }
  
  if (status === 'unauthenticated' || !session?.user) {
    // 会话加载完成，确实未登录
    router.push('/login?callbackUrl=/dashboard');
    return null;
  }

  if (loading) {
    // 加载博客数据中，显示加载状态
    return (
      <div className="  flex items-center justify-center">
        <div className="text-center">
          <p>加载博客数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="  p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
          <CardTitle>{editingId ? '编辑博客' : '发布博客'}</CardTitle>
          <CardDescription>
            {editingId 
              ? '编辑现有博客文章' 
              : '使用 Markdown 编辑器创建和发布新的博客文章'}
          </CardDescription>
        </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-2 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-2 bg-green-50 text-green-600 rounded-md text-sm">
                {success}
              </div>
            )}
            {/* 自动保存状态 */}
            {autoSaveStatus === 'saving' && (
              <div className="mb-4 p-2 bg-blue-50 text-blue-600 rounded-md text-sm">
                正在自动保存...
              </div>
            )}
            {autoSaveStatus === 'saved' && lastSaved && (
              <div className="mb-4 p-2 bg-green-50 text-green-600 rounded-md text-sm">
                已自动保存于 {lastSaved.toLocaleTimeString()}
              </div>
            )}
            {/* 离线提示 */}
            {offlineMessage && (
              <div className="mb-4 p-2 bg-yellow-50 text-yellow-600 rounded-md text-sm">
                {offlineMessage}
              </div>
            )}
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="输入博客标题"
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        category === cat
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">内容</Label>
                {showPreview ? (
                  <div className="border border-gray-300 rounded-md overflow-hidden min-h-[400px] p-4 bg-white">
                    <h2 className="text-xl font-bold mb-4">{title || '预览'}</h2>
                    <MarkdownRenderer content={content} />
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-md overflow-hidden min-h-[400px]">
                    <MarkdownEditor
                      value={content}
                      onChange={(value) => {
                        // 确保保存的是纯Markdown文本，而不是HTML
                        setContent(value || '');
                      }}
                      placeholder="使用 Markdown 编写博客内容..."
                      height="400px"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="private"
                  checked={isPrivate}
                  onCheckedChange={(checked) => setIsPrivate(typeof checked === 'boolean' ? checked : false)}
                />
                <Label htmlFor="private">设置为私密</Label>
              </div>
              <div className="flex space-x-4">
                <Button 
                  type="button" 
                  className="flex-1"
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={submitting}
                >
                  {submitting ? '发布中...' : '发布博客'}
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  className="flex-1"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={submitting}
                >
                  {submitting ? '保存中...' : '存入草稿箱'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  disabled={submitting}
                >
                  {showPreview ? '编辑' : '预览'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// 主组件，使用 Suspense 包装 DashboardContent
const DashboardPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
};

export default DashboardPage;
