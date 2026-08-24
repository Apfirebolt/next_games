'use client';

import React from 'react';

const Loader = ({ text = 'Loading...' }) => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      {/* Spinner Container */}
      <div className="relative flex items-center justify-center">
        {/* Outer subtle glow/pulse ring */}
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-brown/20 duration-1000" />

        {/* Background track circle */}
        <div className="h-14 w-14 rounded-full border-4 border-brown/20" />

        {/* Active spinning arc */}
        <div className="absolute h-14 w-14 animate-spin rounded-full border-4 border-transparent border-t-tan border-r-brown" />

        {/* Inner core dot */}
        <div className="absolute h-2.5 w-2.5 rounded-full bg-sand/80" />
      </div>

      {/* Loading Label */}
      {text && (
        <span className="text-xs font-semibold tracking-widest text-tan uppercase animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
};

export default Loader;