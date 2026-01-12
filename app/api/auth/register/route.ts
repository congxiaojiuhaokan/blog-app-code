import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

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
