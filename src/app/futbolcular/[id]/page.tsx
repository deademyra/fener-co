import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function OldPlayerPage({ params }: { params: { id: string } }) {
  const playerId = parseInt(params.id);
  redirect(ROUTES.PLAYER_DETAIL(playerId));
}
