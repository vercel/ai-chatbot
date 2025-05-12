'use client';

import React from 'react';

interface LogoProps {
  width?: number;
  height?: number;
  showText?: boolean;
  theme?: 'dark' | 'light' | 'gradient';
  onClick?: () => void;
}

export function LostMindLogo({
  width = 50,
  height = 50,
  showText = true,
  theme = 'dark',
  onClick
}: LogoProps) {
  // Theme color mapping
  const getColor = () => {
    switch (theme) {
      case 'light':
        return '#6D28D9';
      case 'gradient':
        return '#4F46E5';
      default:
        return '#4F46E5';
    }
  };

  // Text styling based on theme
  const getTextStyles = () => {
    const styles: React.CSSProperties = {
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700,
      fontSize: 'clamp(14px, 2vw, 24px)',
    };

    if (theme === 'gradient') {
      return {
        ...styles,
        background: 'linear-gradient(45deg, #4F46E5, #8B5CF6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      };
    } else if (theme === 'light') {
      return {
        ...styles,
        color: '#6D28D9',
      };
    } else {
      return {
        ...styles,
        color: '#4F46E5',
      };
    }
  };

  return (
    <div
      className="flex items-center gap-2 transition-all hover:opacity-90 cursor-pointer"
      onClick={onClick}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && onClick) {
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="cursor-pointer transition-transform duration-300 hover:scale-105">
        <svg 
          width={width} 
          height={height} 
          viewBox="0 0 50 50" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="25" cy="25" r="20" stroke={getColor()} strokeWidth="1.5" fill="none" />
          <circle cx="25" cy="25" r="4" fill={getColor()} />
          <path d="M25 5 L25 15" stroke={getColor()} strokeWidth="1.5" />
          <path d="M25 35 L25 45" stroke={getColor()} strokeWidth="1.5" />
          <path d="M5 25 L15 25" stroke={getColor()} strokeWidth="1.5" />
          <path d="M35 25 L45 25" stroke={getColor()} strokeWidth="1.5" />
          <path d="M11 11 L18 18" stroke={getColor()} strokeWidth="1.5" />
          <path d="M32 32 L39 39" stroke={getColor()} strokeWidth="1.5" />
          <path d="M11 39 L18 32" stroke={getColor()} strokeWidth="1.5" />
          <path d="M32 18 L39 11" stroke={getColor()} strokeWidth="1.5" />
        </svg>
      </div>
      {showText && (
        <span style={getTextStyles()} className="transition-all">
          AI Chat
        </span>
      )}
    </div>
  );
}