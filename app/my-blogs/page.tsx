"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { debounce } from '../utils/debounce';
import { Blog } from '../components/BlogCard';
import dynamic from 'next/dynamic';

// 动态导入 BlogCard 组件，避免 SSR 问题
const BlogCard = dynamic(() => import('../components/BlogCard').then((mod) => mod.default), {
  ssr: false,
});

// 动态导入 VirtualList 组件，避免 SSR 问题
const VirtualList = dynamic(() => import('../components/VirtualList').then((mod) => mod.VirtualList), {
  ssr: false,
});
const MyBlogsPage: React.FC = () => {
  const { data: session, status } = useSession();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const router = useRouter();  // 获取用户的博客文章
  useEffect(() => {
    const fetchUserBlogs = async () => {
      try {
        if (session?.user) {
          setLoading(true);
          // 直接从数据库获取用户的所有博客（包括私密和草稿）
          const response = await fetch(`/api/blogs?userId=${(session.user as any).id}`);
          if (!response.ok) {
            throw new Error('获取博客失败');
          }
          const allBlogs = await response.json();
          
          // 过滤出当前用户的博客
          const userBlogs = Array.isArray(allBlogs) ? allBlogs.filter((blog: Blog) => 
            blog.user.id === (session.user as any).id
          ) : [];
          
          setBlogs(userBlogs);
          // 直接设置filteredBlogs，避免触发handleFilter导致的无限循环
          if (activeTab === 'all') {
            setFilteredBlogs(userBlogs);
          } else if (activeTab === 'public') {
            setFilteredBlogs(userBlogs.filter(blog => blog.status === 'published' && !blog.isPrivate));
          } else if (activeTab === 'private') {
            setFilteredBlogs(userBlogs.filter(blog => blog.status === 'published' && blog.isPrivate));
          } else if (activeTab === 'draft') {
            setFilteredBlogs(userBlogs.filter(blog => blog.status === 'draft'));
          }
        }
      } catch (err) {
        setError('获取博客失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserBlogs();
  }, [session]);

  // 筛选博客
  const handleFilter = (status: string) => {
    setActiveTab(status);
    if (status === 'all') {
      setFilteredBlogs(blogs);
    } else if (status === 'public') {
      setFilteredBlogs(blogs.filter(blog => blog.status === 'published' && !blog.isPrivate));
    } else if (status === 'private') {
      setFilteredBlogs(blogs.filter(blog => blog.status === 'published' && blog.isPrivate));
    } else if (status === 'draft') {
      setFilteredBlogs(blogs.filter(blog => blog.status === 'draft'));
    }
  };

  // 删除博客（带防抖）
  const handleDelete = useCallback(
    debounce(async (id: string) => {
      try {
        const response = await fetch(`/api/blogs?id=${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('删除博客失败');
        }

        // 强制重新获取所有博客数据，确保UI完全同步
        const freshResponse = await fetch(`/api/blogs?userId=${(session?.user as any).id}`);
        if (!freshResponse.ok) {
          throw new Error('获取最新博客数据失败');
        }
        
        const freshBlogs = await freshResponse.json();
        const userBlogs = Array.isArray(freshBlogs) ? freshBlogs.filter((blog: Blog) => 
          blog.user.id === (session?.user as any).id
        ) : [];
        
        setBlogs(userBlogs);
        
        // 直接更新filteredBlogs，避免调用handleFilter可能导致的问题
        if (activeTab === 'all') {
          setFilteredBlogs(userBlogs);
        } else if (activeTab === 'public') {
          setFilteredBlogs(userBlogs.filter(blog => blog.status === 'published' && !blog.isPrivate));
        } else if (activeTab === 'private') {
          setFilteredBlogs(userBlogs.filter(blog => blog.status === 'published' && blog.isPrivate));
        } else if (activeTab === 'draft') {
          setFilteredBlogs(userBlogs.filter(blog => blog.status === 'draft'));
        }
      } catch (err) {
        setError('删除博客失败');
        console.error(err);
      }
    }, 500),
  [session, activeTab]
);



  // 检查会话状态
  if (status === 'loading') {
    return (
      <div className="  flex items-center justify-center">
        <div className="text-center">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  // 如果用户未登录，重定向到登录页面
  if (!session?.user) {
    router.push('/login?callbackUrl=/my-blogs');
    return null;
  }

  if (loading) {
    return (
      <div className="  flex items-center justify-center">
        <div className="text-center">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="  p-4">
      <div className="max-w-4xl mx-auto">

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        {blogs.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-medium mb-2">您还没有发布任何博客</h3>
            <p className="text-gray-600 mb-4">开始创建您的第一篇博客吧！</p>
            <Link href="/dashboard">
              <Button>发布博客</Button>
            </Link>
          </div>
        ) : (
          <>
            <Tabs defaultValue="all" onValueChange={handleFilter}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="public">公开</TabsTrigger>
                <TabsTrigger value="private">私密</TabsTrigger>
                <TabsTrigger value="draft">草稿</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* 使用 @tanstack/react-virtual 实现虚拟列表 */}
            <VirtualList
              items={filteredBlogs}
              renderItem={(blog) => (
                <BlogCard
                        blog={blog as Blog}
                        currentUserId={(session?.user as any)?.id || null}
                        onDelete={handleDelete}
                      />
              )}
              dynamicHeight={true}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MyBlogsPage;