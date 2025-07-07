/**
 * Virtual Grid Component
 * Renders only visible images in a grid layout to improve performance with large photo sets
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import ProgressiveImage from "./ProgressiveImage";

const VirtualGrid = ({
  items = [],
  itemHeight = 200,
  itemWidth = 200,
  gap = 16,
  overscan = 5,
  className = "",
  renderItem,
  onItemClick = () => {},
  ...props
}) => {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate grid dimensions
  const { columnsCount, visibleItems } = useMemo(() => {
    if (!containerSize.width || !items.length) {
      return { columnsCount: 0, visibleItems: [] };
    }

    const availableWidth = containerSize.width - gap;
    const columnsCount = Math.floor(availableWidth / (itemWidth + gap));
    const rowsCount = Math.ceil(items.length / columnsCount);

    // Calculate visible rows
    const containerHeight = containerSize.height;
    const rowHeight = itemHeight + gap;

    const startRow = Math.floor(scrollTop / rowHeight);
    const visibleRowsCount = Math.ceil(containerHeight / rowHeight);
    const endRow = Math.min(startRow + visibleRowsCount + overscan, rowsCount);

    // Get visible items
    const visibleStartIndex = Math.max(0, startRow - overscan) * columnsCount;
    const visibleEndIndex = Math.min(endRow * columnsCount, items.length);
    const visibleItems = items.slice(visibleStartIndex, visibleEndIndex);

    return {
      columnsCount,
      visibleItems: visibleItems.map((item, index) => ({
        ...item,
        index: visibleStartIndex + index,
        row: Math.floor((visibleStartIndex + index) / columnsCount),
        col: (visibleStartIndex + index) % columnsCount,
      })),
    };
  }, [containerSize, scrollTop, items, itemWidth, itemHeight, gap, overscan]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle scroll
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // Total height for scrolling
  const totalHeight =
    Math.ceil(items.length / columnsCount) * (itemHeight + gap);

  if (!items.length) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-gray-500 dark:text-gray-400 text-center">
          <svg
            className="w-12 h-12 mx-auto mb-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
          <p>No items to display</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onScroll={handleScroll}
      style={{ height: "100%" }}
      {...props}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleItems.map((item) => (
          <div
            key={item.index}
            className="absolute"
            style={{
              left: item.col * (itemWidth + gap),
              top: item.row * (itemHeight + gap),
              width: itemWidth,
              height: itemHeight,
            }}
          >
            {renderItem ? (
              renderItem(item, item.index)
            ) : (
              <ProgressiveImage
                src={item.src || item.url}
                alt={item.alt || `Item ${item.index}`}
                className="w-full h-full object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => onItemClick(item, item.index)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualGrid;
