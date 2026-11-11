import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { angkaDariTeks, formatInput, hariIni, IKON_TABUNGAN, rupiah, tebakIkonTabungan } from '../helper';
import { C, s } from '../tema';
import { Chip } from '../components/Dasar';
import { KartuNominal, PilihTanggal } from '../components/Input';
import { Catatan, LayarForm } from '../components/LayarForm';

export function FormTarget({ tb, saldo, onSimpan, onBatal, onHapus }) {
  const [nama, setNama] = useState(tb ? tb.nama : '');
  const [target, setTarget] = useState(tb ? formatInput(tb.target) : '');
  const [adaTenggat, setAdaTenggat] = useState(!!(tb && tb.tenggat));
  const [tenggat, setTenggat] = useState(tb && tb.tenggat ? tb.tenggat : hariIni());
  const [ikonPilih, setIkonPilih] = useState(tb ? tb.ikon : null); // null = tebak otomatis dari nama

  const jumlah = angkaDariTeks(target);
  const ikon = ikonPilih || tebakIkonTabungan(nama);

  const simpan = () => {
    if (!nama.trim()) return Alert.alert('Nama target belum diisi', 'Mis. Tabungan nikah.');
    if (!jumlah) return Alert.alert('Nominal target belum diisi');
    onSimpan({
      id: tb ? tb.id : null,
      nama: nama.trim(),
      target: jumlah,
      ikon,
      tenggat: adaTenggat ? tenggat : null,
    });
  };

  return (
    <LayarForm
      judul={tb ? 'Ubah target' : 'Target tabungan'}
      sub="Tentukan tujuan dan berapa yang ingin dikumpulkan."
      onBatal={onBatal}
      tombol="Simpan target"
      onTombol={simpan}
    >
      <Text style={s.label}>Peruntukan tabungan</Text>
      <TextInput
        style={s.input}
        placeholder="mis. Tabungan nikah"
        placeholderTextColor={C.abu}
        value={nama}
        onChangeText={setNama}
      />

      <KartuNominal label="Target yang ingin dicapai" nilai={target} onChange={setTarget} />

      <Text style={s.label}>Ikon</Text>
      <View style={s.chipRow}>
        {IKON_TABUNGAN.map((k) => {
          const aktif = ikon === k;
          return (
            <TouchableOpacity
              key={k}
              onPress={() => setIkonPilih(k)}
              style={[s.chip, aktif && { backgroundColor: C.hijau, borderColor: C.hijau }]}
            >
              <Ionicons name={k} size={20} color={aktif ? '#fff' : C.teks} />
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={s.label}>Tenggat</Text>
      <View style={s.chipRow}>
        <Chip label="Tanpa tenggat" aktif={!adaTenggat} onPress={() => setAdaTenggat(false)} />
        <Chip label="Atur tenggat" aktif={adaTenggat} onPress={() => setAdaTenggat(true)} />
      </View>
      {adaTenggat ? <PilihTanggal nilai={tenggat} onPilih={setTenggat} /> : null}

      {tb ? (
        <>
          <Catatan
            ikon="information-circle-outline"
            teks={`Terkumpul saat ini ${rupiah(saldo)}. Mengubah target tidak mengubah saldo tabungan.`}
          />
          <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 18 }} onPress={onHapus}>
            <Text style={{ color: C.merah, fontWeight: '700' }}>Hapus target</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Catatan
          ikon="information-circle-outline"
          teks="Setelah dibuat, pindahkan uang dari rekening lewat tombol Tabung. Saldo rekening akan berkurang."
        />
      )}
    </LayarForm>
  );
}
