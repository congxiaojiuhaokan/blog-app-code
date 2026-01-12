"use client";

import React, { useState } from 'react';
import { signIn, useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const LoginPage: React.FC = () => {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Get callback URL from query parameters, default to '/'
    const urlParams = new URLSearchParams(window.location.search);
    const callbackUrl = urlParams.get('callbackUrl') || '/';

    // Check if user exists
    const userExists = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const userExistsData = await userExists.json();

    if (!userExistsData.exists) {
      setError('该邮箱未注册');
      return;
    }

    // If user exists, attempt to sign in
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError('密码错误');
    } else {
      router.push(callbackUrl);
    }
  };

  // 处理切换账号
  const handleSwitchAccount = async () => {
    await signOut({ redirect: false });
    // 清除状态，重新渲染登录表单
    setEmail('');
    setPassword('');
  };

  // 处理返回首页
  const handleGoHome = () => {
    router.push('/');
  };

  // 检查会话状态
  if (status === 'loading') {
    return (
      <div className="  flex items-center justify-center">
        <div className="text-center">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  // 如果用户已登录，显示不同内容
  if (session?.user) {
    return (
      <div className="  flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">您已登录</CardTitle>
            <CardDescription className="text-center">
              您已以 {session.user.name || session.user.email} 的身份登录
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">您已经登录，是否需要切换账号？</p>
            <div className="flex flex-col space-y-3">
              <Button 
                onClick={handleSwitchAccount}
                className="w-full"
              >
                切换账号
              </Button>
              <Button 
                variant="ghost"
                onClick={handleGoHome}
                className="w-full"
              >
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 未登录用户显示登录表单
  return (
    <div className="  flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">登录</CardTitle>
          <CardDescription className="text-center">
            登录您的账号以发布博客
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="请输入您的邮箱"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="请输入您的密码"
              />
            </div>
            <Button type="submit" className="w-full">
              登录
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Separator />
          <div className="text-center text-sm text-gray-500">
            还没有账号？{' '}
            <button
              onClick={() => router.push('/register')}
              className="text-blue-600 hover:underline"
            >
              注册
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
