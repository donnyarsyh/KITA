import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, s } from '../tema';
import { Catatan, LayarForm } from '../components/LayarForm';

export function Pengaturan({ nama, pilihanTema, onTema, onSimpan, onBatal }) {
  const [teks, setTeks] = useState(nama);

  const OPSI = [
    { k: 'terang', label: 'Terang', sub: 'Latar putih, cocok di siang hari', ikon: 'sunny-outline' },
    { k: 'gelap', label: 'Gelap', sub: 'Lebih nyaman di mata saat malam', ikon: 'moon-outline' },
    { k: 'sistem', label: 'Ikuti HP', sub: 'Otomatis mengikuti pengaturan HP', ikon: 'phone-portrait-outline' },
  ];

  const simpan = () => {
    if (!teks.trim()) return Alert.alert('Nama belum diisi', 'Isi nama yang ingin ditampilkan di Beranda.');
    onSimpan(teks.trim());
  };

  return (
    <LayarForm
      judul="Pengaturan"
      sub="Atur nama dan tampilan aplikasi."
      onBatal={onBatal}
      tombol="Simpan"
      onTombol={simpan}
    >
      <Text style={s.label}>Nama kamu</Text>
      <TextInput
        style={s.input}
        value={teks}
        onChangeText={setTeks}
        placeholder="Mis. Donny"
        placeholderTextColor={C.abu}
        maxLength={30}
      />
      <Text style={s.petunjuk}>Nama ini tampil di sapaan Beranda. Tidak perlu build ulang.</Text>

      <Text style={s.label}>Tampilan</Text>
      {OPSI.map((o) => {
        const aktif = pilihanTema === o.k;
        return (
          <TouchableOpacity
            key={o.k}
            activeOpacity={0.8}
            style={[s.pilihTema, aktif && s.pilihTemaAktif]}
            onPress={() => onTema(o.k)}
          >
            <Ionicons name={o.ikon} size={22} color={aktif ? C.teal : C.abu} />
            <View style={{ flex: 1 }}>
              <Text style={s.trxJudul}>{o.label}</Text>
              <Text style={s.trxSub}>{o.sub}</Text>
            </View>
            {aktif ? <Ionicons name="checkmark-circle" size={22} color={C.teal} /> : null}
          </TouchableOpacity>
        );
      })}
      <Catatan ikon="information-circle-outline" teks="Pilihan tampilan langsung berlaku dan diingat. Tombol Simpan dipakai untuk nama." />
    </LayarForm>
  );
}
