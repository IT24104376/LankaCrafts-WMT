import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Search, Star, EyeOff, RotateCcw, Flag, Trash2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { getAdminReviews, moderateReview, deleteAdminReview } from '../../../src/api/adminApi';

type ReviewStatus = 'all' | 'active' | 'hidden' | 'flagged' | 'removed';

const STATUS_CONFIG = {
  active:  { label: 'Active',   bg: '#D1FAE5', text: '#065F46' },
  hidden:  { label: 'Hidden',   bg: '#F3F4F6', text: '#374151' },
  flagged: { label: 'Flagged',  bg: '#FEF3C7', text: '#92400E' },
  removed: { label: 'Removed',  bg: '#FEE2E2', text: '#7F1D1D' },
};

const STAR_COLOR = '#C9A227';

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={11} color={STAR_COLOR} fill={s <= rating ? STAR_COLOR : 'transparent'} />
      ))}
    </View>
  );
}

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  return (
    <View style={[stb.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[stb.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}
const stb = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  text: { fontSize: 10, fontWeight: '700' },
});

export default function AdminReviewsScreen() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [showSort, setShowSort] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const params: Record<string, string> = {
        search, sortBy,
        status: statusFilter,
        rating: ratingFilter === 'all' ? 'all' : String(ratingFilter),
      };
      const res = await getAdminReviews(params);
      setReviews(res.data?.reviews || []);
    } catch (err) {
      console.error('Failed to load admin reviews:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, ratingFilter, sortBy]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const handleModerate = async (id: string, action: 'hide' | 'remove' | 'restore' | 'spam') => {
    try {
      await moderateReview(id, action);
      load();
    } catch { Alert.alert('Error', 'Failed to moderate review.'); }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Review', 'Permanently delete this review? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteAdminReview(id);
            setReviews(prev => prev.filter(r => r.id !== id && r._id !== id));
          } catch { Alert.alert('Error', 'Failed to delete review.'); }
        }
      }
    ]);
  };

  const counts = {
    all: reviews.length,
    active: reviews.filter(r => r.status === 'active').length,
    hidden: reviews.filter(r => r.status === 'hidden').length,
    flagged: reviews.filter(r => r.status === 'flagged').length,
    removed: reviews.filter(r => r.status === 'removed').length,
  };

  const SORT_OPTIONS = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Highest Rating', value: 'highest' },
    { label: 'Lowest Rating', value: 'lowest' },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Review Monitoring</Text>
        <Text style={s.headerSub}>Moderate and manage platform reviews</Text>
      </View>

      {/* Search */}
      <View style={s.toolRow}>
        <View style={s.searchBox}>
          <Search size={14} color="#9CA3AF" />
          <TextInput
            style={s.searchInput} value={search} onChangeText={setSearch}
            placeholder="Search tourist, artisan, text..." placeholderTextColor="#9CA3AF"
          />
        </View>
        <TouchableOpacity style={s.sortBtn} onPress={() => setShowSort(v => !v)}>
          <Text style={s.sortBtnText}>{SORT_OPTIONS.find(o => o.value === sortBy)?.label.split(' ')[0]}</Text>
          {showSort ? <ChevronUp size={12} color="#2F5D50" /> : <ChevronDown size={12} color="#2F5D50" />}
        </TouchableOpacity>
      </View>

      {showSort && (
        <View style={s.sortDropdown}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.value} style={[s.sortOption, sortBy === opt.value && s.sortOptionActive]}
              onPress={() => { setSortBy(opt.value as any); setShowSort(false); }}>
              <Text style={[s.sortOptionText, sortBy === opt.value && s.sortOptionTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Status filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
        {(['all', 'active', 'hidden', 'flagged', 'removed'] as ReviewStatus[]).map(st => (
          <TouchableOpacity
            key={st}
            style={[s.filterTab, statusFilter === st && s.filterTabActive]}
            onPress={() => setStatusFilter(st)}
          >
            <Text style={[s.filterTabText, statusFilter === st && s.filterTabTextActive]}>
              {st.charAt(0).toUpperCase() + st.slice(1)} ({counts[st] ?? 0})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Rating filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.ratingScroll} contentContainerStyle={s.ratingRow}>
        {(['all', 5, 4, 3, 2, 1] as (number | 'all')[]).map(r => (
          <TouchableOpacity
            key={String(r)}
            style={[s.ratingTab, ratingFilter === r && s.ratingTabActive]}
            onPress={() => setRatingFilter(r)}
          >
            <Text style={[s.ratingTabText, ratingFilter === r && s.ratingTabTextActive]}>
              {r === 'all' ? 'All ★' : `${r}★`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#2F5D50" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#2F5D50']} />}
        >
          {reviews.length === 0 ? (
            <View style={s.empty}>
              <Star size={40} color="#D1D5DB" fill="transparent" />
              <Text style={s.emptyText}>No reviews match your filters</Text>
            </View>
          ) : (
            reviews.map(review => {
              const rid = review.id || review._id;
              const isExpanded = expandedId === rid;
              return (
                <View key={rid} style={s.card}>
                  {/* Top row */}
                  <View style={s.cardTop}>
                    <View style={[s.avatar, { backgroundColor: review.touristColor || '#2F5D50' }]}>
                      <Text style={s.avatarText}>{review.touristInitials || '?'}</Text>
                    </View>
                    <View style={s.cardMid}>
                      <Text style={s.touristName} numberOfLines={1}>{review.touristName}</Text>
                      <Text style={s.artisanName} numberOfLines={1}>{review.artisanName}</Text>
                      <StarRow rating={review.rating} />
                    </View>
                    <View style={s.cardTopRight}>
                      <StatusBadge status={review.status || 'active'} />
                      <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : rid)}>
                        {isExpanded
                          ? <ChevronUp size={16} color="#9CA3AF" />
                          : <ChevronDown size={16} color="#9CA3AF" />
                        }
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Review text */}
                  <Text style={s.reviewText} numberOfLines={isExpanded ? undefined : 2}>{review.text}</Text>

                  {/* Action buttons (shown when expanded) */}
                  {isExpanded && (
                    <View style={s.actionRow}>
                      {review.status !== 'hidden' && review.status !== 'removed' && (
                        <TouchableOpacity style={[s.actionBtn, s.hideBtn]} onPress={() => handleModerate(rid, 'hide')}>
                          <EyeOff size={12} color="#374151" />
                          <Text style={s.hideBtnText}>Hide</Text>
                        </TouchableOpacity>
                      )}
                      {(review.status === 'hidden' || review.status === 'removed') && (
                        <TouchableOpacity style={[s.actionBtn, s.restoreBtn]} onPress={() => handleModerate(rid, 'restore')}>
                          <RotateCcw size={12} color="#065F46" />
                          <Text style={s.restoreBtnText}>Restore</Text>
                        </TouchableOpacity>
                      )}
                      {review.status !== 'flagged' && review.status !== 'removed' && (
                        <TouchableOpacity style={[s.actionBtn, s.spamBtn]} onPress={() => handleModerate(rid, 'spam')}>
                          <Flag size={12} color="#92400E" />
                          <Text style={s.spamBtnText}>Spam</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={[s.actionBtn, s.deleteBtn]} onPress={() => handleDelete(rid)}>
                        <Trash2 size={12} color="#7F1D1D" />
                        <Text style={s.deleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F3EE' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#2F5D50', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  toolRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  searchInput: { flex: 1, fontSize: 13, color: '#1E1E1E' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F5E9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#BBF7D0' },
  sortBtnText: { fontSize: 12, fontWeight: '700', color: '#2F5D50' },
  sortDropdown: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', zIndex: 10 },
  sortOption: { paddingHorizontal: 20, paddingVertical: 11 },
  sortOptionActive: { backgroundColor: '#F0FDF4' },
  sortOptionText: { fontSize: 13, color: '#6B7280' },
  sortOptionTextActive: { color: '#2F5D50', fontWeight: '700' },
  filterScroll: { backgroundColor: '#fff' },
  filterRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterTab: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent' },
  filterTabActive: { backgroundColor: '#E8F5E9', borderColor: '#2F5D50' },
  filterTabText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  filterTabTextActive: { color: '#2F5D50', fontWeight: '700' },
  ratingScroll: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  ratingRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 6 },
  ratingTab: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, backgroundColor: '#F3F4F6' },
  ratingTabActive: { backgroundColor: '#FEF3C7' },
  ratingTabText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  ratingTabTextActive: { color: '#92400E', fontWeight: '700' },
  list: { padding: 14, gap: 10, paddingBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  cardMid: { flex: 1 },
  touristName: { fontSize: 13, fontWeight: '700', color: '#1E1E1E' },
  artisanName: { fontSize: 11, color: '#6B7280', marginBottom: 3 },
  cardTopRight: { alignItems: 'flex-end', gap: 5 },
  reviewText: { fontSize: 13, color: '#4B5563', lineHeight: 19, marginBottom: 10 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F9FAFB' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  hideBtn: { backgroundColor: '#F3F4F6' }, hideBtnText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  restoreBtn: { backgroundColor: '#D1FAE5' }, restoreBtnText: { fontSize: 11, fontWeight: '700', color: '#065F46' },
  spamBtn: { backgroundColor: '#FEF3C7' }, spamBtnText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  deleteBtn: { backgroundColor: '#FEE2E2' }, deleteBtnText: { fontSize: 11, fontWeight: '700', color: '#7F1D1D' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
