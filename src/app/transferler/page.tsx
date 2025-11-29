import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LoadingTable } from '@/components';
import { 
  FENERBAHCE_TEAM_ID, 
  CURRENT_SEASON, 
  ROUTES,
  TRACKED_LEAGUES
} from '@/lib/constants';
import { getTransfers, TransferResponse } from '@/lib/api/client';

export const revalidate = 3600; // 1 saat

// Transfer listesi bileşeni
async function TransferList({ 
  direction, 
  season 
}: { 
  direction: 'in' | 'out';
  season: number;
}) {
  let transfers: TransferResponse[] = [];
  
  try {
    transfers = await getTransfers(FENERBAHCE_TEAM_ID);
  } catch (error) {
    console.error('Transfer fetch error:', error);
  }
  
  // Sezon filtresi: transferDate yılı === season veya season+1 (örn: 2024-2025 sezonu için)
  const filteredTransfers = transfers.filter(t => {
    const transfer = t.transfers[0];
    if (!transfer) return false;
    
    const transferYear = new Date(transfer.date).getFullYear();
    const isInSeason = transferYear === season || transferYear === season + 1;
    
    if (direction === 'in') {
      return isInSeason && transfer.teams.in.id === FENERBAHCE_TEAM_ID;
    } else {
      return isInSeason && transfer.teams.out.id === FENERBAHCE_TEAM_ID;
    }
  });
  
  if (filteredTransfers.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-500 text-gray-400">
          {direction === 'in' ? 'Gelen transfer bulunamadı' : 'Giden transfer bulunamadı'}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {filteredTransfers.map((t) => {
        const transfer = t.transfers[0];
        const fromTeam = direction === 'in' ? transfer.teams.out : transfer.teams.in;
        const toTeam = direction === 'in' ? transfer.teams.in : transfer.teams.out;
        const transferDate = new Date(transfer.date);
        
        return (
          <div key={`${t.player.id}-${transfer.date}`} className="card p-4">
            <div className="flex items-center gap-4">
              {/* Oyuncu */}
              <Link 
                href={ROUTES.PLAYER_DETAIL(t.player.id)}
                className="flex-1 flex items-center gap-3 hover:text-fb-navy dark:hover:text-fb-yellow transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 bg-slate-800 flex items-center justify-center text-sm font-bold text-gray-600 text-gray-400">
                  {t.player.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <p className="font-medium">{t.player.name}</p>
                  <p className="text-xs text-gray-500">
                    {transferDate.toLocaleDateString('tr-TR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </Link>
              
              {/* Transfer detayı */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <Image 
                    src={fromTeam.logo} 
                    alt={fromTeam.name} 
                    width={28} 
                    height={28}
                    className="object-contain ml-auto"
                  />
                  <p className="text-xs text-gray-500 mt-1 truncate max-w-[80px]">
                    {fromTeam.name}
                  </p>
                </div>
                
                <div className="text-center px-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                
                <div className="text-left">
                  <Image 
                    src={toTeam.logo} 
                    alt={toTeam.name} 
                    width={28} 
                    height={28}
                    className="object-contain"
                  />
                  <p className="text-xs text-gray-500 mt-1 truncate max-w-[80px]">
                    {toTeam.name}
                  </p>
                </div>
              </div>
              
              {/* Transfer tipi */}
              <div className="text-right">
                <span className={`
                  inline-block px-2 py-1 rounded text-xs font-medium
                  ${transfer.type === 'Loan' 
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' 
                    : transfer.type === 'Free'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-fb-navy/10 dark:bg-fb-navy/30 text-fb-navy text-fb-yellow'
                  }
                `}>
                  {transfer.type === 'Loan' ? 'Kiralık' : 
                   transfer.type === 'Free' ? 'Bonservis' : 
                   transfer.type === 'N/A' ? 'Transfer' : transfer.type}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TransferlerPage({
  searchParams,
}: {
  searchParams: { sezon?: string; yön?: string };
}) {
  const season = searchParams.sezon ? parseInt(searchParams.sezon) : CURRENT_SEASON;
  const direction = (searchParams.yön as 'in' | 'out') || 'in';
  
  // Mevcut sezonlar (son 5 sezon)
  const seasons = Array.from({ length: 5 }, (_, i) => CURRENT_SEASON - i);
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-fb-navy text-fb-yellow mb-2">
          TRANSFERLER
        </h1>
        <p className="text-gray-600 text-gray-400">
          Fenerbahçe transfer hareketleri
        </p>
      </div>
      
      {/* Filtreler */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Sezon Filtresi */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 text-gray-400">Sezon:</label>
          <div className="flex gap-1">
            {seasons.map(s => (
              <Link
                key={s}
                href={`/transferler?sezon=${s}&yön=${direction}`}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${season === s 
                    ? 'bg-fb-navy text-white' 
                    : 'bg-slate-800 text-gray-700 text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                {s}-{String(s + 1).slice(-2)}
              </Link>
            ))}
          </div>
        </div>
        
        {/* Yön Filtresi */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 text-gray-400">Yön:</label>
          <div className="flex gap-1">
            <Link
              href={`/transferler?sezon=${season}&yön=in`}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${direction === 'in' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-slate-800 text-gray-700 text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              Gelen
            </Link>
            <Link
              href={`/transferler?sezon=${season}&yön=out`}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${direction === 'out' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-slate-800 text-gray-700 text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              Giden
            </Link>
          </div>
        </div>
      </div>
      
      {/* Transfer Listesi */}
      <Suspense fallback={<LoadingTable rows={10} />}>
        <TransferList direction={direction} season={season} />
      </Suspense>
    </div>
  );
}
