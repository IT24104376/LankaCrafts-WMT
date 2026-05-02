import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeft, MessageCircle, Pencil, Search, Send, Trash2 } from 'lucide-react-native';
import { useAuth } from '../../../src/context/AuthContext';
import {
  type ChatArtistSearchResult,
  type ChatConversation,
  type ChatMessage,
  chatApi,
} from '../../../src/services/chatApi';
import { BatikBackground } from '../../../src/components/BatikBackground';

const PALETTE = ['#C65D3B', '#2F5D50', '#C9A227', '#1A6B6B', '#8B5E3C'];

const pickAvatarColor = (seed: string) => {
  const total = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PALETTE[total % PALETTE.length];
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'LC';

const formatTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatListTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatDayLabel = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function TouristInboxScreen() {
  const { tourist } = useAuth();
  const currentUserId = tourist?.id || '';
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [composerText, setComposerText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [artistResults, setArtistResults] = useState<ChatArtistSearchResult[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) || null,
    [activeConversationId, conversations]
  );

  const filteredConversations = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return conversations;

    return conversations.filter((conversation) => {
      const haystack = [
        conversation.otherUser.fullName,
        conversation.artistProfile?.craftType,
        conversation.artistProfile?.region,
        conversation.lastMessage,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [conversations, searchQuery]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, conversation) => sum + conversation.unread, 0),
    [conversations]
  );

  useEffect(() => {
    if (!messages.length) return;

    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 60);

    return () => clearTimeout(timeout);
  }, [messages]);

  const loadConversations = async () => {
    if (!tourist) return;

    try {
      setLoadingConversations(true);
      const data = await chatApi.getConversations();
      setConversations(data);
      setActiveConversationId((current) => {
        if (current && data.some((conversation) => conversation.id === current)) {
          return current;
        }
        return data[0]?.id || null;
      });
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations.');
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const data = await chatApi.getConversationMessages(conversationId);
      setMessages(data);

      const selectedConversation = conversations.find((item) => item.id === conversationId);
      if (selectedConversation?.unread) {
        await chatApi.markConversationRead(conversationId);
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === conversationId ? { ...conversation, unread: 0 } : conversation
          )
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages.');
    } finally {
      setLoadingMessages(false);
    }
  };

  const refreshActiveConversation = async (conversationId: string) => {
    const [nextMessages, nextConversations] = await Promise.all([
      chatApi.getConversationMessages(conversationId),
      chatApi.getConversations(),
    ]);

    setMessages(nextMessages);
    setConversations(nextConversations);
  };

  useEffect(() => {
    if (!tourist) return;
    loadConversations();
  }, [tourist]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    loadMessages(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    if (!tourist) return;

    const interval = setInterval(() => {
      loadConversations();
      if (activeConversationId) {
        loadMessages(activeConversationId);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [tourist, activeConversationId, conversations]);

  useEffect(() => {
    if (!tourist || !searchQuery.trim()) {
      setArtistResults([]);
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await chatApi.searchArtists(searchQuery.trim());
        setArtistResults(results);
      } catch {
        setArtistResults([]);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [tourist, searchQuery]);

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setMobileView('chat');
    setComposerText('');
    setEditingMessageId(null);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unread: 0 } : conversation
      )
    );
  };

  const handleStartConversation = async (artist: ChatArtistSearchResult) => {
    try {
      const conversation = await chatApi.createConversation({
        artistUserId: artist.artistUserId,
        artistProfileId: artist.artistProfileId,
      });

      setConversations((current) => {
        const rest = current.filter((item) => item.id !== conversation.id);
        return [conversation, ...rest];
      });
      setActiveConversationId(conversation.id);
      setMessages([]);
      setComposerText('');
      setEditingMessageId(null);
      setMobileView('chat');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open conversation.');
    }
  };

  const handleSend = async () => {
    if (!composerText.trim() || !activeConversationId || sending) return;

    try {
      setSending(true);
      if (editingMessageId) {
        await chatApi.updateMessage(activeConversationId, editingMessageId, composerText.trim());
      } else {
        await chatApi.sendMessage(activeConversationId, composerText.trim());
      }

      await refreshActiveConversation(activeConversationId);
      setComposerText('');
      setEditingMessageId(null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save message.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeConversationId) return;

    try {
      await chatApi.deleteMessage(activeConversationId, messageId);
      await refreshActiveConversation(activeConversationId);
      if (editingMessageId === messageId) {
        setEditingMessageId(null);
        setComposerText('');
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message.');
    }
  };

  const renderConversationItem = ({ item }: { item: ChatConversation }) => {
    const isActive = item.id === activeConversationId;

    return (
      <Pressable
        onPress={() => handleSelectConversation(item.id)}
        style={[styles.conversationCard, isActive && styles.conversationCardActive]}
      >
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: pickAvatarColor(item.id) }]}>
            <Text style={styles.avatarText}>{getInitials(item.otherUser.fullName)}</Text>
          </View>
          {item.online ? <View style={styles.onlineDot} /> : null}
        </View>

        <View style={styles.conversationMeta}>
          <View style={styles.rowBetween}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {item.otherUser.fullName}
            </Text>
            <Text style={styles.conversationTime}>{formatListTime(item.lastMessageAt)}</Text>
          </View>
          <Text style={styles.conversationSubtitle} numberOfLines={1}>
            {item.artistProfile?.craftType || 'Artist'}
            {item.artistProfile?.region ? ` - ${item.artistProfile.region}` : ''}
          </Text>
          <Text
            style={[styles.conversationPreview, item.unread > 0 && styles.conversationPreviewUnread]}
            numberOfLines={1}
          >
            {item.lastMessage || 'Start your conversation'}
          </Text>
        </View>

        {item.unread > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{item.unread}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  const renderArtistResult = ({ item }: { item: ChatArtistSearchResult }) => (
    <Pressable style={styles.artistResultCard} onPress={() => handleStartConversation(item)}>
      <View style={[styles.avatar, { backgroundColor: pickAvatarColor(item.artistProfileId) }]}>
        <Text style={styles.avatarText}>{item.initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.artistName} numberOfLines={1}>
          {item.fullName}
        </Text>
        <Text style={styles.artistMeta} numberOfLines={1}>
          {item.craftType}
          {item.location ? ` - ${item.location}` : ''}
        </Text>
      </View>
    </Pressable>
  );

  const showList = mobileView === 'list' || !activeConversation;
  const selectedConversation = activeConversation;

  return (
    <BatikBackground>
      <SafeAreaView style={styles.safeArea}>
      {showList ? (
        <View style={styles.container}>
          <View style={styles.headerBlock}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.eyebrow}>TOURIST INBOX</Text>
                <Text style={styles.title}>Messages</Text>
              </View>
              <View style={styles.headerPill}>
                <Text style={styles.headerPillText}>{totalUnread} new</Text>
              </View>
            </View>

            <View style={styles.searchBox}>
              <Search size={18} color="#9CA3AF" />
              <TextInput
                placeholder="Search artists or conversations..."
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {searchQuery.trim() && artistResults.length > 0 ? (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsLabel}>Registered Artists</Text>
              <FlatList
                data={artistResults}
                keyExtractor={(item) => item.artistProfileId}
                renderItem={renderArtistResult}
                scrollEnabled={false}
              />
            </View>
          ) : null}

          {loadingConversations ? (
            <View style={styles.centerState}>
              <ActivityIndicator color="#C65D3B" />
              <Text style={styles.stateText}>Loading conversations...</Text>
            </View>
          ) : filteredConversations.length > 0 ? (
            <FlatList
              data={filteredConversations}
              keyExtractor={(item) => item.id}
              renderItem={renderConversationItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.centerState}>
              <MessageCircle size={28} color="#C65D3B" />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.stateText}>
                Search for an artist above to start messaging from your inbox.
              </Text>
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.chatHeader}>
            <Pressable style={styles.backButton} onPress={() => setMobileView('list')}>
              <ArrowLeft size={20} color="#2F5D50" />
            </Pressable>

            <View style={[styles.avatar, { backgroundColor: pickAvatarColor(selectedConversation!.id) }]}>
              <Text style={styles.avatarText}>
                {getInitials(selectedConversation!.otherUser.fullName)}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.chatHeaderTitle} numberOfLines={1}>
                {selectedConversation!.otherUser.fullName}
              </Text>
              <Text style={styles.chatHeaderMeta} numberOfLines={1}>
                {selectedConversation!.artistProfile?.craftType || 'Artist'}
                {selectedConversation!.artistProfile?.region
                  ? ` - ${selectedConversation!.artistProfile.region}`
                  : ''}
              </Text>
            </View>
          </View>

          <View style={styles.topicBanner}>
            <Text style={styles.topicBannerText}>
              Ask about availability, custom requests, pricing, and workshop details.
            </Text>
          </View>

          {loadingMessages ? (
            <View style={styles.centerState}>
              <ActivityIndicator color="#C65D3B" />
              <Text style={styles.stateText}>Loading messages...</Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item, index }) => {
                const isMine = item.sender.id === currentUserId;
                const showDate =
                  index === 0 ||
                  new Date(messages[index - 1].createdAt).toDateString() !==
                    new Date(item.createdAt).toDateString();

                return (
                  <View>
                    {showDate ? (
                      <View style={styles.dateDividerWrap}>
                        <Text style={styles.dateDivider}>{formatDayLabel(item.createdAt)}</Text>
                      </View>
                    ) : null}

                    <View
                      style={[
                        styles.messageRow,
                        isMine ? styles.messageRowMine : styles.messageRowOther,
                      ]}
                    >
                      <View
                        style={[
                          styles.messageBubble,
                          isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            isMine ? styles.messageTextMine : styles.messageTextOther,
                          ]}
                        >
                          {item.text}
                        </Text>
                      </View>

                      <View style={[styles.messageMetaRow, isMine && styles.messageMetaRowMine]}>
                        <Text style={styles.messageMetaText}>{formatTime(item.createdAt)}</Text>
                        {item.editedAt ? <Text style={styles.messageMetaText}>edited</Text> : null}
                      </View>

                      {isMine ? (
                        <View style={styles.messageActions}>
                          <Pressable
                            style={styles.messageAction}
                            onPress={() => {
                              setEditingMessageId(item.id);
                              setComposerText(item.text);
                            }}
                          >
                            <Pencil size={14} color="#2F5D50" />
                          </Pressable>
                          <Pressable
                            style={styles.messageAction}
                            onPress={() => handleDeleteMessage(item.id)}
                          >
                            <Trash2 size={14} color="#B42318" />
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.centerState}>
                  <MessageCircle size={28} color="#C65D3B" />
                  <Text style={styles.emptyTitle}>No messages yet</Text>
                  <Text style={styles.stateText}>Say hello to start the conversation.</Text>
                </View>
              }
            />
          )}

          {editingMessageId ? (
            <View style={styles.editBanner}>
              <Text style={styles.editBannerText}>Editing message</Text>
              <Pressable
                onPress={() => {
                  setEditingMessageId(null);
                  setComposerText('');
                }}
              >
                <Text style={styles.editCancel}>Cancel</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.composerWrap}>
            <TextInput
              multiline
              value={composerText}
              onChangeText={setComposerText}
              placeholder={
                editingMessageId
                  ? 'Edit your message...'
                  : `Message ${selectedConversation!.otherUser.fullName}...`
              }
              placeholderTextColor="#9CA3AF"
              style={styles.composerInput}
            />
            <Pressable
              style={[
                styles.sendButton,
                (!composerText.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!composerText.trim() || sending}
            >
              {sending ? <ActivityIndicator color="#FFFFFF" /> : <Send size={18} color="#FFFFFF" />}
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </KeyboardAvoidingView>
      )}
      </SafeAreaView>
    </BatikBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  headerBlock: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: '#C9A227',
  },
  title: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: '800',
    color: '#2F5D50',
  },
  headerPill: {
    borderRadius: 999,
    backgroundColor: '#C65D3B',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchBox: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECE6DD',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E1E1E',
  },
  resultsSection: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#FFF8F3',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1D6C8',
    padding: 12,
  },
  resultsLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: '#C65D3B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  artistResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  artistName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  artistMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECE6DD',
    padding: 14,
    marginBottom: 12,
  },
  conversationCardActive: {
    borderColor: '#C65D3B',
    backgroundColor: '#FFF8F3',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#12B76A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationMeta: {
    flex: 1,
  },
  conversationName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1E1E',
    marginRight: 8,
  },
  conversationTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  conversationSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#C65D3B',
    fontWeight: '600',
  },
  conversationPreview: {
    marginTop: 4,
    fontSize: 12,
    color: '#667085',
  },
  conversationPreviewUnread: {
    color: '#1E1E1E',
    fontWeight: '700',
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C65D3B',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#2F5D50',
  },
  stateText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    fontSize: 13,
    color: '#B42318',
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE6DD',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1E1E',
  },
  chatHeaderMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#667085',
  },
  topicBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF0E7',
    borderBottomWidth: 1,
    borderBottomColor: '#F1D6C8',
  },
  topicBannerText: {
    fontSize: 12,
    color: '#A24A2A',
    fontWeight: '600',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  dateDividerWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  dateDivider: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE6DD',
    fontSize: 11,
    fontWeight: '700',
    color: '#667085',
  },
  messageRow: {
    marginBottom: 12,
  },
  messageRowMine: {
    alignItems: 'flex-end',
  },
  messageRowOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  messageBubbleMine: {
    backgroundColor: '#C65D3B',
    borderBottomRightRadius: 6,
  },
  messageBubbleOther: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE6DD',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#FFFFFF',
  },
  messageTextOther: {
    color: '#1E1E1E',
  },
  messageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  messageMetaRowMine: {
    justifyContent: 'flex-end',
  },
  messageMetaText: {
    fontSize: 11,
    color: '#98A2B3',
  },
  messageActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  messageAction: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE6DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: '#FFF0E7',
    borderWidth: 1,
    borderColor: '#F1D6C8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A24A2A',
  },
  editCancel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C65D3B',
  },
  composerWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECE6DD',
  },
  composerInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: '#F9F7F3',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECE6DD',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E1E1E',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C65D3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
