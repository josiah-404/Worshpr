import { api } from '@/lib/axios';
import type { ChatRoom, ChatMessage, ReactionGroup } from '@/types/chat.types';
import type { SendMessageInput, CreateRoomInput } from '@/validations/chat.schema';

export const getOrgRooms = async (orgId?: string): Promise<ChatRoom[]> => {
  const { data } = await api.get<{ data: ChatRoom[] }>('/chat/rooms', {
    params: orgId ? { orgId } : undefined,
  });
  return data.data;
};

export const createOrgRoom = async (
  input: CreateRoomInput & { orgId?: string },
): Promise<ChatRoom> => {
  const { data } = await api.post<{ data: ChatRoom }>('/chat/rooms', input);
  return data.data;
};

export const getRoomMessages = async (
  roomId: string,
  cursor?: string,
): Promise<{ messages: ChatMessage[]; hasMore: boolean }> => {
  const { data } = await api.get<{ data: ChatMessage[]; hasMore: boolean }>(
    `/chat/rooms/${roomId}/messages`,
    { params: cursor ? { cursor } : undefined },
  );
  return { messages: data.data, hasMore: data.hasMore };
};

export const sendMessage = async (
  roomId: string,
  input: SendMessageInput,
): Promise<ChatMessage> => {
  const { data } = await api.post<{ data: ChatMessage }>(
    `/chat/rooms/${roomId}/messages`,
    input,
  );
  return data.data;
};

export const toggleReaction = async (
  messageId: string,
  emoji: string,
): Promise<ReactionGroup[]> => {
  const { data } = await api.post<{ data: ReactionGroup[] }>(
    `/chat/messages/${messageId}/reactions`,
    { emoji },
  );
  return data.data;
};

export const getEventRoom = async (eventId: string): Promise<ChatRoom> => {
  const { data } = await api.get<{ data: ChatRoom }>(
    `/chat/events/${eventId}/room`,
  );
  return data.data;
};
