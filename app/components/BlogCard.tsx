"use client";

import React from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export interface Blog {
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

interface BlogCardProps {
  blog: Blog;
  currentUserId?: string | null;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

// 优化：使用 React.memo 减少不必要的重新渲染，自定义比较函数确保只有必要时才重新渲染
export const BlogCard: React.FC<BlogCardProps> = React.memo(({
  blog,
  currentUserId,
  onDelete,
  showActions = true
}) => {
  const isAuthor = currentUserId === blog.user.id;
  const showActionButtons = showActions && isAuthor;

  // 优化：使用 useCallback 缓存删除处理函数
  const handleDelete = React.useCallback(() => {
    if (onDelete) {
      onDelete(blog.id);
    }
  }, [onDelete, blog.id]);

  // 优化：使用 useMemo 缓存计算结果，避免每次渲染都执行
  const formattedDate = React.useMemo(() => {
    return format(new Date(blog.createdAt), 'yyyy-MM-dd');
  }, [blog.createdAt]);

  // 优化：使用 useMemo 缓存内容处理结果
  const processedContent = React.useMemo(() => {
    return blog.content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .substring(0, 150) + '...';
  }, [blog.content]);

  return (
    <div className="hover:shadow-md transition-shadow p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex flex-col gap-3 w-full">
        {/* 标题和分类 */}
        <div className="flex flex-row justify-between items-start gap-2 w-full">
          <Link href={`/posts/${blog.id}`} className="max-w-[50%] truncate hover:no-underline">
            <h3 className="text-xl font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
              {blog.title}
            </h3>
          </Link>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {blog.category && (
              <Link href={`/categories`} className="hover:no-underline">
                <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-md self-start hover:bg-gray-200 transition-colors">
                  {blog.category}
                </span>
              </Link>
            )}
            {blog.status === 'draft' && (
              <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                草稿
              </span>
            )}
            {blog.status === 'published' && blog.isPrivate && (
              <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                私密
              </span>
            )}
          </div>
        </div>

        {/* 内容 */}
        <Link href={`/posts/${blog.id}`} className="block w-full hover:no-underline">
          <p className="text-gray-600 line-clamp-2 w-full h-12">
            {processedContent}
          </p>
        </Link>

        {/* 作者信息和操作按钮 */}
        <div className="flex flex-row justify-between items-center gap-3 pt-2 border-t border-gray-100 w-full flex-wrap min-h-14">
          <div className="flex flex-col gap-1 flex-1 items-start">
              {blog.user?.id && (
                <Link href={`/user/${blog.user.id}`} className="text-blue-600 hover:underline text-sm font-medium">
                  {blog.user.name || blog.user.email}
                </Link>
              )}
              {!blog.user?.id && (
                <span className="text-gray-600 text-sm font-medium">
                  {blog.user?.name || blog.user?.email || '未知用户'}
                </span>
              )}
              <span className="text-sm text-gray-500">
                {formattedDate}
              </span>
            </div>
          {showActionButtons && (
            <div className="flex-shrink-0">
              {/* 统一布局：编辑按钮 + 删除按钮 */}
              <div className="flex items-center space-x-3">
                <Link href={`/dashboard?edit=${blog.id}`}>
                  <Button variant="secondary" size="sm">
                    编辑
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      删除
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除</AlertDialogTitle>
                      <AlertDialogDescription>
                        您确定要删除这篇博客吗？此操作不可撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        删除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
          {/* 当没有按钮时，添加一个占位元素以保持高度一致 */}
          {!showActionButtons && (
            <div className="h-9 flex-shrink-0"></div>
          )}
        </div>
      </div>
    </div>
  );
});

// 使用 React.memo 包装组件，减少不必要的重新渲染
export default React.memo(BlogCard);