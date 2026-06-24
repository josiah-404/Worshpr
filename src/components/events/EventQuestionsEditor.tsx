'use client';

import { type FC } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, X, CornerDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { EventQuestionInput } from '@/types';

const EMPTY_QUESTION: EventQuestionInput = { label: '', type: 'TEXT', options: [], isRequired: false, children: [] };

// ─── QuestionList ──────────────────────────────────────────────────────────
// Renders one tree level — used for the event's top-level questions and, recursively, for a
// parent option's follow-up questions.

interface QuestionListProps {
  items: EventQuestionInput[];
  onChange: (items: EventQuestionInput[]) => void;
  triggerOption?: string; // set when this list is a follow-up list for a specific parent option
  emptyMessage: string;
  addLabel: string;
}

const QuestionList: FC<QuestionListProps> = ({ items, onChange, triggerOption, emptyMessage, addLabel }) => {
  function updateItem(index: number, patch: Partial<EventQuestionInput>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, { ...EMPTY_QUESTION, options: [], children: [], ...(triggerOption ? { triggerOption } : {}) }]);
  }

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <EventQuestionRow
              key={index}
              item={item}
              onChange={(patch) => updateItem(index, patch)}
              onRemove={() => removeItem(index)}
            />
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addItem}>
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </Button>
    </div>
  );
};

// ─── EventQuestionRow ──────────────────────────────────────────────────────

interface EventQuestionRowProps {
  item: EventQuestionInput;
  onChange: (patch: Partial<EventQuestionInput>) => void;
  onRemove: () => void;
}

const EventQuestionRow: FC<EventQuestionRowProps> = ({ item, onChange, onRemove }) => {
  function addOption() {
    onChange({ options: [...item.options, ''] });
  }

  function updateOption(optionIndex: number, value: string) {
    const oldValue = item.options[optionIndex];
    onChange({
      options: item.options.map((opt, i) => (i === optionIndex ? value : opt)),
      // Renaming an option re-tags its follow-ups so they don't silently orphan immediately —
      // though once saved, historical answers still only key off the string value.
      children: item.children.map((c) => (c.triggerOption === oldValue ? { ...c, triggerOption: value } : c)),
    });
  }

  function removeOption(optionIndex: number) {
    const removed = item.options[optionIndex];
    onChange({
      options: item.options.filter((_, i) => i !== optionIndex),
      children: item.children.filter((c) => c.triggerOption !== removed),
    });
  }

  function updateChildrenForOption(option: string, newChildren: EventQuestionInput[]) {
    const otherChildren = item.children.filter((c) => c.triggerOption !== option);
    onChange({ children: [...otherChildren, ...newChildren] });
  }

  return (
    <div className="space-y-2 rounded-md border p-2">
      <div className="flex items-center gap-2">
        <Input
          placeholder="e.g. Any allergies?"
          value={item.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="flex-1"
        />
        <Select
          value={item.type}
          onValueChange={(v) => onChange({ type: v as 'TEXT' | 'CHOICE' })}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TEXT">Text</SelectItem>
            <SelectItem value="CHOICE">Choice</SelectItem>
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={() => onChange({ isRequired: !item.isRequired })}
          className={cn(
            'flex items-center gap-1.5 rounded-md border px-2.5 py-2 text-xs font-medium whitespace-nowrap transition-colors shrink-0',
            item.isRequired
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'text-muted-foreground hover:bg-muted/50',
          )}
          title="Toggle whether registrants must answer this question"
        >
          {item.isRequired ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Circle className="h-3.5 w-3.5" />
          )}
          Required
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {item.type === 'CHOICE' && (
        <div className="space-y-3 pl-2">
          <div className="space-y-1.5">
            {item.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center gap-2">
                <Input
                  placeholder={`Option ${optionIndex + 1}`}
                  value={option}
                  onChange={(e) => updateOption(optionIndex, e.target.value)}
                  className="flex-1 h-8 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removeOption(optionIndex)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={addOption}
            >
              <Plus className="h-3 w-3" />
              Add Option
            </Button>
            {item.options.length < 2 && (
              <p className="text-xs text-destructive">Choice questions need at least 2 options</p>
            )}
          </div>

          {/* Follow-up questions, one nested list per option */}
          {item.options.filter((o) => o.trim()).map((option) => (
            <div key={option} className="space-y-1.5 border-l-2 border-border pl-3">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CornerDownRight className="h-3 w-3" />
                Follow-up when &quot;{option}&quot; is selected
              </p>
              <QuestionList
                items={item.children.filter((c) => c.triggerOption === option)}
                onChange={(newChildren) => updateChildrenForOption(option, newChildren)}
                triggerOption={option}
                emptyMessage="No follow-up questions for this option."
                addLabel="Add Follow-up"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Top-level export ──────────────────────────────────────────────────────

interface EventQuestionsEditorProps {
  items: EventQuestionInput[];
  onChange: (items: EventQuestionInput[]) => void;
}

export const EventQuestionsEditor: FC<EventQuestionsEditorProps> = ({ items, onChange }) => (
  <QuestionList
    items={items}
    onChange={onChange}
    emptyMessage="No questions configured — registrants won't be asked anything extra."
    addLabel="Add Question"
  />
);
