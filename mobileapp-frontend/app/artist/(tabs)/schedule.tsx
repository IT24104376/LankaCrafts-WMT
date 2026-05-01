import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../../src/context/AuthContext';
import { getArtistSchedule, updateArtistSchedule } from '../../../src/services/api';
import { BatikBackground } from '../../../src/components/BatikBackground';
import { Check, Calendar, Clock, Sun, Moon } from 'lucide-react-native';

type SlotKey = 'morning' | 'afternoon' | 'evening';
type DaySchedule = Record<SlotKey, boolean>;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SLOTS: { key: SlotKey; label: string; icon: typeof Sun; time: string }[] = [
  { key: 'morning', label: '09:00 - 12:00', icon: Sun, time: '09:00 - 12:00' },
  { key: 'afternoon', label: '12:00 - 17:00', icon: Sun, time: '12:00 - 17:00' },
  { key: 'evening', label: '17:00 - 20:00', icon: Moon, time: '17:00 - 20:00' },
];

export default function ArtistScheduleScreen() {
  const { artist } = useAuth();
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>({});
  const [originalSchedule, setOriginalSchedule] = useState<Record<string, DaySchedule>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);


  useEffect(() => {
    if (artist) loadSchedule();
  }, [artist]);

   const loadSchedule = async () => {
     try {
       setLoading(true);
       const res = await getArtistSchedule();
       // API returns { success: true, data: availability }
       const scheduleData = res?.data?.data ?? {};
       setSchedule(scheduleData);
       setOriginalSchedule(JSON.parse(JSON.stringify(scheduleData)));
       setHasChanges(false);
     } catch (err) {
       Alert.alert('Error', 'Failed to load schedule');
     } finally {
       setLoading(false);
     }
   };

  const toggleSlot = (day: string, slot: SlotKey) => {
    const daySchedule = schedule[day] || { morning: false, afternoon: false, evening: false };
    const newDaySchedule = { ...daySchedule, [slot]: !daySchedule[slot] };
    setSchedule({ ...schedule, [day]: newDaySchedule });
    
    const originalDay = originalSchedule[day] || { morning: false, afternoon: false, evening: false };
    const hasDayChanged = newDaySchedule.morning !== originalDay.morning ||
                         newDaySchedule.afternoon !== originalDay.afternoon ||
                         newDaySchedule.evening !== originalDay.evening;
    
    const anyChanges = Object.keys(schedule).some((d: string) => {
      const current = schedule[d] || { morning: false, afternoon: false, evening: false };
      const orig = originalSchedule[d] || { morning: false, afternoon: false, evening: false };
      return current.morning !== orig.morning || current.afternoon !== orig.afternoon || current.evening !== orig.evening;
    });
    
    setHasChanges(anyChanges);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateArtistSchedule({ availability: schedule });
      setOriginalSchedule(JSON.parse(JSON.stringify(schedule)));
      setHasChanges(false);
      Alert.alert('Success', 'Schedule updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert('Reset', 'Reset all changes to default?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => {
        setSchedule(JSON.parse(JSON.stringify(originalSchedule)));
        setHasChanges(false);
      }},
    ]);
  };

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
        <View style={s.header}>
          <View>
            <Text style={s.title}>Workshop Schedule</Text>
            <Text style={s.subtitle}>Set your availability for workshop sessions</Text>
          </View>
          {hasChanges && <View style={s.badge}><Text style={s.badgeText}>Unsaved changes</Text></View>}
        </View>

        <View style={s.legend}>
          {SLOTS.map(slot => {
            const Icon = slot.icon;
            return (
              <View key={slot.key} style={s.legendItem}>
                <Icon size={18} color="#2F5D50" />
                <Text style={s.legendText}>{slot.time}</Text>
              </View>
            );
          })}
        </View>

        <View style={s.calendarCard}>
          {DAYS.map(day => {
            const daySchedule = schedule[day] || { morning: false, afternoon: false, evening: false };
            const hasAny = daySchedule.morning || daySchedule.afternoon || daySchedule.evening;
            
            return (
              <View key={day} style={[s.dayRow, hasAny && s.dayRowActive]}>
                <View style={s.dayInfo}>
                  <Text style={s.dayName}>{day}</Text>
                  {hasAny && (
                    <Text style={s.daySlots}>
                      {daySchedule.morning ? '09:00 - 12:00 ' : ''}
                      {daySchedule.afternoon ? '12:00 - 17:00 ' : ''}
                      {daySchedule.evening ? '17:00 - 20:00' : ''}
                    </Text>
                  )}
                </View>
                <View style={s.slotsRow}>
                  {SLOTS.map(slot => {
                    const enabled = daySchedule[slot.key];
                    return (
                      <TouchableOpacity
                        key={slot.key}
                        style={[s.slotBtn, enabled && s.slotBtnActive]}
                        onPress={() => toggleSlot(day, slot.key)}
                      >
                        {enabled ? (
                          <Check size={16} color="#fff" />
                        ) : (
                          <Text style={s.slotText}>{slot.label.split(' - ')[0]}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>

        <View style={s.hintCard}>
          <Calendar size={24} color="#2F5D50" style={s.hintIcon} />
          <Text style={s.hintTitle}>Quick Tips</Text>
          <Text style={s.hintText}>• Toggle slots to set your availability</Text>
          <Text style={s.hintText}>• Tourists can only book during available times</Text>
          <Text style={s.hintText}>• Save your changes to update your schedule</Text>
        </View>

        <View style={s.footer}>
          <TouchableOpacity style={s.resetBtn} onPress={handleReset}>
            <Text style={s.resetText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.saveBtn, (!hasChanges || saving) && s.saveBtnDisabled]} onPress={handleSave} disabled={!hasChanges || saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>Save Schedule</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ddede7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#1E1E1E' },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  badge: { backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  legend: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, gap: 8 },
  legendItem: { alignItems: 'center', gap: 4 },
  legendText: { fontSize: 11, color: '#6B7280' },
  calendarCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dayRowActive: { backgroundColor: '#F0FDF4' },
  dayInfo: { flex: 1 },
  dayName: { fontSize: 15, fontWeight: '600', color: '#1E1E1E' },
  daySlots: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  slotsRow: { flexDirection: 'row', gap: 6 },
  slotBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  slotBtnActive: { backgroundColor: '#2F5D50' },
  slotText: { fontSize: 10, color: '#9CA3AF', fontWeight: '700' },
  hintCard: { backgroundColor: '#E8F5E9', borderRadius: 16, padding: 20, marginTop: 16, alignItems: 'center' },
  hintIcon: { marginBottom: 12 },
  hintTitle: { fontSize: 16, fontWeight: '700', color: '#1E1E1E', marginBottom: 12 },
  hintText: { fontSize: 13, color: '#4B5563', marginBottom: 4 },
  footer: { flexDirection: 'row', gap: 12, marginTop: 20 },
  resetBtn: { flex: 1, backgroundColor: '#E5E7EB', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  resetText: { color: '#1E1E1E', fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 1, backgroundColor: '#2F5D50', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});