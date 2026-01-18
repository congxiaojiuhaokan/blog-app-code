"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Heading {
  level: number;
  text: string;
  id: string;
}

interface TableOfContentsProps {
  content: string;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // 等待页面渲染完成，然后提取实际的标题元素
    const extractHeadingsFromDOM = () => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const extractedHeadings: Heading[] = [];

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
      
      // 默认展开所有一级标题
      const initialExpanded: Record<string, boolean> = {};
      extractedHeadings
        .filter(heading => heading.level === 1)
        .forEach(heading => {
          initialExpanded[heading.id] = true;
        });
      setExpandedSections(initialExpanded);
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

  const toggleSection = (headingId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [headingId]: !prev[headingId]
    }));
  };

  // 组织标题为树状结构
  const buildHeadingTree = () => {
    const tree: any[] = [];
    const stack: any[] = [];

    headings.forEach(heading => {
      const node = { ...heading, children: [] };

      if (heading.level === 1) {
        tree.push(node);
        stack.length = 0;
        stack.push(node);
      } else {
        while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
          stack.pop();
        }
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(node);
        }
        stack.push(node);
      }
    });

    return tree;
  };

  const headingTree = buildHeadingTree();

  // 递归渲染标题树
  const renderHeadingTree = (nodes: any[], level: number = 1) => {
    return (
      <ul className="space-y-1 pl-2">
        {nodes.map((node, index) => {
          const isExpanded = expandedSections[node.id] ?? true;
          const hasChildren = node.children.length > 0;
          
          return (
            <li key={index} className="space-y-1">
              <div className="flex items-center gap-1">
                {hasChildren && (
                  <button
                    onClick={() => toggleSection(node.id)}
                    className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}
                <a
                  href={`#${node.id}`}
                  className={`block py-1 px-2 rounded transition-colors hover:text-blue-600 hover:bg-gray-100 text-sm font-medium ${level === 1 ? 'font-semibold' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleClick(node.id);
                  }}
                  style={{ paddingLeft: hasChildren ? '0' : `${(level - 1) * 16}px` }}
                >
                  {node.text}
                </a>
              </div>
              {hasChildren && isExpanded && renderHeadingTree(node.children, level + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <nav className="bg-white rounded-md shadow-sm p-3 border border-gray-200">
      <h3 className="text-sm font-semibold mb-3 text-gray-700">目录</h3>
      {renderHeadingTree(headingTree)}
    </nav>
  );
};

export default TableOfContents;
