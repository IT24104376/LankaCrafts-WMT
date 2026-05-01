import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { updateProfile, uploadProfilePic } from '../../src/services/api';
import { INTERESTS, REGIONS, COUNTRIES, LANGUAGES } from '../../src/constants/touristConstants';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Save, Check } from 'lucide-react-native';

export default function TouristProfileEditScreen() {
  const { tourist, refreshUser } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: tourist?.fullName || '',
    callingName: tourist?.callingName || '',
    country: tourist?.country || '',
    interests: tourist?.interests || [],
    preferredRegions: tourist?.preferredRegions || [],
    preferredLanguages: tourist?.preferredLanguages || [],
    addressLine1: tourist?.address?.line1 || '',
    addressLine2: tourist?.address?.line2 || '',
    city: tourist?.address?.city || '',
    postalCode: tourist?.address?.postalCode || '',
  });
  const [profilePic, setProfilePic] = useState<string | null>(tourist?.profilePicUrl || null);

  const toggle = (key: 'interests' | 'preferredRegions' | 'preferredLanguages', id: string) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((i: string) => i !== id) : [...prev[key], id],
    }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setProfilePic(uri);
      try {
        const formData = new FormData();
        formData.append('profilePic', {
          uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);
        await uploadProfilePic(formData);
      } catch (err) {
        Alert.alert('Upload failed', 'Could not upload profile picture.');
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        fullName: form.fullName,
        callingName: form.callingName,
        country: form.country,
        interests: form.interests,
        preferredRegions: form.preferredRegions,
        preferredLanguages: form.preferredLanguages,
        address: {
          line1: form.addressLine1,
          line2: form.addressLine2,
          city: form.city,
          postalCode: form.postalCode,
        },
      });
      await refreshUser();
      Alert.alert('Success', 'Profile updated!');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><ArrowLeft size={20} color="#2F5D50" /></TouchableOpacity>
          <Text style={s.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[s.saveBtn, saving && { opacity: 0.5 }]}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <><Save size={16} color="#fff" /><Text style={s.saveBtnText}>Save</Text></>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <TouchableOpacity style={s.avatarWrap} onPress={pickImage} activeOpacity={0.8}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarFallback}><Text style={s.avatarText}>{tourist?.initials || '?'}</Text></View>
            )}
            <View style={s.cameraBadge}><Camera size={14} color="#fff" /></View>
          </TouchableOpacity>

          {/* Fields */}
          <Field label="Full Name" value={form.fullName} onChange={v => setForm({ ...form, fullName: v })} />
          <Field label="Calling Name" value={form.callingName} onChange={v => setForm({ ...form, callingName: v })} />

          {/* Country */}
          <Text style={s.label}>Country</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {COUNTRIES.map(c => (
              <TouchableOpacity key={c} style={[s.chip, form.country === c && s.chipSel]} onPress={() => setForm({ ...form, country: c })}>
                <Text style={[s.chipText, form.country === c && s.chipTextSel]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Address */}
          <Text style={s.sectionTitle}>Address</Text>
          <Field label="Line 1" value={form.addressLine1} onChange={v => setForm({ ...form, addressLine1: v })} />
          <Field label="Line 2" value={form.addressLine2} onChange={v => setForm({ ...form, addressLine2: v })} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Field label="City" value={form.city} onChange={v => setForm({ ...form, city: v })} /></View>
            <View style={{ flex: 1 }}><Field label="Postal Code" value={form.postalCode} onChange={v => setForm({ ...form, postalCode: v })} /></View>
          </View>

          {/* Languages */}
          <Text style={s.sectionTitle}>Preferred Languages</Text>
          <View style={s.chipRow}>
            {LANGUAGES.map(l => (
              <TouchableOpacity key={l} style={[s.chip, form.preferredLanguages.includes(l) && s.chipSel]} onPress={() => toggle('preferredLanguages', l)}>
                <Text style={[s.chipText, form.preferredLanguages.includes(l) && s.chipTextSel]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Interests */}
          <Text style={s.sectionTitle}>Cultural Interests</Text>
          <View style={s.chipRow}>
            {INTERESTS.map(({ id, label, emoji }) => (
              <TouchableOpacity key={id} style={[s.chip, form.interests.includes(id) && s.chipSel]} onPress={() => toggle('interests', id)}>
                <Text style={[s.chipText, form.interests.includes(id) && s.chipTextSel]}>{emoji} {label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Regions */}
          <Text style={s.sectionTitle}>Preferred Regions</Text>
          <View style={s.chipRow}>
            {REGIONS.map(({ id, label, emoji }) => (
              <TouchableOpacity key={id} style={[s.chip, form.preferredRegions.includes(id) && { ...s.chipSel, backgroundColor: '#2F5D50', borderColor: '#2F5D50' }]} onPress={() => toggle('preferredRegions', id)}>
                <Text style={[s.chipText, form.preferredRegions.includes(id) && s.chipTextSel]}>{emoji} {label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} value={value} onChangeText={onChange} placeholderTextColor="#C0C0C0" />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F3EE' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#2F5D50' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#C65D3B', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  scroll: { padding: 20, paddingBottom: 48 },
  avatarWrap: { alignSelf: 'center', marginBottom: 24, position: 'relative' },
  avatarImg: { width: 88, height: 88, borderRadius: 28 },
  avatarFallback: { width: 88, height: 88, borderRadius: 28, backgroundColor: '#C65D3B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  cameraBadge: { position: 'absolute', bottom: -2, right: -2, width: 32, height: 32, borderRadius: 16, backgroundColor: '#2F5D50', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#F6F3EE' },
  label: { fontSize: 13, fontWeight: '600', color: '#1E1E1E', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16, fontSize: 14, color: '#1E1E1E' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2F5D50', marginBottom: 12, marginTop: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', marginBottom: 4 },
  chipSel: { backgroundColor: '#C65D3B', borderColor: '#C65D3B' },
  chipText: { fontSize: 13, color: '#1E1E1E', fontWeight: '500' },
  chipTextSel: { color: '#fff' },
});
