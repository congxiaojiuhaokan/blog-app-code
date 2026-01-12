"use client";

import React, { useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

// 添加全局样式来隐藏滚动条
const style = document.createElement('style');
style.textContent = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
document.head.appendChild(style);

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
  className?: string;
  dynamicHeight?: boolean;
  
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight = 220, // 增加默认高度以避免重叠
  overscan = 3,
  className = '',
  dynamicHeight = false,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<Map<number, number>>(new Map());

  // 当 items 变化时，重置 sizes
  useEffect(() => {
    setSizes(new Map());
  }, [items]);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => sizes.get(index) || itemHeight,
    overscan,
  });

  // 更新项目高度的函数
  const updateItemSize = (index: number, size: number) => {
    setSizes(prev => {
      const newSizes = new Map(prev);
      newSizes.set(index, size);
      return newSizes;
    });
  };

  return (
    <div
      ref={parentRef}
      className={`${dynamicHeight ? '' : 'h-[calc(100vh-200px)]'} overflow-y-auto scrollbar-hide ${className}`}
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div
              ref={(el) => {
                if (el) {
                  const height = el.getBoundingClientRect().height;
                  if (height > 0 && height !== sizes.get(virtualRow.index)) {
                    updateItemSize(virtualRow.index, height);
                  }
                }
              }}
            >
              {renderItem(items[virtualRow.index], virtualRow.index)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
