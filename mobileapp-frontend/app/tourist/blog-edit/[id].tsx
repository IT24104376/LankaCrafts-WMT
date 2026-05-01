import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBlog, updateBlog } from '../../../src/services/api';
import { TRENDING_TAGS } from '../../../src/constants/touristConstants';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Save, Image as ImageIcon, X } from 'lucide-react-native';

export default function TouristBlogEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await getBlog(id);
        const blog = res?.data?.blog || res?.data;
        if (blog) {
          setTitle(blog.title || '');
          setContent(blog.content || blog.body || '');
          setTags(blog.tags || []);
          setImageUri(blog.imageUrl || null);
        }
      } catch { }
      setLoading(false);
    })();
  }, [id]);

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('tags', JSON.stringify(tags));
      if (imageUri && !imageUri.startsWith('http')) {
        formData.append('image', { uri: imageUri, type: 'image/jpeg', name: 'blog.jpg' } as any);
      }
      await updateBlog(id!, formData);
      Alert.alert('Success', 'Blog updated!');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update blog.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color="#C65D3B" /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><ArrowLeft size={20} color="#2F5D50" /></TouchableOpacity>
          <Text style={s.headerTitle}>Edit Blog</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[s.saveBtn, saving && { opacity: 0.5 }]}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Save size={16} color="#fff" /><Text style={s.saveBtnText}>Save</Text></>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <Text style={s.label}>Title</Text>
          <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Blog title" placeholderTextColor="#C0C0C0" />

          {/* Content */}
          <Text style={s.label}>Content</Text>
          <TextInput
            style={[s.input, { minHeight: 160, textAlignVertical: 'top' }]}
            value={content}
            onChangeText={setContent}
            placeholder="Write your story..."
            placeholderTextColor="#C0C0C0"
            multiline
          />

          {/* Image */}
          <Text style={s.label}>Cover Image</Text>
          {imageUri ? (
            <View style={s.imageWrap}>
              <Image source={{ uri: imageUri }} style={s.image} resizeMode="cover" />
              <TouchableOpacity style={s.removeImg} onPress={() => setImageUri(null)}><X size={14} color="#fff" /></TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.imagePicker} onPress={pickImage}>
              <ImageIcon size={24} color="#9CA3AF" />
              <Text style={s.imagePickerText}>Tap to add image</Text>
            </TouchableOpacity>
          )}

          {/* Tags */}
          <Text style={s.label}>Tags</Text>
          <View style={s.chipRow}>
            {TRENDING_TAGS.map(tag => (
              <TouchableOpacity key={tag} style={[s.chip, tags.includes(tag) && s.chipSel]} onPress={() => toggleTag(tag)}>
                <Text style={[s.chipText, tags.includes(tag) && s.chipTextSel]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F3EE' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#2F5D50' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#C65D3B', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  scroll: { padding: 20, paddingBottom: 48 },
  label: { fontSize: 13, fontWeight: '600', color: '#1E1E1E', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16, fontSize: 14, color: '#1E1E1E' },
  imageWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 8, position: 'relative' },
  image: { width: '100%', height: 180, borderRadius: 14 },
  removeImg: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  imagePicker: { height: 120, borderRadius: 14, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  imagePickerText: { fontSize: 13, color: '#9CA3AF', marginTop: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  chipSel: { backgroundColor: '#C65D3B', borderColor: '#C65D3B' },
  chipText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  chipTextSel: { color: '#fff' },
});
