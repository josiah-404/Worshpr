import { RemoteClient } from '@/app/worship/components/remote/RemoteClient';

interface WorshipRemotePageProps {
  params: { token: string };
}

export default function WorshipRemotePage({ params }: WorshipRemotePageProps) {
  return <RemoteClient token={params.token} />;
}
