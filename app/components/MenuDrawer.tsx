"use client";

import React from 'react';
import Link from 'next/link';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { MenuDrawerProps } from '@/app/types';

const MenuDrawer: React.FC<MenuDrawerProps> = ({ isOpen, onOpenChange }) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="p-0 border-l border-gray-200 w-64 [&>button]:hidden"
      >
        <div className="p-4">
          <nav className="space-y-4">
            <Link
              href="/"
              className="block py-2 text-gray-700 hover:text-black font-medium"
              onClick={() => onOpenChange(false)}
            >
              首页
            </Link>
            <Link
              href="/categories"
              className="block py-2 text-gray-700 hover:text-black font-medium"
              onClick={() => onOpenChange(false)}
            >
              分类
            </Link>
            <Link
              href="/english"
              className="block py-2 text-gray-700 hover:text-black font-medium"
              onClick={() => onOpenChange(false)}
            >
              英语练习
            </Link>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MenuDrawer;
