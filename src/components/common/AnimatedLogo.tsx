'use client';

import Link from 'next/link';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showAnimation?: boolean;
}

export function AnimatedLogo({ size = 'md', showAnimation = true }: AnimatedLogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const suffixes = ['', 'llect', 'unt', 'mpute', 'mpare', 'ver', 'mment'];

  return (
    <Link href="/" className="flex items-center group">
      <div className={`flex items-center font-bold ${sizeClasses[size]} leading-none`}>
        {/* fener - Sarı */}
        <span className="text-fb-yellow drop-shadow-[0_2px_8px_rgba(252,211,77,0.3)] group-hover:drop-shadow-[0_2px_12px_rgba(252,211,77,0.5)] transition-all duration-300">
          fener
        </span>
        
        {/* .co - Beyaz */}
        <span className="text-white">
          .co
        </span>
        
        {/* Animated suffix */}
        {showAnimation && (
          <div className="h-[1em] overflow-hidden relative ml-[1px]">
            <div className="animate-logo-scroll">
              {suffixes.map((suffix, index) => (
                <span
                  key={index}
                  className="block h-[1em] text-white/40"
                >
                  {suffix}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export default AnimatedLogo;
