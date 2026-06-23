'use client';

import { type FC } from 'react';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { EventFeeItemInput } from '@/types';

interface EventFeeItemsEditorProps {
  items: EventFeeItemInput[];
  onChange: (items: EventFeeItemInput[]) => void;
}

export const EventFeeItemsEditor: FC<EventFeeItemsEditorProps> = ({ items, onChange }) => {
  function updateItem(index: number, patch: Partial<EventFeeItemInput>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, { label: '', amount: 0, isRequired: false }]);
  }

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No fees configured — this event is free.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2 rounded-md border p-2">
              <Input
                placeholder="e.g. Food"
                value={item.label}
                onChange={(e) => updateItem(index, { label: e.target.value })}
                className="flex-1"
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={item.amount}
                onChange={(e) => updateItem(index, { amount: Number(e.target.value) })}
                className="w-28"
              />
              <button
                type="button"
                onClick={() => updateItem(index, { isRequired: !item.isRequired })}
                className={cn(
                  'flex items-center gap-1.5 rounded-md border px-2.5 py-2 text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                  item.isRequired
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'text-muted-foreground hover:bg-muted/50',
                )}
                title="Toggle whether registrants must pay this fee"
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
                onClick={() => removeItem(index)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addItem}>
        <Plus className="h-3.5 w-3.5" />
        Add Fee
      </Button>
    </div>
  );
};
