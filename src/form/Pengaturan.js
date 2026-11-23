import { ekspor, pilihFileCadangan, pulihkan, ringkasCadangan } from '../backup';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, s } from '../tema';
import { Catatan, LayarForm } from '../components/LayarForm';

export function Pengaturan({ nama, pilihanTema, onTema, onSimpan, onBatal, onPulih }) {
  const [teks, setTeks] = useState(nama);
  const [sibuk, setSibuk] = useState(false);

  const OPSI = [
    { k: 'terang', label: 'Terang', sub: 'Latar putih, cocok di siang hari', ikon: 'sunny-outline' },
    { k: 'gelap', label: 'Gelap', sub: 'Lebih nyaman di mata saat malam', ikon: 'moon-outline' },
    { k: 'sistem', label: 'Ikuti HP', sub: 'Otomatis mengikuti pengaturan HP', ikon: 'phone-portrait-outline' },
  ];

  const simpan = () => {
    if (!teks.trim()) return Alert.alert('Nama belum diisi', 'Isi nama yang ingin ditampilkan di Beranda.');
    onSimpan(teks.trim());
  };

  const cadangkan = async () => {
    setSibuk(true);
    try {
      const c = await ekspor();
      Alert.alert('Cadangan siap', `Berisi ${ringkasCadangan(c)}. Pastikan file tersimpan (Drive, WhatsApp, atau File).`);
    } catch (e) {
      Alert.alert('Gagal mencadangkan', String(e && e.message ? e.message : e));
    }
    setSibuk(false);
  };

  const pulihkanData = async () => {
    setSibuk(true);
    try {
      const f = await pilihFileCadangan();
      if (f) {
        Alert.alert(
          'Ganti semua data?',
          `File: ${f.nama}\nBerisi ${ringkasCadangan(f.isi)}.\n\nSEMUA data di HP ini akan diganti dengan isi file. Tindakan ini tidak bisa dibatalkan. Cadangkan data saat ini dulu bila perlu.`,
          [
            { text: 'Batal', style: 'cancel' },
            {
              text: 'Ganti semua data',
              style: 'destructive',
              onPress: () => {
                try {
                  pulihkan(f.isi);
                  Alert.alert('Berhasil dipulihkan', 'Data dari file cadangan sudah dimuat.');
                  onPulih();
                } catch (e) {
                  Alert.alert('Gagal memulihkan', 'Data di HP tidak diubah. ' + String(e && e.message ? e.message : e));
                }
              },
            },
          ]
        );
      }
    } catch (e) {
      Alert.alert('Tidak bisa membuka file', String(e && e.message ? e.message : e));
    }
    setSibuk(false);
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

      <Text style={[s.label, { marginTop: 22 }]}>Cadangan data</Text>
      <TouchableOpacity style={[s.pilihTema, sibuk && { opacity: 0.5 }]} disabled={sibuk} onPress={cadangkan}>
        <Ionicons name="cloud-upload-outline" size={22} color={C.teal} />
        <View style={{ flex: 1 }}>
          <Text style={s.trxJudul}>Cadangkan data</Text>
          <Text style={s.trxSub}>Simpan semua data ke satu file, lalu kirim ke Drive, WhatsApp, atau File</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={[s.pilihTema, sibuk && { opacity: 0.5 }]} disabled={sibuk} onPress={pulihkanData}>
        <Ionicons name="cloud-download-outline" size={22} color={C.teal} />
        <View style={{ flex: 1 }}>
          <Text style={s.trxJudul}>Pulihkan dari file</Text>
          <Text style={s.trxSub}>Pilih file cadangan untuk memulihkan data, mis. di HP baru</Text>
        </View>
      </TouchableOpacity>
      <Catatan ikon="warning-outline" teks="Memulihkan akan MENGGANTI seluruh data di HP ini dengan isi file cadangan." />
    </LayarForm>
  );
}
