import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import { colors, radius, spacing, type as t } from '@/src/theme/tokens';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useAuth } from '@/src/context/AuthContext';

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('test@gharana.in');
  const [password, setPassword] = useState('Test@1234');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      setErr(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="login-screen">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <LinearGradient
              colors={['rgba(232, 135, 58, 0.14)', 'transparent']}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.script}>gharana</Text>
            <Text style={styles.namaskar}>Namaste</Text>
            <Text style={styles.subtitle}>Ghar jaisi shuddhata, ab har roz.</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              testID="login-email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@home.in"
              placeholderTextColor={colors.dustLight}
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              testID="login-password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.dustLight}
              style={styles.input}
            />

            {err && <Text style={styles.error} testID="login-error">{err}</Text>}

            <PrimaryButton title="Enter Gharana" onPress={submit} loading={loading} testID="login-submit" />

            <Pressable
              testID="go-to-register"
              onPress={() => router.push('/(auth)/register')}
              style={{ alignSelf: 'center', marginTop: spacing.lg }}
            >
              <Text style={styles.link}>New here? <Text style={styles.linkStrong}>Create an account</Text></Text>
            </Pressable>
          </View>

          <View style={styles.trustRow}>
            <View style={styles.trustItem}><Feather name="check-circle" size={12} color={colors.jade} /><Text style={styles.trustText}>Zero adulteration</Text></View>
            <View style={styles.trustItem}><Feather name="award" size={12} color={colors.jade} /><Text style={styles.trustText}>Lab tested</Text></View>
            <View style={styles.trustItem}><Feather name="truck" size={12} color={colors.jade} /><Text style={styles.trustText}>28-min delivery</Text></View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1, padding: spacing.xl, paddingBottom: spacing.xxxl },
  hero: { paddingVertical: spacing.xxxl, alignItems: 'flex-start' },
  script: { ...t.h1, fontStyle: 'italic', fontSize: 44, color: colors.saffronDark, marginBottom: 8 },
  namaskar: { ...t.h1, fontSize: 40 },
  subtitle: { ...t.body, color: colors.dust, marginTop: spacing.sm },
  form: { gap: 8, marginTop: spacing.md },
  label: { ...t.small, color: colors.dust, marginBottom: 2, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.earth,
    marginBottom: 4,
  },
  error: { color: colors.error, marginVertical: 8, fontSize: 13 },
  link: { ...t.body, color: colors.dust },
  linkStrong: { color: colors.saffronDark, fontWeight: '700' },
  trustRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xxl, paddingHorizontal: spacing.sm },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: { fontSize: 10, letterSpacing: 1, color: colors.dust, fontWeight: '600' },
});
