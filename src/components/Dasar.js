import { View, Text, TouchableOpacity, ScrollView, Modal, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, s } from '../tema';

export function Bar({ persen, warna = C.teal, latar }) {
  const lebar = Math.min(100, Math.max(0, persen));
  return (
    <View style={[s.barLatar, latar ? { backgroundColor: latar } : null]}>
      <View style={[s.barIsi, { width: `${lebar}%`, backgroundColor: warna }]} />
    </View>
  );
}

export function IkonPanah({ masuk, size = 20, color }) {
  return (
    <Ionicons
      name={masuk ? 'arrow-down' : 'arrow-up'}
      size={size}
      color={color}
      style={{ transform: [{ rotate: '45deg' }] }}
    />
  );
}

export function Judul({ teks, aksi, onAksi }) {
  return (
    <View style={s.judulRow}>
      <Text style={s.judulSeksi}>{teks}</Text>
      {aksi && onAksi ? (
        <TouchableOpacity onPress={onAksi} hitSlop={10}>
          <Text style={s.linkTeal}>{aksi}</Text>
        </TouchableOpacity>
      ) : aksi ? (
        <Text style={s.linkTeal}>{aksi}</Text>
      ) : null}
    </View>
  );
}

export function Header({ judul, sub, onPlus }) {
  return (
    <View style={s.rowBetween}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={s.judulHal}>{judul}</Text>
        <Text style={s.subHal}>{sub}</Text>
      </View>
      <TouchableOpacity style={s.plus} onPress={onPlus}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

export function Chip({ label, aktif, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.chip, aktif && { backgroundColor: C.hijau, borderColor: C.hijau }]}
    >
      <Text style={[s.chipTeks, aktif && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Pil({ label, aktif, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.pil, aktif && { backgroundColor: C.hijau }]}>
      <Text style={[s.pilTeks, aktif && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Kosong({ teks }) {
  return (
    <View style={s.kosong}>
      <Text style={{ color: C.abu, textAlign: 'center' }}>{teks}</Text>
    </View>
  );
}

export function Sheet({ visible, onClose, judul, children }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior="padding">
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.sheetHead}>
            <Text style={s.sheetJudul}>{judul}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={C.abu} />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
