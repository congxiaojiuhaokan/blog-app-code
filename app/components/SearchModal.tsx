"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { SearchModalProps, Post } from '@/app/types';
import SearchResults from './SearchResults';

interface Blog {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  isPrivate: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onOpenChange,
  searchQuery,
  onSearchQueryChange,
  onSearch,
}) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 根据搜索关键词过滤文章
  const filteredPosts = searchQuery
    ? allPosts.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : latestPosts;

  // 获取所有公开文章
  useEffect(() => {
    if (isOpen) {
      const fetchAllPosts = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/blogs', {
            cache: 'no-store',
          });
          if (res.ok) {
            const blogs: Blog[] = await res.json();
            // 过滤出公开的文章，按创建时间排序
            const publicBlogs = blogs
              .filter(blog => blog.status === 'published' && !blog.isPrivate)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            // 转换为 Post 类型
            const posts: Post[] = publicBlogs.map(blog => ({
              id: blog.id,
              title: blog.title,
              href: `/posts/${blog.id}`
            }));
            
            // 设置所有公开文章
            setAllPosts(posts);
            // 设置最新的五篇文章
            setLatestPosts(posts.slice(0, 5));
          }
        } catch (error) {
          console.error('Error fetching posts:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchAllPosts();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    } else if (e.key === 'Enter') {
      onSearch(e);
    }
  };

  const handleResultClick = () => {
    onOpenChange(false);
  };

  const renderSearchContent = () => (
    <div className="p-4" style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Search Input */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <span className="text-xs text-gray-400">Esc</span>
        </div>
        <Input
          type="text"
          placeholder="What are you searching for?"
          className="w-full pl-10 pr-10 h-10 border border-gray-300 rounded-md focus:outline-none focus:border-gray-400 focus-visible:outline-none focus-visible:border-gray-400 focus-visible:ring-0"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>

      {/* Search Results */}
      {loading ? (
        <div className="p-4 text-center text-gray-500">加载中...</div>
      ) : (
        <SearchResults
          results={filteredPosts}
          onResultClick={handleResultClick}
        />
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="sm:max-w-lg p-0 border-t border-gray-200 h-3/4 [&>button]:hidden"
        >
          {renderSearchContent()}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg p-0 border border-gray-200 rounded-lg [&>button]:hidden"
        style={{ width: '340px' }}
      >
        {renderSearchContent()}
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;
