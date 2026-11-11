import { useState } from 'react';
import { Text, TextInput, Alert } from 'react-native';
import { angkaDariTeks, hariIni, jamSekarang, rupiah } from '../helper';
import { C, s } from '../tema';
import { Dropdown, KartuNominal, PilihTanggal } from '../components/Input';
import { BarisRingkas, Catatan, LayarForm, Ringkasan } from '../components/LayarForm';
import { PilihSering } from '../components/PilihSering';

export function FormSaldoHal({
  rekening, saldoRek, totalSaldo, opsiKat, onKatBaru, onKatHapus, onSimpan, onBatal, onGanti,
}) {
  const [rekId, setRekId] = useState(rekening[0]?.id ?? null);
  const [nominal, setNominal] = useState('');
  const [ket, setKet] = useState('');
  const [kategori, setKategori] = useState(
    opsiKat.some((o) => o.key === 'Pemasukan lainnya') ? 'Pemasukan lainnya' : opsiKat[0]?.key ?? null
  );
  const [tanggal, setTanggal] = useState(hariIni());

  const jumlah = angkaDariTeks(nominal);
  const rek = rekening.find((r) => r.id === rekId);
  const opsiRek = rekening.map((r) => ({ key: r.id, label: `${r.nama} • ${rupiah(saldoRek(r))}` }));

  const simpan = () => {
    if (!rek) return Alert.alert('Pilih rekening tujuan');
    if (!jumlah) return Alert.alert('Nominal belum diisi');
    const judul = ket.trim() || kategori || '';
    if (!judul) return Alert.alert('Keterangan belum diisi');
    onSimpan({
      tipe: 'masuk',
      keterangan: judul,
      kategori: kategori || '',
      nominal: jumlah,
      tanggal,
      waktu: jamSekarang(),
      rekId,
      tujuanId: null,
      angId: null,
      catatan: null,
    });
  };

  return (
    <LayarForm
      judul="Tambah saldo"
      sub="Catat uang yang masuk ke rekeningmu."
      tabAktif="saldo"
      onGanti={onGanti}
      onBatal={onBatal}
      tombol="Simpan tambahan saldo"
      onTombol={simpan}
    >
      <Dropdown label="Rekening tujuan" nilai={rekId} opsi={opsiRek} onPilih={setRekId} />

      <KartuNominal label="Nominal tambahan saldo" nilai={nominal} onChange={setNominal} />

      <Text style={s.label}>Keterangan pemasukan</Text>
      <TextInput
        style={s.input}
        placeholder="mis. Bonus penjualan"
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

      <PilihTanggal label="Tanggal transaksi" nilai={tanggal} onPilih={setTanggal} />

      <Ringkasan judul="SETELAH DISIMPAN">
        <BarisRingkas
          label={`Saldo ${rek ? rek.nama : '-'}`}
          nilai={rupiah((rek ? saldoRek(rek) : 0) + jumlah)}
          teal
          tebal
        />
        <BarisRingkas label="Total semua rekening" nilai={rupiah(totalSaldo + jumlah)} />
      </Ringkasan>

      <Catatan
        ikon="information-circle-outline"
        teks="Tambahan saldo dicatat sebagai pemasukan. Untuk memindahkan uang dari rekening lain, gunakan Pindah saldo."
      />
    </LayarForm>
  );
}
