export type ChatRoomType = 'ORG' | 'EVENT';

export interface ChatRoom {
  id: string;
  name: string;
  type: ChatRoomType;
  orgId: string;
  eventId: string | null;
  createdAt: string;
}

export interface ReactionGroup {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  reactions: ReactionGroup[];
}

export interface TypingPayload {
  userId: string;
  userName: string;
}
