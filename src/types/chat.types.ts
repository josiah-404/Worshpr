export type ChatRoomType = 'ORG' | 'EVENT';

export interface ChatRoom {
  id: string;
  name: string;
  type: ChatRoomType;
  orgId: string;
  eventId: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface TypingPayload {
  userId: string;
  userName: string;
}
