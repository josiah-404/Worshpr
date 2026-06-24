import type { EventQuestion, EventQuestionInput, QuestionType } from '@/types';

export interface FlatQuestionRow {
  id: string;
  parentQuestionId: string | null;
  triggerOption: string | null;
  label: string;
  type: QuestionType;
  options: string[];
  isRequired: boolean;
  order: number;
}

/** Assembles a flat (e.g. straight from Prisma) list of questions into a parent/children tree. */
export function buildQuestionTree(rows: FlatQuestionRow[]): EventQuestion[] {
  function childrenOf(parentId: string | null): EventQuestion[] {
    return rows
      .filter((r) => r.parentQuestionId === parentId)
      .sort((a, b) => a.order - b.order)
      .map((r) => ({
        id: r.id,
        label: r.label,
        type: r.type,
        options: r.options,
        isRequired: r.isRequired,
        order: r.order,
        triggerOption: r.triggerOption,
        children: childrenOf(r.id),
      }));
  }

  return childrenOf(null);
}

/** Strips server-only fields (id, order) for editor form state, keeping the tree shape. */
export function toQuestionInput(q: EventQuestion): EventQuestionInput {
  return {
    label: q.label,
    type: q.type,
    options: q.options,
    isRequired: q.isRequired,
    ...(q.triggerOption ? { triggerOption: q.triggerOption } : {}),
    children: q.children.map(toQuestionInput),
  };
}

export interface ResolvedQuestionAnswer {
  questionId: string;
  questionLabel: string;
  answer: string;
}

export interface ResolvedQuestionAnswers {
  snapshots: ResolvedQuestionAnswer[];
  missingRequired: { id: string; label: string }[];
}

/**
 * Walks a question tree against a flat registrant answer map, only descending into a
 * question's follow-ups once its own answer matches the follow-up's triggerOption. A required
 * follow-up that's never revealed (because an earlier answer didn't trigger it) never blocks
 * submission.
 */
export function resolveQuestionAnswers(
  questions: EventQuestion[],
  answers: Record<string, string>,
): ResolvedQuestionAnswers {
  const snapshots: ResolvedQuestionAnswer[] = [];
  const missingRequired: { id: string; label: string }[] = [];

  function walk(list: EventQuestion[]) {
    for (const q of list) {
      const value = answers[q.id]?.trim();
      if (value) {
        snapshots.push({ questionId: q.id, questionLabel: q.label, answer: value });
        walk(q.children.filter((c) => c.triggerOption === value));
      } else if (q.isRequired) {
        missingRequired.push({ id: q.id, label: q.label });
      }
    }
  }

  walk(questions);
  return { snapshots, missingRequired };
}
