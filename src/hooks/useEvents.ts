'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { createEvent, updateEvent, deleteEvent } from '@/services/event.service';
import type { Event } from '@/types/event.types';
import type { CreateEventInput, UpdateEventInput } from '@/validations/event.schema';

export function useEvents(initialEvents: Event[]) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(input: CreateEventInput): Promise<void> {
    setLoading(true);
    setError('');
    try {
      const created = await createEvent(input);
      setEvents((prev) => [created, ...prev]);
      toast.success('Event created', { description: `"${created.theme}" has been added.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(id: string, input: UpdateEventInput): Promise<void> {
    setLoading(true);
    setError('');
    try {
      const updated = await updateEvent(id, input);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      toast.success('Event updated', { description: `"${updated.theme}" has been updated.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success('Event deleted');
    } catch {
      toast.error('Delete failed', { description: 'Failed to delete the event.' });
    }
  }

  return {
    events,
    loading,
    error,
    setError,
    createEvent: handleCreate,
    updateEvent: handleUpdate,
    deleteEvent: handleDelete,
  };
}
