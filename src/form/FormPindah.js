import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { angkaDariTeks, hariIni, jamSekarang, rupiah } from '../helper';
import { C, s } from '../tema';
import { Dropdown, KartuNominal, PilihTanggal } from '../components/Input';
import { BarisRingkas, Catatan, LayarForm, Ringkasan } from '../components/LayarForm';

export function FormPindahHal({ rekening, saldoRek, totalSaldo, onSimpan, onBatal }) {
  // Awalnya: dari rekening biasa pertama, ke rekening tabungan (jika ada)
  const biasa = rekening.filter((r) => !r.khusus_tabungan);
  const tab = rekening.filter((r) => r.khusus_tabungan);
  const awalDari = biasa[0] ?? rekening[0];
  const awalKe = tab[0] ?? rekening.find((r) => r.id !== awalDari?.id);
  const [dariId, setDariId] = useState(awalDari?.id ?? null);
  const [keId, setKeId] = useState(awalKe?.id ?? null);
  const [nominal, setNominal] = useState('');
  const [tanggal, setTanggal] = useState(hariIni());
  const [ket, setKet] = useState('');

  const jumlah = angkaDariTeks(nominal);
  const dari = rekening.find((r) => r.id === dariId);
  const ke = rekening.find((r) => r.id === keId);
  const opsiRek = rekening.map((r) => ({
    key: r.id,
    label: `${r.nama}${r.khusus_tabungan ? ' (Tabungan)' : ''} • ${rupiah(saldoRek(r))}`,
  }));
  const kurang = jumlah > 0 && !!dari && jumlah > saldoRek(dari);

  const pilihDari = (k) => {
    if (k === keId) setKeId(dariId);
    setDariId(k);
  };
  const pilihKe = (k) => {
    if (k === dariId) setDariId(keId);
    setKeId(k);
  };
  const tukar = () => {
    setDariId(keId);
    setKeId(dariId);
  };

  const simpan = () => {
    if (!dari || !ke) return Alert.alert('Pilih rekening asal dan tujuan');
    if (dari.id === ke.id) return Alert.alert('Rekening asal dan tujuan tidak boleh sama');
    if (!jumlah) return Alert.alert('Nominal belum diisi');
    if (jumlah > saldoRek(dari)) {
      return Alert.alert(
        'Saldo rekening tidak cukup',
        `Saldo ${dari.nama} hanya ${rupiah(saldoRek(dari))}, tidak cukup untuk memindahkan ${rupiah(jumlah)}.`
      );
    }
    onSimpan({
      tipe: 'pindah',
      keterangan: ket.trim() || `Pindah ke ${ke.nama}`,
      kategori: '',
      nominal: jumlah,
      tanggal,
      waktu: jamSekarang(),
      rekId: dari.id,
      tujuanId: ke.id,
      angId: null,
      catatan: null,
    });
  };

  return (
    <LayarForm
      judul="Pindah saldo"
      sub="Antarrekening, termasuk ke rekening tabungan."
      onBatal={onBatal}
      tombol="Simpan perpindahan"
      onTombol={simpan}
    >
      <KartuNominal label="Nominal yang dipindahkan" nilai={nominal} onChange={setNominal} />

      <Dropdown label="Dari rekening" nilai={dariId} opsi={opsiRek} onPilih={pilihDari} />

      <View style={{ alignItems: 'center', marginTop: 12 }}>
        <TouchableOpacity style={s.panahBulat} onPress={tukar} hitSlop={8}>
          <Ionicons name="arrow-down" size={18} color={C.teal} />
        </TouchableOpacity>
      </View>

      <Dropdown label="Ke rekening" nilai={keId} opsi={opsiRek} onPilih={pilihKe} />

      <PilihTanggal label="Tanggal transaksi" nilai={tanggal} onPilih={setTanggal} />

      <Text style={s.label}>Keterangan (opsional)</Text>
      <View style={[s.field, { paddingVertical: 4 }]}>
        <TextInput
          style={[s.fieldTeks, { flex: 1, paddingVertical: 12 }]}
          placeholder="mis. Uang saku minggu ini"
          placeholderTextColor={C.abu}
          value={ket}
          onChangeText={setKet}
        />
        <Ionicons name="pencil-outline" size={20} color={C.abu} />
      </View>

      <Ringkasan judul="SALDO SETELAH DISIMPAN">
        <BarisRingkas
          label={dari ? dari.nama : '-'}
          nilai={rupiah((dari ? saldoRek(dari) : 0) - jumlah)}
          tebal
          merah={kurang}
        />
        <BarisRingkas
          label={ke ? ke.nama : '-'}
          nilai={rupiah((ke ? saldoRek(ke) : 0) + jumlah)}
          teal
        />
      </Ringkasan>

      {kurang ? (
        <Catatan
          merah
          ikon="warning-outline"
          teks={`Nominal melebihi saldo ${dari.nama} (${rupiah(saldoRek(dari))}). Perpindahan tidak bisa disimpan.`}
        />
      ) : (
        <Catatan
          ikon="swap-horizontal"
          teks={
            dari && ke && !!dari.khusus_tabungan !== !!ke.khusus_tabungan
              ? ke.khusus_tabungan
                ? `Uang pindah ke tabungan, jadi Total saldo di Beranda berkurang ${rupiah(jumlah)} dan Total tabungan bertambah.`
                : `Uang kembali dari tabungan, jadi Total saldo di Beranda bertambah ${rupiah(jumlah)} dan Total tabungan berkurang.`
              : `Total saldo tetap ${rupiah(totalSaldo)}. Pindah saldo tidak masuk ke laporan pemasukan atau pengeluaran.`
          }
        />
      )}
    </LayarForm>
  );
}
