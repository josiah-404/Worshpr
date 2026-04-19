import { z } from 'zod';

export const bibleIdSchema = z.string().min(1).max(64);
export const bookIdSchema = z.string().regex(/^[1-3A-Z]{2,4}$/);
export const chapterIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9-]+\.[1-3A-Z]{2,4}\.[0-9]{1,3}$/);
