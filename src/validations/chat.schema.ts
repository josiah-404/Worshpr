import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
});

export const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(64, 'Room name too long'),
  orgId: z.string().optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
