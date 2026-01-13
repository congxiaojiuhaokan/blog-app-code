"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import BlogCard, { Blog } from '../../components/BlogCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { VirtualList } from '../../components/VirtualList';


interface User {
  id: string;
  name: string | null;
  email: string;
}

const UserBlogsPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { data: session } = useSession();

  const [user, setUser] = useState<User | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayBlogs, setDisplayBlogs] = useState<Blog[]>([]);
  
  // 使用 React.use() 解包 params Promise
  const { id: userId } = React.use(params);


  // 确保 useEffect 只在组件挂载时运行一次，并且当 userId 变化时重新运行
  useEffect(() => {
    console.log('useEffect triggered for user:', userId);
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // 确保 userId 存在
        if (!userId) {
          console.error('User ID is undefined');
          setLoading(false);
          return;
        }

        console.log('Fetching data for user:', userId);

        // 先获取用户信息
        const userRes = await fetch(`/api/users/${userId}`, {
          cache: 'no-store',
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
          console.log('User data:', userData);
        } else {
          console.error('Failed to fetch user:', userRes.status);
          // 用户不存在时，设置一个默认用户对象
          setUser({
            id: userId,
            name: null,
            email: 'unknown@example.com'
          });
        }

        // 再获取博客数据
        const blogsRes = await fetch(`/api/blogs?userId=${userId}`, {
          cache: 'no-store',
        });

        console.log('Blogs API response status:', blogsRes.status);

        if (blogsRes.ok) {
          const data = await blogsRes.json();
          console.log('Blogs data:', data);
          
          const blogsData: Blog[] = Array.isArray(data) ? data.map((blog: any) => ({
            ...blog,
            status: blog.status || 'published',
            isPrivate: blog.isPrivate || false,
            user: blog.user || {
              id: userId,
              name: null,
              email: 'unknown@example.com'
            }
          })) : [];
          
          // 过滤出公开的博客（已发布且非私密）
          const publicBlogs = blogsData.filter(blog => 
            blog.status === 'published' && !blog.isPrivate
          );
          
          console.log('Public blogs:', publicBlogs);
          
          setBlogs(publicBlogs);
          
          // 排序博客
          const sortedBlogs = [...publicBlogs].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          console.log('Sorted blogs:', sortedBlogs);
          setDisplayBlogs(sortedBlogs);
        } else {
          console.error('Failed to fetch blogs:', blogsRes.status);
          setBlogs([]);
          setDisplayBlogs([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setBlogs([]);
        setDisplayBlogs([]);
      } finally {
        setLoading(false);
        console.log('Data fetching completed');
      }
    };

    fetchData();
  }, [userId]); // 确保依赖项正确

  if (loading) {
    return (
      <div className="  flex items-center justify-center">
        <div className="text-center">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  const sortedBlogs = [...blogs].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // 处理删除博客
  const handleDeleteBlog = async (id: string) => {
    try {
      const res = await fetch(`/api/blogs/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        // 更新博客列表，过滤掉已删除的博客
        setDisplayBlogs(prevBlogs => prevBlogs.filter(blog => blog.id !== id));
        setBlogs(prevBlogs => prevBlogs.filter(blog => blog.id !== id));
      } else {
        console.error('删除博客失败');
      }
    } catch (error) {
      console.error('删除博客时发生错误:', error);
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          {/* 左侧空白占位 */}
          <div className="hidden md:block md:col-span-3 lg:col-span-2"></div>
          
          {/* 中间内容区域 */}
          <div className="md:col-span-6 lg:col-span-8">
            {/* 用户信息 */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8 text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-gray-600">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-2">
                {user?.name || user?.email || '用户'}
              </h1>
              <p className="text-gray-600 mb-4">
                共发布 {sortedBlogs.length} 篇博客
              </p>
            </div>

            {/* 博客列表 */}
            <h2 className="text-xl font-bold mb-6">博客文章</h2>
            {displayBlogs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-medium mb-2">该用户还没有发布任何博客</h3>
                <p className="text-gray-600 mb-4">敬请期待！</p>
                <Link href="/">
                  <Button>返回首页</Button>
                </Link>
              </div>
            ) : (
              // 使用 @tanstack/react-virtual 实现虚拟列表
              <VirtualList
                items={displayBlogs}
                renderItem={(blog) => (
                  <BlogCard
                    blog={blog}
                    currentUserId={(session?.user as any)?.id || null}
                    onDelete={handleDeleteBlog}
                  />
                )}
                dynamicHeight={true}
              />
            )}
          </div>
          
          {/* 右侧空白占位 */}
          <div className="hidden md:block md:col-span-3 lg:col-span-2"></div>
        </div>
      </div>
    </div>
  );
};

export default UserBlogsPage;