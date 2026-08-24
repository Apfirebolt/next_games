'use client';

import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  // Generate page numbers with sliding window & ellipses
  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  return (
    <nav
      aria-label="Pagination Navigation"
      className="flex items-center justify-center gap-1.5 py-6 select-none"
    >
      {/* Previous Button */}
      <button
        type="button"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        aria-label="Previous Page"
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-brown/30 bg-carafe px-3 text-xs font-medium text-sand transition-all hover:bg-brown/40 hover:text-white disabled:pointer-events-none disabled:opacity-40"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 w-8 items-center justify-center text-sm font-semibold text-tan/60"
              >
                &hellip;
              </span>
            );
          }

          const isCurrent = page === currentPage;

          return (
            <button
              key={`page-${page}`}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={isCurrent ? 'page' : undefined}
              className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg px-2.5 text-xs font-semibold transition-all ${
                isCurrent
                  ? 'bg-tan text-carafe shadow-sm ring-1 ring-tan/80'
                  : 'border border-brown/30 bg-carafe text-sand hover:bg-brown/40 hover:text-white'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        aria-label="Next Page"
        className="inline-flex h-9 items-center gap-1 rounded-lg border border-brown/30 bg-carafe px-3 text-xs font-medium text-sand transition-all hover:bg-brown/40 hover:text-white disabled:pointer-events-none disabled:opacity-40"
      >
        <span className="hidden sm:inline">Next</span>
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </nav>
  );
};

export default Pagination;