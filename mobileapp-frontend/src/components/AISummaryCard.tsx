import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, Bot } from 'lucide-react-native';
import { AiReviewSummary } from '../services/aiApi';

interface AISummaryCardProps {
  loading: boolean;
  data: AiReviewSummary | null;
  totalReviews: number;
}

export function AISummaryCard({
  loading,
  data,
  totalReviews,
}: AISummaryCardProps) {
  return (
    <View style={ai.card}>
      {/* Header */}
      <View style={ai.header}>
        <View style={ai.iconBox}>
          <Bot size={16} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ai.title}>AI Summary of Visitor Feedback</Text>
          <Text style={ai.subtitle}>Generated from {totalReviews} review{totalReviews !== 1 ? 's' : ''}</Text>
        </View>
        <View style={ai.badge}>
          <Sparkles size={11} color="#2F5D50" />
          <Text style={ai.badgeText}>AI</Text>
        </View>
      </View>

      {/* Body */}
      {loading ? (
        <View style={ai.skeleton}>
          {[100, 88, 70].map((w, i) => (
            <View key={i} style={[ai.skeletonLine, { width: `${w}%` }]} />
          ))}
        </View>
      ) : data ? (
        <View>
          <Text style={ai.summary}>{data.summary}</Text>
          {data.highlights && data.highlights.length > 0 && (
            <View style={ai.tagRow}>
              {data.highlights.map((h, i) => (
                <View key={i} style={ai.highlightTag}>
                  <Text style={ai.highlightText}>✓ {h}</Text>
                </View>
              ))}
            </View>
          )}
          {data.cautions && data.cautions.length > 0 && (
            <View style={ai.tagRow}>
              {data.cautions.map((c, i) => (
                <View key={i} style={ai.cautionTag}>
                  <Text style={ai.cautionText}>⚠ {c}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <Text style={ai.emptyText}>
          Not enough reviews yet to generate an AI summary.
        </Text>
      )}
    </View>
  );
}

const ai = StyleSheet.create({
  card: {
    backgroundColor: '#F0FDF4', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#BBF7D0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconBox: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#2F5D50', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 13, fontWeight: '700', color: '#2F5D50' },
  subtitle: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#2F5D50' },
  summary: { fontSize: 13, color: '#374151', lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  highlightTag: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  highlightText: { fontSize: 11, color: '#166534', fontWeight: '600' },
  cautionTag: { backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  cautionText: { fontSize: 11, color: '#DC2626', fontWeight: '600' },
  skeleton: { gap: 8 },
  skeletonLine: { height: 10, backgroundColor: '#D1FAE5', borderRadius: 6 },
  emptyText: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
});
