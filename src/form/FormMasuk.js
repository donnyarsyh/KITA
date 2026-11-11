import { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { angkaDariTeks, hariIni, jamSekarang, labelBulan, rupiah } from '../helper';
import { C, s } from '../tema';
import { IkonPanah } from '../components/Dasar';
import { Dropdown, KartuNominal, PilihTanggal } from '../components/Input';
import { Catatan, LayarForm, Ringkasan } from '../components/LayarForm';
import { PilihSering } from '../components/PilihSering';

export function FormMasukHal({ rekening, saldoRek, totalSaldo, opsiKat, onKatBaru, onKatHapus, onSimpan, onBatal }) {
  const [nominal, setNominal] = useState('');
  const [ket, setKet] = useState('');
  const [kategori, setKategori] = useState(opsiKat[0]?.key ?? null);
  const [rekId, setRekId] = useState(rekening[0]?.id ?? null);
  const [tanggal, setTanggal] = useState(hariIni());
  const [catatan, setCatatan] = useState('');

  const jumlah = angkaDariTeks(nominal);
  const rek = rekening.find((r) => r.id === rekId);
  const opsiRek = rekening.map((r) => ({ key: r.id, label: `${r.nama} • ${rupiah(saldoRek(r))}` }));

  const simpan = () => {
    if (!jumlah) return Alert.alert('Nominal belum diisi');
    if (!rek) return Alert.alert('Pilih rekening tujuan');
    const judul = ket.trim() || kategori || '';
    if (!judul) return Alert.alert('Keterangan belum diisi');
    onSimpan({
      tipe: 'masuk',
      keterangan: judul,
      kategori: kategori || '',
      nominal: jumlah,
      tanggal,
      waktu: jamSekarang(),
      rekId: rek.id,
      tujuanId: null,
      angId: null,
      catatan: catatan.trim() || null,
    });
  };

  return (
    <LayarForm
      judul="Tambah pemasukan"
      sub="Catat kabar baik untuk keuanganmu."
      onBatal={onBatal}
      tombol="Simpan pemasukan"
      onTombol={simpan}
    >
      <KartuNominal label="Nominal pemasukan" nilai={nominal} onChange={setNominal} />

      <Text style={s.label}>Keterangan pemasukan</Text>
      <TextInput
        style={s.input}
        placeholder="mis. Honor ilustrasi"
        placeholderTextColor={C.abu}
        value={ket}
        onChangeText={setKet}
      />

      <PilihSering
        label="Kategori"
        nilai={kategori}
        opsi={opsiKat}
        onPilih={setKategori}
        onBaru={onKatBaru}
        onHapus={onKatHapus}
      />

      <Dropdown label="Masuk ke rekening" nilai={rekId} opsi={opsiRek} onPilih={setRekId} />

      <PilihTanggal label="Tanggal transaksi" nilai={tanggal} onPilih={setTanggal} />

      <Text style={s.label}>Catatan (opsional)</Text>
      <View style={[s.field, { paddingVertical: 4 }]}>
        <TextInput
          style={[s.fieldTeks, { flex: 1, paddingVertical: 12 }]}
          placeholder="mis. Pelunasan proyek Oktober"
          placeholderTextColor={C.abu}
          value={catatan}
          onChangeText={setCatatan}
        />
        <Ionicons name="pencil-outline" size={20} color={C.abu} />
      </View>

      <Ringkasan>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IkonPanah masuk size={16} color={C.teal} />
          <Text style={s.ringkasJudulTebal}>Saldo {rek ? rek.nama : '-'} setelah disimpan</Text>
        </View>
        <Text style={s.ringkasBesar}>{rupiah((rek ? saldoRek(rek) : 0) + jumlah)}</Text>
        <Text style={s.ringkasLabel2}>Total saldo menjadi {rupiah(totalSaldo + jumlah)}</Text>
      </Ringkasan>

      <Catatan
        ikon="information-circle-outline"
        teks={`Pemasukan ini akan tercatat di laporan ${labelBulan(tanggal.slice(0, 7))} setelah kamu menyimpannya.`}
      />
    </LayarForm>
  );
}
