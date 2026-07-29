import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, type as t } from '@/src/theme/tokens';
import { useAuth } from '@/src/context/AuthContext';

const DIETARY = ['Vegan', 'Jain', 'Diabetic-friendly', 'Gluten-free'];

export default function AccountScreen() {
  const { user, signOut, updatePreferences, refresh } = useAuth();
  const router = useRouter();
  const [dietary, setDietary] = useState<string[]>(user?.preferences?.dietary || []);
  const [notif, setNotif] = useState<boolean>(user?.preferences?.notifications !== false);

  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    if (!user) return;
    setDietary(user.preferences?.dietary || []);
    setNotif(user.preferences?.notifications !== false);
  }, [user?.id]);

  const toggle = (d: string) => {
    const next = dietary.includes(d) ? dietary.filter(x => x !== d) : [...dietary, d];
    setDietary(next);
    updatePreferences({ dietary: next, notifications: notif }).catch(() => {});
  };

  const toggleNotif = (v: boolean) => {
    setNotif(v);
    updatePreferences({ dietary, notifications: v }).catch(() => {});
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="account-screen">
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}>
        <View style={styles.hero}>
          <Text style={styles.namaste}>Namaste,</Text>
          <Text style={styles.name}>{user?.full_name || 'Guest'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.creditRow}>
            <Feather name="award" size={13} color={colors.jade} />
            <Text style={styles.creditText}>Gharana credits · ₹{(user?.credits || 0).toFixed(0)}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <Tile icon="package" label="My Orders" onPress={() => router.push('/orders')} testID="tile-orders" />
          <Tile icon="map-pin" label="Addresses" onPress={() => router.push('/addresses')} testID="tile-addresses" />
          <Tile icon="repeat" label="Subscriptions" onPress={() => router.push('/subscriptions')} testID="tile-subs" />
          <Tile icon="gift" label="Referrals" onPress={() => router.push('/referrals')} testID="tile-referrals" />
        </View>

        <Text style={styles.sectionLabel}>DIETARY PREFERENCES</Text>
        <View style={styles.pillRow}>
          {DIETARY.map((d) => (
            <Pressable key={d} onPress={() => toggle(d)} style={[styles.pill, dietary.includes(d) && styles.pillActive]} testID={`diet-${d.toLowerCase()}`}>
              <Text style={[styles.pillText, dietary.includes(d) && styles.pillTextActive]}>{d}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.notifRow}>
          <View>
            <Text style={styles.notifTitle}>Delivery updates</Text>
            <Text style={styles.notifSub}>Order confirmations, tracking, and promos</Text>
          </View>
          <Switch value={notif} onValueChange={toggleNotif} thumbColor={colors.white} trackColor={{ true: colors.saffron, false: colors.border }} testID="notif-toggle" />
        </View>

        <Pressable style={styles.logoutBtn} onPress={signOut} testID="logout-btn">
          <Feather name="log-out" size={14} color={colors.error} />
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>

        <Text style={styles.tagline}>Ghar jaisi shuddhata, since always.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Tile({ icon, label, onPress, testID }: any) {
  return (
    <Pressable onPress={onPress} style={styles.tile} testID={testID}>
      <View style={styles.tileIcon}><Feather name={icon} size={18} color={colors.saffronDark} /></View>
      <Text style={styles.tileLabel}>{label}</Text>
      <Feather name="chevron-right" size={16} color={colors.dust} style={{ marginLeft: 'auto' }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  hero: { paddingVertical: spacing.lg },
  namaste: { ...t.body, color: colors.dust },
  name: { ...t.h1, fontStyle: 'italic' },
  email: { ...t.small, color: colors.dust, marginTop: 2 },
  creditRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: spacing.md, backgroundColor: colors.jadeTint, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  creditText: { color: colors.jade, fontWeight: '700', fontSize: 12 },
  grid: { marginTop: spacing.lg, gap: 8 },
  tile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  tileIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.saffronTint, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { ...t.body, fontWeight: '600' },
  sectionLabel: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700', color: colors.dust, marginTop: spacing.xxl, marginBottom: spacing.sm },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  pillActive: { backgroundColor: colors.jade, borderColor: colors.jade },
  pillText: { fontSize: 12, color: colors.earth, fontWeight: '600' },
  pillTextActive: { color: colors.white },
  notifRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  notifTitle: { ...t.body, fontWeight: '600' },
  notifSub: { ...t.small, color: colors.dust, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', padding: spacing.lg, marginTop: spacing.xxl },
  logoutText: { color: colors.error, fontWeight: '700' },
  tagline: { textAlign: 'center', color: colors.dust, fontStyle: 'italic', marginTop: spacing.lg },
});
