import api from '../api/axiosInstance';

export interface ChatUserSummary {
  id: string;
  fullName: string;
  email: string;
  role: 'tourist' | 'artist';
  country?: string;
}

export interface ChatArtistProfileSummary {
  id: string;
  username: string;
  craftType: string;
  region: string;
}

export interface ChatConversation {
  id: string;
  otherUser: ChatUserSummary;
  artistProfile: ChatArtistProfileSummary | null;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  text: string;
  createdAt: string;
  editedAt: string | null;
  readAt: string | null;
  sender: ChatUserSummary;
  recipient: ChatUserSummary;
}

export interface ChatArtistSearchResult {
  artistUserId: string;
  artistProfileId: string;
  fullName: string;
  callingName: string;
  craftType: string;
  location: string;
  initials: string;
}

const unwrap = async <T>(request: Promise<{ data: { data: T } }>): Promise<T> => {
  const response = await request;
  return response.data.data;
};

export const chatApi = {
  getConversations: () => unwrap<ChatConversation[]>(api.get('/chat/conversations')),

  getConversationMessages: (conversationId: string) =>
    unwrap<ChatMessage[]>(api.get(`/chat/conversations/${conversationId}/messages`)),

  createConversation: (payload: {
    artistUserId?: string;
    artistProfileId?: string;
    openingMessage?: string;
  }) => unwrap<ChatConversation>(api.post('/chat/conversations', payload)),

  sendMessage: (conversationId: string, text: string) =>
    unwrap<ChatMessage>(api.post(`/chat/conversations/${conversationId}/messages`, { text })),

  updateMessage: (conversationId: string, messageId: string, text: string) =>
    unwrap<ChatMessage>(
      api.put(`/chat/conversations/${conversationId}/messages/${messageId}`, { text })
    ),

  deleteMessage: (conversationId: string, messageId: string) =>
    unwrap<{ id: string; conversationId: string }>(
      api.delete(`/chat/conversations/${conversationId}/messages/${messageId}`)
    ),

  markConversationRead: (conversationId: string) =>
    unwrap<{ conversationId: string; userId: string; otherParticipantId: string }>(
      api.patch(`/chat/conversations/${conversationId}/read`)
    ),

  searchArtists: (query: string) =>
    unwrap<ChatArtistSearchResult[]>(
      api.get(`/chat/artists/search?q=${encodeURIComponent(query)}`)
    ),
};
