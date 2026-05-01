import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, Camera, X, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { reviewApi, Review } from '../../../src/services/reviewApi';
import { BatikBackground } from '../../../src/components/BatikBackground';

const STAR_COLOR = '#C9A227';
const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={ss.starRow}>
      {[1, 2, 3, 4, 5].map(s => (
        <TouchableOpacity key={s} onPress={() => onChange(s)} style={ss.starTouch} activeOpacity={0.7}>
          <Star
            size={38}
            color={STAR_COLOR}
            fill={s <= value ? STAR_COLOR : 'transparent'}
          />
        </TouchableOpacity>
      ))}
      {value > 0 && (
        <Text style={ss.ratingLabel}>{RATING_LABELS[value]}</Text>
      )}
    </View>
  );
}

export default function EditReviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [existingPhotos, setExistingPhotos] = useState<Array<{ url: string; alt: string }>>([]);
  const [newPhotoUris, setNewPhotoUris] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadReview();
  }, [id]);

  const loadReview = async () => {
    try {
      const data = await reviewApi.getMyReviews();
      const found: Review | undefined = (data.reviews || []).find(
        (r: Review) => r._id === id || r.id === id,
      );
      if (!found) {
        Alert.alert('Not found', 'Review not found.');
        router.back();
        return;
      }
      if (!found.canEdit) {
        Alert.alert('Cannot edit', 'Reviews can only be edited within 24 hours of posting.');
        router.back();
        return;
      }
      setReview(found);
      setRating(found.rating);
      setText(found.text);
      setExistingPhotos(found.photos || []);
    } catch {
      Alert.alert('Error', 'Failed to load review.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow access to photos.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!result.canceled && result.assets?.[0]) {
      setNewPhotoUris(prev => [...prev, result.assets[0].uri]);
    }
  };

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotoUris(prev => prev.filter((_, i) => i !== index));
  };

  const totalPhotos = existingPhotos.length + newPhotoUris.length;

  const handleSave = async () => {
    if (rating === 0) { Alert.alert('Rating required', 'Please select a star rating.'); return; }
    if (!text.trim()) { Alert.alert('Review required', 'Please write your review.'); return; }

    try {
      setSubmitting(true);
      const mergedPhotos = [
        ...existingPhotos,
        ...newPhotoUris.map(uri => ({ url: uri, alt: 'Review photo' })),
      ];
      await reviewApi.updateReview(id as string, {
        rating,
        text: text.trim(),
        photos: mergedPhotos,
      });
      setDone(true);
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.error || 'Could not save changes.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={ss.safe} edges={['top']}>
        <BatikBackground />
        <View style={ss.center}>
          <ActivityIndicator size="large" color="#2F5D50" />
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    return (
      <SafeAreaView style={ss.safe} edges={['top']}>
        <BatikBackground />
        <View style={ss.successContainer}>
          <View style={ss.successIcon}>
            <Check size={36} color="#fff" />
          </View>
          <Text style={ss.successTitle}>Review Updated!</Text>
          <Text style={ss.successSub}>Your changes have been saved.</Text>
          <TouchableOpacity style={ss.doneBtn} onPress={() => router.replace('/tourist/reviews')}>
            <Text style={ss.doneBtnText}>View My Reviews</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={ss.safe} edges={['top']}>
      <BatikBackground />

      {/* Header */}
      <View style={ss.header}>
        <TouchableOpacity style={ss.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#2F5D50" />
        </TouchableOpacity>
        <Text style={ss.headerTitle}>Edit Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={ss.content}
      >
        {/* Artisan / workshop info (read-only) */}
        <View style={ss.infoCard}>
          <Text style={ss.infoArtisan}>{review?.artisanName}</Text>
          {review?.workshopName ? <Text style={ss.infoWorkshop}>{review.workshopName}</Text> : null}
          <Text style={ss.infoNote}>Artisan and workshop name cannot be changed after posting.</Text>
        </View>

        {/* Star rating */}
        <View style={ss.card}>
          <Text style={ss.sectionLabel}>Your Rating *</Text>
          <StarSelector value={rating} onChange={setRating} />
        </View>

        {/* Review text */}
        <View style={ss.card}>
          <Text style={ss.sectionLabel}>Your Review *</Text>
          <TextInput
            style={ss.textArea}
            value={text}
            onChangeText={setText}
            placeholder="Describe your experience..."
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
          />
          <Text style={ss.charCount}>{text.length} / 1000</Text>
        </View>

        {/* Photos */}
        <View style={ss.card}>
          <Text style={ss.sectionLabel}>Photos</Text>
          <View style={ss.photoGrid}>
            {existingPhotos.map((p, i) => (
              <View key={`ex-${i}`} style={ss.photoThumb}>
                <Image source={{ uri: p.url }} style={ss.thumbImage} />
                <TouchableOpacity style={ss.removePhoto} onPress={() => removeExistingPhoto(i)}>
                  <X size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {newPhotoUris.map((uri, i) => (
              <View key={`new-${i}`} style={ss.photoThumb}>
                <Image source={{ uri }} style={ss.thumbImage} />
                <TouchableOpacity style={ss.removePhoto} onPress={() => removeNewPhoto(i)}>
                  <X size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {totalPhotos < 4 && (
              <TouchableOpacity style={ss.addPhoto} onPress={pickPhoto} activeOpacity={0.7}>
                <Camera size={22} color="#9CA3AF" />
                <Text style={ss.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[ss.submitBtn, (submitting || rating === 0 || !text.trim()) && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={submitting || rating === 0 || !text.trim()}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={ss.submitText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F3EE' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E1E1E' },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 14 },
  infoCard: {
    backgroundColor: '#E8F5E9', borderRadius: 14, padding: 14,
    borderLeftWidth: 4, borderLeftColor: '#2F5D50',
  },
  infoArtisan: { fontSize: 16, fontWeight: '700', color: '#2F5D50' },
  infoWorkshop: { fontSize: 13, color: '#4B5563', marginTop: 2 },
  infoNote: { fontSize: 11, color: '#9CA3AF', marginTop: 6, fontStyle: 'italic' },
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#1E1E1E', marginBottom: 10 },
  textArea: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#1E1E1E',
    minHeight: 130,
  },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 6 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  starTouch: { padding: 2 },
  ratingLabel: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginLeft: 6 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoThumb: { width: 76, height: 76, borderRadius: 12 },
  thumbImage: { width: 76, height: 76, borderRadius: 12 },
  removePhoto: {
    position: 'absolute', top: -6, right: -6, backgroundColor: '#DC2626',
    width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  addPhoto: {
    width: 76, height: 76, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addPhotoText: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#2F5D50', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#2F5D50',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#1E1E1E', marginBottom: 10 },
  successSub: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  doneBtn: { marginTop: 28, backgroundColor: '#2F5D50', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
