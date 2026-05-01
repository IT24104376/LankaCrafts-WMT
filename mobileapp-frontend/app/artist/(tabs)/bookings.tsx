import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../../../src/context/AuthContext';
import { getArtistBookings } from '../../../src/services/api';
import { BatikBackground } from '../../../src/components/BatikBackground';
import { Calendar, Clock, MapPin, Users, CheckCircle, XCircle, Trash2 } from 'lucide-react-native';
import { bookingApi } from '../../../src/api';

export default function ArtistBookingsScreen() {
  const { artist } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (artist?.id) loadBookings();
  }, [artist?.id]);

   const loadBookings = async () => {
     try {
       setLoading(true);
       const res = await getArtistBookings();
       const bookingsArray = res?.data?.data ?? [];
       setBookings(Array.isArray(bookingsArray) ? bookingsArray : []);
     } catch (err) {
       console.error('Failed to load bookings:', err);
       Alert.alert('Error', 'Failed to load bookings');
       setBookings([]);
     } finally {
       setLoading(false);
     }
   };

   const updateStatus = async (id: string, status: string) => {
     try {
       await bookingApi.updateBooking(id, { status });
       loadBookings();
     } catch (err) {
       Alert.alert('Error', 'Failed to update booking status');
       console.error('Update error:', err);
     }
   };

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return '#22C55E';
    case 'pending': return '#F59E0B';
    case 'completed': return '#3B82F6';
    case 'cancelled': return '#EF4444';
    default: return '#9CA3AF';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'confirmed': return 'Confirmed';
    case 'pending': return 'Pending';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
};

  const filteredBookings = bookings.filter((b: any) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b: any) => b.status === 'pending').length,
    confirmed: bookings.filter((b: any) => b.status === 'confirmed').length,
    completed: bookings.filter((b: any) => b.status === 'completed').length,
    cancelled: bookings.filter((b: any) => b.status === 'cancelled').length,
  };

  const handleConfirm = (id: string) => updateStatus(id, 'confirmed');
  const handleComplete = (id: string) => updateStatus(id, 'completed');
  const handleCancel = async (id: string) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking? This action cannot be undone.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
          try {
            await bookingApi.deleteBooking(id);
            loadBookings();
            Alert.alert('Success', 'Booking has been cancelled successfully');
          } catch (err) {
            Alert.alert('Error', 'Failed to cancel booking. Please try again.');
            console.error('Cancel error:', err);
          }
        }
      },
    ]);
  };

  const renderBooking = ({ item }: { item: any }) => (
    <View style={[s.card, { borderLeftColor: getStatusColor(item.status), borderLeftWidth: 4 }]}>
      <View style={s.cardHeader}>
        <View>
          <Text style={s.craftName}>{item.craftName}</Text>
          <View style={s.statusRow}>
            <View style={[s.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[s.statusText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
      </View>
      <View style={s.detailRow}>
        <View style={s.detailIconBox}><Calendar size={16} color="#9CA3AF" /></View>
        <Text style={s.detailValue}>{item.bookingDate}</Text>
      </View>
      <View style={s.detailRow}>
        <View style={s.detailIconBox}><Clock size={16} color="#9CA3AF" /></View>
        <Text style={s.detailValue}>{item.bookingTime}</Text>
      </View>
      <View style={s.detailRow}>
        <View style={s.detailIconBox}><MapPin size={16} color="#9CA3AF" /></View>
        <Text style={s.detailValue}>{item.location}</Text>
      </View>
      <View style={s.detailRow}>
        <View style={s.detailIconBox}><Users size={16} color="#9CA3AF" /></View>
        <Text style={s.detailValue}>{item.groupSize} {item.groupSize === 1 ? 'person' : 'people'}</Text>
      </View>
      <View style={s.detailRow}>
        <View style={s.detailIconBox}><Users size={16} color="#9CA3AF" /></View>
        <Text style={s.detailValue}>{item.customerName}</Text>
      </View>
      <View style={s.detailRow}>
        <Text style={s.detailLabel}>Email:</Text>
        <Text style={[s.detailValue, { flex: 1 }]}>{item.customerEmail}</Text>
      </View>
      {(item.status !== 'cancelled') && (
        <View style={s.actionRow}>
          {/* {item.status === 'pending' && (
            <TouchableOpacity style={s.confirmBtn} onPress={() => handleConfirm(item._id)}>
              <CheckCircle size={16} color="#fff" />
              <Text style={s.actionBtnText}>Confirm</Text>
            </TouchableOpacity>
          )} */}
          {item.status === 'confirmed' && (
            <TouchableOpacity style={s.completeBtn} onPress={() => handleComplete(item._id)}>
              <CheckCircle size={16} color="#fff" />
              <Text style={s.actionBtnText}>Mark Complete</Text>
            </TouchableOpacity>
          )}
          {/* <TouchableOpacity style={[s.cancelBtn, { backgroundColor: '#EF4444', flexDirection: 'row', gap: 4 }]} onPress={() => handleCancel(item._id)}>
            <Trash2 size={16} color="#fff" />
            <Text style={s.actionBtnText}>Cancel</Text>
          </TouchableOpacity> */}
        </View>
      )}
      {item.status === 'cancelled' && (
        <View style={[s.detailRow, { marginTop: 8 }]}>
          <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '600' }}>Booking Cancelled</Text>
        </View>
      )}
    </View>
  );  

  if (loading) {
    return (
      <View style={s.safe}>
        <BatikBackground />
        <View style={s.center}><ActivityIndicator size="large" color="#2F5D50" /></View>
      </View>
    );
  }

  return (
    <View style={s.safe}>
      <BatikBackground />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.statsRow}>
          <View style={s.statCard}><Text style={s.statNum}>{stats.total}</Text><Text style={s.statLabel}>Total</Text></View>
          <View style={s.statCard}><Text style={[s.statNum, { color: '#F59E0B' }]}>{stats.pending}</Text><Text style={s.statLabel}>Pending</Text></View>
          <View style={s.statCard}><Text style={[s.statNum, { color: '#22C55E' }]}>{stats.confirmed}</Text><Text style={s.statLabel}>Confirmed</Text></View>
          <View style={s.statCard}><Text style={[s.statNum, { color: '#3B82F6' }]}>{stats.completed}</Text><Text style={s.statLabel}>Done</Text></View>
          <View style={s.statCard}><Text style={[s.statNum, { color: '#EF4444' }]}>{stats.cancelled}</Text><Text style={s.statLabel}>Cancelled</Text></View>
        </View>
        <View style={s.filterRow}>
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
            <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterBtnActive]} onPress={() => setFilter(f)}>
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {filteredBookings.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>No bookings yet</Text>
            <Text style={s.emptySub}>Your workshop bookings will appear here</Text>
          </View>
        ) : (
          <FlatList data={filteredBookings} renderItem={renderBooking} keyExtractor={(item) => item._id} scrollEnabled={false} />
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ddede7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: 70, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800', color: '#2F5D50' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterBtn: { backgroundColor: '#E5E7EB', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  filterBtnActive: { backgroundColor: '#2F5D50' },
  filterText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  craftName: { fontSize: 16, fontWeight: '700', color: '#1E1E1E', marginBottom: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  detailIconBox: { width: 20 },
  detailLabel: { fontSize: 13, color: '#9CA3AF' },
  detailValue: { fontSize: 14, color: '#1E1E1E', marginLeft: 8 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  confirmBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#22C55E', borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', gap: 4 },
  completeBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', gap: 4 },
  cancelBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#EF4444', borderRadius: 10, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 18, fontWeight: '800', color: '#1E1E1E', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9CA3AF' },
});