import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, TextInput,
    StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { bookingApi } from '../../../src/api';
import { getArtists } from '../../../src/services/api';
import { INTEREST_MAP } from '../../../src/constants/touristConstants';
import { useAuth } from '../../../src/context/AuthContext';


export default function BookWorkshop() {
    const router = useRouter();
    const { tourist } = useAuth();
    const [step, setStep] = useState(1);
    const [selectedCraft, setSelectedCraft] = useState('');
    const [selectedArtisan, setSelectedArtisan] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [allArtists, setAllArtists] = useState<any[]>([]);
    const [craftCategories, setCraftCategories] = useState<{ id: string; name: string; icon: string }[]>([]);
    const [artistsLoading, setArtistsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', groupSize: 1 });

    useEffect(() => {
        if (tourist) {
            setFormData(prev => ({ ...prev, name: tourist.fullName || '', email: tourist.email || '' }));
        }
    }, [tourist]);

    useEffect(() => {
        const fetchArtists = async () => {
            try {
                const res = await getArtists(1, 100);
                const artists = res.data?.artists || [];
                setAllArtists(artists);
                const craftSet = new Map<string, { id: string; name: string; icon: string }>();
                for (const a of artists) {
                    if (a.craftType && !craftSet.has(a.craftType)) {
                        const mapped = INTEREST_MAP[a.craftType];
                        craftSet.set(a.craftType, {
                            id: a.craftType,
                            name: mapped?.label || a.craftType.charAt(0).toUpperCase() + a.craftType.slice(1),
                            icon: mapped?.emoji || '',
                        });
                    }
                }
                setCraftCategories(Array.from(craftSet.values()));
            } catch (err) {
                console.error('Failed to fetch artists:', err);
            } finally {
                setArtistsLoading(false);
            }
        };
        fetchArtists();
    }, []);

    const filteredArtisans = allArtists.filter(a => a.craftType === selectedCraft);

    const handleSubmit = async () => {
        if (!formData.name || formData.name.length < 3) { Alert.alert('Error', 'Name must be at least 3 characters'); return; }
        if (!formData.email.includes('@')) { Alert.alert('Error', 'Invalid email'); return; }
        if (!/^[0-9]{10}$/.test(formData.phone)) { Alert.alert('Error', 'Phone must be 10 digits'); return; }
        if (!selectedDate || !selectedTime) { Alert.alert('Error', 'Please select date and time'); return; }

        setIsSubmitting(true);
        const artisanData = allArtists.find(a => (a._id || a.id) === selectedArtisan);
        const craftData = craftCategories.find(c => c.id === selectedCraft);

        try {
            await bookingApi.createBooking({
                artisanId: selectedArtisan as string,
                artisanName: artisanData?.fullName || 'Unknown',
                location: artisanData?.address?.city || 'Unknown',
                craftId: selectedCraft,
                craftName: craftData?.name || 'Unknown',
                customerId: tourist?.id,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                date: selectedDate,
                time: selectedTime,
                groupSize: formData.groupSize,
            });
            setIsSuccess(true);
        } catch {
            Alert.alert('Error', 'Failed to save booking. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step indicator
    const StepBar = () => (
        <View style={styles.stepBar}>
            {['Craft', 'Artisan', 'Date & Time', 'Details'].map((s, i) => (
                <View key={i} style={styles.stepItem}>
                    <View style={[styles.stepCircle, step > i + 1 ? styles.stepDone : step === i + 1 ? styles.stepActive : styles.stepInactive]}>
                        <Text style={styles.stepNum}>{step > i + 1 ? '✓' : i + 1}</Text>
                    </View>
                    <Text style={styles.stepLabel}>{s}</Text>
                </View>
            ))}
        </View>
    );

    if (isSuccess) return (
        <ScrollView contentContainerStyle={styles.successContainer}>
            <View style={styles.successIcon}><Text style={{ fontSize: 40 }}>✅</Text></View>
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            <Text style={styles.successMsg}>
                Thank you, {formData.name}. Your workshop has been booked. A confirmation will be sent to {formData.email}.
            </Text>
            <View style={styles.summaryBox}>
                <Text style={styles.summaryRow}>📅 Date: <Text style={styles.summaryVal}>{selectedDate}</Text></Text>
                <Text style={styles.summaryRow}>🕐 Time: <Text style={styles.summaryVal}>{AVAILABLE_TIMES.find(t => t.id === selectedTime)?.time}</Text></Text>
                <Text style={styles.summaryRow}>👥 Group: <Text style={styles.summaryVal}>{formData.groupSize} {formData.groupSize === 1 ? 'Person' : 'People'}</Text></Text>
            </View>
            <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/tourist')}>
                <Text style={styles.homeBtnText}>Return Home</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    if (!tourist) return (
        <View style={styles.centered}>
            <Text style={styles.loginTitle}>Login Required</Text>
            <Text style={styles.loginMsg}>You need to be logged in to book a workshop.</Text>
            <TouchableOpacity style={styles.loginBtn} onPress={() => router.replace('/tourist/login')}>
                <Text style={styles.loginBtnText}>Go to Login</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.pageTitle}>Book a Workshop</Text>
            <StepBar />

            {/* Step 1 */}
            {step === 1 && (
                <View>
                    <Text style={styles.stepTitle}>What would you like to learn?</Text>
                    {artistsLoading ? <ActivityIndicator color="#2F5D50" size="large" /> : (
                        craftCategories.map(craft => (
                            <TouchableOpacity key={craft.id} style={[styles.optionCard, selectedCraft === craft.id && styles.optionSelected]}
                                onPress={() => { setSelectedCraft(craft.id); setSelectedArtisan(null); setStep(2); }}>
                                <Text style={styles.optionIcon}>{craft.icon}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.optionName}>{craft.name}</Text>
                                    <Text style={styles.optionSub}>2-3 hour session</Text>
                                </View>
                                <Text style={styles.chevron}>›</Text>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            )}

            {/* Step 2 */}
            {step === 2 && (
                <View>
                    <TouchableOpacity onPress={() => setStep(1)}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
                    <Text style={styles.stepTitle}>Choose your Artisan</Text>
                    {filteredArtisans.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyText}>No artisans available for this craft.</Text>
                            <TouchableOpacity onPress={() => setStep(1)}><Text style={styles.linkText}>Choose another craft</Text></TouchableOpacity>
                        </View>
                    ) : filteredArtisans.map(artisan => {
                        const artisanId = artisan._id || artisan.id;
                        return (
                            <TouchableOpacity key={artisanId} style={[styles.optionCard, selectedArtisan === artisanId && styles.optionSelected]}
                                onPress={() => { setSelectedArtisan(artisanId); setStep(3); }}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{artisan.initials || artisan.fullName?.[0] || 'A'}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.optionName}>{artisan.fullName}</Text>
                                    <Text style={styles.optionSub}>📍 {artisan.address?.city || artisan.address?.district || 'Sri Lanka'}</Text>
                                </View>
                                <View style={styles.ratingBadge}><Text style={styles.ratingText}>★ {artisan.rating || 'New'}</Text></View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* Step 3 */}
            {step === 3 && (
                <View>
                    <TouchableOpacity onPress={() => setStep(2)}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
                    <Text style={styles.stepTitle}>Select Date & Time</Text>
                    <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                    <TextInput
                        style={styles.input}
                        value={selectedDate}
                        onChangeText={setSelectedDate}
                        placeholder="e.g. 2026-05-10"
                        placeholderTextColor="#aaa"
                    />
                    <Text style={styles.label}>Available Slots</Text>
                    <View style={styles.timeGrid}>
                        {AVAILABLE_TIMES.map(slot => (
                            <TouchableOpacity key={slot.id} style={[styles.timeSlot, selectedTime === slot.id && styles.timeSlotSelected]}
                                onPress={() => setSelectedTime(slot.id)}>
                                <Text style={[styles.timeSlotTime, selectedTime === slot.id && styles.timeSlotTextSelected]}>{slot.time}</Text>
                                <Text style={[styles.timeSlotLabel, selectedTime === slot.id && styles.timeSlotTextSelected]}>{slot.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={[styles.nextBtn, (!selectedDate || !selectedTime) && styles.nextBtnDisabled]}
                        disabled={!selectedDate || !selectedTime}
                        onPress={() => setStep(4)}>
                        <Text style={styles.nextBtnText}>Continue →</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Step 4 */}
            {step === 4 && (
                <View>
                    <TouchableOpacity onPress={() => setStep(3)}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
                    <Text style={styles.stepTitle}>Your Details</Text>

                    <Text style={styles.label}>Full Name</Text>
                    <TextInput style={[styles.input, styles.inputReadOnly]} value={formData.name} editable={false} />

                    <Text style={styles.label}>Email</Text>
                    <TextInput style={[styles.input, styles.inputReadOnly]} value={formData.email} editable={false} />

                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput style={styles.input} value={formData.phone}
                        onChangeText={v => setFormData({ ...formData, phone: v })}
                        placeholder="0771234567" placeholderTextColor="#aaa" keyboardType="phone-pad" />

                    <Text style={styles.label}>Group Size</Text>
                    <View style={styles.groupRow}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <TouchableOpacity key={n} style={[styles.groupBtn, formData.groupSize === n && styles.groupBtnSelected]}
                                onPress={() => setFormData({ ...formData, groupSize: n })}>
                                <Text style={[styles.groupBtnText, formData.groupSize === n && styles.groupBtnTextSelected]}>{n}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={[styles.submitBtn, isSubmitting && styles.nextBtnDisabled]}
                        onPress={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Confirm Booking</Text>}
                    </TouchableOpacity>
                    <Text style={styles.termsText}>By booking, you agree to our Terms of Service.</Text>
                </View>
            )}
        </ScrollView>
    );
}
const AVAILABLE_TIMES = [
    { id: 't1', time: '09:00 AM', label: 'Morning Session' },
    { id: 't2', time: '11:00 AM', label: 'Late Morning' },
    { id: 't3', time: '02:00 PM', label: 'Afternoon Session' },
    { id: 't4', time: '04:00 PM', label: 'Evening Session' },
];

const PRIMARY = '#2F5D50';
const ACCENT = '#BC3908';

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    container: { flex: 1, backgroundColor: '#f8f7f4' },
    content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
    pageTitle: { fontSize: 28, fontWeight: '900', color: PRIMARY, marginBottom: 20, textAlign: 'center' },
    stepBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    stepItem: { alignItems: 'center', flex: 1 },
    stepCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    stepActive: { backgroundColor: PRIMARY },
    stepDone: { backgroundColor: '#22c55e' },
    stepInactive: { backgroundColor: '#e5e7eb' },
    stepNum: { color: '#fff', fontWeight: '700', fontSize: 13 },
    stepLabel: { fontSize: 10, color: '#888', textAlign: 'center' },
    stepTitle: { fontSize: 20, fontWeight: '800', color: PRIMARY, marginBottom: 16 },
    backBtn: { color: '#888', fontSize: 14, fontWeight: '700', marginBottom: 12 },
    optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 14, padding: 14, marginBottom: 10, gap: 12 },
    optionSelected: { borderColor: ACCENT, backgroundColor: '#fff8f6' },
    optionIcon: { fontSize: 28 },
    optionName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
    optionSub: { fontSize: 12, color: '#888', marginTop: 2 },
    chevron: { fontSize: 22, color: '#ccc' },
    avatar: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 18, fontWeight: '700', color: '#888' },
    ratingBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    ratingText: { fontSize: 12, fontWeight: '700', color: '#16a34a' },
    emptyBox: { alignItems: 'center', padding: 32 },
    emptyText: { color: '#888', marginBottom: 8 },
    linkText: { color: ACCENT, fontWeight: '700' },
    label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
    input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 14, color: '#1a1a1a', marginBottom: 16 },
    inputReadOnly: { backgroundColor: '#f3f4f6', color: '#888' },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    timeSlot: { width: '47%', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, alignItems: 'center', backgroundColor: '#fff' },
    timeSlotSelected: { borderColor: ACCENT, backgroundColor: ACCENT },
    timeSlotTime: { fontSize: 15, fontWeight: '700', color: '#333' },
    timeSlotLabel: { fontSize: 11, color: '#888', marginTop: 2 },
    timeSlotTextSelected: { color: '#fff' },
    nextBtn: { backgroundColor: PRIMARY, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
    nextBtnDisabled: { opacity: 0.5 },
    nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    groupRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    groupBtn: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    groupBtnSelected: { backgroundColor: PRIMARY, borderColor: PRIMARY },
    groupBtnText: { fontSize: 14, color: '#555' },
    groupBtnTextSelected: { color: '#fff', fontWeight: '700' },
    submitBtn: { backgroundColor: ACCENT, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
    submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    termsText: { textAlign: 'center', color: '#aaa', fontSize: 11, marginTop: 12 },
    successContainer: { flexGrow: 1, padding: 24, paddingTop: 80, alignItems: 'center' },
    successIcon: { marginBottom: 16 },
    successTitle: { fontSize: 28, fontWeight: '900', color: PRIMARY, marginBottom: 8 },
    successMsg: { color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
    summaryBox: { backgroundColor: '#f8f7f4', borderRadius: 16, padding: 20, width: '100%', marginBottom: 24 },
    summaryRow: { fontSize: 14, color: '#666', marginBottom: 8 },
    summaryVal: { fontWeight: '700', color: PRIMARY },
    homeBtn: { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 },
    homeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    loginTitle: { fontSize: 24, fontWeight: '900', color: PRIMARY, marginBottom: 8 },
    loginMsg: { color: '#666', textAlign: 'center', marginBottom: 24 },
    loginBtn: { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 },
    loginBtnText: { color: '#fff', fontWeight: '700' },
});