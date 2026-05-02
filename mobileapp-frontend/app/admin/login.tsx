import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function AdminLoginScreen() {
  const router = useRouter();
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      await adminLogin(email.trim(), password);
      router.replace('/admin/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Header */}
          <View style={s.logoSection}>
            <View style={s.logoBox}>
              <Shield size={32} color="#C9A227" />
            </View>
            <Text style={s.logoTitle}>Lanka Crafts</Text>
            <Text style={s.logoSubtitle}>Admin Portal</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Administrator Sign In</Text>
            <Text style={s.cardSub}>Secure access for platform administrators only</Text>

            {/* Email */}
            <View style={s.fieldGroup}>
              <Text style={s.label}>Email Address</Text>
              <View style={s.inputRow}>
                <Mail size={16} color="#9CA3AF" style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="admin@lankacrafts.lk"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={s.fieldGroup}>
              <Text style={s.label}>Password</Text>
              <View style={s.inputRow}>
                <Lock size={16} color="#9CA3AF" style={s.inputIcon} />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={s.eyeBtn}>
                  {showPassword
                    ? <EyeOff size={16} color="#9CA3AF" />
                    : <Eye size={16} color="#9CA3AF" />
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[s.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#2F5D50" />
                : <Text style={s.loginBtnText}>Sign In to Admin Panel</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Back link */}
          <TouchableOpacity onPress={() => router.back()} style={s.backLink}>
            <Text style={s.backLinkText}>← Back to main app</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#2F5D50' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  logoSection: { alignItems: 'center', paddingTop: 48, paddingBottom: 36 },
  logoBox: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: '#2F5D50',
    borderWidth: 2, borderColor: '#C9A227', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  logoTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  logoSubtitle: {
    fontSize: 12, fontWeight: '700', color: '#C9A227',
    textTransform: 'uppercase', letterSpacing: 3, marginTop: 4,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#1E1E1E', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#9CA3AF', marginBottom: 24 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 12, backgroundColor: '#F9FAFB',
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 14, color: '#1E1E1E' },
  eyeBtn: { padding: 4 },
  loginBtn: {
    backgroundColor: '#C9A227', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  loginBtnText: { fontSize: 15, fontWeight: '800', color: '#2F5D50' },
  backLink: { alignItems: 'center', marginTop: 24 },
  backLinkText: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
});
