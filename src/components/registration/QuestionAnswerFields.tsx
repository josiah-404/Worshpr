'use client';

import { type FC } from 'react';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { EventQuestion } from '@/types';

interface QuestionAnswerFieldsProps {
  questions: EventQuestion[];
  answers: Record<string, string>;
  missingIds: Set<string>;
  onAnswer: (questionId: string, value: string) => void;
}

/** Renders a question tree, recursively revealing follow-ups as their trigger option is answered. */
export const QuestionAnswerFields: FC<QuestionAnswerFieldsProps> = ({ questions, answers, missingIds, onAnswer }) => (
  <>
    {questions.map((q) => (
      <QuestionAnswerField key={q.id} question={q} answers={answers} missingIds={missingIds} onAnswer={onAnswer} />
    ))}
  </>
);

interface QuestionAnswerFieldProps {
  question: EventQuestion;
  answers: Record<string, string>;
  missingIds: Set<string>;
  onAnswer: (questionId: string, value: string) => void;
}

const QuestionAnswerField: FC<QuestionAnswerFieldProps> = ({ question: q, answers, missingIds, onAnswer }) => {
  const value = answers[q.id] ?? '';
  const isMissing = missingIds.has(q.id);
  const revealedChildren = q.children.filter((c) => c.triggerOption === value);

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">
          {q.label} {q.isRequired && <span className="text-destructive">*</span>}
        </label>
        {q.type === 'CHOICE' ? (
          <Select onValueChange={(v) => onAnswer(q.id, v)} value={value}>
            <SelectTrigger className={isMissing ? 'border-destructive' : undefined}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {q.options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Textarea
            value={value}
            onChange={(e) => onAnswer(q.id, e.target.value)}
            rows={2}
            className={cn('resize-none', isMissing && 'border-destructive')}
          />
        )}
        {isMissing && <p className="text-xs text-destructive">This question is required</p>}
      </div>

      {revealedChildren.length > 0 && (
        <div className="space-y-2 pl-4 border-l-2 border-border ml-1">
          {revealedChildren.map((c) => (
            <QuestionAnswerField key={c.id} question={c} answers={answers} missingIds={missingIds} onAnswer={onAnswer} />
          ))}
        </div>
      )}
    </div>
  );
};
