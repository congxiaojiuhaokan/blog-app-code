import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // 验证邮箱格式
    const validateEmail = (email: string): boolean => {
      // 检查是否缺少用户名部分
      const hasLocalPart = email.includes('@') && email.split('@')[0].trim().length > 0;
      
      // 检查是否包含中文全角字符
      const hasFullWidthChars = /[\uFF00-\uFFFF]/.test(email);
      
      // 检查域名部分是否包含中文句号
      const hasChinesePeriod = email.includes('。');
      
      // 基本邮箱格式验证
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
      return emailRegex.test(email) && !hasFullWidthChars && !hasChinesePeriod && hasLocalPart;
    };

    if (!validateEmail(email)) {
      return NextResponse.json({ error: '请输入有效的邮箱地址' }, { status: 400 });
    }

    // 验证名字长度
    if (name && name.length > 10) {
      return NextResponse.json({ error: '名字长度不能超过10个字符' }, { status: 400 });
    }

    // Check if user already exists by email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 400 });
    }

    // Check if user already exists by name
    if (name) {
      const existingUserByName = await prisma.user.findFirst({
        where: { name },
      });

      if (existingUserByName) {
        return NextResponse.json({ error: '该用户名已被使用' }, { status: 400 });
      }
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: '注册成功！请登录。' }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '注册过程中发生错误' }, { status: 500 });
  }
}
