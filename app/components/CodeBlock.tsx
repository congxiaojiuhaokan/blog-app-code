'use client';

import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  node?: Record<string, unknown>;
  inline: boolean;
  className?: string;
  children: string;
  metastring?: string;
  isDarkMode?: boolean;
  setIsDarkMode?: (darkMode: boolean) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ 
  inline, 
  className, 
  children,
  isDarkMode: propIsDarkMode = true,
  setIsDarkMode 
}) => {
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [localIsDarkMode, setLocalIsDarkMode] = useState(propIsDarkMode);
  
  const isDarkMode = setIsDarkMode ? propIsDarkMode : localIsDarkMode;
  const lightMode = !isDarkMode;
  
  const toggleTheme = () => {
    if (setIsDarkMode) {
      setIsDarkMode(!isDarkMode);
    } else {
      setLocalIsDarkMode(!localIsDarkMode);
    }
  };
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (inline) {
    return (
      <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
        {children}
      </code>
    );
  }

  const isShortCode = children.trim().length < 100 && !children.includes('\n');
  
  if (isShortCode) {
    return (
      <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">
        {children}
      </code>
    );
  }

  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-lg w-full m-0 p-0 overflow-visible">
      <div className={`flex items-center justify-between px-4 py-2 text-sm overflow-visible ${lightMode ? 'bg-gray-200 text-gray-800 rounded-t-lg border border-gray-300' : 'bg-gray-900 text-gray-300 rounded-t-lg border border-gray-700'}`}>
        <div className="flex items-center gap-2 overflow-visible">
          <span className="font-medium">{language || 'plaintext'}</span>
        </div>
        <div className="flex items-center gap-2 overflow-visible">
          <button
            onClick={toggleCollapse}
            className={`p-1 rounded transition-colors ${lightMode ? 'hover:bg-gray-300' : 'hover:bg-gray-700'}`}
            aria-label={isCollapsed ? '展开代码' : '折叠代码'}
          >
            {isCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 15 12 9 18 15"></polyline>
              </svg>
            )}
          </button>
          
          <button
            onClick={handleCopy}
            className={`p-1 rounded transition-colors ${lightMode ? 'hover:bg-gray-300' : 'hover:bg-gray-700'}`}
            aria-label="Copy code"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
          </button>
          
          <button
            onClick={toggleTheme}
            className={`p-1 rounded transition-colors ${lightMode ? 'hover:bg-gray-300' : 'hover:bg-gray-700'}`}
            aria-label="Toggle theme"
          >
            {lightMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <SyntaxHighlighter
          language={language}
          style={lightMode ? undefined : vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            borderRadius: '0 0 0.5rem 0.5rem',
            backgroundColor: lightMode ? '#f8f8f8' : '#1e1e1e',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            minHeight: 'auto',
            height: 'auto',
            border: lightMode ? '1px solid #d1d5db' : '1px solid #374151',
            borderTop: 'none',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              color: lightMode ? '#333333' : '#d4d4d4',
            },
          }}
        >
          {children}
        </SyntaxHighlighter>
      )}
    </div>
  );
};

export default CodeBlock;