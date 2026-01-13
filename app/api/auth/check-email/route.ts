import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ exists: false }, { status: 400 });
    }

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
      return NextResponse.json({ exists: false }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    return NextResponse.json({ exists: !!user }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}
