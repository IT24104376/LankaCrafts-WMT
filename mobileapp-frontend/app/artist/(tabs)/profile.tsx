import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image, Platform
} from 'react-native';
import { useAuth } from '../../../src/context/AuthContext';
import { getArtistProfile, updateArtistProfile, uploadProfilePic } from '../../../src/services/api';
import { BatikBackground } from '../../../src/components/BatikBackground';
import { Camera, Image as ImageIcon, X, LogOut } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  User, Contact, Mail, Lock, Check, Globe,
  CreditCard, Calendar, Home, MapPin, ArrowRight, ArrowLeft,
} from 'lucide-react-native';

export default function ArtistProfileScreen() {
  const { artist, refreshArtist, logoutArtist } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    callingName: '',
    email: '',
    phone: '',
    craftType: '',
    bio: '',
    address: { number: '', street: '', village: '', city: '', district: '', province: '', postalCode: '' },
    profilePicUrl: '',
  });

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                await logoutArtist();
                router.replace('/');
              } catch (err) {
                Alert.alert('Error', 'Failed to logout. Please try again.');
              }
            }
        }
      ]
    );
  };

  useEffect(() => {
    if (artist?.id) loadProfile();
  }, [artist?.id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await getArtistProfile();
      const data = res.data?.data || res.data?.artist;
      if (data) {
        setProfile(data);
        setForm({
          fullName: data.fullName || '',
          callingName: data.callingName || '',
          email: data.email || '',
          phone: data.phone || '',
          craftType: data.craftType || '',
          bio: data.bio || '',
          address: {
            number: data.address?.number || data.address?.street || '',
            street: data.address?.street || '',
            village: data.address?.village || '',
            city: data.address?.city || '',
            district: data.address?.district || '',
            province: data.address?.province || '',
            postalCode: data.address?.postalCode || '',
          },
          profilePicUrl: data.profilePicUrl || '',
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (!result.canceled && result.assets?.[0]) {
      setUploading(true);
      try {
        const uri = result.assets[0].uri;
        const fileType = uri.split('.').pop() || 'jpg';
        const filename = uri.split('/').pop() || `image_${Date.now()}.${fileType}`;
        const match = /.+\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        const formData = new FormData();
        formData.append('file', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: filename,
          type,
        } as any);
        const res = await uploadProfilePic(formData);
        setForm({ ...form, profilePicUrl: res.data?.profilePicUrl || '' });
      } catch (err) {
        Alert.alert('Error', 'Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateArtistProfile(form);
      setEditing(false);
      refreshArtist();
      Alert.alert('Success', 'Profile updated');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={s.safe}>
        <BatikBackground />
        <View style={s.loading}>
          <ActivityIndicator size="large" color="#2F5D50" />
        </View>
      </View>
    );
  }

  return (
    <View style={s.safe}>
      <BatikBackground />
      {/* Header with Logout */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Profile</Text>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#DC2626" />
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Cover & Avatar */}
        <View style={s.coverSection}>
          <View style={s.cover} />
          <View style={s.avatarWrapper}>
            {form.profilePicUrl ? (
              <Image source={{ uri: form.profilePicUrl }} style={s.avatar} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarText}>{form.fullName?.[0] || 'A'}</Text>
              </View>
            )}
            {editing && (
              <TouchableOpacity style={s.editAvatarBtn} onPress={handleImagePick}>
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Camera size={18} color="#fff" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Info Card */}
        <View style={s.card}>
          {!editing ? (
            <>
              <View style={s.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{form.fullName || 'Unknown'}</Text>
                  <Text style={s.handle}>@{form.callingName || form.fullName?.toLowerCase().replace(/\s+/g, '') || 'unknown'}</Text>
                </View>
                <TouchableOpacity style={s.editBtn} onPress={() => setEditing(true)}>
                  <Text style={s.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={s.row}>
                <View style={s.badge}>
                  <Text style={s.badgeText}>{form.craftType || 'N/A'}</Text>
                </View>
              </View>

              {form.bio ? <Text style={s.bio}>{form.bio}</Text> : null}

              <View style={s.divider} />

              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Email</Text>
                <Text style={s.detailValue}>{form.email || 'N/A'}</Text>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Phone</Text>
                <Text style={s.detailValue}>{form.phone || 'Not provided'}</Text>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Location</Text>
                <Text style={s.detailValue}>
                  {[form.address.city, form.address.district, form.address.province].filter(Boolean).join(', ') || 'Not provided'}
                </Text>
              </View>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Rating</Text>
                <Text style={s.detailValue}>★ {profile?.rating || '0'} ({profile?.reviewCount || 0} reviews)</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={s.sectionTitle}>Edit Profile</Text>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Full Name *</Text>
                <TextInput style={s.editInput} value={form.fullName} onChangeText={v => setForm({ ...form, fullName: v })} />
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Calling Name</Text>
                <TextInput style={s.editInput} value={form.callingName} onChangeText={v => setForm({ ...form, callingName: v })} />
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Email</Text>
                <TextInput style={s.editInput} value={form.email} keyboardType="email-address" editable={false} />
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Phone</Text>
                <TextInput style={s.editInput} value={form.phone} onChangeText={v => setForm({ ...form, phone: v })} placeholder="+94 xxx xxxxxx" />
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Craft Type</Text>
                <TextInput style={s.editInput} value={form.craftType} editable={false} />
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Bio</Text>
                <TextInput style={[s.editInput, { height: 80, textAlignVertical: 'top' }]} value={form.bio} onChangeText={v => setForm({ ...form, bio: v })} multiline />
              </View>
              <Text style={s.sectionTitle}>Address</Text>
              <View style={s.field}>
                <Text style={s.fieldLabel}>City</Text>
                <TextInput style={s.editInput} value={form.address.city} onChangeText={v => setForm({ ...form, address: { ...form.address, city: v } })} />
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>District</Text>
                <TextInput style={s.editInput} value={form.address.district} onChangeText={v => setForm({ ...form, address: { ...form.address, district: v } })} />
              </View>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Province</Text>
                <TextInput style={s.editInput} value={form.address.province} onChangeText={v => setForm({ ...form, address: { ...form.address, province: v } })} />
              </View>
              <View style={s.btnGroup}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{profile?.workshopsConducted || 0}</Text>
            <Text style={s.statLabel}>Workshops</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{profile?.rating || 0}</Text>
            <Text style={s.statLabel}>Avg Rating</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{profile?.reviewCount || 0}</Text>
            <Text style={s.statLabel}>Reviews</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ddede7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1E1E1E' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FEF2F2' },
  logoutText: { fontSize: 13, fontWeight: '600', color: '#DC2626' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  coverSection: { marginBottom: 20 },
  cover: { height: 100, backgroundColor: '#2F5D50', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  avatarWrapper: { marginTop: -40, marginLeft: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff' },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2F5D50', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff' },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: -8, backgroundColor: '#2F5D50', borderRadius: 20, padding: 6, borderWidth: 3, borderColor: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontSize: 22, fontWeight: '800', color: '#1E1E1E', marginBottom: 2 },
  handle: { fontSize: 14, color: '#9CA3AF' },
  editBtn: { backgroundColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  editBtnText: { fontSize: 13, fontWeight: '600', color: '#1E1E1E' },
  row: { flexDirection: 'row', marginTop: 12, marginBottom: 12 },
  badge: { backgroundColor: '#E8F5E9', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#2F5D50' },
  bio: { fontSize: 15, color: '#4B5563', lineHeight: 22, marginTop: 8 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  detailLabel: { fontSize: 14, color: '#9CA3AF' },
  detailValue: { fontSize: 14, color: '#1E1E1E', fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E1E1E', marginBottom: 12, marginTop: 8 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#1E1E1E', marginBottom: 6 },
  editInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 15, color: '#1E1E1E' },
  btnGroup: { flexDirection: 'row', gap: 12, marginTop: 16 },
  saveBtn: { flex: 1, backgroundColor: '#2F5D50', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { flex: 1, backgroundColor: '#E5E7EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#1E1E1E', fontWeight: '700', fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '800', color: '#2F5D50' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
});