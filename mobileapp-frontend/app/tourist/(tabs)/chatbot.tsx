import React, { useMemo, useRef, useState } from 'react';
import {
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
import { Bot, MessageCircle, Send, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  SUGGESTED_QUESTIONS,
  getChatbotReply,
} from '../../../src/services/chatbotFaq';

type UiMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  suggestions?: string[];
};

const initialMessage: UiMessage = {
  id: 'welcome',
  role: 'assistant',
  text:
    'I am your LankaCrafts assistant. Ask me about bookings, artists, workshops, payments, or how to use the inbox.',
  suggestions: SUGGESTED_QUESTIONS,
};

export default function TouristChatbotScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<UiMessage>>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<UiMessage[]>([initialMessage]);

  const quickActions = useMemo(
    () => [
      { id: 'open-inbox', label: 'Open Inbox', onPress: () => router.push('/tourist/(tabs)/inbox') },
      { id: 'book-workshop', label: 'Book Workshop', onPress: () => router.push('/tourist/bookings/book-workshop') },
      { id: 'view-bookings', label: 'View Bookings', onPress: () => router.push('/tourist/(tabs)/bookings') },
    ],
    [router]
  );

  const sendMessage = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const userMessage: UiMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const reply = getChatbotReply(trimmed);
    const assistantMessage: UiMessage = {
      id: `assistant-${Date.now() + 1}`,
      role: 'assistant',
      text: reply.text,
      suggestions: reply.suggestions,
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput('');

    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 60);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Sparkles size={16} color="#C65D3B" />
            <Text style={styles.headerBadgeText}>AI CHATBOT</Text>
          </View>
          <Text style={styles.title}>LankaCrafts Assistant</Text>
          <Text style={styles.subtitle}>
            Fast help for bookings, artist discovery, payments, reviews, and messaging.
          </Text>
        </View>

        <View style={styles.quickActionRow}>
          {quickActions.map((action) => (
            <Pressable key={action.id} style={styles.quickAction} onPress={action.onPress}>
              <Text style={styles.quickActionText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isAssistant = item.role === 'assistant';

            return (
              <View
                style={[
                  styles.messageRow,
                  isAssistant ? styles.messageRowAssistant : styles.messageRowUser,
                ]}
              >
                {isAssistant ? (
                  <View style={styles.assistantIcon}>
                    <Bot size={16} color="#FFFFFF" />
                  </View>
                ) : null}

                <View
                  style={[
                    styles.messageBubble,
                    isAssistant ? styles.assistantBubble : styles.userBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isAssistant ? styles.assistantText : styles.userText,
                    ]}
                  >
                    {item.text}
                  </Text>

                  {isAssistant && item.suggestions?.length ? (
                    <View style={styles.suggestionWrap}>
                      {item.suggestions.map((suggestion) => (
                        <Pressable
                          key={`${item.id}-${suggestion}`}
                          style={styles.suggestionChip}
                          onPress={() => sendMessage(suggestion)}
                        >
                          <Text style={styles.suggestionChipText}>{suggestion}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            <View style={styles.footerNote}>
              <MessageCircle size={16} color="#C65D3B" />
              <Text style={styles.footerNoteText}>
                Need a real artisan reply? Open your inbox and message them directly.
              </Text>
            </View>
          }
        />

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Ask about LankaCrafts..."
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            multiline
          />
          <Pressable
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            disabled={!input.trim()}
            onPress={() => sendMessage(input)}
          >
            <Send size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F3EE',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#FFF0E7',
    borderWidth: 1,
    borderColor: '#F1D6C8',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: '#C65D3B',
  },
  title: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: '800',
    color: '#2F5D50',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#667085',
    lineHeight: 21,
  },
  quickActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  quickAction: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE6DD',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2F5D50',
  },
  chatContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  messageRow: {
    marginBottom: 14,
  },
  messageRowAssistant: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  messageRowUser: {
    alignItems: 'flex-end',
  },
  assistantIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#C65D3B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  messageBubble: {
    maxWidth: '86%',
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE6DD',
  },
  userBubble: {
    backgroundColor: '#2F5D50',
    borderBottomRightRadius: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  assistantText: {
    color: '#1E1E1E',
  },
  userText: {
    color: '#FFFFFF',
  },
  suggestionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  suggestionChip: {
    borderRadius: 999,
    backgroundColor: '#FFF8F3',
    borderWidth: 1,
    borderColor: '#F1D6C8',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A24A2A',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    borderRadius: 18,
    backgroundColor: '#FFF0E7',
    borderWidth: 1,
    borderColor: '#F1D6C8',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#A24A2A',
    fontWeight: '600',
    lineHeight: 18,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECE6DD',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: 18,
    backgroundColor: '#F9F7F3',
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
