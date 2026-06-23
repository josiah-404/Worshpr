'use client';

import { type FC } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { EventRegistrantTypeInput } from '@/types';

interface EventRegistrantTypesEditorProps {
  items: EventRegistrantTypeInput[];
  onChange: (items: EventRegistrantTypeInput[]) => void;
}

export const EventRegistrantTypesEditor: FC<EventRegistrantTypesEditorProps> = ({ items, onChange }) => {
  function updateItem(index: number, label: string) {
    onChange(items.map((item, i) => (i === index ? { ...item, label } : item)));
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addItem() {
    onChange([...items, { label: '' }]);
  }

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No registrant types configured — registrants won&apos;t be asked to pick one.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2 rounded-md border p-2">
              <Input
                placeholder="e.g. Staff"
                value={item.label}
                onChange={(e) => updateItem(index, e.target.value)}
                className="flex-1"
              />
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
        Add Type
      </Button>
    </div>
  );
};
