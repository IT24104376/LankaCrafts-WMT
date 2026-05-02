import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, RefreshControl, Dimensions, Modal,
  FlatList, NativeSyntheticEvent, NativeScrollEvent, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { getBlogs, getBlog, likeBlog, getMyBlogs } from '../../../src/services/api';
import { TRENDING_TAGS } from '../../../src/constants/touristConstants';
import { Heart, Clock, Plus, X, ChevronRight, Play } from 'lucide-react-native';
import { BatikBackground } from '../../../src/components/BatikBackground';

const { width } = Dimensions.get('window');
const CARD_IMAGE_HEIGHT = 200;
const CAROUSEL_WIDTH = width - 32; // card padding

// ── Media Carousel ────────────────────────────────────────────────
function MediaCarousel({ media, height = CARD_IMAGE_HEIGHT }: { media: any[]; height?: number }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const sorted = [...media].sort((a, b) => (a.order || 0) - (b.order || 0));

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CAROUSEL_WIDTH);
    setActiveIdx(idx);
  };

  if (sorted.length === 0) return null;

  return (
    <View>
      <FlatList
        data={sorted}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => `media-${i}`}
        renderItem={({ item }) => (
          <View style={{ width: CAROUSEL_WIDTH, height, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            {item.mediaType === 'video' ? (
              <TouchableOpacity
                style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                onPress={() => Linking.openURL(item.url)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: item.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <View style={s.playOverlay}>
                  <View style={s.playCircle}><Play size={24} color="#fff" fill="#fff" /></View>
                </View>
              </TouchableOpacity>
            ) : (
              <Image source={{ uri: item.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            )}
          </View>
        )}
      />
      {sorted.length > 1 && (
        <View style={s.dotRow}>
          {sorted.map((_, i) => (
            <View key={i} style={[s.dot, activeIdx === i ? s.dotActive : null]} />
          ))}
        </View>
      )}
    </View>
  );
}

// ── Read Post Modal ───────────────────────────────────────────────
function ReadPostModal({ visible, blog, loading, onClose, onLike, liked }: {
  visible: boolean; blog: any; loading: boolean;
  onClose: () => void; onLike: () => void; liked: boolean;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <SafeAreaView style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalHeaderTitle}>Blog Post</Text>
            <TouchableOpacity onPress={onClose} style={s.modalCloseBtn}>
              <X size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#C65D3B" style={{ marginTop: 60 }} />
          ) : blog ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
              {/* Media */}
              {blog.media?.length > 0 && (
                <MediaCarousel media={blog.media} height={260} />
              )}

              {/* Tags */}
              {(blog.workshopTag || blog.hashtags?.length > 0) && (
                <View style={s.readTagRow}>
                  {blog.workshopTag ? (
                    <View style={s.workshopTag}><Text style={s.workshopTagText}>{blog.workshopTag}</Text></View>
                  ) : null}
                  {blog.hashtags?.map((tag: string) => (
                    <View key={tag} style={s.hashTag}><Text style={s.hashTagText}>{tag}</Text></View>
                  ))}
                </View>
              )}

              {/* Title */}
              <Text style={s.readTitle}>{blog.title}</Text>

              {/* Author */}
              <View style={s.readAuthorRow}>
                {blog.author?.profilePicUrl ? (
                  <Image source={{ uri: blog.author.profilePicUrl }} style={s.readAuthorPic} />
                ) : (
                  <View style={s.readAuthorFallback}>
                    <Text style={s.readAuthorInitials}>
                      {blog.author?.initials || blog.author?.fullName?.charAt(0) || '?'}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.readAuthorName}>{blog.author?.fullName || 'Anonymous'}</Text>
                  <Text style={s.readDate}>{formatDate(blog.createdAt)}</Text>
                </View>
                <TouchableOpacity onPress={onLike} style={s.readLikeBtn}>
                  <Heart size={18} color={liked ? '#DC2626' : '#9CA3AF'} fill={liked ? '#DC2626' : 'transparent'} />
                  <Text style={[s.readLikeText, liked && { color: '#DC2626' }]}>
                    {blog.likeCount ?? blog.likes?.length ?? 0}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <Text style={s.readContent}>{blog.content}</Text>
            </ScrollView>
          ) : (
            <Text style={{ textAlign: 'center', marginTop: 40, color: '#9CA3AF' }}>Could not load post.</Text>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return ''; }
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Main Screen ───────────────────────────────────────────────────
export default function TouristBlogsScreen() {
  const { tourist } = useAuth();
  const router = useRouter();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [activeTag, setActiveTag] = useState<string | undefined>();
  const [sort, setSort] = useState('recent');

  // Read modal
  const [readVisible, setReadVisible] = useState(false);
  const [readBlog, setReadBlog] = useState<any>(null);
  const [readLoading, setReadLoading] = useState(false);

  const fetchBlogs = async (p = 1, sortVal = sort, tag = activeTag) => {
    try {
      if (sortVal === 'my posts') {
        const res = await getMyBlogs();
        if (res?.data) {
          const list = res.data.blogs || res.data || [];
          setBlogs(list);
        }
      } else {
        let finalSort = sortVal === 'popular' ? 'liked' : sortVal;
        if (tag) {
          finalSort = 'hashtag';
        }
        const res = await getBlogs(p, finalSort, tag);
        if (res?.data) {
          const list = res.data.blogs || res.data || [];
          setBlogs(p === 1 ? list : [...blogs, ...list]);
        }
      }
    } catch { }
  };

  useEffect(() => {
    (async () => { setLoading(true); await fetchBlogs(1, sort, activeTag); setLoading(false); })();
  }, [sort, activeTag]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); setPage(1);
    await fetchBlogs(1, sort, activeTag);
    setRefreshing(false);
  }, [sort, activeTag]);

  const handleLike = async (id: string) => {
    const blog = blogs.find(b => b._id === id);
    if (!blog) return;
    const alreadyLiked = blog.likes?.includes(tourist?.id);
    setBlogs(prev => prev.map(b => {
      if (b._id !== id) return b;
      const nextLikes = alreadyLiked
        ? (b.likes || []).filter((uid: string) => uid !== tourist?.id)
        : [...(b.likes || []), tourist?.id];
      return { ...b, likes: nextLikes, likeCount: (b.likeCount || 0) + (alreadyLiked ? -1 : 1), hasLiked: !alreadyLiked };
    }));
    try { await likeBlog(id); } catch {
      setBlogs(prev => prev.map(b => {
        if (b._id !== id) return b;
        const nextLikes = alreadyLiked
          ? [...(b.likes || []), tourist?.id]
          : (b.likes || []).filter((uid: string) => uid !== tourist?.id);
        return { ...b, likes: nextLikes, likeCount: (b.likeCount || 0) + (alreadyLiked ? 1 : -1), hasLiked: alreadyLiked };
      }));
    }
  };

  const handleReadMore = async (id: string) => {
    setReadVisible(true); setReadLoading(true); setReadBlog(null);
    try {
      const res = await getBlog(id);
      setReadBlog(res.data.blog || res.data);
    } catch { }
    setReadLoading(false);
  };

  return (
    <BatikBackground>
      <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Blogs</Text>
        <TouchableOpacity style={s.newBtn} activeOpacity={0.8} onPress={() => router.push('/tourist/blog-create/blog-create')}>
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
        <TouchableOpacity style={[s.tagChip, !activeTag && s.tagChipActive]} onPress={() => { setActiveTag(undefined); setPage(1); }}>
          <Text style={[s.tagText, !activeTag && s.tagTextActive]}>All</Text>
        </TouchableOpacity>
        {TRENDING_TAGS.slice(0, 10).map(tag => (
          <TouchableOpacity key={tag} style={[s.tagChip, activeTag === tag && s.tagChipActive]} onPress={() => { setActiveTag(activeTag === tag ? undefined : tag); setPage(1); }}>
            <Text style={[s.tagText, activeTag === tag && s.tagTextActive]}>{tag}</Text>
          </TouchableOpacity>
        ))}
        <Text>{"\n\n"}</Text>
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
          blogs.map((blog: any) => {
            const authorName = blog.author?.fullName || blog.authorName || 'Anonymous';
            const authorInitials = blog.author?.initials || authorName.charAt(0);
            const authorPic = blog.author?.profilePicUrl || null;
            const liked = blog.likes?.includes(tourist?.id);
            const likeCount = blog.likeCount ?? blog.likes?.length ?? 0;

            return (
              <View key={blog._id} style={s.blogCard}>
                {/* Media carousel */}
                {blog.media?.length > 0 ? (
                  <MediaCarousel media={blog.media} />
                ) : blog.imageUrl ? (
                  <View style={{ width: '100%', height: CARD_IMAGE_HEIGHT, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Image source={{ uri: blog.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </View>
                ) : null}

                {/* Tags */}
                {blog.tags && blog.tags.length > 0 && (
                  <View style={s.blogTags}>
                    {blog.tags.slice(0, 3).map((t: string) => (
                      <View key={t} style={s.blogTag}><Text style={s.blogTagText}>{t}</Text></View>
                    ))}
                  </View>
                )}

                {/* Title + excerpt */}
                <Text style={s.blogTitle} numberOfLines={2}>{blog.title}</Text>
                <Text style={s.blogExcerpt} numberOfLines={3}>{blog.content || blog.body || ''}</Text>

                {/* Author row */}
                <View style={s.authorRow}>
                  {authorPic ? (
                    <Image source={{ uri: authorPic }} style={s.authorPic} />
                  ) : (
                    <View style={s.authorAvatar}>
                      <Text style={s.authorInitials}>{authorInitials}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={s.authorName}>{authorName}</Text>
                    <View style={s.timeMeta}>
                      <Clock size={10} color="#9CA3AF" />
                      <Text style={s.timeText}>{timeAgo(blog.createdAt)}</Text>
                    </View>
                  </View>
                </View>

                {/* Actions: Like + Read More */}
                <View style={s.actionsRow}>
                  <TouchableOpacity style={s.actionBtn} onPress={() => handleLike(blog._id)}>
                    <Heart size={16} color={liked ? '#DC2626' : '#9CA3AF'} fill={liked ? '#DC2626' : 'transparent'} />
                    <Text style={s.actionText}>{likeCount}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.readMoreBtn} onPress={() => handleReadMore(blog._id)}>
                    <Text style={s.readMoreText}>Read More</Text>
                    <ChevronRight size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Read Post Modal */}
      <ReadPostModal
        visible={readVisible}
        blog={readBlog}
        loading={readLoading}
        liked={readBlog ? readBlog.likes?.includes(tourist?.id) : false}
        onLike={() => readBlog && handleLike(readBlog._id)}
        onClose={() => setReadVisible(false)}
      />
      </SafeAreaView>
    </BatikBackground>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#2F5D50' },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#C65D3B', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  newBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  sortRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  sortTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F0F0F0' },
  sortTabActive: { backgroundColor: '#2F5D50', borderColor: '#2F5D50' },
  sortTabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  sortTabTextActive: { color: '#fff' },
  tagScroll: { marginBottom: 10, maxHeight: 40 },
  tagChip: { height: 35, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  tagChipActive: { backgroundColor: '#C65D3B', borderColor: '#C65D3B' },
  tagText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  tagTextActive: { color: '#fff' },
  emptyCard: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 40, marginTop: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#6B7280', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },

  // Blog Card
  blogCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#F0F0F0' },
  blogImage: { width: '100%', height: CARD_IMAGE_HEIGHT, borderRadius: 14, marginBottom: 12 },
  blogTags: { flexDirection: 'row', gap: 6, marginBottom: 8, marginTop: 10, flexWrap: 'wrap' },
  blogTag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: '#F3F4F6' },
  blogTagText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  blogTitle: { fontSize: 16, fontWeight: '700', color: '#1E1E1E', marginBottom: 6 },
  blogExcerpt: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 12 },

  // Author
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  authorPic: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#E5E7EB' },
  authorAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#C65D3B', alignItems: 'center', justifyContent: 'center' },
  authorInitials: { fontSize: 14, fontWeight: '700', color: '#fff' },
  authorName: { fontSize: 13, fontWeight: '600', color: '#1E1E1E' },
  timeMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  timeText: { fontSize: 10, color: '#9CA3AF' },

  // Actions
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  readMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2F5D50', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  readMoreText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Carousel dots
  dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB' },
  dotActive: { width: 20, backgroundColor: '#C65D3B' },

  // Read Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#2F5D50' },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },

  readTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12, marginTop: 12 },
  workshopTag: { backgroundColor: '#EBF4F1', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16 },
  workshopTagText: { fontSize: 12, fontWeight: '600', color: '#2F5D50' },
  hashTag: { backgroundColor: '#F6F3EE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  hashTagText: { fontSize: 11, color: '#6B7280' },

  readTitle: { fontSize: 24, fontWeight: '800', color: '#1E1E1E', marginBottom: 16 },
  readAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  readAuthorPic: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  readAuthorFallback: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#C65D3B', alignItems: 'center', justifyContent: 'center' },
  readAuthorInitials: { fontSize: 16, fontWeight: '700', color: '#fff' },
  readAuthorName: { fontSize: 14, fontWeight: '600', color: '#1E1E1E' },
  readDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  readLikeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readLikeText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  readContent: { fontSize: 15, color: '#374151', lineHeight: 24 },

  // Video play overlay
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  playCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
});
