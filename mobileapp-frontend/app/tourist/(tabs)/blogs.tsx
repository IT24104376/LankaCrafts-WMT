import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, RefreshControl, Dimensions, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/context/AuthContext';
import { getBlogs, likeBlog } from '../../../src/services/api';
import { TRENDING_TAGS } from '../../../src/constants/touristConstants';
import {
  Heart, MessageCircle, Clock, Search, Plus, TrendingUp,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function TouristBlogsScreen() {
  const { tourist } = useAuth();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [activeTag, setActiveTag] = useState<string | undefined>();
  const [sort, setSort] = useState('recent');

  const fetchBlogs = async (p = 1, s = sort, t = activeTag) => {
    try {
      const res = await getBlogs(p, s, t);
      if (res?.data) {
        const list = res.data.blogs || res.data || [];
        setBlogs(p === 1 ? list : [...blogs, ...list]);
      }
    } catch { }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchBlogs(1, sort, activeTag);
      setLoading(false);
    })();
  }, [sort, activeTag]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await fetchBlogs(1, sort, activeTag);
    setRefreshing(false);
  }, [sort, activeTag]);

  const handleLike = async (id: string) => {
    const blog = blogs.find(b => b._id === id);
    if (!blog) return;
    const alreadyLiked = blog.likes?.includes(tourist?.id);

    // Optimistic Update
    setBlogs(prev => prev.map(b => {
      if (b._id === id) {
        const nextLikes = alreadyLiked
          ? (b.likes || []).filter((uid: string) => uid !== tourist?.id)
          : [...(b.likes || []), tourist?.id];
        return { ...b, likes: nextLikes, likeCount: (b.likeCount || 0) + (alreadyLiked ? -1 : 1), hasLiked: !alreadyLiked };
      }
      return b;
    }));

    try {
      await likeBlog(id);
    } catch {
      // Revert on error
      setBlogs(prev => prev.map(b => {
        if (b._id === id) {
          const nextLikes = alreadyLiked
            ? [...(b.likes || []), tourist?.id]
            : (b.likes || []).filter((uid: string) => uid !== tourist?.id);
          return { ...b, likes: nextLikes, likeCount: (b.likeCount || 0) + (alreadyLiked ? 1 : -1), hasLiked: alreadyLiked };
        }
        return b;
      }));
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (

    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Blogs</Text>
        <TouchableOpacity style={s.newBtn} activeOpacity={0.8}>
          <Plus size={18} color="#fff" />
          <Text style={s.newBtnText}>New Post</Text>
        </TouchableOpacity>
      </View>

      {/* Sort tabs */}
      <View style={s.sortRow}>
        {['recent', 'popular', 'mine'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[s.sortTab, sort === tab && s.sortTabActive]}
            onPress={() => { setSort(tab); setPage(1); }}
          >
            <Text style={[s.sortTabText, sort === tab && s.sortTabTextActive]}>
              {tab === 'recent' ? 'Recent' : tab === 'popular' ? 'Popular' : 'My Posts'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tags */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tagScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
        <TouchableOpacity
          style={[s.tagChip, !activeTag && s.tagChipActive]}
          onPress={() => { setActiveTag(undefined); setPage(1); }}
        >
          <Text style={[s.tagText, !activeTag && s.tagTextActive]}>All</Text>
        </TouchableOpacity>
        {TRENDING_TAGS.slice(0, 10).map(tag => (
          <TouchableOpacity
            key={tag}
            style={[s.tagChip, activeTag === tag && s.tagChipActive]}
            onPress={() => { setActiveTag(activeTag === tag ? undefined : tag); setPage(1); }}
          >
            <Text style={[s.tagText, activeTag === tag && s.tagTextActive]}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Blog list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C65D3B" />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#C65D3B" style={{ marginTop: 40 }} />
        ) : blogs.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={{ fontSize: 36 }}>📝</Text>
            <Text style={s.emptyTitle}>No blogs yet</Text>
            <Text style={s.emptySub}>Be the first to share your cultural journey!</Text>
          </View>
        ) : (
          blogs.map((blog: any) => (
            <View key={blog._id} style={s.blogCard}>
              {/* Author */}
              <View style={s.authorRow}>
                <View style={s.authorAvatar}>
                  <Text style={s.authorInitials}>
                    {(blog.authorName || blog.author?.callingName || '?').charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.authorName}>{blog.authorName || blog.author?.callingName || 'Anonymous'}</Text>
                  <View style={s.timeMeta}>
                    <Clock size={10} color="#9CA3AF" />
                    <Text style={s.timeText}>{timeAgo(blog.createdAt)}</Text>
                  </View>
                </View>
              </View>

              {/* Content */}
              <Text style={s.blogTitle} numberOfLines={2}>{blog.title}</Text>
              <Text style={s.blogExcerpt} numberOfLines={3}>{blog.content || blog.body || ''}</Text>

              {/* Media */}
              {(() => {
                const mediaUrl = blog.media?.[0]?.url || blog.imageUrl;
                return mediaUrl ? (
                  <Image source={{ uri: mediaUrl }} style={s.blogImage} resizeMode="cover" />
                ) : null;
              })()}

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <View style={s.blogTags}>
                  {blog.tags.slice(0, 3).map((t: string) => (
                    <View key={t} style={s.blogTag}><Text style={s.blogTagText}>{t}</Text></View>
                  ))}
                </View>
              )}

              {/* Actions */}
              <View style={s.actionsRow}>
                <TouchableOpacity style={s.actionBtn} onPress={() => handleLike(blog._id)}>
                  <Heart size={16} color={blog.hasLiked ? '#DC2626' : '#9CA3AF'} fill={blog.hasLiked ? '#DC2626' : 'transparent'} />
                  <Text style={s.actionText}>{blog.likeCount || blog.likes?.length || 0}</Text>
                </TouchableOpacity>
                <View style={s.actionBtn}>
                  <MessageCircle size={16} color="#9CA3AF" />
                  <Text style={s.actionText}>{blog.comments?.length || 0}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F3EE' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#2F5D50' },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#C65D3B', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  newBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  sortRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  sortTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F0F0F0' },
  sortTabActive: { backgroundColor: '#2F5D50', borderColor: '#2F5D50' },
  sortTabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  sortTabTextActive: { color: '#fff' },
  tagScroll: { marginBottom: 8, maxHeight: 40 },
  tagChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  tagChipActive: { backgroundColor: '#C65D3B', borderColor: '#C65D3B' },
  tagText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  tagTextActive: { color: '#fff' },
  emptyCard: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 40, marginTop: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#6B7280', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  blogCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#F0F0F0' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  authorAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EBF4F1', alignItems: 'center', justifyContent: 'center' },
  authorInitials: { fontSize: 14, fontWeight: '700', color: '#2F5D50' },
  authorName: { fontSize: 13, fontWeight: '600', color: '#1E1E1E' },
  timeMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  timeText: { fontSize: 10, color: '#9CA3AF' },
  blogTitle: { fontSize: 16, fontWeight: '700', color: '#1E1E1E', marginBottom: 6 },
  blogExcerpt: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 12 },
  blogImage: { width: '100%', height: 180, borderRadius: 14, marginBottom: 12 },
  blogTags: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  blogTag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: '#F3F4F6' },
  blogTagText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  actionsRow: { flexDirection: 'row', gap: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
});
