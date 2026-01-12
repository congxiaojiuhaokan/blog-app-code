import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
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
