import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getGuide, GUIDES } from '@/lib/guides';
import { GuideStepper } from '@/components/guides/GuideStepper';
import { Button } from '@/components/ui/button';

interface GuideDetailPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: GuideDetailPageProps) {
  const guide = getGuide(params.slug);
  return { title: guide ? `${guide.module} Guide — EMBR` : 'Guide Not Found' };
}

export default function GuideDetailPage({ params }: GuideDetailPageProps) {
  const guide = getGuide(params.slug);
  if (!guide) notFound();

  const totalSteps = guide.sections.reduce((acc, s) => acc + s.steps.length, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground">
        <Link href="/guides">
          <ChevronLeft className="h-4 w-4 mr-1" />
          All Guides
        </Link>
      </Button>

      <div className="flex gap-10 items-start">
        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{guide.module}</h1>
            <p className="text-muted-foreground mt-2 text-base">{guide.description}</p>
            <p className="text-xs text-muted-foreground mt-3">
              {guide.sections.length} {guide.sections.length === 1 ? 'section' : 'sections'} · {totalSteps} {totalSteps === 1 ? 'step' : 'steps'}
            </p>
          </div>

          <GuideStepper guide={guide} />
        </div>

        {/* ── Table of contents (sticky) ── */}
        {guide.sections.length > 1 && (
          <aside className="hidden lg:block w-52 shrink-0 sticky top-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">On this page</p>
            <nav className="space-y-1">
              {guide.sections.map((section) => (
                <a
                  key={section.heading}
                  href={`#${section.heading.toLowerCase().replace(/\s+/g, '-')}`}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5 leading-snug"
                >
                  {section.heading}
                </a>
              ))}
            </nav>
          </aside>
        )}
      </div>
    </div>
  );
}
