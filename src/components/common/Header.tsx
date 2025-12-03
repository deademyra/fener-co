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
  { name: 'Admin', href: ROUTES.ADMIN, isAdmin: true },
];

// Twitter/X Icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

// Settings/Admin Icon
function AdminIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-[100]">
      {/* Main Header */}
      <header className="glass-card-solid border-b border-white/10" style={{ borderRadius: 0 }}>
        <nav className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Animated Logo - using header size (2rem) */}
            <AnimatedLogo size="header" showAnimation={true} />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'nav-link relative',
                  pathname === item.href && 'nav-link-active',
                  item.isAdmin && 'text-gray-500'
                )}
              >
                {item.isLive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-live rounded-full animate-pulse-live" />
                )}
                {item.isAdmin && (
                  <AdminIcon className="w-4 h-4 inline-block mr-1" />
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
              className="p-2.5 rounded-lg hover:bg-slate-800 active:bg-slate-700 text-gray-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menüyü aç/kapat"
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
          <div className="md:hidden py-3 sm:py-4 border-t border-white/10 animate-slide-down">
            <div className="flex flex-col gap-0.5">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'nav-link relative flex items-center justify-between min-h-[44px] py-3 px-3',
                    pathname === item.href && 'nav-link-active',
                    item.isAdmin && 'text-gray-500'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-base flex items-center gap-2">
                    {item.isAdmin && <AdminIcon className="w-4 h-4" />}
                    {item.name}
                  </span>
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
                className="nav-link flex items-center gap-2 min-h-[44px] py-3 px-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                <XIcon className="w-4 h-4" />
                <span className="text-base">Twitter</span>
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
    </div>
  );
}

export default Header;
