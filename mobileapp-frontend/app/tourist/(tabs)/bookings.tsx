import { useAuth } from '../../../src/context/AuthContext';
import { bookingApi } from '../../../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, TextInput, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BatikBackground } from '../../../src/components/BatikBackground';
interface Booking {
    _id: string; craftId: string; craftName: string;
    artisanId: string; customerName: string;
    customerEmail: string; bookingDate: string;
    bookingTime: string; status: string;
}

export default function MyBookings() {
    const router = useRouter();
    const { tourist } = useAuth();
    const email = tourist?.email;
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<{ bookingDate: string; bookingTime: string }>({ bookingDate: '', bookingTime: '' });

    const fetchBookings = async () => {
        if (!email) { setLoading(false); return; }
        try {
            const data = await bookingApi.getBookingsByEmail(email);
            setBookings(Array.isArray(data) ? data : (data.bookings ?? []));
        } catch (err) {
            console.error('Error fetching bookings:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchBookings(); }, [email]);

    const handleDelete = (id: string) => {
        Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes', style: 'destructive', onPress: async () => {
                    try {
                        await bookingApi.deleteBooking(id);
                        setBookings(bookings.filter(b => b._id !== id));
                    } catch {
                        Alert.alert('Error', 'Could not cancel booking. Please try again.');
                    }
                }
            }
        ]);
    };

    const handleUpdate = async (id: string) => {
        try {
            await bookingApi.updateBooking(id, editData);
            setBookings(bookings.map(b => b._id === id ? { ...b, ...editData } : b));
            setEditingId(null);
        } catch {
            Alert.alert('Error', 'Failed to update booking.');
        }
    };

    if (loading) return (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color="#BC3908" />
            <Text style={styles.loadingText}>Retrieving your sessions...</Text>
        </View>
    );

    return (
        <BatikBackground>
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} />}>

                    <View style={styles.header}>
                        <Text style={styles.title}>My Craft Journey</Text>
                        <TouchableOpacity onPress={fetchBookings} style={styles.refreshBtn}>
                            <Text style={styles.refreshText}>↻</Text>
                        </TouchableOpacity>
                    </View>

                    {bookings.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>No bookings found. Ready to start your first masterclass?</Text>
                        </View>
                    ) : (
                        bookings.map((booking) => (
                            <View key={booking._id} style={styles.card}>
                                <View style={styles.cardTop}>
                                    <Text style={styles.craftTag}>{booking.craftId}</Text>
                                    <View style={[styles.statusBadge,
                                    booking.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending]}>
                                        <Text style={styles.statusText}>{booking.status}</Text>
                                    </View>
                                </View>

                                <Text style={styles.cardLabel}>Artisan: <Text style={styles.cardValue}>{booking.artisanId}</Text></Text>
                                <Text style={styles.cardLabel}>Tourist: <Text style={styles.cardValue}>{booking.customerName}</Text></Text>
                                <Text style={styles.cardLabel}>Workshop: <Text style={styles.cardValue}>{booking.craftName || booking.craftId}</Text></Text>

                                {editingId === booking._id ? (
                                    <View style={styles.editRow}>
                                        <TextInput
                                            style={styles.editInput}
                                            value={editData.bookingDate}
                                            onChangeText={(v) => setEditData({ ...editData, bookingDate: v })}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor="#aaa"
                                        />
                                        <TextInput
                                            style={styles.editInput}
                                            value={editData.bookingTime}
                                            onChangeText={(v) => setEditData({ ...editData, bookingTime: v })}
                                            placeholder="HH:MM"
                                            placeholderTextColor="#aaa"
                                        />
                                        <View style={styles.editActions}>
                                            <TouchableOpacity style={styles.saveBtn} onPress={() => handleUpdate(booking._id)}>
                                                <Text style={styles.saveBtnText}>✓ Save</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setEditingId(null)}>
                                                <Text style={styles.cancelEditText}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.dateRow}>
                                        <Text style={styles.dateText}>📅 {booking.bookingDate}</Text>
                                        <Text style={styles.dateText}>🕐 {booking.bookingTime}</Text>
                                    </View>
                                )}

                                {editingId !== booking._id && (
                                    <View style={styles.actions}>
                                        <TouchableOpacity
                                            style={styles.editBtn}
                                            onPress={() => router.push(`/tourist/bookings/${booking._id}`)}>
                                            <Text style={styles.editBtnText}>✏️ Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteBtn}
                                            onPress={() => handleDelete(booking._id)}>
                                            <Text style={styles.deleteBtnText}>🗑 Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </ScrollView>
            </SafeAreaView>
        </BatikBackground>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#888' },
    container: { flex: 1, backgroundColor: 'transparent' },
    content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#e7e5e4', paddingBottom: 12 },
    title: { fontSize: 26, fontStyle: 'italic', fontWeight: '700', color: '#1c1917' },
    refreshBtn: { padding: 8 },
    refreshText: { fontSize: 20, color: '#BC3908' },
    emptyBox: { borderWidth: 2, borderColor: '#d6d3d1', borderStyle: 'dashed', borderRadius: 20, padding: 40, alignItems: 'center' },
    emptyText: { color: '#a8a29e', textAlign: 'center' },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f5f5f4', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    craftTag: { fontSize: 10, fontWeight: '800', color: '#BC3908', textTransform: 'uppercase', letterSpacing: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusConfirmed: { backgroundColor: '#fef3c7' },
    statusPending: { backgroundColor: '#f3f4f6' },
    statusText: { fontSize: 10, fontWeight: '800', color: '#92400e', textTransform: 'uppercase', letterSpacing: 1 },
    cardLabel: { fontSize: 13, color: '#78716c', marginBottom: 4 },
    cardValue: { fontWeight: '600', color: '#44403c' },
    dateRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
    dateText: { fontSize: 12, color: '#a8a29e' },
    editRow: { marginTop: 8, gap: 8 },
    editInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 8, fontSize: 13, color: '#1a1a1a' },
    editActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
    saveBtn: { backgroundColor: '#dcfce7', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
    saveBtnText: { color: '#16a34a', fontWeight: '700', fontSize: 13 },
    cancelEditBtn: { backgroundColor: '#fee2e2', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    cancelEditText: { color: '#dc2626', fontWeight: '700' },
    actions: { flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'flex-end' },
    editBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fffbeb', borderRadius: 8 },
    editBtnText: { color: '#d97706', fontSize: 13, fontWeight: '600' },
    deleteBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff1f2', borderRadius: 8 },
    deleteBtnText: { color: '#e11d48', fontSize: 13, fontWeight: '600' },
});