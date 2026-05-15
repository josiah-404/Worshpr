import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { ChatPageClient } from '@/app/chat/ChatPageClient';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return <ChatPageClient />;
}
