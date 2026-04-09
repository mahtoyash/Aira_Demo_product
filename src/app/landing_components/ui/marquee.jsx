import React from 'react';

export function Marquee({ className, reverse, pauseOnHover = false, children, ...props }) {
  return (
    <div
      {...props}
      className={`group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)] ${className || ''}`}
    >
      <div
        className={`flex shrink-0 justify-around [gap:var(--gap)] animate-[marquee_var(--duration)_linear_infinite] ${
          pauseOnHover ? 'group-hover:[animation-play-state:paused]' : ''
        } ${reverse ? '[animation-direction:reverse]' : ''}`}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className={`flex shrink-0 justify-around [gap:var(--gap)] animate-[marquee_var(--duration)_linear_infinite] ${
          pauseOnHover ? 'group-hover:[animation-play-state:paused]' : ''
        } ${reverse ? '[animation-direction:reverse]' : ''}`}
      >
        {children}
      </div>
    </div>
  );
}
