'use client';

import { useMutation } from '@tanstack/react-query';
import { sendMessage } from '@/services/chat.service';
import type { SendMessageInput } from '@/validations/chat.schema';

export function useSendMessage(roomId: string) {
  return useMutation<void, Error, SendMessageInput>({
    mutationFn: async (input) => {
      await sendMessage(roomId, input);
    },
  });
}
