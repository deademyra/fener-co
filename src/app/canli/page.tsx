import { Metadata } from 'next';
import LiveMatchesClient from './components/LiveMatchesClient';

export const metadata: Metadata = {
  title: 'Canlı Skorlar',
  description: 'Fenerbahçe ve Süper Lig canlı maç skorları - Anlık güncelleme',
};

export default function LivePage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-bold text-3xl md:text-4xl text-white mb-2">
            <span className="text-fb-yellow">CANLI</span> SKORLAR
          </h1>
          <p className="text-gray-400">
            Anlık maç sonuçları ve günün maçları
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/5 px-3 py-2 rounded-lg">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Her 15 saniyede otomatik güncellenir
        </div>
      </div>
      
      {/* Live Matches - Client Component with Polling */}
      <LiveMatchesClient />
    </div>
  );
}
