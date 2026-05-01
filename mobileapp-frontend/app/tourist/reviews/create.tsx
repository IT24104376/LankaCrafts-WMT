import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, Camera, X, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { reviewApi } from '../../../src/services/reviewApi';
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

export default function CreateReviewScreen() {
  const router = useRouter();
  // Pre-fill artisan/workshop if coming from artist or craft detail page
  const params = useLocalSearchParams<{
    artisanName?: string;
    workshopName?: string;
  }>();

  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [artisanName, setArtisanName] = useState(params.artisanName || '');
  const [workshopName, setWorkshopName] = useState(params.workshopName || '');
  const [photos, setPhotos] = useState<Array<{ uri: string; url?: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotos(prev => [...prev, { uri: result.assets[0].uri }]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) { Alert.alert('Rating required', 'Please select a star rating.'); return; }
    if (!text.trim()) { Alert.alert('Review required', 'Please write your review.'); return; }
    if (!artisanName.trim()) { Alert.alert('Artisan name required', 'Please enter the artisan\'s name.'); return; }

    try {
      setSubmitting(true);
      await reviewApi.createReview({
        rating,
        text: text.trim(),
        artisanName: artisanName.trim(),
        workshopName: workshopName.trim() || undefined,
        context: 'artisan',
        photos: photos.map(p => ({ url: p.uri, alt: 'Review photo' })),
      });
      setDone(true);
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.error || 'Could not submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <SafeAreaView style={ss.safe} edges={['top']}>
        <BatikBackground />
        <View style={ss.successContainer}>
          <View style={ss.successIcon}>
            <Check size={36} color="#fff" />
          </View>
          <Text style={ss.successTitle}>Review Submitted!</Text>
          <Text style={ss.successSub}>Thank you for sharing your experience with the community.</Text>
          <TouchableOpacity style={ss.doneBtn} onPress={() => router.replace('/tourist/reviews')}>
            <Text style={ss.doneBtnText}>View My Reviews</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={ss.backLink}>Go Back</Text>
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
        <Text style={ss.headerTitle}>Write a Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={ss.content}
      >
        {/* Artisan name */}
        <View style={ss.card}>
          <Text style={ss.sectionLabel}>Artisan Name *</Text>
          <TextInput
            style={ss.input}
            value={artisanName}
            onChangeText={setArtisanName}
            placeholder="e.g. Kumari Batik Studio"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={[ss.sectionLabel, { marginTop: 14 }]}>Workshop (optional)</Text>
          <TextInput
            style={ss.input}
            value={workshopName}
            onChangeText={setWorkshopName}
            placeholder="e.g. Traditional Batik Making"
            placeholderTextColor="#9CA3AF"
          />
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
            placeholder="Describe your experience — what did you enjoy, learn, or would like to share with other travellers?"
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
          />
          <Text style={ss.charCount}>{text.length} / 1000</Text>
        </View>

        {/* Photos */}
        <View style={ss.card}>
          <Text style={ss.sectionLabel}>Add Photos (optional)</Text>
          <View style={ss.photoGrid}>
            {photos.map((p, i) => (
              <View key={i} style={ss.photoThumb}>
                <Image source={{ uri: p.uri }} style={ss.thumbImage} />
                <TouchableOpacity style={ss.removePhoto} onPress={() => removePhoto(i)}>
                  <X size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 4 && (
              <TouchableOpacity style={ss.addPhoto} onPress={pickPhoto} activeOpacity={0.7}>
                <Camera size={22} color="#9CA3AF" />
                <Text style={ss.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[ss.submitBtn, (submitting || rating === 0 || !text.trim()) && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={submitting || rating === 0 || !text.trim()}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={ss.submitText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F3EE' },
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
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#1E1E1E', marginBottom: 10 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#1E1E1E',
  },
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
  photoThumb: { width: 76, height: 76, borderRadius: 12, overflow: 'visible' },
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
  successSub: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  doneBtn: { marginTop: 28, backgroundColor: '#2F5D50', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  backLink: { fontSize: 14, color: '#9CA3AF', textDecorationLine: 'underline' },
});
