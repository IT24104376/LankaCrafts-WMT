import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, FlatList, Image,
  Platform,
} from 'react-native';
import { useAuth } from '../../../src/context/AuthContext';
import { createCraft, updateCraft, deleteCraft } from '../../../src/services/api';
import api from '../../../src/api/axiosInstance';
import { BatikBackground } from '../../../src/components/BatikBackground';
import { Camera, Plus, Edit2, Trash2, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ArtistCraftsScreen() {
  const { artist } = useAuth();
  const [crafts, setCrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCraft, setSelectedCraft] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editingCraft, setEditingCraft] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'LKR',
    category: '',
    stock: 1,
    images: [] as string[],
    mediaFiles: [] as { uri: string; type: string; name: string }[],
    isAvailable: true,
    dimensions: { height: '', width: '', depth: '', unit: 'cm' },
    weight: { value: '', unit: 'kg' },
    materials: [] as string[],
    tags: [] as string[],
  });
  const [tempMaterial, setTempMaterial] = useState('');
  const [tempTag, setTempTag] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (artist?.id) loadCrafts();
  }, [artist?.id]);

  const loadCrafts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/crafts/public/crafts?${new URLSearchParams({ artistId: artist!.id, page: '1', limit: '100' })}`);
      setCrafts(res.data?.crafts || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load crafts');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery access is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(a => a.uri);
      const newMediaFiles = result.assets.map(a => {
        const uri = a.uri;
        const fileType = uri.split('.').pop() || 'jpg';
        const filename = uri.split('/').pop() || `image_${Date.now()}.${fileType}`;
        const match = /.+\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        return {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: filename,
          type,
        };
      });
      setForm({ 
        ...form, 
        images: [...form.images, ...newImages],
        mediaFiles: [...form.mediaFiles, ...newMediaFiles]
      });
    }
  };

  const removeImage = (index: number) => {
    setForm({ 
      ...form, 
      images: form.images.filter((_, i) => i !== index),
      mediaFiles: form.mediaFiles.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.category) {
      Alert.alert('Error', 'Name, price, and category are required');
      return;
    }
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description || '');
      formData.append('price', form.price);
      formData.append('currency', form.currency);
      formData.append('category', form.category);
      formData.append('stock', form.stock.toString());
      formData.append('isAvailable', form.isAvailable.toString());
      if (form.dimensions) {
        formData.append('dimensions', JSON.stringify(form.dimensions));
      }
      if (form.weight) {
        formData.append('weight', JSON.stringify(form.weight));
      }
      if (form.materials.length > 0) {
        formData.append('materials', JSON.stringify(form.materials));
      }
      if (form.tags.length > 0) {
        formData.append('tags', JSON.stringify(form.tags));
      }
      // Append image files
      form.mediaFiles.forEach((file, index) => {
        formData.append('images', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);
      });

      const apiCall = editingCraft 
        ? updateCraft(editingCraft._id, formData)
        : createCraft(formData);
      
      await apiCall;
      Alert.alert('Success', editingCraft ? 'Craft updated' : 'Craft created');
      setShowModal(false);
      resetForm();
      loadCrafts();
    } catch (err: any) {
      console.error('Error creating craft:', err);
      Alert.alert('Error', err?.response?.data?.error || err?.message || 'Failed to save craft');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Confirm', 'Delete this craft?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            await deleteCraft(id);
            loadCrafts();
            Alert.alert('Success', 'Craft deleted');
          } catch (err) {
            Alert.alert('Error', 'Failed to delete craft');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const openEdit = (craft: any) => {
    setEditingCraft(craft);
    setForm({
      name: craft.name,
      description: craft.description || '',
      price: craft.price.toString(),
      currency: craft.currency || 'LKR',
      category: craft.category,
      stock: craft.stock || 1,
      images: craft.images || [],
      mediaFiles: [],
      isAvailable: craft.isAvailable !== false,
      dimensions: craft.dimensions || { height: '', width: '', depth: '', unit: 'cm' },
      weight: craft.weight || { value: '', unit: 'kg' },
      materials: craft.materials || [],
      tags: craft.tags || [],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      price: '',
      currency: 'LKR',
      category: '',
      stock: 1,
      images: [],
      mediaFiles: [],
      isAvailable: true,
      dimensions: { height: '', width: '', depth: '', unit: 'cm' },
      weight: { value: '', unit: 'kg' },
      materials: [],
      tags: [],
    });
    setEditingCraft(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openDetail = (craft: any) => {
    setSelectedCraft(craft);
    setShowDetail(true);
  };

  const renderCraft = ({ item }: { item: any }) => (
    <TouchableOpacity key={item._id} style={s.craftCard} activeOpacity={0.7} onPress={() => openDetail(item)}>
      <Image source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }} style={s.craftImg} />
      <View style={s.craftInfo}>
        <Text style={s.craftName}>{item.name}</Text>
        <Text style={s.craftCat}>{item.category}</Text>
        <View style={s.craftMeta}>
          <Text style={s.craftPrice}>LKR {item.price}</Text>
          <Text style={s.craftStock}>Stock: {item.stock}</Text>
          {item.isAvailable !== false && <View style={s.availableBadge}><Text style={s.availableText}>Available</Text></View>}
        </View>
        {item.dimensions && (item.dimensions.height || item.dimensions.width || item.dimensions.depth) && (
          <Text style={s.craftMeta2}>Size: {item.dimensions.height || ''}{item.dimensions.height && item.dimensions.width ? '×' : ''} {item.dimensions.width || ''}{item.dimensions.depth ? `× ${item.dimensions.depth} ${item.dimensions.unit || 'cm'}` : ''}</Text>
        )}
        {item.materials && item.materials.length > 0 && (
          <Text style={s.craftMeta2}>Materials: {item.materials.join(', ')}</Text>
        )}
      </View>
      <View style={s.craftActions}>
        <TouchableOpacity onPress={(e) => { e.stopPropagation(); openEdit(item); }} style={s.actionBtn}>
          <Edit2 size={18} color="#2F5D50" />
        </TouchableOpacity>
        <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDelete(item._id); }} style={s.actionBtn}>
          <Trash2 size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={s.safe}>
        <BatikBackground />
        <View style={s.center}>
          <ActivityIndicator size="large" color="#2F5D50" />
        </View>
      </View>
    );
  }

  return (
    <View style={s.safe}>
      <BatikBackground />
      <ScrollView contentContainerStyle={[s.detailBody, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.headerTitle}>My Crafts</Text>
          <TouchableOpacity style={s.addBtn} onPress={openAdd}>
            <Plus size={20} color="#fff" />
            <Text style={s.addBtnText}>Add Craft</Text>
          </TouchableOpacity>
        </View>

        {crafts.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>No crafts listed yet</Text>
            <Text style={s.emptySub}>Start showcasing your traditional crafts</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={openAdd}>
              <Text style={s.emptyBtnText}>Add Your First Craft</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList data={crafts} renderItem={renderCraft} keyExtractor={(item) => item._id} scrollEnabled={false} />
        )}

        {/* Detail Modal */}
        {showDetail && selectedCraft && (
          <View style={s.detailOverlay}>
            <View style={s.detailModal}>
              <View style={s.detailHeader}>
                <Text style={s.detailTitle}>{selectedCraft.name}</Text>
                <TouchableOpacity onPress={() => { setShowDetail(false); setSelectedCraft(null); }}>
                  <X size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <ScrollView style={s.detailBody}>
                <View style={s.detailImageRow}>
                  {selectedCraft.images && selectedCraft.images.length > 0 ? (
                    <FlatList
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      data={selectedCraft.images}
                      keyExtractor={(uri, idx) => idx.toString()}
                      renderItem={({ item }) => (
                        <Image source={{ uri: item }} style={s.detailFullImage} />
                      )}
                    />
                  ) : (
                    <Image source={{ uri: 'https://via.placeholder.com/400x300' }} style={s.detailFullImage} />
                  )}
                </View>
                <View style={s.detailSection}>
                  <Text style={s.detailSectionTitle}>Basic Info</Text>
                  <View style={s.detailRow}>
                    <Text style={s.detailLabel}>Category</Text>
                    <Text style={s.detailValue}>{selectedCraft.category}</Text>
                  </View>
                  <View style={s.detailRow}>
                    <Text style={s.detailLabel}>Price</Text>
                    <Text style={[s.detailValue, s.detailPrice]}>LKR {selectedCraft.price?.toLocaleString()}</Text>
                  </View>
                  <View style={s.detailRow}>
                    <Text style={s.detailLabel}>Stock</Text>
                    <Text style={s.detailValue}>{selectedCraft.stock} available</Text>
                  </View>
                  <View style={s.detailRow}>
                    <Text style={s.detailLabel}>Status</Text>
                    <View style={[s.statusBadge, selectedCraft.isAvailable === false ? s.statusUnavailable : s.statusAvailable]}>
                      <Text style={selectedCraft.isAvailable === false ? s.statusUnavailableText : s.statusAvailableText}>
                        {selectedCraft.isAvailable === false ? 'Out of Stock' : 'Available'}
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedCraft.description && (
                  <View style={s.detailSection}>
                    <Text style={s.detailSectionTitle}>Description</Text>
                    <Text style={s.detailDesc}>{selectedCraft.description}</Text>
                  </View>
                )}

                {selectedCraft.dimensions && (selectedCraft.dimensions.height || selectedCraft.dimensions.width || selectedCraft.dimensions.depth) && (
                  <View style={s.detailSection}>
                    <Text style={s.detailSectionTitle}>Dimensions</Text>
                    <Text style={s.detailValue}>
                      {selectedCraft.dimensions.height || ''}{selectedCraft.dimensions.height && selectedCraft.dimensions.width ? '×' : ''} {selectedCraft.dimensions.width || ''}{selectedCraft.dimensions.depth ? `× ${selectedCraft.dimensions.depth} ${selectedCraft.dimensions.unit || 'cm'}` : ''}
                    </Text>
                  </View>
                )}

                {selectedCraft.weight && (selectedCraft.weight.value || selectedCraft.weight.unit) && (
                  <View style={s.detailSection}>
                    <Text style={s.detailSectionTitle}>Weight</Text>
                    <Text style={s.detailValue}>{selectedCraft.weight.value} {selectedCraft.weight.unit}</Text>
                  </View>
                )}

                {selectedCraft.materials && selectedCraft.materials.length > 0 && (
                  <View style={s.detailSection}>
                    <Text style={s.detailSectionTitle}>Materials</Text>
                    <View style={s.detailChipContainer}>
                      {selectedCraft.materials.map((m: string, idx: number) => (
                        <View key={idx} style={s.detailChip}>
                          <Text style={s.detailChipText}>{m}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {selectedCraft.tags && selectedCraft.tags.length > 0 && (
                  <View style={s.detailSection}>
                    <Text style={s.detailSectionTitle}>Tags</Text>
                    <View style={s.detailChipContainer}>
                      {selectedCraft.tags.map((t: string, idx: number) => (
                        <View key={idx} style={[s.detailChip, s.detailTagChip]}>
                          <Text style={s.detailChipText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
              <View style={s.detailFooter}>
                <TouchableOpacity style={[s.modalCancelBtn, { flex: 1 }]} onPress={() => { setShowDetail(false); setSelectedCraft(null); }}>
                  <Text style={s.modalCancelText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.modalSaveBtn, { flex: 1, backgroundColor: '#F59E0B' }]} onPress={() => { setShowDetail(false); openEdit(selectedCraft); }}>
                  <Text style={s.modalSaveText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <View style={s.fullModalOverlay}>
            <View style={s.fullModalCard}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>{editingCraft ? 'Edit Craft' : 'Add New Craft'}</Text>
                <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
                  <X size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <ScrollView style={s.fullModalBody}>
                <Text style={s.fieldLabel}>Name *</Text>
                <TextInput style={s.modalInput} value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
                <Text style={s.fieldLabel}>Description</Text>
                <TextInput style={[s.modalInput, { height: 100 }]} value={form.description} onChangeText={v => setForm({ ...form, description: v })} multiline textAlignVertical="top" />
                <View style={s.row}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={s.fieldLabel}>Price *</Text>
                    <TextInput style={s.modalInput} value={form.price} onChangeText={v => setForm({ ...form, price: v })} keyboardType="numeric" placeholder="0.00" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Category *</Text>
                    <TextInput style={s.modalInput} value={form.category} onChangeText={v => setForm({ ...form, category: v })} placeholder="Select category" />
                  </View>
                </View>
                <View style={s.fieldRow}>
                  <Text style={s.fieldLabel}>Dimensions (cm)</Text>
                </View>
                <View style={s.row}>
                  <View style={{ flex: 1, marginRight: 4 }}>
                    <TextInput style={[s.dimensionInput, { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, flex: 1 }]} value={form.dimensions.height} onChangeText={v => setForm({ ...form, dimensions: { ...form.dimensions, height: v } })} placeholder="H" keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 6 }}>
                    <TextInput style={[s.dimensionInput, { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, flex: 1 }]} value={form.dimensions.width} onChangeText={v => setForm({ ...form, dimensions: { ...form.dimensions, width: v } })} placeholder="W" keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 6 }}>
                    <TextInput style={[s.dimensionInput, { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, flex: 1 }]} value={form.dimensions.depth} onChangeText={v => setForm({ ...form, dimensions: { ...form.dimensions, depth: v } })} placeholder="D" keyboardType="numeric" />
                  </View>
                </View>
                <View style={s.fieldRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <Text style={s.fieldLabel}>Weight</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                      <TextInput style={[s.weightInput, { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, width: 100 }]} value={form.weight.value} onChangeText={v => setForm({ ...form, weight: { ...form.weight, value: v } })} placeholder="0.0" keyboardType="numeric" />
                      <TextInput style={[s.unitInput, { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, width: 80, marginLeft: 8 }]} value={form.weight.unit} onChangeText={v => setForm({ ...form, weight: { ...form.weight, unit: v } })} placeholder="kg" />
                    </View>
                  </View>
                </View>
                <View style={s.fieldRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <TextInput style={[s.materialInput, { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, flex: 1 }]} value={tempMaterial} onChangeText={setTempMaterial} placeholder="Add material" />
                    <TouchableOpacity style={s.addChipBtn} onPress={() => { if (tempMaterial.trim()) { setForm({ ...form, materials: [...form.materials, tempMaterial.trim()] }); setTempMaterial(''); } }}>
                      <Plus size={18} color="#2F5D50" />
                    </TouchableOpacity>
                  </View>
                </View>
                {form.materials.length > 0 && (
                  <View style={s.chipContainer}>
                    {form.materials.map((m, idx) => (
                      <View key={idx} style={s.chip}>
                        <Text style={s.chipText}>{m}</Text>
                        <TouchableOpacity onPress={() => setForm({ ...form, materials: form.materials.filter((_, i) => i !== idx) })}>
                          <X size={14} color="#9CA3AF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <View style={s.fieldRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <TextInput style={[s.tagInput, { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, flex: 1 }]} value={tempTag} onChangeText={setTempTag} placeholder="Add tag" />
                    <TouchableOpacity style={s.addChipBtn} onPress={() => { if (tempTag.trim()) { setForm({ ...form, tags: [...form.tags, tempTag.trim()] }); setTempTag(''); } }}>
                      <Plus size={18} color="#2F5D50" />
                    </TouchableOpacity>
                  </View>
                </View>
                {form.tags.length > 0 && (
                  <View style={s.chipContainer}>
                    {form.tags.map((t, idx) => (
                      <View key={idx} style={[s.chip, s.tagChip]}>
                        <Text style={s.chipText}>{t}</Text>
                        <TouchableOpacity onPress={() => setForm({ ...form, tags: form.tags.filter((_, i) => i !== idx) })}>
                          <X size={14} color="#9CA3AF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <View style={s.row}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={s.fieldLabel}>Stock</Text>
                    <TextInput style={s.modalInput} value={form.stock.toString()} onChangeText={v => setForm({ ...form, stock: parseInt(v) || 1 })} keyboardType="number-pad" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Currency</Text>
                    <TextInput style={s.modalInput} value={form.currency} editable={false} />
                  </View>
                </View>
                <Text style={s.fieldLabel}>Images</Text>
                <View style={s.imgPreviewRow}>
                  {form.images.map((uri, idx) => (
                    <View key={idx} style={s.imgPreviewWrap}>
                      <Image source={{ uri }} style={s.imgPreview} />
                      <TouchableOpacity style={s.imgRemoveBtn} onPress={() => removeImage(idx)}>
                        <X size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={s.imgAddBtn} onPress={handlePickImage}>
                    {uploading ? <ActivityIndicator size="small" color="#2F5D50" /> : <Plus size={24} color="#2F5D50" />}
                  </TouchableOpacity>
                </View>
                <View style={s.switchRow}>
                  <Text style={s.fieldLabel}>Available</Text>
                  <TouchableOpacity
                    style={[s.switchBtn, form.isAvailable && s.switchBtnActive]}
                    onPress={() => setForm({ ...form, isAvailable: !form.isAvailable })}
                  >
                    <View style={[s.switchThumb, form.isAvailable && s.switchThumbActive]} />
                  </TouchableOpacity>
                </View>
              </ScrollView>
              <View style={s.modalFooter}>
                <TouchableOpacity style={s.modalCancelBtn} onPress={() => { setShowModal(false); resetForm(); }}>
                  <Text style={s.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.modalSaveBtn, saving && { opacity: 0.7 }]} onPress={handleSubmit} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.modalSaveText}>{editingCraft ? 'Update' : 'Save'}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ddede7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1E1E1E' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2F5D50', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  craftCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  craftImg: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#F3F4F6' },
  craftInfo: { flex: 1, marginLeft: 12 },
  craftName: { fontSize: 16, fontWeight: '700', color: '#1E1E1E' },
  craftCat: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  craftMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 },
  craftMeta2: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  craftPrice: { fontSize: 15, fontWeight: '700', color: '#2F5D50' },
  craftStock: { fontSize: 12, color: '#9CA3AF' },
  availableBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  availableText: { fontSize: 10, color: '#166534', fontWeight: '600' },
  craftActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 8 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 18, fontWeight: '800', color: '#1E1E1E', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9CA3AF' },
  emptyBtn: { backgroundColor: '#2F5D50', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  fullModalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', padding: 0 },
   fullModalCard: { backgroundColor: '#fff', borderRadius: 0, width: '100%', height: '100%', flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E1E1E' },
  fullModalBody: { paddingHorizontal: 24, paddingBottom: 24, flex: 1 },
  modalBody: { paddingHorizontal: 24, flex: 1, paddingBottom: 24 },
   fieldLabel: { fontSize: 16, fontWeight: '700', color: '#1E1E1E', marginBottom: 10, marginTop: 16 },
  modalInput: { borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, padding: 18, fontSize: 16, color: '#1E1E1E', minHeight: 56, backgroundColor: '#fff' },
  row: { flexDirection: 'row' },
  fieldRow: { marginTop: 12 },
   dimensionInput: { fontSize: 16, color: '#1E1E1E', minHeight: 48 },
  weightInput: { fontSize: 16, color: '#1E1E1E', minHeight: 48 },
  unitInput: { fontSize: 16, color: '#1E1E1E', minHeight: 48 },
  materialInput: { fontSize: 16, color: '#1E1E1E', minHeight: 48 },
  tagInput: { fontSize: 16, color: '#1E1E1E', minHeight: 48 },
  addChipBtn: { backgroundColor: '#E8F5E9', borderRadius: 10, padding: 12, marginLeft: 10, justifyContent: 'center', alignItems: 'center' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  tagChip: { backgroundColor: '#E0E7FF' },
  chipText: { fontSize: 14, color: '#1E1E1E', fontWeight: '500' },
  imgPreviewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  imgPreviewWrap: { position: 'relative' },
  imgPreview: { width: 100, height: 100, borderRadius: 14, backgroundColor: '#F3F4F6' },
  imgAddBtn: { width: 100, height: 100, borderRadius: 14, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed' },
  imgRemoveBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#DC2626', borderRadius: 12, padding: 2 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  switchBtn: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#E5E7EB', justifyContent: 'center', paddingHorizontal: 2 },
  switchBtnActive: { backgroundColor: '#2F5D50' },
  switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  switchThumbActive: { marginLeft: 20 },
  modalFooter: { flexDirection: 'row', padding: 20, gap: 16, marginTop: 16 },
  modalCancelBtn: { flex: 1, backgroundColor: '#E5E7EB', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  modalCancelText: { color: '#1E1E1E', fontWeight: '700', fontSize: 16 },
  modalSaveBtn: { flex: 1, backgroundColor: '#2F5D50', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Detail modal styles
  detailOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  detailModal: { backgroundColor: '#fff', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '95%', flex: 1 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  detailTitle: { fontSize: 18, fontWeight: '800', color: '#1E1E1E' },
  detailBody: { padding: 20, flex: 1 },
  detailSection: { marginBottom: 20 },
  detailSectionTitle: { fontSize: 14, fontWeight: '800', color: '#C65D3B', marginBottom: 12, textTransform: 'uppercase' },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  detailLabel: { fontSize: 13, color: '#9CA3AF', width: 80 },
  detailValue: { fontSize: 14, color: '#1E1E1E', flex: 1 },
  detailPrice: { fontSize: 16, fontWeight: '700', color: '#2F5D50' },
  detailDesc: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  detailFullImage: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#F3F4F6' },
  detailImageRow: { marginBottom: 16 },
  detailChipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  detailChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  detailTagChip: { backgroundColor: '#E0E7FF' },
  detailChipText: { fontSize: 13, color: '#1E1E1E', fontWeight: '500' },
  statusAvailable: { backgroundColor: '#E8F5E9' },
  statusAvailableText: { fontSize: 11, color: '#166534', fontWeight: '600' },
  statusUnavailable: { backgroundColor: '#FEF2F2' },
  statusUnavailableText: { fontSize: 11, color: '#DC2626', fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  detailFooter: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
});
