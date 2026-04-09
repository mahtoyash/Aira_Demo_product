import React, { useState, useRef, useLayoutEffect } from 'react';

/**
 * An adaptive-width navigation bar with a "limelight" effect that highlights the hovered item.
 */
export const LimelightNav = ({
  items = [],
  className = "",
  limelightClassName = "",
  itemClassName = "text-[32px]",
  onSubItemClick
}) => {
  // Removed Limelight effect logic per user request

  if (items.length === 0) {
    return null; 
  }

  return (
    <nav className={`relative inline-flex items-center h-16 ${className}`}>
      {items.map((item, index) => (
        <div key={item.id || item.name} className="relative group pointer-events-auto h-full flex items-center px-2">
          <a
            href={`#${item.name.toLowerCase().replace(' ', '-')}`} 
            className={`relative z-20 flex cursor-pointer items-center justify-center px-4 py-2 transition-all duration-300 transform hover:scale-105 font-[family-name:var(--font-geist)] font-medium text-black hover:opacity-100 opacity-80 ${itemClassName}`}
            aria-label={item.name}
          >
            {item.name}
          </a>
          
          {/* Dropdown Menu nested within to preserve existing functionality */}
          {item.menu && item.menu.length > 0 && (
            <div className="absolute left-1/2 -translate-x-1/2 top-[80%] pt-4 w-48 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
              <div className="py-2 flex flex-col items-center bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
                {item.menu.map(subItem => (
                  <a 
                    key={subItem} 
                    href={`#${subItem.toLowerCase()}`} 
                    onClick={(e) => {
                      if (onSubItemClick) {
                        onSubItemClick(e, subItem);
                      }
                    }}
                    className="w-full text-center px-4 py-3 text-[18px] md:text-[20px] font-medium text-gray-700 hover:text-black hover:bg-gray-100/80 transition-colors"
                  >
                    {subItem}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </nav>
  );
};
