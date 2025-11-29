'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { AnimatedLogo } from './AnimatedLogo';

const navigation = [
  { name: 'Anasayfa', href: ROUTES.HOME },
  { name: 'Canlı', href: ROUTES.LIVE, isLive: true },
  { name: 'Maçlar', href: ROUTES.MATCHES },
  { name: 'Turnuvalar', href: ROUTES.TOURNAMENTS },
  { name: 'Kadro', href: ROUTES.SQUAD },
  { name: 'Transfer', href: ROUTES.TRANSFERS },
  { name: 'İstatistik', href: ROUTES.STATISTICS },
];

// Twitter/X Icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 glass-card-solid border-b border-white/10" style={{ borderRadius: 0 }}>
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Animated Logo */}
          <AnimatedLogo size="md" showAnimation={true} />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'nav-link relative',
                  pathname === item.href && 'nav-link-active'
                )}
              >
                {item.isLive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-live rounded-full animate-pulse-live" />
                )}
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center gap-2">
            {/* Twitter/X Link */}
            <a 
              href="https://twitter.com/fenerblog" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-ghost p-2 rounded-full hover:text-fb-yellow"
              aria-label="Twitter"
            >
              <XIcon className="w-5 h-5" />
            </a>

            {/* Search Button */}
            <button className="btn-ghost p-2 rounded-full hover:text-fb-yellow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              className="p-2 rounded-lg hover:bg-slate-800 text-gray-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 animate-slide-down">
            <div className="flex flex-col gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'nav-link relative flex items-center justify-between',
                    pathname === item.href && 'nav-link-active'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{item.name}</span>
                  {item.isLive && (
                    <span className="flex items-center gap-1 text-xs text-live">
                      <span className="w-2 h-2 bg-live rounded-full animate-pulse-live" />
                      CANLI
                    </span>
                  )}
                </Link>
              ))}
              
              {/* Mobile Twitter Link */}
              <a 
                href="https://twitter.com/fenerblog" 
                target="_blank" 
                rel="noopener noreferrer"
                className="nav-link flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <XIcon className="w-4 h-4" />
                <span>Twitter</span>
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;
