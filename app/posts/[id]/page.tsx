import { format } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import TableOfContents from '../../components/TableOfContents';
import '../../components/MarkdownStyles.css';

// 客户端组件包装器
const BlogDetailClient = ({ blog }: { blog: any }) => {
  'use client';
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
      {/* 左侧空白占位 */}
      <div className="hidden md:block md:col-span-3 lg:col-span-2"></div>
      
      {/* 中间博客内容 */}
      <div className="md:col-span-6 lg:col-span-8 px-4 md:px-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-center">{blog.title}</h1>
          <div className="flex flex-wrap items-center gap-2 justify-center mt-2">
            <span className="text-sm text-gray-600">
              {blog.user.name || blog.user.email} ·{' '}
              {format(new Date(blog.createdAt), 'yyyy-MM-dd HH:mm')}
            </span>
            {blog.category && (
              <a 
                href={`/categories/${blog.category.toLowerCase()}`}
                className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                {blog.category}
              </a>
            )}
          </div>
        </div>
        <div className="markdown-content">
          <MarkdownRenderer content={blog.content || ''} />
        </div>
        <div className="mt-8 text-center">
          <Link href="/">
            <button className="text-blue-600 hover:underline">
              返回博客列表
            </button>
          </Link>
        </div>
      </div>

      {/* 右侧目录导航 */}
      <div className="hidden md:block md:col-span-3 lg:col-span-2">
        <div className="sticky top-24 p-0 text-sm">
          {/* TableOfContents 组件需要在客户端渲染 */}
          <TableOfContents content={blog.content || ''} />
        </div>
      </div>
    </div>
  );
};

const prisma = new PrismaClient();


const BlogDetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  // 正确解包params Promise
  const { id } = await params;
  
  // 验证ID是否存在
  if (!id) {
    return (
      <div className="  bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>博客不存在</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">您请求的博客不存在或已被删除。</p>
          </CardContent>
          <CardFooter>
            <Link href="/">
              <button className="text-blue-600 hover:underline">
                返回首页
              </button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 直接从数据库获取博客详情
  const blog = await prisma.blog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  if (!blog) {
    return (
      <div className="  bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>博客不存在</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">您请求的博客不存在或已被删除。</p>
          </CardContent>
          <CardFooter>
            <Link href="/">
              <button className="text-blue-600 hover:underline">
                返回首页
              </button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className=" bg-gray-50">
      <div className=" px-0 py-8">
        <BlogDetailClient blog={blog} />
      </div>
    </div>
  );
};

export default BlogDetailPage;
