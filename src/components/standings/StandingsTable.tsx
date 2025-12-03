'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Standing } from '@/types';
import { cn, parseForm } from '@/lib/utils';
import { FENERBAHCE_TEAM_ID, FORM_DISPLAY, ROUTES } from '@/lib/constants';

interface StandingsTableProps {
  standings: Standing[];
  leagueId?: number;
  compact?: boolean;
  maxRows?: number;
}

export function StandingsTable({ standings, leagueId, compact = false, maxRows }: StandingsTableProps) {
  const displayStandings = maxRows ? standings.slice(0, maxRows) : standings;
  
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-10">#</th>
            <th>Takım</th>
            <th className="text-center w-10">O</th>
            {!compact && (
              <>
                <th className="text-center w-10">G</th>
                <th className="text-center w-10">B</th>
                <th className="text-center w-10">M</th>
                <th className="text-center w-16">A/Y</th>
              </>
            )}
            <th className="text-center w-10">Av</th>
            <th className="text-center w-12">P</th>
            {!compact && <th className="w-32">Form</th>}
          </tr>
        </thead>
        <tbody>
          {displayStandings.map((team) => {
            const isFenerbahce = team.team.id === FENERBAHCE_TEAM_ID;
            const form = parseForm(team.form);
            
            return (
              <tr 
                key={team.team.id}
                className={cn(
                  isFenerbahce && 'highlight'
                )}
              >
                <td>
                  <span className={cn(
                    'font-medium',
                    team.rank <= 4 && 'text-green-400',
                    team.rank >= standings.length - 3 && 'text-red-400',
                    isFenerbahce && 'text-fb-yellow'
                  )}>
                    {team.rank}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Image
                      src={team.team.logo}
                      alt={team.team.name}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                    <span className={cn(
                      'font-medium truncate max-w-[120px] md:max-w-[180px]',
                      isFenerbahce && 'text-fb-yellow'
                    )}>
                      {team.team.name}
                    </span>
                  </div>
                </td>
                <td className="text-center">{team.all.played}</td>
                {!compact && (
                  <>
                    <td className="text-center text-green-400">{team.all.win}</td>
                    <td className="text-center text-gray-400">{team.all.draw}</td>
                    <td className="text-center text-red-400">{team.all.lose}</td>
                    <td className="text-center text-gray-400">
                      {team.all.goals.for}/{team.all.goals.against}
                    </td>
                  </>
                )}
                <td className="text-center">
                  {team.goalsDiff > 0 ? '+' : ''}{team.goalsDiff}
                </td>
                <td className="text-center">
                  <span className={cn(
                    'font-bold',
                    isFenerbahce && 'text-fb-yellow'
                  )}>
                    {team.points}
                  </span>
                </td>
                {!compact && (
                  <td>
                    <div className="flex gap-1">
                      {/* En eskiden en yeniye sıralama için .reverse() eklendi */}
                      {form.slice(-5).reverse().map((result, i) => (
                        <span
                          key={i}
                          className={cn(
                            'form-dot',
                            `form-dot-${result}`
                          )}
                          title={FORM_DISPLAY[result].title}
                        >
                          {FORM_DISPLAY[result].label}
                        </span>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {maxRows && standings.length > maxRows && leagueId && (
        <div className="mt-4 text-center">
          <Link 
            href={`${ROUTES.TOURNAMENT_DETAIL(leagueId)}/puan-durumu`}
            className="text-sm text-fb-yellow hover:text-fb-yellow-light transition-colors"
          >
            Tüm tabloyu gör →
          </Link>
        </div>
      )}
    </div>
  );
}

export function FormIndicator({ form }: { form: string | null }) {
  const formArray = parseForm(form);
  
  return (
    <div className="flex gap-1">
      {/* En eskiden en yeniye sıralama için .reverse() eklendi */}
      {formArray.slice(-5).reverse().map((result, i) => (
        <span
          key={i}
          className={cn(
            'form-dot',
            `form-dot-${result}`
          )}
          title={FORM_DISPLAY[result].title}
        >
          {FORM_DISPLAY[result].label}
        </span>
      ))}
    </div>
  );
}

export default StandingsTable;
