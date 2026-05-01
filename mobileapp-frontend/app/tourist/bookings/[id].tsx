import React, { useEffect, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, ScrollView, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { bookingApi } from '../../../src/api';

export default function EditBooking() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({ bookingDate: '', bookingTime: '' });

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const data = await bookingApi.getBookingById(id);
                setFormData({ bookingDate: data.bookingDate, bookingTime: data.bookingTime });
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to load booking');
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [id]);

    const handleSubmit = async () => {
        try {
            setError(null);
            await bookingApi.updateBooking(id, formData);
            Alert.alert('Success', 'Booking updated successfully!');
            router.replace('/tourist/bookings');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update booking');
        }
    };

    if (loading) return (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color="#BC3908" />
        </View>
    );

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Update Booking</Text>

            {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

            <Text style={styles.label}>Booking Date</Text>
            <TextInput
                style={styles.input}
                value={formData.bookingDate}
                onChangeText={(v) => setFormData({ ...formData, bookingDate: v })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#aaa"
            />

            <Text style={styles.label}>Booking Time</Text>
            <TextInput
                style={styles.input}
                value={formData.bookingTime}
                onChangeText={(v) => setFormData({ ...formData, bookingTime: v })}
                placeholder="HH:MM"
                placeholderTextColor="#aaa"
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Update Booking</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
                <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { padding: 24, paddingTop: 60 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 24 },
    errorBox: { backgroundColor: '#fee2e2', borderRadius: 8, padding: 12, marginBottom: 16 },
    errorText: { color: '#dc2626', fontSize: 13 },
    label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
    input: {
        borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
        padding: 12, fontSize: 14, color: '#1a1a1a', marginBottom: 16,
    },
    button: {
        backgroundColor: '#BC3908', borderRadius: 10,
        padding: 14, alignItems: 'center', marginTop: 8,
    },
    buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    cancelBtn: { alignItems: 'center', marginTop: 12 },
    cancelText: { color: '#888', fontSize: 14 },
});