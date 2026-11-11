import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, s } from '../tema';

export function Ringkasan({ judul, children }) {
  return (
    <View style={s.ringkasKartu}>
      {judul ? <Text style={s.ringkasJudul}>{judul}</Text> : null}
      {children}
    </View>
  );
}

export function BarisRingkas({ label, nilai, teal, tebal, merah }) {
  return (
    <View style={[s.rowBetween, { marginTop: 10 }]}>
      <Text style={[s.ringkasLabel2, tebal && { color: C.teks, fontWeight: '700' }]}>{label}</Text>
      <Text style={[s.ringkasNilai, teal && { color: C.teal }, merah && { color: C.merah }]}>{nilai}</Text>
    </View>
  );
}

export function Catatan({ ikon = 'shield-checkmark-outline', teks, merah }) {
  return (
    <View style={[s.catatan, merah && { backgroundColor: C.bahaya }]}>
      <Ionicons name={ikon} size={18} color={merah ? C.merah : C.teal} style={{ marginTop: 1 }} />
      <Text style={[s.catatanTeks, merah && { color: C.merah }]}>{teks}</Text>
    </View>
  );
}

export function LayarForm({ judul, sub, tabAktif, onGanti, onBatal, tombol, onTombol, children }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: C.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: insets.top + 12,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.rowBetween}>
            <TouchableOpacity style={s.back} onPress={onBatal}>
              <Ionicons name="arrow-back" size={22} color={C.teal} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onBatal} hitSlop={10}>
              <Text style={{ color: C.abu, fontSize: 14 }}>Batal</Text>
            </TouchableOpacity>
          </View>

          <Text style={[s.judulHal, { marginTop: 18 }]}>{judul}</Text>
          <Text style={s.subHal}>{sub}</Text>

          {tabAktif ? (
            <View style={s.seg}>
              {[
                { k: 'rekening', label: 'Rekening baru' },
                { k: 'saldo', label: 'Tambah saldo' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.k}
                  style={[s.segItem, tabAktif === t.k && s.segAktif]}
                  onPress={() => tabAktif !== t.k && onGanti(t.k)}
                >
                  <Text style={[s.segTeks, tabAktif === t.k && { color: C.teal, fontWeight: '700' }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={{ height: 16 }} />
          )}

          {children}
        </ScrollView>

        <View style={[s.bawah, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity style={s.tombolBesar} onPress={onTombol}>
            <Text style={s.tombolTeks}>{tombol}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
