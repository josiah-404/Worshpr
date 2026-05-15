import { api } from '@/lib/axios';
import type { ChatRoom, ChatMessage } from '@/types/chat.types';
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
): Promise<ChatMessage[]> => {
  const { data } = await api.get<{ data: ChatMessage[] }>(
    `/chat/rooms/${roomId}/messages`,
    { params: cursor ? { cursor } : undefined },
  );
  return data.data;
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

export const getEventRoom = async (eventId: string): Promise<ChatRoom> => {
  const { data } = await api.get<{ data: ChatRoom }>(
    `/chat/events/${eventId}/room`,
  );
  return data.data;
};
