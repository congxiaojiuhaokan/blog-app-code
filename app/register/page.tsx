"use client";

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const RegisterPage: React.FC = () => {
  const { data: session, status } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // 验证邮箱格式
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 验证邮箱格式
    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '注册过程中发生错误');
        return;
      }

      setSuccess('注册成功！请登录。');
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('注册过程中发生错误');
      console.error(err);
    }
  };

  // 处理注册新账号
  const handleRegisterNewAccount = async () => {
    await signOut({ redirect: false });
    // 清除状态，重新渲染注册表单
    setName('');
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
            <p className="mb-6">您已经登录，是否要注册新账号？</p>
            <div className="flex flex-col space-y-3">
              <Button 
                onClick={handleRegisterNewAccount}
                className="w-full"
              >
                注册新账号
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

  // 未登录用户显示注册表单
  return (
    <div className="  flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">注册</CardTitle>
          <CardDescription className="text-center">
            创建账号以发布博客
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-2 bg-green-50 text-green-600 rounded-md text-sm">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名字</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="请输入您的姓名"
              />
            </div>
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
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full">
              注册
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Separator />
          <div className="text-center text-sm text-gray-500">
            已有账号？{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:underline"
            >
              登录
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;
