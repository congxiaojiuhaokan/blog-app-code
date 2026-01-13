"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useKeyboardShortcut } from '@/app/hooks/useKeyboardShortcut';
import { signOut, useSession } from 'next-auth/react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import NavigationLinks from './NavigationLinks';
import MenuDrawer from './MenuDrawer';
import SearchModal from './SearchModal';

const Navbar: React.FC = () => {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 实现搜索逻辑
    console.log('搜索:', searchQuery);
    setIsDesktopSearchOpen(false);
    setIsMobileSearchOpen(false);
  };

  // 检测操作系统，显示对应的快捷键
  const getSearchShortcut = () => {
    if (typeof window !== 'undefined') {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      return isMac ? '⌘K' : 'Ctrl+K';
    }
    return '⌘K';
  };

  // 使用键盘快捷键 Hook
  useKeyboardShortcut({
    key: 'k',
    metaKey: true,
    callback: () => {
      // 检测屏幕宽度，打开对应的搜索组件
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      if (isMobile) {
        setIsMobileSearchOpen(true);
      } else {
        setIsDesktopSearchOpen(true);
      }
    },
  });

  // 同时监听 Ctrl+K（Windows/Linux）
  useKeyboardShortcut({
    key: 'k',
    ctrlKey: true,
    callback: () => {
      // 检测屏幕宽度，打开对应的搜索组件
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      if (isMobile) {
        setIsMobileSearchOpen(true);
      } else {
        setIsDesktopSearchOpen(true);
      }
    },
  });

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className=" mx-auto px-4 py-4">
        <div className="flex items-center justify-between w-full">
          {/* Logo and Navigation Links */}
          <div className="flex items-center space-x-8 flex-1">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-xl font-bold text-black">博客</span>
            </Link>

            {/* Desktop Navigation */}
            <NavigationLinks />
          </div>

          {/* Right Side: Search and Login */}
          <div className="flex items-center space-x-6 flex-1 justify-end" style={{ margin: 0 }}>
            {/* Search Button for Desktop */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <Button
                  variant="ghost"
                  className="w-72 h-9 pl-10 pr-3 text-left justify-between text-sm border border-gray-300 rounded-md hover:bg-gray-100"
                  onClick={() => setIsDesktopSearchOpen(true)}
                >
                  <span className="text-gray-400">搜索文章...</span>
                  <span className="text-xs font-medium text-gray-500 px-2 py-0.5 bg-gray-100 rounded-md">{getSearchShortcut()}</span>
                </Button>
              </div>
            </div>

            {/* Search Icon for Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setIsMobileSearchOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </Button>

            {/* 登录/登出按钮 */}
            {session?.user ? (
              <div className="flex items-center space-x-4" style={{ margin: 0 }}>
                <Link href="/dashboard">
                  <Button className="h-9 px-4 bg-black text-white hover:bg-gray-800 rounded-md">
                    发布博客
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-medium">
                        {session.user.name
                          ? session.user.name.charAt(0)
                          : session.user.email
                          ? session.user.email.charAt(0)
                          : 'U'}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <a href="/my-blogs">我的博客</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => signOut()}>
                      登出
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link href="/login">
                <Button className="h-9 px-4 bg-black text-white hover:bg-gray-800 rounded-md">
                  登录
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Search Modal for Desktop */}
        <div className="hidden md:block">
          <SearchModal
            isOpen={isDesktopSearchOpen}
            onOpenChange={setIsDesktopSearchOpen}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSearch={handleSearch}
          />
        </div>

        {/* Search Modal for Mobile */}
        <div className="md:hidden">
          <SearchModal
            isOpen={isMobileSearchOpen}
            onOpenChange={setIsMobileSearchOpen}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSearch={handleSearch}
          />
        </div>

        {/* Menu Drawer */}
        <MenuDrawer isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} />
      </div>
    </header>
  );
};

export default Navbar;
