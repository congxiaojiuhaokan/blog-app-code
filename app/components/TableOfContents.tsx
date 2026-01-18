"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Heading {
  level: number;
  text: string;
  id: string;
  children: Heading[];
}

interface TableOfContentsProps {
  content: string;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const [headingTree, setHeadingTree] = useState<Heading[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

      // 构建树状结构
      const buildTree = (headings: Array<{ level: number; text: string; id: string }>): Heading[] => {
        const tree: Heading[] = [];
        const stack: Heading[] = [];

        headings.forEach(heading => {
          const newNode: Heading = { ...heading, children: [] };

          if (heading.level === 1) {
            // 一级标题直接添加到树中
            tree.push(newNode);
            stack.length = 0;
            stack.push(newNode);
          } else {
            // 找到合适的父节点
            while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
              stack.pop();
            }
            if (stack.length > 0) {
              stack[stack.length - 1].children.push(newNode);
            }
            stack.push(newNode);
          }
        });

        return tree;
      };

      const tree = buildTree(extractedHeadings);
      setHeadingTree(tree);

      // 初始化展开状态：只展开一级标题，二级及以下默认折叠
      const initialExpanded: Record<string, boolean> = {};
      const initExpandedState = (nodes: Heading[]) => {
        nodes.forEach(node => {
          // 只有一级标题默认展开
          initialExpanded[node.id] = node.level === 1;
          if (node.children.length > 0) {
            initExpandedState(node.children);
          }
        });
      };
      initExpandedState(tree);
      setExpanded(initialExpanded);
    };

    // 延迟执行，确保页面渲染完成
    const timer = setTimeout(() => {
      extractHeadingsFromDOM();
    }, 500); // 增加延迟时间，确保所有标题都已渲染并添加了 id

    return () => clearTimeout(timer);
  }, [content]);

  if (headingTree.length === 0) {
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

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // 递归渲染标题树
  const renderHeadingTree = (nodes: Heading[]) => {
    return (
      <ul className="space-y-1">
        {nodes.map((node) => {
          const isExpanded = expanded[node.id] ?? false;
          const hasChildren = node.children.length > 0;
          
          return (
            <li key={node.id} className="space-y-1">
              <div className="flex items-center gap-1">
                {hasChildren && (
                  <button
                    onClick={() => toggleExpand(node.id)}
                    className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 flex-shrink-0"
                    aria-expanded={isExpanded}
                    type="button"
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
                  className={`block py-1 px-2 rounded transition-colors hover:text-blue-600 hover:bg-gray-100 text-sm font-medium ${node.level === 1 ? 'font-semibold' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleClick(node.id);
                  }}
                  style={{ paddingLeft: hasChildren ? '0' : `${(node.level - 1) * 16}px` }}
                >
                  {node.text}
                </a>
              </div>
              {hasChildren && isExpanded && (
                <div className="pl-4">
                  {renderHeadingTree(node.children)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <nav className="p-0 max-h-[calc(100vh-120px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {renderHeadingTree(headingTree)}
    </nav>
  );
};

export default TableOfContents;
