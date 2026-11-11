import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, s } from '../tema';

export function PilihSering({ label, nilai, opsi, onPilih, onBaru, onHapus, kosongLabel, batas = 6 }) {
  const [semua, setSemua] = useState(false);
  const [baru, setBaru] = useState(false);
  const [hapus, setHapus] = useState(false);
  const [teks, setTeks] = useState('');

  const tampil = semua ? opsi : opsi.slice(0, batas);
  const tersembunyi =
    !semua && nilai != null && !tampil.some((o) => o.key === nilai)
      ? opsi.find((o) => o.key === nilai)
      : null;
  const daftar = tersembunyi ? [...tampil, tersembunyi] : tampil;
  const adaSering = opsi.some((o) => o.hitung > 0);

  const tambah = () => {
    const hasil = onBaru(teks);
    if (hasil) {
      onPilih(hasil);
      setTeks('');
      setBaru(false);
    }
  };

  const tekanChip = (o) => {
    if (hapus && onHapus) {
      onHapus(o.key, () => {
        if (nilai === o.key) onPilih(opsi.find((x) => x.key !== o.key)?.key ?? null);
      });
    } else {
      onPilih(o.key);
    }
  };

  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <View style={s.chipRow}>
        {daftar.map((o, i) => {
          const aktif = o.key === nilai && !hapus;
          return (
            <TouchableOpacity
              key={String(o.key)}
              onPress={() => tekanChip(o)}
              style={[
                s.chip,
                aktif && { backgroundColor: C.hijau, borderColor: C.hijau },
                hapus && { borderColor: C.merah },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                {hapus ? (
                  <Ionicons name="close-circle" size={15} color={C.merah} />
                ) : o.hitung > 0 && i < 3 ? (
                  <Ionicons name="star" size={12} color={aktif ? '#ffd966' : '#d4a017'} />
                ) : null}
                <Text style={[s.chipTeks, aktif && { color: '#fff' }]}>{o.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {kosongLabel ? (
          <TouchableOpacity
            onPress={() => onPilih(null)}
            style={[s.chip, nilai == null && { backgroundColor: C.hijau, borderColor: C.hijau }]}
          >
            <Text style={[s.chipTeks, nilai == null && { color: '#fff' }]}>{kosongLabel}</Text>
          </TouchableOpacity>
        ) : null}

        {opsi.length > batas ? (
          <TouchableOpacity style={s.chipLink} onPress={() => setSemua(!semua)}>
            <Text style={s.chipLinkTeks}>{semua ? 'Ringkas' : `Lainnya (${opsi.length - batas})`}</Text>
          </TouchableOpacity>
        ) : null}

        {onBaru ? (
          <TouchableOpacity style={s.chipBaru} onPress={() => setBaru(!baru)}>
            <Ionicons name={baru ? 'close' : 'add'} size={16} color={C.teal} />
            <Text style={s.chipLinkTeks}>{baru ? 'Batal' : 'Baru'}</Text>
          </TouchableOpacity>
        ) : null}

        {onHapus ? (
          <TouchableOpacity
            style={[s.chipBaru, { borderColor: C.merah }, hapus && { backgroundColor: C.bahaya }]}
            onPress={() => setHapus(!hapus)}
          >
            <Ionicons name={hapus ? 'checkmark' : 'trash-outline'} size={16} color={C.merah} />
            <Text style={[s.chipLinkTeks, { color: C.merah }]}>{hapus ? 'Selesai' : 'Hapus'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {hapus ? (
        <Text style={[s.petunjuk, { color: C.merah }]}>Ketuk kategori yang ingin dihapus.</Text>
      ) : adaSering ? (
        <Text style={s.petunjuk}>★ = sering dipakai, otomatis diurutkan paling atas.</Text>
      ) : null}

      {baru ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="Nama kategori baru"
            placeholderTextColor={C.abu}
            value={teks}
            onChangeText={setTeks}
            autoFocus
          />
          <TouchableOpacity style={s.tambahBtn} onPress={tambah}>
            <Text style={s.tombolTeks}>Tambah</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
