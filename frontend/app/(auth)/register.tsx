import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, type as t } from '@/src/theme/tokens';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useAuth } from '@/src/context/AuthContext';

export default function Register() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [full_name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (password.length < 6) return setErr('Password must be at least 6 characters');
    setLoading(true);
    try {
      await signUp(email.trim(), password, full_name.trim(), phone.trim() || undefined);
    } catch (e: any) {
      setErr(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="register-screen">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Join Gharana</Text>
          <Text style={styles.subtitle}>Real food, delivered honestly.</Text>

          <Text style={styles.label}>Full name</Text>
          <TextInput testID="register-name" value={full_name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.dustLight} style={styles.input} />

          <Text style={styles.label}>Email</Text>
          <TextInput testID="register-email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@home.in" placeholderTextColor={colors.dustLight} style={styles.input} />

          <Text style={styles.label}>Phone</Text>
          <TextInput testID="register-phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+91 …" placeholderTextColor={colors.dustLight} style={styles.input} />

          <Text style={styles.label}>Password</Text>
          <TextInput testID="register-password" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 6 characters" placeholderTextColor={colors.dustLight} style={styles.input} />

          {err && <Text style={styles.error} testID="register-error">{err}</Text>}

          <PrimaryButton title="Create account" onPress={submit} loading={loading} testID="register-submit" />
          <Pressable testID="go-to-login" onPress={() => router.replace('/(auth)/login')} style={{ alignSelf: 'center', marginTop: spacing.lg }}>
            <Text style={styles.link}>Already have an account? <Text style={styles.linkStrong}>Sign in</Text></Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  title: { ...t.h1, marginTop: spacing.xl },
  subtitle: { ...t.body, color: colors.dust, marginBottom: spacing.lg },
  label: { ...t.small, color: colors.dust, marginTop: spacing.sm, marginBottom: 2 },
  input: {
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 15, color: colors.earth, marginBottom: 4,
  },
  error: { color: colors.error, marginVertical: 8, fontSize: 13 },
  link: { ...t.body, color: colors.dust },
  linkStrong: { color: colors.saffronDark, fontWeight: '700' },
});
