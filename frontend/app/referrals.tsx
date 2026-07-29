import { View, Text, StyleSheet, Pressable, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import * as Clipboard from 'expo-clipboard';
import { colors, radius, spacing, type as t } from '@/src/theme/tokens';
import { useAuth } from '@/src/context/AuthContext';
import { PrimaryButton } from '@/src/components/PrimaryButton';

export default function Referrals() {
  const router = useRouter();
  const { user } = useAuth();
  const code = user?.referral_code || 'GHRWELCOME';

  const share = async () => {
    try {
      await Share.share({
        message: `I'm loving Gharana — real Indian pantry, delivered honestly. Use my code ${code} to get ₹50 off your first order. https://gharana.in`,
      });
    } catch {}
  };

  const copy = async () => {
    await Clipboard.setStringAsync(code);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="referrals-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={20} color={colors.earth} /></Pressable>
        <Text style={styles.title}>Referrals</Text>
        <View style={{ width: 20 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>GHARANA CIRCLE</Text>
          <Text style={styles.heroTitle}>Invite your kitchen circle.</Text>
          <Text style={styles.heroBody}>Give a friend ₹50 off their first order. Earn ₹100 credits when they order.</Text>
        </View>

        <View style={styles.codeBox} testID="referral-code-box">
          <Text style={styles.codeLabel}>YOUR CODE</Text>
          <Text style={styles.code}>{code}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
            <Pressable onPress={copy} style={styles.copyBtn} testID="copy-code-btn">
              <Feather name="copy" size={14} color={colors.earth} />
              <Text style={{ ...t.body, fontWeight: '700' }}>Copy</Text>
            </Pressable>
            <PrimaryButton title="Share" onPress={share} style={{ flex: 1, height: 42 }} testID="share-code-btn" />
          </View>
        </View>

        <Text style={styles.creditLabel}>Your credits · ₹{(user?.credits || 0).toFixed(0)}</Text>

        <View style={{ marginTop: spacing.xl, gap: 12 }}>
          <How step="1" title="Share your code" body="Send your code via WhatsApp, message, or email." />
          <How step="2" title="Friend orders" body="When they check out with your code, they save ₹50 on their first order." />
          <How step="3" title="You earn" body="₹100 credit lands in your Gharana wallet — use on any order." />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function How({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <View style={styles.howRow}>
      <View style={styles.stepCircle}><Text style={styles.stepText}>{step}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.howTitle}>{title}</Text>
        <Text style={styles.howBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  title: { ...t.h3, fontStyle: 'italic' },
  hero: { backgroundColor: colors.earth, padding: spacing.xl, borderRadius: radius.lg },
  heroLabel: { color: colors.saffron, fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  heroTitle: { color: colors.white, fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 28, fontWeight: '700', marginTop: 8 },
  heroBody: { color: colors.cream, opacity: 0.8, marginTop: 6, fontSize: 13, lineHeight: 20 },
  codeBox: { marginTop: spacing.lg, backgroundColor: colors.white, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.saffron, borderStyle: 'dashed', alignItems: 'center' },
  codeLabel: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700', color: colors.dust },
  code: { fontSize: 28, letterSpacing: 4, fontWeight: '800', color: colors.saffronDark, marginTop: 8 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.cream, paddingHorizontal: 16, borderRadius: radius.pill, height: 42, borderWidth: 1, borderColor: colors.border },
  creditLabel: { textAlign: 'center', marginTop: spacing.md, color: colors.jade, fontWeight: '700' },
  howRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.saffron, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.white, fontWeight: '800' },
  howTitle: { ...t.body, fontWeight: '700' },
  howBody: { ...t.small, color: colors.dust, marginTop: 2 },
});
