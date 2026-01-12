import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';
import { blogRateLimit } from '../middleware/rateLimit';

const prisma = new PrismaClient();

// GET /api/blogs - 获取所有公开的已发布博客
export async function GET(req: NextRequest) {
  try {
    // 解析查询参数
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const category = url.searchParams.get('category');
    
    // 构建查询条件
    const id = url.searchParams.get('id');
    let where: any = {};
    
    console.log('GET /api/blogs - Query params:', { userId, category, id });
    
    if (id) {
      where.id = id;
    } else if (userId) {
      // 当指定了userId时，返回该用户的所有公开博客（已发布且非私密）
      where = {
        userId,
        status: 'published',
        isPrivate: false
      };
      console.log('GET /api/blogs - Where clause for user:', where);
    } else {
      where = { status: 'published', isPrivate: false };
    }
    
    if (category) {
      where.category = category;
    }

    console.log('GET /api/blogs - Final where clause:', where);
    
    let result;
    if (id) {
      // 如果指定了 ID，返回单个博客对象
      // 对于单个博客，我们不限制状态和隐私设置，因为用户可能需要编辑自己的私密博客或草稿
      // 但我们仍然需要确保用户只能访问自己的博客
      const session = await getServerSession(authOptions);
      let blogWhere: { id: string; userId?: string } = { id };
      
      // 如果用户已登录，检查博客是否属于该用户
      if (session?.user) {
        blogWhere = {
          id,
          userId: session.user.id,
        };
      }
      
      result = await prisma.blog.findFirst({
        where: blogWhere,
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
    } else {
      // 否则返回博客列表
      result = await prisma.blog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }
    
    console.log('Fetched result:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ error: 'Failed to fetch blogs', details: error }, { status: 500 });
  }
}
// POST /api/blogs - 创建新博客
export async function POST(req: NextRequest) {
  try {
    // 获取会话信息
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 速率限制检查
    const rateLimitResponse = await new Promise<NextResponse | null>((resolve) => {
      const res = {
        headers: new Headers(),
      };
      
      const next = () => {
        resolve(null);
      };
      
      // 模拟请求对象
      const reqWithSession = {
        ...req,
        session,
        ip: 'unknown',
      };
      
      // 应用速率限制
      blogRateLimit(reqWithSession as any, res as any, next);
    });
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 检查session.user.id是否存在
    if (!session.user.id) {
      return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 });
    }

    const { title, content, category, status = 'published', isPrivate = false } = await req.json();

    // 只有当状态为published时，才强制要求所有字段都填写
    // 状态为draft时，允许部分字段为空
    if (status === 'published' && (!title || !content || !category)) {
      return NextResponse.json({ error: 'Title, content and category are required' }, { status: 400 });
    }

    // 获取用户ID，优先使用session.user.id
    const userId = session.user.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }
    
    try {
      const blog = await prisma.blog.create({
        data: {
          title,
          content,
          category,
          status,
          isPrivate,
          userId,
        },
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
      
      return NextResponse.json(blog, { status: 201 });
    } catch (error) {
      console.error('Detailed error creating blog:', error);
      return NextResponse.json({ error: 'Failed to create blog', details: error }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating blog:', error);
    return NextResponse.json({ error: 'Failed to create blog', details: error }, { status: 500 });
  }
}// PUT /api/blogs/[id] - 更新博客
export async function PUT(req: NextRequest) {
  try {
    // 获取会话信息
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 速率限制检查
    const rateLimitResponse = await new Promise<NextResponse | null>((resolve) => {
      const res = {
        headers: new Headers(),
      };
      
      const next = () => {
        resolve(null);
      };
      
      // 模拟请求对象
      const reqWithSession = {
        ...req,
        session,
        ip: 'unknown',
      };
      
      // 应用速率限制
      blogRateLimit(reqWithSession as any, res as any, next);
    });
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { id, title, content, category, status, isPrivate } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Blog ID is required' }, { status: 400 });
    }

    // 获取用户ID
    const userId = session.user.id;
    
    // 检查博客是否存在且属于当前用户
    const existingBlog = await prisma.blog.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingBlog) {
      return NextResponse.json({ error: 'Blog not found or not authorized' }, { status: 404 });
    }

    // 更新博客
    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
        ...(status !== undefined && { status }),
        ...(isPrivate !== undefined && { isPrivate }),
      },
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
    
    return NextResponse.json(updatedBlog);
  } catch (error) {
    console.error('Error updating blog:', error);
    return NextResponse.json({ error: 'Failed to update blog', details: error }, { status: 500 });
  }
}
// DELETE /api/blogs/[id] - 删除博客
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Blog ID is required' }, { status: 400 });
    }

    // 获取用户ID
    const userId = session.user.id;
    
    // 检查博客是否存在且属于当前用户
    const existingBlog = await prisma.blog.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingBlog) {
      return NextResponse.json({ error: 'Blog not found or not authorized' }, { status: 404 });
    }

    // 删除博客
    await prisma.blog.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json({ error: 'Failed to delete blog', details: error }, { status: 500 });
  }
}
