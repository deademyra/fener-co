// Season Selector Component
// Fenerbahçe Stats - FENER.CO

'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { formatSeasonDisplay } from '@/lib/utils/round-utils';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface SeasonSelectorProps {
  seasons: number[];
  selectedSeason: number;
  baseUrl?: string;
  onChange?: (season: number) => void;
}

export function SeasonSelector({ 
  seasons, 
  selectedSeason, 
  baseUrl,
  onChange 
}: SeasonSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSeasonChange = (season: number) => {
    setIsOpen(false);
    
    if (onChange) {
      onChange(season);
      return;
    }

    // Update URL with new season
    const params = new URLSearchParams(searchParams.toString());
    params.set('sezon', season.toString());
    
    const url = baseUrl 
      ? `${baseUrl}?${params.toString()}`
      : `${pathname}?${params.toString()}`;
    
    router.push(url);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 
                   border border-slate-600/50 rounded-lg text-white transition-all
                   focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
      >
        <span className="text-slate-400 text-sm">Sezon:</span>
        <span className="font-semibold">{formatSeasonDisplay(selectedSeason)}</span>
        <ChevronDown 
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-600/50 
                        rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-64 overflow-y-auto">
            {seasons.map(season => (
              <button
                key={season}
                onClick={() => handleSeasonChange(season)}
                className={`w-full px-4 py-2.5 text-left hover:bg-slate-700/50 transition-colors
                           ${season === selectedSeason 
                             ? 'bg-yellow-500/10 text-yellow-400 font-semibold' 
                             : 'text-white'}`}
              >
                {formatSeasonDisplay(season)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for inline use
export function SeasonSelectorCompact({ 
  seasons, 
  selectedSeason, 
  onChange 
}: SeasonSelectorProps) {
  return (
    <select
      value={selectedSeason}
      onChange={(e) => onChange?.(parseInt(e.target.value))}
      className="px-3 py-1.5 bg-slate-800/80 border border-slate-600/50 rounded-lg 
                 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50
                 cursor-pointer"
    >
      {seasons.map(season => (
        <option key={season} value={season}>
          {formatSeasonDisplay(season)}
        </option>
      ))}
    </select>
  );
}
