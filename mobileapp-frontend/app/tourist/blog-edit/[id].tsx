import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Image, Alert, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../src/context/AuthContext';
import { getBlog, updateBlog, getArtists } from '../../../src/services/api';
import { TRENDING_TAGS } from '../../../src/constants/touristConstants';
import { ArrowLeft, X, ImagePlus, ChevronDown, Save, FileText } from 'lucide-react-native';
import { BatikBackground } from '../../../src/components/BatikBackground';

const { width } = Dimensions.get('window');

interface Workshop { id: string; name: string; }
interface PickedMedia { uri: string; type: string; name: string; }
interface ExistingMedia { url: string; publicId: string; mediaType: string; order: number; }

export default function TouristBlogEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { tourist } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [workshop, setWorkshop] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>([]);
  const [newMedia, setNewMedia] = useState<PickedMedia[]>([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);

  const [workshopsList, setWorkshopsList] = useState<Workshop[]>([]);
  const [workshopSearch, setWorkshopSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [blogRes, artistsRes] = await Promise.all([
          getBlog(id),
          getArtists(1, 100).catch(() => ({ data: { artists: [] } }))
        ]);

        const blog = blogRes?.data?.blog || blogRes?.data;
        if (blog) {
          setTitle(blog.title || '');
          setContent(blog.content || '');
          setWorkshop(blog.workshopTag || '');
          setStatus(blog.status === 'draft' ? 'draft' : 'published');
          setSelectedTags(blog.hashtags || []);
          setExistingMedia(blog.media || []);
        }

        const all = artistsRes.data?.artists || [];
        setWorkshopsList(all.map((a: any) => ({
          id: a._id || a.id,
          name: `${(a.craftType || 'Art').charAt(0).toUpperCase() + (a.craftType || 'Art').slice(1)} Workshop — ${a.address?.city || 'Sri Lanka'} (by ${a.fullName})`,
        })));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    })();
  }, [id]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const pickMedia = async () => {
    const currentCount = existingMedia.length + newMedia.length;
    if (currentCount >= 10) { Alert.alert('Limit', 'Max 10 files.'); return; }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: 10 - currentCount,
      quality: 0.8,
    });

    if (!result.canceled) {
      const picked = result.assets.map(a => ({
        uri: a.uri,
        type: a.mimeType || (a.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        name: a.fileName || `media_${Date.now()}.jpg`,
      }));
      setNewMedia(prev => [...prev, ...picked].slice(0, 10 - existingMedia.length));
    }
  };

  const removeExisting = (pubId: string) => {
    setRemovedMediaIds(prev => [...prev, pubId]);
    setExistingMedia(prev => prev.filter(m => m.publicId !== pubId));
  };

  const removeNew = (idx: number) => setNewMedia(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async (finalStatus: 'published' | 'draft' = status) => {
    if (!title.trim() || !content.trim()) { setError('Title and story are required.'); return; }
    setSubmitting(true); setError('');
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('content', content.trim());
      fd.append('workshopTag', workshop);
      fd.append('status', finalStatus);
      fd.append('hashtags', JSON.stringify(selectedTags));
      
      if (removedMediaIds.length > 0) {
        fd.append('removeMediaIds', removedMediaIds.join(','));
      }

      newMedia.forEach(m => fd.append('media', { uri: m.uri, type: m.type, name: m.name } as any));

      await updateBlog(id!, fd);
      Alert.alert('Success', 'Blog updated successfully!');
      router.back();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update.');
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <BatikBackground>
        <SafeAreaView style={st.safe}>
          <View style={st.center}>
            <ActivityIndicator size="large" color="#C65D3B" />
          </View>
        </SafeAreaView>
      </BatikBackground>
    );
  }

  const filtered = workshopsList.filter(w => w.name.toLowerCase().includes(workshopSearch.toLowerCase()));

  return (
    <BatikBackground>
      <SafeAreaView style={st.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => router.back()} style={st.backBtn}><ArrowLeft size={20} color="#2F5D50" /></TouchableOpacity>
          <Text style={st.headerTitle}>Edit Story</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
          {error ? <View style={st.errorBox}><Text style={st.errorText}>{error}</Text></View> : null}

          <Text style={st.label}>Blog Title *</Text>
          <TextInput style={st.input} placeholder="Title..." placeholderTextColor="#C0C0C0" value={title} onChangeText={setTitle} />

          <Text style={st.label}>Workshop Tag</Text>
          <TouchableOpacity style={st.input} onPress={() => setDropdownOpen(!dropdownOpen)}>
            <Text style={{ color: workshop ? '#1E1E1E' : '#C0C0C0', fontSize: 15 }}>{workshop || 'Select a workshop (optional)'}</Text>
            <ChevronDown size={16} color="#9CA3AF" style={{ position: 'absolute', right: 14, top: 16 }} />
          </TouchableOpacity>
          {dropdownOpen && (
            <View style={st.dropdown}>
              <TextInput style={st.ddSearch} placeholder="Search..." placeholderTextColor="#C0C0C0" value={workshopSearch} onChangeText={setWorkshopSearch} />
              <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {filtered.length > 0 ? filtered.map(w => (
                  <TouchableOpacity key={w.id} style={st.ddItem} onPress={() => { setWorkshop(w.name); setDropdownOpen(false); setWorkshopSearch(''); }}>
                    <Text style={[st.ddItemText, workshop === w.name && { color: '#2F5D50', fontWeight: '700' }]}>{w.name}</Text>
                  </TouchableOpacity>
                )) : <Text style={st.ddEmpty}>No workshops found</Text>}
              </ScrollView>
            </View>
          )}

          <Text style={st.label}>Your Story *</Text>
          <TextInput style={[st.input, { minHeight: 140, textAlignVertical: 'top', paddingTop: 14 }]} placeholder="Describe your experience..." placeholderTextColor="#C0C0C0" value={content} onChangeText={setContent} multiline />

          <Text style={st.label}>Hashtags <Text style={st.hint}>(tap to select)</Text></Text>
          <View style={st.tagGrid}>
            {TRENDING_TAGS.map(tag => {
              const active = selectedTags.includes(tag);
              return (
                <TouchableOpacity key={tag} style={[st.tagChip, active && st.tagActive]} onPress={() => toggleTag(tag)}>
                  <Text style={[st.tagText, active && st.tagTextActive]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={st.label}>Blog Media <Text style={st.hint}>({existingMedia.length + newMedia.length}/10 files)</Text></Text>
          
          {(existingMedia.length > 0 || newMedia.length > 0) && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {/* Existing Media */}
              {existingMedia.map((m) => (
                <View key={m.publicId} style={st.thumb}>
                  <Image source={{ uri: m.url }} style={st.thumbImg} />
                  <TouchableOpacity style={st.thumbRemove} onPress={() => removeExisting(m.publicId)}><X size={12} color="#fff" /></TouchableOpacity>
                  {m.mediaType === 'video' && <View style={st.videoBadge}><Text style={st.videoBadgeText}>VIDEO</Text></View>}
                </View>
              ))}
              {/* New Media */}
              {newMedia.map((m, i) => (
                <View key={`new-${i}`} style={st.thumb}>
                  <Image source={{ uri: m.uri }} style={[st.thumbImg, { borderColor: '#C65D3B', borderWidth: 2 }]} />
                  <TouchableOpacity style={st.thumbRemove} onPress={() => removeNew(i)}><X size={12} color="#fff" /></TouchableOpacity>
                  {m.type.startsWith('video') && <View style={st.videoBadge}><Text style={st.videoBadgeText}>NEW VIDEO</Text></View>}
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={st.picker} onPress={pickMedia}>
            <ImagePlus size={24} color="#2F5D50" />
            <Text style={st.pickerText}>Add more photos or videos</Text>
          </TouchableOpacity>

          <View style={st.footer}>
            <TouchableOpacity style={st.draftBtn} onPress={() => handleSave('draft')} disabled={submitting}>
              <FileText size={18} color="#2F5D50" />
              <Text style={st.draftBtnText}>Save as Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.publishBtn} onPress={() => handleSave('published')} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <><Save size={18} color="#fff" /><Text style={st.publishBtnText}>Update Blog</Text></>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </BatikBackground>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#2F5D50' },
  scroll: { padding: 20, paddingBottom: 40 },
  errorBox: { backgroundColor: '#FEE2E2', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '700', color: '#1E1E1E', marginTop: 20, marginBottom: 8 },
  hint: { fontWeight: '400', color: '#9CA3AF', fontSize: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 16, fontSize: 15, color: '#1E1E1E' },
  dropdown: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, marginTop: 4, padding: 4, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  ddSearch: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', fontSize: 14 },
  ddItem: { padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#F9FAFB' },
  ddItemText: { fontSize: 13, color: '#4B5563' },
  ddEmpty: { padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 13 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  tagActive: { backgroundColor: '#2F5D50', borderColor: '#2F5D50' },
  tagText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  tagTextActive: { color: '#fff' },
  thumb: { width: 80, height: 80, borderRadius: 12, marginRight: 10, position: 'relative' },
  thumbImg: { width: 80, height: 80, borderRadius: 12 },
  thumbRemove: { position: 'absolute', top: -5, right: -5, width: 22, height: 22, borderRadius: 11, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  videoBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  videoBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  picker: { height: 100, borderRadius: 14, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pickerText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  footer: { flexDirection: 'row', gap: 12, marginTop: 32 },
  draftBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#EBF4F1', paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: '#C8E6DF' },
  draftBtnText: { color: '#2F5D50', fontWeight: '700', fontSize: 14 },
  publishBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#C65D3B', paddingVertical: 16, borderRadius: 16 },
  publishBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
