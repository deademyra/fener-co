// Standings Table Component
// Fenerbahçe Stats - FENER.CO

import Image from 'next/image';
import Link from 'next/link';
import { Standing } from '@/types/api-football';

interface StandingsTableProps {
  standings: Standing[][] | Record<string, Standing[]>;
  isGroupFormat: boolean;
  highlightTeamId?: number;
  compact?: boolean;
}

// Qualification zone colors
function getPositionStyle(rank: number, description: string | null): string {
  // Champions League qualification (top 2-4 depending on league)
  if (description?.toLowerCase().includes('champions league')) {
    return 'border-l-4 border-l-blue-500 bg-blue-500/5';
  }
  // Europa League
  if (description?.toLowerCase().includes('europa league')) {
    return 'border-l-4 border-l-orange-500 bg-orange-500/5';
  }
  // Conference League
  if (description?.toLowerCase().includes('conference')) {
    return 'border-l-4 border-l-green-500 bg-green-500/5';
  }
  // Relegation
  if (description?.toLowerCase().includes('relegation')) {
    return 'border-l-4 border-l-red-500 bg-red-500/5';
  }
  return '';
}

// Form indicator
function FormIndicator({ form }: { form: string | null }) {
  if (!form) return null;
  
  // En eskiden en yeniye sıralama için .reverse() eklendi
  const results = form.split('').slice(-5).reverse();
  
  return (
    <div className="flex gap-1">
      {results.map((result, index) => {
        let bgColor = 'bg-slate-600';
        if (result === 'W') bgColor = 'bg-green-500';
        if (result === 'D') bgColor = 'bg-amber-500';
        if (result === 'L') bgColor = 'bg-red-500';
        
        return (
          <span
            key={index}
            className={`w-5 h-5 rounded-full ${bgColor} flex items-center justify-center text-xs text-white font-medium`}
            title={result === 'W' ? 'Galibiyet' : result === 'D' ? 'Beraberlik' : 'Mağlubiyet'}
          >
            {result === 'W' ? 'G' : result === 'D' ? 'B' : 'M'}
          </span>
        );
      })}
    </div>
  );
}

export function StandingsTable({
  standings,
  isGroupFormat,
  highlightTeamId,
  compact = false,
}: StandingsTableProps) {
  // Convert to array format if object
  const standingsArray: Array<{ groupName: string; teams: Standing[] }> = Array.isArray(standings)
    ? standings.map((group, index) => ({
        groupName: group[0]?.group || `Grup ${index + 1}`,
        teams: group,
      }))
    : Object.entries(standings).map(([groupName, teams]) => ({
        groupName,
        teams,
      }));

  if (standingsArray.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400">
        <p>Puan durumu henüz yayınlanmadı.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {standingsArray.map(({ groupName, teams }) => (
        <div key={groupName}>
          {/* Group Header (for group format) */}
          {isGroupFormat && standingsArray.length > 1 && (
            <div className="px-4 py-2 bg-slate-700/50 border-b border-slate-600/50">
              <h3 className="text-sm font-semibold text-white">{groupName}</h3>
            </div>
          )}
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs uppercase border-b border-slate-700/50">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Takım</th>
                  <th className="px-4 py-3 text-center">O</th>
                  {!compact && (
                    <>
                      <th className="px-4 py-3 text-center">G</th>
                      <th className="px-4 py-3 text-center">B</th>
                      <th className="px-4 py-3 text-center">M</th>
                      <th className="px-4 py-3 text-center">A</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-center">P</th>
                  {!compact && (
                    <th className="px-4 py-3 text-center hidden md:table-cell">Form</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => {
                  const isHighlighted = team.team.id === highlightTeamId;
                  const positionStyle = getPositionStyle(team.rank, team.description);
                  
                  return (
                    <tr
                      key={team.team.id}
                      className={`border-b border-slate-700/30 transition-colors
                                 ${isHighlighted ? 'bg-yellow-500/10' : 'hover:bg-slate-700/30'}
                                 ${positionStyle}`}
                    >
                      {/* Rank */}
                      <td className="px-4 py-3">
                        <span className={`font-medium ${isHighlighted ? 'text-yellow-400' : 'text-white'}`}>
                          {team.rank}
                        </span>
                      </td>
                      
                      {/* Team */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 relative flex-shrink-0">
                            {team.team.logo ? (
                              <Image
                                src={team.team.logo}
                                alt={team.team.name}
                                fill
                                className="object-contain"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-600 rounded-full" />
                            )}
                          </div>
                          <span className={`truncate ${isHighlighted ? 'text-yellow-400 font-semibold' : 'text-white'}`}>
                            {team.team.name}
                          </span>
                        </div>
                      </td>
                      
                      {/* Played */}
                      <td className="px-4 py-3 text-center text-slate-300">
                        {team.all.played}
                      </td>
                      
                      {!compact && (
                        <>
                          {/* Won */}
                          <td className="px-4 py-3 text-center text-green-400">
                            {team.all.win}
                          </td>
                          
                          {/* Draw */}
                          <td className="px-4 py-3 text-center text-amber-400">
                            {team.all.draw}
                          </td>
                          
                          {/* Lost */}
                          <td className="px-4 py-3 text-center text-red-400">
                            {team.all.lose}
                          </td>
                          
                          {/* Goal Difference */}
                          <td className="px-4 py-3 text-center text-slate-300">
                            <span className={team.goalsDiff > 0 ? 'text-green-400' : team.goalsDiff < 0 ? 'text-red-400' : ''}>
                              {team.goalsDiff > 0 ? '+' : ''}{team.goalsDiff}
                            </span>
                          </td>
                        </>
                      )}
                      
                      {/* Points */}
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${isHighlighted ? 'text-yellow-400' : 'text-white'}`}>
                          {team.points}
                        </span>
                      </td>
                      
                      {/* Form */}
                      {!compact && (
                        <td className="px-4 py-3 hidden md:table-cell">
                          <FormIndicator form={team.form} />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      
      {/* Legend for qualification zones */}
      {!isGroupFormat && !compact && (
        <div className="px-4 py-3 border-t border-slate-700/50">
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-sm" />
              <span>Şampiyonlar Ligi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-orange-500 rounded-sm" />
              <span>Avrupa Ligi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-sm" />
              <span>Konferans Ligi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-sm" />
              <span>Küme Düşme</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact single-column standings for sidebar
export function StandingsTableCompact({
  standings,
  highlightTeamId,
  limit = 10,
}: {
  standings: Standing[];
  highlightTeamId?: number;
  limit?: number;
}) {
  const displayStandings = standings.slice(0, limit);
  
  return (
    <div className="space-y-1">
      {displayStandings.map((team) => {
        const isHighlighted = team.team.id === highlightTeamId;
        
        return (
          <div
            key={team.team.id}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                       ${isHighlighted ? 'bg-yellow-500/10' : 'hover:bg-slate-700/30'}`}
          >
            <span className={`w-5 text-center font-medium ${isHighlighted ? 'text-yellow-400' : 'text-slate-400'}`}>
              {team.rank}
            </span>
            <div className="w-5 h-5 relative flex-shrink-0">
              {team.team.logo && (
                <Image
                  src={team.team.logo}
                  alt={team.team.name}
                  fill
                  className="object-contain"
                />
              )}
            </div>
            <span className={`flex-1 truncate text-sm ${isHighlighted ? 'text-yellow-400 font-medium' : 'text-white'}`}>
              {team.team.name}
            </span>
            <span className={`font-bold ${isHighlighted ? 'text-yellow-400' : 'text-white'}`}>
              {team.points}
            </span>
          </div>
        );
      })}
    </div>
  );
}
