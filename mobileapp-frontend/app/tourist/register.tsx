import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { INTERESTS, REGIONS, COUNTRIES, LANGUAGES } from '../../src/constants/touristConstants';
import { BatikBackground } from '../../src/components/BatikBackground';
import {
  User, Contact, Mail, Lock, Check, Globe,
  CreditCard, Calendar, Home, MapPin, ArrowRight, ArrowLeft,
} from 'lucide-react-native';

const STEP_LABELS = ['Account Setup', 'Personal Info', 'Your Interests'];

export default function TouristRegisterScreen() {
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [s1, setS1] = useState({ fullName: '', callingName: '', email: '', password: '', confirmPassword: '', country: '' });
  const [s2, setS2] = useState({ idNumber: '', dateOfBirth: '', addressLine1: '', addressLine2: '', city: '', postalCode: '' });

  const { register } = useAuth();
  const router = useRouter();

  const isSriLankan = s1.country === 'Sri Lanka';
  const isValidNIC = !isSriLankan || !s2.idNumber || /^[0-9]{9}[vVxX]$/.test(s2.idNumber) || /^[0-9]{12}$/.test(s2.idNumber);

  const toggle = (arr: string[], setArr: (v: string[]) => void, id: string) =>
    setArr(arr.includes(id) ? arr.filter(i => i !== id) : [...arr, id]);

  const passwordStrength = () => {
    const p = s1.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };
  const strength = passwordStrength();
  const strengthColors = ['#F87171', '#FB923C', '#FACC15', '#22C55E'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const handleSubmit = async () => {
    if (!agreed) return;
    setSubmitting(true);
    setApiError('');
    try {
      await register(s1.email, s1.password, {
        fullName: s1.fullName, callingName: s1.callingName, country: s1.country,
        preferredLanguages: selectedLanguages, idNumber: s2.idNumber,
        dateOfBirth: s2.dateOfBirth || undefined,
        address: { line1: s2.addressLine1, line2: s2.addressLine2, city: s2.city, postalCode: s2.postalCode },
        interests: selectedInterests, preferredRegions: selectedRegions,
      });
      router.replace('/tourist/login');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Registration failed.';
      setApiError(msg.includes('email-already-in-use') ? 'An account with this email already exists.' : msg);
    } finally {
      setSubmitting(false);
    }
  };

  const progressWidth = step === 1 ? '33%' : step === 2 ? '66%' : '100%';

  return (
    <SafeAreaView style={st.safe}>
      <BatikBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Step indicator */}
          <View style={st.stepRow}>
            {STEP_LABELS.map((label, idx) => {
              const sn = idx + 1;
              const done = step > sn;
              const cur = step === sn;
              return (
                <View key={label} style={st.stepItem}>
                  <View style={[st.stepDot, done && st.stepDotDone, cur && st.stepDotCur]}>
                    {done ? <Check size={12} color="#fff" /> : <Text style={[st.stepDotText, cur && { color: '#C65D3B' }]}>{sn}</Text>}
                  </View>
                  <Text style={[st.stepLabel, cur && { color: '#1E1E1E' }]}>{label}</Text>
                </View>
              );
            })}
          </View>

          {/* Progress bar */}
          <View style={st.progBg}><View style={[st.progFill, { width: progressWidth as any }]} /></View>

          {apiError ? <View style={st.errorBox}><Text style={st.errorText}>{apiError}</Text></View> : null}

          {/* STEP 1 */}
          {step === 1 && (
            <View style={st.card}>
              <Text style={st.title}>Create Your Account</Text>
              <Text style={st.subtitle}>Join thousands of cultural explorers</Text>

              <InputField icon={<User size={18} color="#9CA3AF" />} label="Full Name" placeholder="Arjun Tennakoon" value={s1.fullName} onChangeText={(v: string) => setS1({ ...s1, fullName: v })} />
              <InputField icon={<Contact size={18} color="#9CA3AF" />} label="Calling Name" placeholder="Arjun" value={s1.callingName} onChangeText={(v: string) => setS1({ ...s1, callingName: v })} />
              <InputField icon={<Mail size={18} color="#9CA3AF" />} label="Email Address" placeholder="you@example.com" value={s1.email} onChangeText={(v: string) => setS1({ ...s1, email: v })} keyboardType="email-address" autoCapitalize="none" />
              <InputField icon={<Lock size={18} color="#9CA3AF" />} label="Password" placeholder="••••••••" value={s1.password} onChangeText={(v: string) => setS1({ ...s1, password: v })} secure={!showPassword} />
              {s1.password ? (
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                  {[0,1,2,3].map(i => <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i < strength ? strengthColors[strength - 1] : '#E5E7EB' }} />)}
                  <Text style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 8 }}>{strength > 0 ? strengthLabels[strength - 1] : ''}</Text>
                </View>
              ) : null}
              <InputField icon={<Check size={18} color="#9CA3AF" />} label="Confirm Password" placeholder="••••••••" value={s1.confirmPassword} onChangeText={(v: string) => setS1({ ...s1, confirmPassword: v })} secure />
              {s1.confirmPassword ? <Text style={{ fontSize: 11, color: s1.password === s1.confirmPassword ? '#22C55E' : '#EF4444', marginBottom: 12 }}>{s1.password === s1.confirmPassword ? '✓ Passwords match' : '✗ Do not match'}</Text> : null}

              {/* Country picker */}
              <Text style={st.inputLabel}>Country</Text>
              <TouchableOpacity style={st.inputWrap} onPress={() => setShowCountryPicker(!showCountryPicker)}>
                <Globe size={18} color="#9CA3AF" style={{ marginLeft: 14 }} />
                <Text style={[st.input, { paddingVertical: 14, color: s1.country ? '#1E1E1E' : '#C0C0C0' }]}>{s1.country || 'Select your country'}</Text>
              </TouchableOpacity>
              {showCountryPicker && (
                <View style={st.pickerList}>
                  {COUNTRIES.map(c => (
                    <TouchableOpacity key={c} style={st.pickerItem} onPress={() => { setS1({ ...s1, country: c }); setShowCountryPicker(false); }}>
                      <Text style={[st.pickerItemText, s1.country === c && { color: '#C65D3B', fontWeight: '700' }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Languages */}
              <Text style={[st.inputLabel, { marginTop: 16 }]}>Preferred Languages</Text>
              <View style={st.chipRow}>
                {LANGUAGES.map(lang => {
                  const sel = selectedLanguages.includes(lang);
                  return (
                    <TouchableOpacity key={lang} style={[st.chip, sel && st.chipSel]} onPress={() => toggle(selectedLanguages, setSelectedLanguages, lang)}>
                      <Text style={[st.chipText, sel && st.chipTextSel]}>{lang}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[st.primaryBtn, { opacity: (!s1.fullName || !s1.email || !s1.password || !s1.country || s1.password !== s1.confirmPassword) ? 0.5 : 1 }]}
                disabled={!s1.fullName || !s1.email || !s1.password || !s1.country || s1.password !== s1.confirmPassword}
                onPress={() => setStep(2)}
              >
                <Text style={st.primaryBtnText}>Continue</Text>
                <ArrowRight size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <View style={st.card}>
              <Text style={st.title}>Personal Information</Text>
              <Text style={st.subtitle}>Verify your identity and personalise your experience</Text>

              <InputField icon={<CreditCard size={18} color="#9CA3AF" />} label={isSriLankan ? 'NIC Number' : 'Passport Number'} placeholder={isSriLankan ? '199012345678' : 'A12345678'} value={s2.idNumber} onChangeText={(v: string) => setS2({ ...s2, idNumber: v })} />
              {isSriLankan && s2.idNumber && !isValidNIC && <Text style={{ fontSize: 11, color: '#EF4444', marginBottom: 8 }}>Invalid NIC format</Text>}

              <InputField icon={<Calendar size={18} color="#9CA3AF" />} label="Date of Birth" placeholder="YYYY-MM-DD" value={s2.dateOfBirth} onChangeText={(v: string) => setS2({ ...s2, dateOfBirth: v })} />
              <InputField icon={<Home size={18} color="#9CA3AF" />} label="Address Line 1" placeholder="Street, House No." value={s2.addressLine1} onChangeText={(v: string) => setS2({ ...s2, addressLine1: v })} />
              <InputField label="Address Line 2 (optional)" placeholder="Apartment, Suite" value={s2.addressLine2} onChangeText={(v: string) => setS2({ ...s2, addressLine2: v })} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}><InputField icon={<MapPin size={18} color="#9CA3AF" />} label="City" placeholder="City" value={s2.city} onChangeText={(v: string) => setS2({ ...s2, city: v })} /></View>
                <View style={{ flex: 1 }}><InputField label="Postal Code" placeholder="10100" value={s2.postalCode} onChangeText={(v: string) => setS2({ ...s2, postalCode: v })} /></View>
              </View>

              <View style={st.btnRow}>
                <TouchableOpacity style={st.backBtn} onPress={() => setStep(1)}><ArrowLeft size={16} color="#6B7280" /><Text style={st.backBtnText}>Back</Text></TouchableOpacity>
                <TouchableOpacity
                  style={[st.primaryBtn, { flex: 1, opacity: (!s2.idNumber || !s2.addressLine1 || !s2.city || !isValidNIC) ? 0.5 : 1 }]}
                  disabled={!s2.idNumber || !s2.addressLine1 || !s2.city || !isValidNIC}
                  onPress={() => setStep(3)}
                >
                  <Text style={st.primaryBtnText}>Continue</Text><ArrowRight size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <View style={st.card}>
              <Text style={st.title}>Your Interests</Text>
              <Text style={st.subtitle}>Help us personalise your experience</Text>

              <Text style={st.inputLabel}>Cultural Interests</Text>
              <View style={st.chipRow}>
                {INTERESTS.map(({ id, label, emoji }) => {
                  const sel = selectedInterests.includes(id);
                  return (
                    <TouchableOpacity key={id} style={[st.chip, sel && st.chipSel]} onPress={() => toggle(selectedInterests, setSelectedInterests, id)}>
                      <Text style={[st.chipText, sel && st.chipTextSel]}>{emoji} {label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[st.inputLabel, { marginTop: 20 }]}>Preferred Regions</Text>
              <View style={st.chipRow}>
                {REGIONS.map(({ id, label, emoji }) => {
                  const sel = selectedRegions.includes(id);
                  return (
                    <TouchableOpacity key={id} style={[st.chip, sel && { ...st.chipSel, backgroundColor: '#2F5D50', borderColor: '#2F5D50' }]} onPress={() => toggle(selectedRegions, setSelectedRegions, id)}>
                      <Text style={[st.chipText, sel && st.chipTextSel]}>{emoji} {label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Terms */}
              <TouchableOpacity style={st.termsRow} onPress={() => setAgreed(!agreed)}>
                <View style={[st.checkbox, agreed && st.checkboxChecked]}>{agreed && <Check size={12} color="#fff" />}</View>
                <Text style={st.termsText}>I agree to the Terms of Service and Privacy Policy</Text>
              </TouchableOpacity>

              <View style={st.btnRow}>
                <TouchableOpacity style={st.backBtn} onPress={() => setStep(2)}><ArrowLeft size={16} color="#6B7280" /><Text style={st.backBtnText}>Back</Text></TouchableOpacity>
                <TouchableOpacity
                  style={[st.primaryBtn, { flex: 1, opacity: (!agreed || submitting) ? 0.5 : 1 }]}
                  disabled={!agreed || submitting}
                  onPress={handleSubmit}
                >
                  {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.primaryBtnText}>Create Account</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Footer links */}
          <View style={st.footerRow}>
            <Text style={st.footerGray}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/tourist/login')}><Text style={st.footerLink}>Sign in</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Reusable input field component
function InputField({ icon, label, placeholder, value, onChangeText, secure, keyboardType, autoCapitalize }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={st.inputLabel}>{label}</Text> : null}
      <View style={st.inputWrap}>
        {icon && <View style={{ marginLeft: 14 }}>{icon}</View>}
        <TextInput
          style={[st.input, !icon && { paddingLeft: 16 }]}
          placeholder={placeholder}
          placeholderTextColor="#C0C0C0"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ddede7' },
  scroll: { padding: 20, paddingBottom: 48 },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepDotDone: { backgroundColor: '#22C55E' },
  stepDotCur: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#C65D3B' },
  stepDotText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  stepLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  progBg: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  progFill: { height: 4, backgroundColor: '#C65D3B', borderRadius: 2 },
  errorBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 13, color: '#DC2626' },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E1E1E', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#9CA3AF', marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#1E1E1E', marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, backgroundColor: '#fff' },
  input: { flex: 1, paddingVertical: 13, paddingHorizontal: 12, fontSize: 14, color: '#1E1E1E' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  chipSel: { backgroundColor: '#C65D3B', borderColor: '#C65D3B' },
  chipText: { fontSize: 13, color: '#1E1E1E', fontWeight: '500' },
  chipTextSel: { color: '#fff' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#C65D3B', paddingVertical: 14, borderRadius: 14, marginTop: 16 },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  backBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 20, marginBottom: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#C65D3B', borderColor: '#C65D3B' },
  termsText: { fontSize: 13, color: '#6B7280', flex: 1, lineHeight: 18 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerGray: { fontSize: 13, color: '#9CA3AF' },
  footerLink: { fontSize: 13, fontWeight: '700', color: '#C65D3B' },
  pickerList: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', maxHeight: 200, marginBottom: 12 },
  pickerItem: { paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  pickerItemText: { fontSize: 14, color: '#1E1E1E' },
});
