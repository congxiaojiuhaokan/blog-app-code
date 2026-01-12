"use client";

import React from 'react';
import Link from 'next/link';
import { SearchResultsProps } from '@/app/types';

const SearchResults: React.FC<SearchResultsProps> = ({ results, onResultClick }) => {
  return (
    <div className="max-h-96 overflow-y-auto" style={{ width: '300px' }}>
      <div className="space-y-1">
        {results.map((post) => (
          <Link
            key={post.id}
            href={post.href}
            className="block p-2 hover:bg-gray-50 rounded-md transition-colors"
            passHref
          >
            <div
              className="flex items-center space-x-3"
              onClick={onResultClick}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-500 flex-shrink-0"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <span 
                  className="text-gray-800"
                  style={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {post.title}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
