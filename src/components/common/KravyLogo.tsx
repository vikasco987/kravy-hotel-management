import React from 'react';
import Image from 'next/image';

interface KravyLogoProps {
  /**
   * 'xs' = 28px, 'sm' = 36px, 'md' = 44px, 'lg' = 56px, 'xl' = 80px, or a custom pixel number
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  textClassName?: string;
  subtextClassName?: string;
  className?: string;
  priority?: boolean;
}

const SIZE_MAP: Record<string, number> = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 80,
};

export default function KravyLogo({
  size = 'md',
  showText = false,
  textClassName = 'text-white text-lg font-black tracking-tight leading-tight',
  subtextClassName = 'text-[10px] font-medium text-slate-400 tracking-wide leading-none mt-0.5',
  className = '',
  priority = false,
}: KravyLogoProps) {
  const pixelSize = typeof size === 'number' ? size : (SIZE_MAP[size] || 44);

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div
        className="relative shrink-0 overflow-hidden rounded-xl shadow-md border border-white/10"
        style={{ width: pixelSize, height: pixelSize }}
      >
        <Image
          src="/images/kravy-logo.png"
          alt="Kravy Logo"
          fill
          sizes={`${pixelSize}px`}
          priority={priority}
          className="object-contain"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={textClassName}>Kravy</span>
          <span className={subtextClassName}>Hotel Management</span>
        </div>
      )}
    </div>
  );
}
