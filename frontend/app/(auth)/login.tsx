import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { useAuth } from '@/src/context/AuthContext';
import { colors, fonts, radius, spacing } from '@/src/theme/tokens';

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
          <View style={styles.brandBlock}>
            <View style={styles.logo}><Text style={styles.logoText}>G</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.brand}>Gharana</Text>
              <Text style={styles.brandSub}>Pure pantry · delivered fast</Text>
            </View>
            <Feather name="zap" size={24} color={colors.white} />
          </View>

          <View style={styles.heading}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to shop your everyday essentials.</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email address</Text>
            <View style={styles.inputWrap}>
              <Feather name="mail" size={17} color={colors.dust} />
              <TextInput
                testID="login-email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
                placeholderTextColor={colors.dustLight}
                style={styles.input}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={17} color={colors.dust} />
              <TextInput
                testID="login-password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Enter your password"
                placeholderTextColor={colors.dustLight}
                style={styles.input}
              />
            </View>

            {!!err && <Text style={styles.error} testID="login-error">{err}</Text>}
            <PrimaryButton title="Continue" onPress={submit} loading={loading} testID="login-submit" style={styles.submit} />

            <Pressable testID="go-to-register" onPress={() => router.push('/(auth)/register')} style={styles.register}>
              <Text style={styles.registerText}>New to Gharana? <Text style={styles.registerStrong}>Create account</Text></Text>
            </Pressable>
          </View>

          <View style={styles.trustRow}>
            <Trust icon="check-circle" text="Lab tested" />
            <Trust icon="truck" text="Fast delivery" />
            <Trust icon="shield" text="Secure checkout" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Trust({ icon, text }: { icon: 'check-circle' | 'truck' | 'shield'; text: string }) {
  return <View style={styles.trust}><Feather name={icon} size={14} color={colors.jade} /><Text style={styles.trustText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xxl },
  brandBlock: { minHeight: 112, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.saffron },
  logo: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: colors.saffron, fontFamily: fonts.bodyBold, fontSize: 22 },
  brand: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 22, letterSpacing: -0.5 },
  brandSub: { color: 'rgba(255,255,255,0.82)', fontFamily: fonts.bodyMedium, fontSize: 10.5, marginTop: 3 },
  heading: { marginTop: spacing.xxxl, marginBottom: spacing.xl },
  title: { color: colors.earth, fontFamily: fonts.bodyBold, fontSize: 28, letterSpacing: -0.8 },
  subtitle: { color: colors.dust, fontFamily: fonts.body, fontSize: 13.5, marginTop: 6 },
  form: { gap: 8 },
  label: { color: colors.earth, fontFamily: fonts.bodySemibold, fontSize: 12, marginTop: 8 },
  inputWrap: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cream },
  input: { flex: 1, height: 52, color: colors.earth, fontFamily: fonts.bodyMedium, fontSize: 14 },
  error: { color: colors.error, fontFamily: fonts.bodyMedium, fontSize: 12, marginTop: 4 },
  submit: { marginTop: spacing.md },
  register: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  registerText: { color: colors.dust, fontFamily: fonts.body, fontSize: 13 },
  registerStrong: { color: colors.saffron, fontFamily: fonts.bodyBold },
  trustRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto', paddingTop: spacing.xxxl },
  trust: { alignItems: 'center', gap: 5 },
  trustText: { color: colors.dust, fontFamily: fonts.bodyMedium, fontSize: 9.5 },
});