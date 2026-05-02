import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Image, Alert, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../src/context/AuthContext';
import { createBlog, getArtists } from '../../../src/services/api';
import { TRENDING_TAGS } from '../../../src/constants/touristConstants';
import { ArrowLeft, X, ImagePlus, ChevronDown } from 'lucide-react-native';
import { BatikBackground } from '../../../src/components/BatikBackground';

const { width } = Dimensions.get('window');

interface Workshop { id: string; name: string; }
interface PickedMedia { uri: string; type: string; name: string; }

export default function BlogCreateScreen() {
  const router = useRouter();
  const { tourist } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [workshop, setWorkshop] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [media, setMedia] = useState<PickedMedia[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [workshopsList, setWorkshopsList] = useState<Workshop[]>([]);
  const [workshopSearch, setWorkshopSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    getArtists(1, 100).then(res => {
      const all = res.data?.artists || [];
      setWorkshopsList(all.map((a: any) => ({
        id: a._id || a.id,
        name: `${(a.craftType || 'Art').charAt(0).toUpperCase() + (a.craftType || 'Art').slice(1)} Workshop — ${a.address?.city || 'Sri Lanka'} (by ${a.fullName})`,
      })));
    }).catch(() => {});
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const pickMedia = async () => {
    if (media.length >= 10) { Alert.alert('Limit', 'Max 10 files.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: 10 - media.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      const picked = result.assets.map(a => ({
        uri: a.uri,
        type: a.mimeType || (a.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        name: a.fileName || `media_${Date.now()}.jpg`,
      }));
      setMedia(prev => [...prev, ...picked].slice(0, 10));
    }
  };

  const removeMedia = (idx: number) => setMedia(prev => prev.filter((_, i) => i !== idx));

  const handlePublish = async (status: 'published' | 'draft') => {
    if (!title.trim() || !content.trim()) { setError('Title and story are required.'); return; }
    setSubmitting(true); setError('');
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('content', content.trim());
      fd.append('workshopTag', workshop);
      fd.append('status', status);
      fd.append('hashtags', JSON.stringify(selectedTags));
      media.forEach(m => fd.append('media', { uri: m.uri, type: m.type, name: m.name } as any));
      await createBlog(fd);
      Alert.alert(status === 'published' ? 'Published!' : 'Draft Saved!', '', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to publish.');
    } finally { setSubmitting(false); }
  };

  const filtered = workshopsList.filter(w => w.name.toLowerCase().includes(workshopSearch.toLowerCase()));

  return (
    <BatikBackground>
      <SafeAreaView style={st.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => router.back()} style={st.backBtn}><ArrowLeft size={20} color="#2F5D50" /></TouchableOpacity>
          <Text style={st.headerTitle}>Share Your Experience</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
          {error ? <View style={st.errorBox}><Text style={st.errorText}>{error}</Text></View> : null}

          <Text style={st.label}>Blog Title *</Text>
          <TextInput style={st.input} placeholder="Give your story a title..." placeholderTextColor="#C0C0C0" value={title} onChangeText={setTitle} />

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
          <TextInput style={[st.input, { height: 140, textAlignVertical: 'top', paddingTop: 14 }]} placeholder="Describe your experience..." placeholderTextColor="#C0C0C0" value={content} onChangeText={setContent} multiline />

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
          {selectedTags.length > 0 && <Text style={st.selectedHint}>Selected: {selectedTags.join(' ')}</Text>}

          <Text style={st.label}>Add Media <Text style={st.hint}>(up to 10 files)</Text></Text>
          {media.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {media.map((m, i) => (
                <View key={i} style={st.thumb}>
                  <Image source={{ uri: m.uri }} style={st.thumbImg} />
                  <TouchableOpacity style={st.thumbRemove} onPress={() => removeMedia(i)}><X size={12} color="#fff" /></TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity style={st.picker} onPress={pickMedia}>
            <ImagePlus size={24} color={media.length > 0 ? '#2F5D50' : '#C0C0C0'} />
            <Text style={[st.pickerText, media.length > 0 && { color: '#2F5D50' }]}>
              {media.length > 0 ? `${media.length} file${media.length !== 1 ? 's' : ''} — tap to add more` : 'Tap to select photos or videos'}
            </Text>
          </TouchableOpacity>

          <View style={st.btnRow}>
            <TouchableOpacity style={st.draftBtn} onPress={() => handlePublish('draft')} disabled={submitting}>
              <Text style={st.draftText}>Save Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.pubBtn, { opacity: submitting ? 0.6 : 1 }]} onPress={() => handlePublish('published')} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.pubText}>Publish Story</Text>}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EBF4F1', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#2F5D50' },
  scroll: { padding: 20, paddingBottom: 40 },
  errorBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 14, padding: 14, marginBottom: 16 },
  errorText: { fontSize: 13, color: '#DC2626' },
  label: { fontSize: 13, fontWeight: '700', color: '#1E1E1E', marginBottom: 6, marginTop: 16 },
  hint: { fontWeight: '400', color: '#9CA3AF' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E1E1E' },
  dropdown: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, marginTop: 4, overflow: 'hidden' },
  ddSearch: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', fontSize: 14, color: '#1E1E1E' },
  ddItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  ddItemText: { fontSize: 14, color: '#374151' },
  ddEmpty: { paddingHorizontal: 14, paddingVertical: 16, fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  tagActive: { backgroundColor: '#C65D3B', borderColor: '#C65D3B' },
  tagText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  tagTextActive: { color: '#fff', fontWeight: '700' },
  selectedHint: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },
  thumb: { width: 72, height: 72, borderRadius: 12, marginRight: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  thumbImg: { width: '100%', height: '100%' },
  thumbRemove: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  picker: { borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 14, paddingVertical: 24, alignItems: 'center', justifyContent: 'center', gap: 8 },
  pickerText: { fontSize: 13, color: '#9CA3AF' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  draftBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#2F5D50', alignItems: 'center' },
  draftText: { fontSize: 14, fontWeight: '700', color: '#2F5D50' },
  pubBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#C65D3B', alignItems: 'center' },
  pubText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});