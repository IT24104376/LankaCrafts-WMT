import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { CRAFT_TYPES } from '../../src/constants/craftConstants';
import { BatikBackground } from '../../src/components/BatikBackground';
import {
  User, Contact, Mail, Lock, Check, Globe,
  CreditCard, Calendar, Home, MapPin, ArrowRight, ArrowLeft, Eye, EyeOff,
} from 'lucide-react-native';
const STEP_LABELS = ['Account Setup', 'Profile Details', 'Location'];

export default function ArtistRegisterScreen() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const insets = useSafeAreaInsets();

  // Step 1 - Account
  const [s1, setS1] = useState({ fullName: '', callingName: '', email: '', password: '', confirmPassword: '' });
  // Step 2 - Profile
  const [s2, setS2] = useState({ craftType: '', phone: '', bio: '' });
   // Step 3 - Location
   const [s3, setS3] = useState({ number: '', street: '', village: '', city: '', district: '', province: '', postalCode: '' });

  const { registerArtist } = useAuth();
  const router = useRouter();

  // Field error states
  const [errors, setErrors] = useState<Record<string, string>>({});

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

   const [provinceOpen, setProvinceOpen] = useState(false);
   const [districtOpen, setDistrictOpen] = useState(false);
   const [craftOpen, setCraftOpen] = useState(false);

   // Validate phone number - exactly 10 digits (Sri Lanka local format)
   const validatePhone = (phone: string): boolean => {
     const digitsOnly = phone.replace(/\D/g, '');
     return digitsOnly.length === 10;
   };

   const getPhoneError = (phone: string): string | null => {
     if (!phone) return null;
     const digitsOnly = phone.replace(/\D/g, '');
     if (digitsOnly.length === 0) return null;
     if (digitsOnly.length < 10) return 'Phone number must be 10 digits';
     if (digitsOnly.length > 10) return 'Phone number cannot exceed 10 digits';
     return null;
   };

   const districtsByProvince: Record<string, string[]> = {
     'Western': ['Colombo', 'Gampaha', 'Kalutara'],
     'Central': ['Kandy', 'Matale', 'Nuwara Eliya'],
     'Southern': ['Galle', 'Matara', 'Hambantota'],
     'Northern': ['Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu'],
     'Eastern': ['Batticaloa', 'Ampara', 'Trincomalee'],
     'North Western': ['Kurunegala', 'Puttalam'],
     'North Central': ['Anuradhapura', 'Polonnaruwa'],
     'Uva': ['Badulla', 'Moneragala'],
     'Sabaragamuwa': ['Ratnapura', 'Kegalle'],
   };

   const validateStep = () => {
     setApiError('');
     const newErrors: Record<string, string> = {};

     if (step === 1) {
       if (!s1.fullName) newErrors.fullName = 'Full name is required';
       if (!s1.email) newErrors.email = 'Email is required';
       else if (!/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(s1.email)) newErrors.email = 'Invalid email address';
       if (!s1.password) newErrors.password = 'Password is required';
       if (!s1.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
       else if (s1.password !== s1.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
       if (strength < 2 && s1.password) newErrors.password = 'Password too weak (min 8 chars, uppercase, number, symbol)';
       if (!s1.callingName.trim()) newErrors.callingName = 'Calling name is required';

       setErrors(newErrors);
       return Object.keys(newErrors).length === 0;
     }
      if (step === 2) {
        if (!s2.craftType) {
          newErrors.craftType = 'Please select your craft type';
        }
        const phoneError = getPhoneError(s2.phone);
        if (phoneError) {
          newErrors.phone = phoneError;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      }
      if (step === 3) {
        if (!s3.number) newErrors.number = 'Street number is required';
        if (!s3.street) newErrors.street = 'Street name is required';
        if (!s3.city) newErrors.city = 'City is required';
        if (!s3.district) newErrors.district = 'District is required';
        if (!s3.province) newErrors.province = 'Province is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      }
     return true;
   };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    setApiError('');
    try {
      await registerArtist(s1.email, s1.password, {
        fullName: s1.fullName,
        callingName: s1.callingName,
        email: s1.email,
        craftType: s2.craftType,
        phone: s2.phone || '',
        bio: s2.bio || '',
        address: {
          number: s3.number,
          street: s3.street,
          village: s3.village || '',
          city: s3.city,
          district: s3.district,
          province: s3.province,
          postalCode: s3.postalCode || '',
        },
      });
      router.replace('/artist/login');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Registration failed.';
      setApiError(msg.includes('already exists') ? 'An account with this email already exists.' : msg);
    } finally {
      setLoading(false);
    }
  };

  const progressWidth = step === 1 ? '33%' : step === 2 ? '66%' : '100%';

  return (
    <View style={st.safe}>
      <BatikBackground />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[st.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Back button */}
          <TouchableOpacity style={st.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft size={20} color="#2F5D50" />
            <Text style={st.backText}>Back</Text>
          </TouchableOpacity>

          <View style={st.card}>
            {/* Progress */}
            <View style={st.stepRow}>
              {STEP_LABELS.map((label, idx) => {
                const sn = idx + 1;
                const done = step > sn;
                const cur = step === sn;
                return (
                  <View key={label} style={st.stepItem}>
                    <View style={[st.stepDot, done && st.stepDotDone, cur && st.stepDotCur]}>
                      {done ? <Check size={12} color="#fff" /> : <Text style={[st.stepDotText, cur && { color: '#2F5D50' }]}>{sn}</Text>}
                    </View>
                    <Text style={[st.stepLabel, cur && { color: '#1E1E1E' }]}>{label}</Text>
                  </View>
                );
              })}
            </View>
            <View style={st.progBg}><View style={[st.progFill, { width: progressWidth as any }]} /></View>

            {apiError ? <View style={st.errorBox}><Text style={st.errorText}>{apiError}</Text></View> : null}

             {/* STEP 1 */}
             {step === 1 && (
                <>
                  <Text style={st.title}>Create Artist Account</Text>
                  <Text style={st.subtitle}>Join Sri Lanka's craft community</Text>

                  <InputField icon={<User size={18} color="#9CA3AF" />} label="Full Name" placeholder="Enter your full name" value={s1.fullName} onChangeText={(v: string) => { setS1({ ...s1, fullName: v }); setErrors({ ...errors, fullName: '' }); }} error={errors.fullName} />
                  <InputField icon={<User size={18} color="#9CA3AF" />} label="Calling Name" placeholder="How you'd like to be called" value={s1.callingName} onChangeText={(v: string) => { setS1({ ...s1, callingName: v }); setErrors({ ...errors, callingName: '' }); }} error={errors.callingName} />
                  <InputField icon={<Mail size={18} color="#9CA3AF" />} label="Email Address" placeholder="you@example.com" value={s1.email} onChangeText={(v: string) => { setS1({ ...s1, email: v }); setErrors({ ...errors, email: '' }); }} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
                   <InputField
                     icon={<Lock size={18} color="#9CA3AF" />}
                     label="Password"
                     placeholder="Min. 8 characters"
                     value={s1.password}
                     onChangeText={(v: string) => { setS1({ ...s1, password: v }); setErrors({ ...errors, password: '' }); }}
                     secure={!showPassword}
                     error={errors.password}
                     rightIcon={
                       <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                         {showPassword ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
                       </TouchableOpacity>
                     }
                   />
                  {s1.password ? (
                    <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                      {[0, 1, 2, 3].map(i => <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i < strength ? strengthColors[strength - 1] : '#E5E7EB' }} />)}
                      <Text style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 8 }}>{strength > 0 ? strengthLabels[strength - 1] : ''}</Text>
                    </View>
                  ) : null}
                   <InputField
                     icon={<Check size={18} color="#9CA3AF" />}
                     label="Confirm Password"
                     placeholder="Re-enter password"
                     value={s1.confirmPassword}
                     onChangeText={(v: string) => { setS1({ ...s1, confirmPassword: v }); setErrors({ ...errors, confirmPassword: '' }); }}
                     secure={!showConfirmPassword}
                     error={errors.confirmPassword}
                     rightIcon={
                       <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                         {showConfirmPassword ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
                       </TouchableOpacity>
                     }
                   />

                  <TouchableOpacity
                    style={[st.primaryBtn, { opacity: (!s1.fullName || !s1.callingName || !s1.email || !s1.password || !s1.confirmPassword || strength < 2) ? 0.5 : 1 }]}
                    disabled={!s1.fullName || !s1.callingName || !s1.email || !s1.password || !s1.confirmPassword || strength < 2}
                    onPress={() => { setStep(2); }}
                  >
                    <Text style={st.primaryBtnText}>Next</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <>
                  <Text style={st.title}>Your Craft Details</Text>
                  <Text style={st.subtitle}>Tell us about your traditional craft</Text>

                  <View style={st.pickerContainer}>
                    <Text style={st.inputLabel}>Craft Type *</Text>
                    <TouchableOpacity style={[st.inputWrap, errors.craftType && st.inputWrapError]} onPress={() => setCraftOpen(!craftOpen)}>
                      <Text style={[st.input, { color: s2.craftType ? '#1E1E1E' : '#C0C0C0' }]}>{s2.craftType || 'Select your craft'}</Text>
                    </TouchableOpacity>
                     {craftOpen && (
                       <ScrollView style={st.pickerList} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                         {CRAFT_TYPES.map(c => (
                           <TouchableOpacity key={c} style={st.pickerItem} onPress={() => { setS2({ ...s2, craftType: c }); setCraftOpen(false); setErrors({ ...errors, craftType: '' }); }}>
                             <Text style={[st.pickerItemText, s2.craftType === c && { color: '#2F5D50', fontWeight: '700' }]}>{c}</Text>
                           </TouchableOpacity>
                         ))}
                       </ScrollView>
                     )}
                    {errors.craftType && <Text style={st.errorTextSmall}>{errors.craftType}</Text>}
                  </View>

                  <InputField
                    icon={<Contact size={18} color="#9CA3AF" />}
                    label="Phone Number (optional)"
                    placeholder="0712345678"
                    value={s2.phone}
                    onChangeText={(v: string) => {
                      // Allow only digits, limit to 10
                      const digits = v.replace(/\D/g, '').slice(0, 10);
                      setS2({ ...s2, phone: digits });
                      setErrors({ ...errors, phone: '' });
                    }}
                    keyboardType="phone-pad"
                    error={errors.phone}
                  />
                   <View style={{ marginBottom: 12 }}>
                     <Text style={st.inputLabel}>Bio (optional)</Text>
                     <View style={st.inputWrap}>
                       <TextInput
                         style={[st.input, { height: 100, paddingTop: 14, textAlignVertical: 'top' }]}
                         placeholder="Tell us about your craft experience..."
                         placeholderTextColor="#C0C0C0"
                         value={s2.bio}
                         onChangeText={(v: string) => setS2({ ...s2, bio: v })}
                         multiline
                       />
                     </View>
                   </View>

                  <View style={st.btnRow}>
                    <TouchableOpacity style={st.backBtn} onPress={() => setStep(1)}><ArrowLeft size={16} color="#6B7280" /><Text style={st.backBtnText}>Back</Text></TouchableOpacity>
                    <TouchableOpacity
                      style={[st.primaryBtn, { flex: 1, opacity: !s2.craftType ? 0.5 : 1 }]}
                      disabled={!s2.craftType || !!errors.phone}
                      onPress={() => { setErrors({}); setStep(3); }}
                    >
                      <Text style={st.primaryBtnText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

               {/* STEP 3 */}
               {step === 3 && (
                 <>
                   <Text style={st.title}>Your Location</Text>
                   <Text style={st.subtitle}>Help tourists find your workshop</Text>

                   <InputField label="Street Number" placeholder="No. 123" value={s3.number} onChangeText={(v: string) => { setS3({ ...s3, number: v }); setErrors({ ...errors, number: '' }); }} error={errors.number} />
                   <InputField label="Street" placeholder="Main Street" value={s3.street} onChangeText={(v: string) => { setS3({ ...s3, street: v }); setErrors({ ...errors, street: '' }); }} error={errors.street} />
                   <InputField label="Village (optional)" placeholder="Galle Fort" value={s3.village} onChangeText={(v: string) => { setS3({ ...s3, village: v }); setErrors({ ...errors, village: '' }); }} />

                   <InputField label="City / Town" placeholder="Colombo" value={s3.city} onChangeText={(v: string) => { setS3({ ...s3, city: v }); setErrors({ ...errors, city: '' }); }} error={errors.city} />

                   <View style={st.pickerContainer}>
                     <Text style={st.inputLabel}>District *</Text>
                     <TouchableOpacity style={[st.inputWrap, errors.district && st.inputWrapError]} onPress={() => setDistrictOpen(!districtOpen)}>
                       <Text style={[st.input, { color: s3.district ? '#1E1E1E' : '#C0C0C0' }]}>{s3.district || 'Select district'}</Text>
                     </TouchableOpacity>
                     {districtOpen && (
                       <ScrollView style={st.pickerList} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                         {s3.province && districtsByProvince[s3.province]?.map(d => (
                           <TouchableOpacity key={d} style={st.pickerItem} onPress={() => {
                             setS3({ ...s3, district: d });
                             setDistrictOpen(false);
                             setErrors({ ...errors, district: '' });
                           }}>
                             <Text style={[st.pickerItemText, s3.district === d && { color: '#2F5D50', fontWeight: '700' }]}>{d}</Text>
                           </TouchableOpacity>
                         ))}
                       </ScrollView>
                     )}
                     {errors.district && <Text style={st.errorTextSmall}>{errors.district}</Text>}
                   </View>

                   <View style={st.pickerContainer}>
                     <Text style={st.inputLabel}>Province *</Text>
                     <TouchableOpacity style={[st.inputWrap, errors.province && st.inputWrapError]} onPress={() => setProvinceOpen(!provinceOpen)}>
                       <Text style={[st.input, { color: s3.province ? '#1E1E1E' : '#C0C0C0' }]}>{s3.province || 'Select province'}</Text>
                     </TouchableOpacity>
                   {provinceOpen && (
                     <ScrollView style={st.pickerList} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                          {['Western', 'Central', 'Southern', 'Northern', 'Eastern', 'North Western', 'North Central', 'Uva', 'Sabaragamuwa'].map(p => (
                            <TouchableOpacity key={p} style={st.pickerItem} onPress={() => {
                              setS3({ ...s3, province: p, district: '' });
                              setDistrictOpen(false);
                              setProvinceOpen(false);
                              setErrors({ ...errors, province: '', district: '' });
                            }}>
                              <Text style={[st.pickerItemText, s3.province === p && { color: '#2F5D50', fontWeight: '700' }]}>{p}</Text>
                            </TouchableOpacity>
                          ))}
                     </ScrollView>
                   )}
                     {errors.province && <Text style={st.errorTextSmall}>{errors.province}</Text>}
                   </View>

                   <InputField label="Postal Code" placeholder="00100" value={s3.postalCode} onChangeText={(v: string) => { setS3({ ...s3, postalCode: v }); setErrors({ ...errors, postalCode: '' }); }} keyboardType="number-pad" />

                   <TouchableOpacity
                     style={[st.primaryBtn, { opacity: (!s3.number || !s3.street || !s3.city || !s3.district || !s3.province) ? 0.5 : 1 }]}
                     disabled={!s3.number || !s3.street || !s3.city || !s3.district || !s3.province}
                     onPress={handleSubmit}
                   >
                     {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.primaryBtnText}>Complete Registration</Text>}
                   </TouchableOpacity>
                 </>
                )}

             <TouchableOpacity style={{ marginTop: 16, alignSelf: 'center' }} onPress={() => router.push('/login')}>
               <Text style={st.linkText}>Already have an account? <Text style={st.linkOrange}>Login</Text></Text>
             </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

 function InputField({ icon, label, error, secure, rightIcon, ...props }: { icon?: any; label: string; error?: string; secure?: boolean; rightIcon?: React.ReactNode; [key: string]: any }) {
     return (
       <>
         <Text style={st.inputLabel}>{label}</Text>
         <View style={[st.inputWrap, error && st.inputWrapError]}>
           {icon}
           <TextInput style={[st.input, !icon && { paddingLeft: 14 }, error && st.inputError, secure && { paddingRight: 44 }]} {...props} secureTextEntry={secure} />
           {rightIcon && <View style={st.rightIconWrapper}>{rightIcon}</View>}
         </View>
         {error && <Text style={st.errorTextSmall}>{error}</Text>}
       </>
     );
   }

  const st = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#ddede7' },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 40 },
    backText: { fontSize: 14, fontWeight: '600', color: '#2F5D50' },
    card: {
      backgroundColor: '#fff', borderRadius: 24, padding: 28,
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8,
    },
    title: { fontSize: 24, fontWeight: '800', color: '#1E1E1E', marginBottom: 4 },
    subtitle: { fontSize: 13, color: '#9CA3AF', marginBottom: 20 },
    stepRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    stepItem: { alignItems: 'center', flex: 1 },
    stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    stepDotDone: { backgroundColor: '#2F5D50' },
    stepDotCur: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#2F5D50' },
    stepDotText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
    stepLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
    progBg: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginBottom: 24 },
    progFill: { height: 4, backgroundColor: '#2F5D50', borderRadius: 2 },
    errorBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 16 },
    errorText: { fontSize: 13, color: '#DC2626' },
    errorTextSmall: { fontSize: 11, color: '#DC2626', marginTop: 4, marginLeft: 4 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#1E1E1E', marginBottom: 6, marginTop: 8 },
    inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, backgroundColor: '#fff', paddingHorizontal: 14 },
    inputWrapError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
     input: { flex: 1, fontSize: 15, color: '#1E1E1E', paddingVertical: 14, marginLeft: 10 },
     inputError: { color: '#DC2626' },
     rightIconWrapper: { position: 'absolute', right: 14 },
    pickerList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 999,
  },
   pickerItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
   pickerItemText: { fontSize: 15, color: '#374151' },
    btnRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    backBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    backBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginLeft: 6 },
    primaryBtn: { backgroundColor: '#2F5D50', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    linkText: { fontSize: 13, color: '#6B7280' },
    linkOrange: { color: '#2F5D50', fontWeight: '700' },
    pickerContainer: { position: 'relative', marginBottom: 12 },
  });