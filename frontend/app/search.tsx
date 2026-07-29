import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from '@expo/vector-icons/Feather';
import { colors, radius, spacing, type as t } from '@/src/theme/tokens';
import { CatalogAPI } from '@/src/api/client';
import { ProductCard } from '@/src/components/ProductCard';

const RECENT_KEY = 'gharana_recent_searches';

export default function Search() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then((v) => setRecent(v ? JSON.parse(v) : []));
    CatalogAPI.trending().then((r: any) => setTrending(r.trending));
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const h = setTimeout(() => {
      CatalogAPI.products({ q: q.trim() }).then(setResults);
    }, 300);
    return () => clearTimeout(h);
  }, [q]);

  const submit = async () => {
    if (!q.trim()) return;
    const next = [q.trim(), ...recent.filter((x) => x !== q.trim())].slice(0, 6);
    setRecent(next);
    AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => {});
  };

  const pickTerm = (term: string) => { setQ(term); };

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="search-screen">
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} testID="search-back"><Feather name="arrow-left" size={22} color={colors.earth} /></Pressable>
        <View style={styles.searchInputWrap}>
          <Feather name="search" size={15} color={colors.dust} />
          <TextInput
            ref={inputRef}
            testID="search-input"
            value={q}
            onChangeText={setQ}
            onSubmitEditing={submit}
            placeholder="Chakki atta, mustard oil, cow ghee…"
            placeholderTextColor={colors.dustLight}
            style={styles.input}
            returnKeyType="search"
          />
          {q.length > 0 && (
            <Pressable onPress={() => setQ('')} testID="search-clear"><Feather name="x" size={15} color={colors.dust} /></Pressable>
          )}
        </View>
      </View>

      {q.trim().length === 0 ? (
        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          {recent.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>RECENT</Text>
              <View style={styles.chipRow}>
                {recent.map((r) => (
                  <Pressable key={r} onPress={() => pickTerm(r)} style={styles.chip} testID={`recent-${r}`}>
                    <Feather name="clock" size={12} color={colors.dust} />
                    <Text style={styles.chipText}>{r}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
          <Text style={styles.sectionLabel}>TRENDING TODAY</Text>
          <View style={styles.chipRow}>
            {trending.map((r) => (
              <Pressable key={r} onPress={() => pickTerm(r)} style={styles.chip} testID={`trending-${r}`}>
                <Feather name="trending-up" size={12} color={colors.saffronDark} />
                <Text style={styles.chipText}>{r}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.md }}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
          renderItem={({ item }) => <View style={{ flex: 1 }}><ProductCard product={item} /></View>}
          ListEmptyComponent={<Text style={{ padding: spacing.xl, color: colors.dust }}>No matches. Try &ldquo;dal&rdquo; or &ldquo;ghee&rdquo;.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.xl },
  searchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, paddingVertical: 12, color: colors.earth, fontSize: 14 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700', color: colors.dust, marginBottom: 10, marginTop: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill },
  chipText: { color: colors.earth, fontSize: 13, fontWeight: '500' },
});
