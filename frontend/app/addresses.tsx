import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { colors, radius, spacing, type as t } from '@/src/theme/tokens';
import { AddressAPI } from '@/src/api/client';
import { PrimaryButton } from '@/src/components/PrimaryButton';

export default function Addresses() {
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const load = () => AddressAPI.list().then((a: any) => setList(a));
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    await AddressAPI.remove(id);
    load();
  };

  const setDefault = async (a: any) => {
    await AddressAPI.update(a.id, { ...a, is_default: true });
    load();
  };

  if (editing) return <AddressForm initial={editing} onDone={() => { setEditing(null); load(); }} />;

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="addresses-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Feather name="arrow-left" size={20} color={colors.earth} /></Pressable>
        <Text style={styles.title}>Addresses</Text>
        <Pressable onPress={() => setEditing({})}><Feather name="plus" size={22} color={colors.earth} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
        {list.length === 0 && <Text style={{ color: colors.dust, textAlign: 'center', padding: spacing.xxl }}>No saved addresses. Add one to get started.</Text>}
        {list.map((a) => (
          <View key={a.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.label}>{a.label}</Text>
                  {a.is_default && <View style={styles.defaultTag}><Text style={styles.defaultTagText}>DEFAULT</Text></View>}
                </View>
                <Text style={styles.name}>{a.full_name} · {a.phone}</Text>
                <Text style={styles.line}>{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city} {a.pincode}</Text>
                {!!a.instructions && <Text style={styles.instr}>“{a.instructions}”</Text>}
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.action} onPress={() => setEditing(a)} testID={`edit-${a.label}`}><Feather name="edit-2" size={12} color={colors.earth} /><Text style={styles.actionText}>Edit</Text></Pressable>
              {!a.is_default && <Pressable style={styles.action} onPress={() => setDefault(a)} testID={`default-${a.label}`}><Feather name="check-circle" size={12} color={colors.jade} /><Text style={styles.actionText}>Set default</Text></Pressable>}
              <Pressable style={styles.action} onPress={() => remove(a.id)} testID={`delete-${a.label}`}><Feather name="trash-2" size={12} color={colors.error} /><Text style={[styles.actionText, { color: colors.error }]}>Delete</Text></Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function AddressForm({ initial, onDone }: { initial: any; onDone: () => void }) {
  const [form, setForm] = useState({
    label: initial.label || 'Home',
    full_name: initial.full_name || '',
    phone: initial.phone || '',
    line1: initial.line1 || '',
    line2: initial.line2 || '',
    city: initial.city || '',
    pincode: initial.pincode || '',
    instructions: initial.instructions || '',
    is_default: initial.is_default || false,
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      if (initial.id) await AddressAPI.update(initial.id, form);
      else await AddressAPI.create(form);
      onDone();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe} testID="address-form">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={onDone}><Feather name="arrow-left" size={20} color={colors.earth} /></Pressable>
          <Text style={styles.title}>{initial.id ? 'Edit address' : 'New address'}</Text>
          <View style={{ width: 20 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          {[
            ['Label (Home/Work)', 'label'],
            ['Full name', 'full_name'],
            ['Phone', 'phone'],
            ['Address line 1', 'line1'],
            ['Address line 2 (optional)', 'line2'],
            ['City', 'city'],
            ['Pincode', 'pincode'],
            ['Delivery instructions (optional)', 'instructions'],
          ].map(([label, key]) => (
            <View key={key}>
              <Text style={styles.formLabel}>{String(label).toUpperCase()}</Text>
              <TextInput
                testID={`addr-form-${key}`}
                value={(form as any)[key]}
                onChangeText={(v) => setForm({ ...form, [key]: v })}
                style={styles.input}
                keyboardType={key === 'phone' || key === 'pincode' ? 'number-pad' : 'default'}
              />
            </View>
          ))}
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md }} onPress={() => setForm({ ...form, is_default: !form.is_default })} testID="addr-form-default">
            <Feather name={form.is_default ? 'check-square' : 'square'} size={18} color={colors.saffronDark} />
            <Text style={{ ...t.body }}>Set as default</Text>
          </Pressable>
          <PrimaryButton title="Save address" onPress={submit} loading={saving} testID="addr-form-save" style={{ marginTop: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  title: { ...t.h3, fontStyle: 'italic' },
  card: { backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  label: { fontWeight: '700', color: colors.earth, fontSize: 15 },
  defaultTag: { backgroundColor: colors.jade, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  defaultTagText: { color: colors.white, fontSize: 8, letterSpacing: 1, fontWeight: '700' },
  name: { color: colors.dust, marginTop: 4, fontSize: 13 },
  line: { color: colors.dust, marginTop: 2, fontSize: 13 },
  instr: { color: colors.dust, fontStyle: 'italic', marginTop: 4, fontSize: 12 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 11, color: colors.earth, fontWeight: '600' },
  formLabel: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700', color: colors.dust, marginTop: spacing.md, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, color: colors.earth, fontSize: 14 },
});
