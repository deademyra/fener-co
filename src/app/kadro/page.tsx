import { Suspense } from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import { PlayerGrid, LoadingTable } from '@/components';
import { getCachedSquad, getCachedCoach } from '@/lib/api';
import { FENERBAHCE_TEAM_ID, CURRENT_SEASON } from '@/lib/constants';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Kadro',
  description: 'Fenerbahçe futbol takımı güncel kadrosu',
};

export const revalidate = 86400; // 1 day

async function CoachSection() {
  const coach = await getCachedCoach(FENERBAHCE_TEAM_ID);
  
  if (!coach) return null;
  
  return (
    <div className="card p-6 mb-8">
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-800 ring-2 ring-fb-navy">
          <Image
            src={coach.photo}
            alt={coach.name}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">TEKNİK DİREKTÖR</p>
          <h2 className="font-display text-2xl text-fb-yellow">{coach.name}</h2>
          <div className="flex gap-4 mt-2 text-sm text-gray-400">
            <span>🌍 {coach.nationality}</span>
            <span>🎂 {coach.age} yaş</span>
          </div>
        </div>
      </div>
    </div>
  );
}

async function SquadSection() {
  const squad = await getCachedSquad(FENERBAHCE_TEAM_ID);
  
  if (!squad || !squad.players.length) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-400">Kadro bilgisi bulunamadı</p>
      </div>
    );
  }
  
  return <PlayerGrid players={squad.players} />;
}

export default async function SquadPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl text-white mb-2">
          <span className="text-fb-yellow">FENERBAHÇE</span> KADROSU
        </h1>
        <p className="text-gray-400">
          {CURRENT_SEASON}-{CURRENT_SEASON + 1} Sezonu
        </p>
      </div>
      
      {/* Coach */}
      <Suspense fallback={<div className="card p-6 mb-8 skeleton h-32" />}>
        <CoachSection />
      </Suspense>
      
      {/* Squad */}
      <Suspense fallback={<LoadingTable rows={10} />}>
        <SquadSection />
      </Suspense>
    </div>
  );
}
