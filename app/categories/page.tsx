"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const CategoriesPage: React.FC = () => {
  const { data: session } = useSession();
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

  const [allBlogs, setAllBlogs] = useState<Blog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [blogsByCategory, setBlogsByCategory] = useState<Record<string, Blog[]>>({});
  const [displayBlogs, setDisplayBlogs] = useState<Blog[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);


  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/blogs', {
          cache: 'no-store',
        });

        const data = await res.json();
        const blogs: Blog[] = Array.isArray(data) ? data.map((blog: any) => ({
          ...blog,
          status: blog.status || 'published',
          isPrivate: blog.isPrivate || false,
          user: blog.user || {
            id: 'unknown',
            name: null,
            email: 'unknown@example.com'
          }
        })) : [];
        setAllBlogs(blogs);

        const byCategory: Record<string, Blog[]> = {};
        categories.forEach(category => {
          byCategory[category] = blogs.filter(blog => 
            blog.category?.toLowerCase() === category.toLowerCase()
          );
        });
        setBlogsByCategory(byCategory);
        
        // 初始显示所有博客
        const sortedBlogs = [...blogs].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setDisplayBlogs(sortedBlogs);
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);


  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
    
    let blogsToDisplay: Blog[];
    if (selectedCategory === category) {
      // 如果点击的是当前选中的分类，显示所有博客
      blogsToDisplay = [...allBlogs].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      // 否则显示选中分类的博客
      blogsToDisplay = blogsByCategory[category] || [];
    }
    setDisplayBlogs(blogsToDisplay);
    // 关闭抽屉
    setIsSheetOpen(false);
  };


  return (
    <div className=" bg-gray-50">
      {/* 手机端分类菜单 */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-[64px] z-40">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="w-full justify-start px-4 py-3 text-left">
              <span className="mr-2">☰</span>
              分类菜单
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="bottom" 
            className="w-full"
            style={{
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
            }}
          >
            <div className="py-4">
              <h3 className="text-lg font-semibold mb-4 px-4">分类</h3>
              <ul className="space-y-1">
                {categories.map((category) => (
                  <li key={category}>
                    <button
                      onClick={() => {
                        handleCategoryClick(category);
                      }}
                      className={`flex items-center justify-between w-full py-2 px-4 rounded-md transition-colors ${
                        selectedCategory === category
                          ? 'bg-black text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="font-medium">{category}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {blogsByCategory[category]?.length || 0}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className=" px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          {/* 左侧分类列表 (仅在桌面端显示) */}
          <div className="hidden md:block md:col-span-3 lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 sticky top-24">
              <ul className="space-y-1 md:space-y-2">
                {categories.map((category) => (
                  <li key={category}>
                    <button
                      onClick={() => handleCategoryClick(category)}
                      className={`flex items-center justify-between w-full py-2 px-3 rounded-md transition-colors ${
                        selectedCategory === category
                          ? 'bg-black text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="font-medium">{category}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {blogsByCategory[category]?.length || 0}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 中间博客列表 */}
          <div className="md:col-span-6 lg:col-span-8">
            {loading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">加载中...</p>
              </div>
            ) : (
              <div>
                {displayBlogs.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">
                      {selectedCategory ? `暂无 ${selectedCategory} 分类的博客文章` : '暂无博客文章'}
                    </p>
                  </div>
                ) : (
                  // 使用 @tanstack/react-virtual 实现虚拟列表
                  <VirtualList
                    items={displayBlogs}
                    renderItem={(blog) => (
                      <BlogCard
                        blog={blog as Blog}
                        currentUserId={(session?.user as any)?.id || null}
                      />
                    )}
                    dynamicHeight={true}
                  />
                )}
              </div>
            )}
          </div>

          {/* 右侧边栏 (仅在桌面端显示) */}
          <div className="hidden md:block md:col-span-3 lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 sticky top-24">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">统计</h3>
                  <p className="text-sm text-gray-600">
                    共有 {selectedCategory ? (blogsByCategory[selectedCategory]?.length || 0) : allBlogs.length} 篇博客文章
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;