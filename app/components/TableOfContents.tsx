"use client";

import React, { useState, useEffect } from 'react';

interface TableOfContentsProps {
  content: string;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const [headings, setHeadings] = useState<Array<{ level: number; text: string; id: string }>>([]);

  useEffect(() => {
    // 等待页面渲染完成，然后提取实际的标题元素
    const extractHeadingsFromDOM = () => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const extractedHeadings: Array<{ level: number; text: string; id: string }> = [];

      headingElements.forEach((element) => {
        const level = parseInt(element.tagName.substring(1));
        const text = element.textContent || '';
        let id = element.id || '';

        // 如果没有 id，生成一个随机 id
        if (!id) {
          id = `heading-${Math.random().toString(36).substr(2, 9)}`;
          element.id = id; // 添加到元素上
        }

        extractedHeadings.push({ level, text, id });
      });

      setHeadings(extractedHeadings);
    };

    // 延迟执行，确保页面渲染完成
    const timer = setTimeout(() => {
      extractHeadingsFromDOM();
    }, 500); // 增加延迟时间，确保所有标题都已渲染并添加了 id

    return () => clearTimeout(timer);
  }, [content]);

  if (headings.length === 0) {
    return null; // 如果没有标题，不显示任何内容
  }

  const handleClick = (id: string) => {
    // 尝试直接通过ID查找元素
    const element = document.getElementById(id);
    
    // 如果找到元素，滚动到该元素
    if (element) {
      // 计算偏移量，确保标题显示在页面顶部
      const offsetTop = element.offsetTop;
      window.scrollTo({
        top: offsetTop - 80, // 减去导航栏高度
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav>
      <ul className="space-y-1">
        {headings.map((heading, index) => (
          <li key={index} style={{ paddingLeft: `${(heading.level - 1) * 16}px` }}>
            <a
              href={`#${heading.id}`}
              className="block py-1 px-2 transition-colors hover:text-blue-600"
              onClick={(e) => {
                e.preventDefault();
                handleClick(heading.id);
              }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default TableOfContents;
