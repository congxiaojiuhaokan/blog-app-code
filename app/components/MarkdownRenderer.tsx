'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import CodeBlock from './CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // 页面级别的代码块主题状态
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // 确保只在客户端运行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 自定义 rehype slug 插件
  const customRehypeSlug = () => {
    return (tree: any) => {
      // 遍历所有元素
      const visit = (node: any) => {
        if (node.type === 'element' && /^h[1-6]$/.test(node.tagName)) {
          // 生成随机ID
          const randomId = `heading-${Math.random().toString(36).substr(2, 9)}`;
          
          // 添加 id 属性
          if (!node.properties) node.properties = {};
          node.properties.id = randomId;
        }
        
        // 递归遍历子元素
        if (node.children) {
          node.children.forEach(visit);
        }
      };
      
      visit(tree);
    };
  };

  // 在客户端渲染完成后再显示内容，避免 hydration 错误
  if (!isClient) {
    return <div className="w-full h-full m-0 p-0"></div>;
  }

  return (
    <div className="w-full h-full m-0 p-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[
          customRehypeSlug,
          [rehypeAutolinkHeadings, { 
            behavior: 'before',
            properties: {
              className: 'anchor-link no-underline hover:underline mr-2'
            }
          }]
        ]}
        components={{
          code: (props: any) => (
            <CodeBlock
              inline={props.inline || false}
              className={props.className}
              children={props.children}
              metastring={props.metastring}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
            />
          ),
          // 移除所有元素的默认边距
          p: (props) => <p {...props} style={{ margin: 0, padding: 0 }} />,
          h1: (props) => <h1 {...props} style={{ margin: 0, padding: 0 }} />,
          h2: (props) => <h2 {...props} style={{ margin: 0, padding: 0 }} />,
          h3: (props) => <h3 {...props} style={{ margin: 0, padding: 0 }} />,
          h4: (props) => <h4 {...props} style={{ margin: 0, padding: 0 }} />,
          ul: (props) => <ul {...props} style={{ margin: 0, padding: 0 }} />,
          ol: (props) => <ol {...props}  />,
          li: (props) => <li {...props} style={{ margin: 0, padding: 0 }} />,
          blockquote: (props) => <blockquote {...props} style={{ margin: 0, padding: 0 }} />,
          table: (props) => <table {...props} style={{ margin: 0, padding: 0 }} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
