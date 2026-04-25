'use client';

import { type FC } from 'react';
import Image from 'next/image';
import { Lightbulb, AlertTriangle } from 'lucide-react';
import type { Guide } from '@/lib/guides';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GuideStepperProps {
  guide: Guide;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const GuideStepper: FC<GuideStepperProps> = ({ guide }) => {
  let stepCounter = 0;

  return (
    <div className="space-y-12">
      {guide.sections.map((section) => {
        const sectionId = section.heading.toLowerCase().replace(/\s+/g, '-');

        return (
          <div key={section.heading} id={sectionId}>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-base font-semibold">{section.heading}</h2>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-0">
              {section.steps.map((step, stepIdx) => {
                stepCounter += 1;
                const num = stepCounter;
                const isLast = stepIdx === section.steps.length - 1;

                return (
                  <div key={step.title} className="flex gap-4">
                    {/* Step number + connector */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 z-10">
                        {num}
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-border mt-1 mb-1 min-h-[24px]" />}
                    </div>

                    {/* Step content */}
                    <div className={`min-w-0 flex-1 ${isLast ? 'pb-0' : 'pb-6'}`}>
                      <p className="font-medium text-sm leading-snug mb-1 pt-0.5">{step.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

                      {step.image && (
                        <div className="mt-3 rounded-lg overflow-hidden border">
                          <Image
                            src={step.image}
                            alt={step.title}
                            width={800}
                            height={450}
                            className="w-full object-cover"
                          />
                        </div>
                      )}

                      {step.tip && (
                        <div className="mt-3 flex gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
                          <Lightbulb className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">{step.tip}</p>
                        </div>
                      )}

                      {step.warning && (
                        <div className="mt-3 flex gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{step.warning}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
