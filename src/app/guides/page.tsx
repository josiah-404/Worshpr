import { BookOpen } from 'lucide-react';
import { GUIDES } from '@/lib/guides';
import { GuideCard } from '@/components/guides/GuideCard';

export const metadata = { title: 'Guides — EMBR' };

export default function GuidesPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Help &amp; Guides</h1>
          <p className="text-sm text-muted-foreground">Step-by-step instructions for every module</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GUIDES.map((guide) => (
          <GuideCard key={guide.slug} guide={guide} />
        ))}
      </div>
    </div>
  );
}
