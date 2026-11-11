import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { angkaDariTeks, JENIS, rupiah, warnaRekTema } from '../helper';
import { C, s } from '../tema';
import { Dropdown, KartuNominal } from '../components/Input';
import { BarisRingkas, Catatan, LayarForm, Ringkasan } from '../components/LayarForm';

export function FormRekeningHal({ totalSaldo, onSimpan, onBatal, onGanti }) {
  const [jenis, setJenis] = useState('bank');
  const [nama, setNama] = useState('');
  const [nomor, setNomor] = useState('');
  const [saldo, setSaldo] = useState('');
  const [warna, setWarna] = useState(0);

  const awal = angkaDariTeks(saldo);

  const simpan = () => {
    if (!nama.trim()) return Alert.alert('Nama rekening belum diisi');
    onSimpan({
      nama: nama.trim(),
      jenis,
      nomor: jenis === 'bank' ? nomor : '',
      saldo: awal,
      warna,
    });
  };

  return (
    <LayarForm
      judul="Tambah rekening"
      sub="Satukan semua saldo dalam satu tempat."
      tabAktif="rekening"
      onGanti={onGanti}
      onBatal={onBatal}
      tombol="Simpan rekening"
      onTombol={simpan}
    >
      <Dropdown label="Jenis rekening" nilai={jenis} opsi={JENIS} onPilih={setJenis} />

      <Text style={s.label}>Nama rekening</Text>
      <TextInput
        style={s.input}
        placeholder={jenis === 'bank' ? 'mis. Mandiri' : jenis === 'ewallet' ? 'mis. GoPay' : 'mis. Tunai'}
        placeholderTextColor={C.abu}
        value={nama}
        onChangeText={setNama}
      />

      {jenis === 'bank' ? (
        <>
          <Text style={s.label}>Nomor rekening (opsional)</Text>
          <View style={[s.field, { paddingVertical: 4 }]}>
            <Text style={s.fieldTeks}>•••• ••••  </Text>
            <TextInput
              style={[s.fieldTeks, { flex: 1, paddingVertical: 12 }]}
              placeholder="4 digit terakhir"
              placeholderTextColor={C.abu}
              keyboardType="numeric"
              maxLength={4}
              value={nomor}
              onChangeText={(t) => setNomor(t.replace(/\D/g, ''))}
            />
            <Ionicons name="business-outline" size={22} color={C.abu} />
          </View>
          <Text style={s.petunjuk}>Demi keamanan, cukup isi 4 digit terakhir.</Text>
        </>
      ) : null}

      <KartuNominal label="Saldo awal" nilai={saldo} onChange={setSaldo} />

      <Text style={[s.label, { marginTop: 22 }]}>Penanda rekening</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {warnaRekTema().map((w, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setWarna(i)}
            style={[s.penanda, { backgroundColor: w.bg }, warna === i && { borderColor: w.ikon }]}
          >
            {warna === i ? <Ionicons name="checkmark" size={22} color={w.ikon} /> : null}
          </TouchableOpacity>
        ))}
      </View>

      <Ringkasan>
        <BarisRingkas label="Total saldo saat ini" nilai={rupiah(totalSaldo)} />
        <View style={s.pemisah} />
        <BarisRingkas label="Total setelah disimpan" nilai={rupiah(totalSaldo + awal)} teal tebal />
      </Ringkasan>

      <Catatan teks="Saldo awal menambah total saldo, tetapi tidak dihitung sebagai pemasukan bulan ini." />
    </LayarForm>
  );
}
