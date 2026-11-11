import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  akhirBulan,
  angkaDariTeks,
  awalBulan,
  formatInput,
  labelPanjang,
  periode,
  rupiah,
  satuTahun,
  selisihHari,
  tambahHari,
  tebakIkon,
} from '../helper';
import { C, s } from '../tema';
import { Chip } from '../components/Dasar';
import { Dropdown, KartuNominal, PilihTanggal } from '../components/Input';
import { Catatan, LayarForm } from '../components/LayarForm';

export function FormAnggaranHal({ a, bulanAwal, rekening, tertaut, terpakaiSekarang, onSimpan, onBatal, onHapus }) {
  const p0 = a ? periode(a) : { mulai: awalBulan(bulanAwal), selesai: akhirBulan(bulanAwal) };
  const [nama, setNama] = useState(a ? a.nama : '');
  const [rekId, setRekId] = useState(a ? a.rekening_id ?? null : null);
  const [mulai, setMulai] = useState(p0.mulai);
  const [selesai, setSelesai] = useState(p0.selesai);
  const [nominal, setNominal] = useState(a ? formatInput(a.nominal) : '');
  const [sudah, setSudah] = useState(a ? terpakaiSekarang > 0 : false);
  const [terpakaiTxt, setTerpakaiTxt] = useState(a && terpakaiSekarang > 0 ? formatInput(terpakaiSekarang) : '');

  const jatah = angkaDariTeks(nominal);
  const terpakai = sudah ? angkaDariTeks(terpakaiTxt) : 0;
  const sisa = jatah - terpakai;
  const jumlahHari = selisihHari(mulai, selesai) + 1;

  const opsiRek = [
    { key: null, label: 'Tanpa rekening' },
    ...rekening.map((r) => ({ key: r.id, label: r.nama })),
  ];

  const ubahMulai = (t) => {
    setMulai(t);
    if (selesai < t) setSelesai(t);
  };

  const pintas = [
    { label: 'Bulan kalender', pasang: () => { setSelesai(akhirBulan(mulai.slice(0, 7))); setMulai(awalBulan(mulai.slice(0, 7))); } },
    { label: '7 hari', pasang: () => setSelesai(tambahHari(mulai, 6)) },
    { label: '30 hari', pasang: () => setSelesai(tambahHari(mulai, 29)) },
    { label: '1 tahun', pasang: () => setSelesai(satuTahun(mulai)) },
  ];

  const simpan = () => {
    if (!nama.trim()) return Alert.alert('Keterangan pengeluaran belum diisi');
    if (!jatah) return Alert.alert('Nominal anggaran belum diisi');
    if (selesai < mulai) return Alert.alert('Tanggal akhir tidak boleh sebelum tanggal mulai');
    if (sudah && !terpakai) return Alert.alert('Isi nominal yang sudah terpakai');
    onSimpan({
      id: a ? a.id : null,
      nama: nama.trim(),
      nominal: jatah,
      mulai,
      selesai,
      bulan: mulai.slice(0, 7),
      rekId,
      ikon: a && a.nama === nama.trim() && a.ikon ? a.ikon : tebakIkon(nama),
      penyesuaian: terpakai - tertaut,
    });
  };

  return (
    <LayarForm
      judul="Atur anggaran"
      sub="Beri batas untuk setiap kebutuhan."
      onBatal={onBatal}
      tombol="Simpan anggaran"
      onTombol={simpan}
    >
      <Text style={s.label}>Keterangan pengeluaran</Text>
      <TextInput
        style={s.input}
        placeholder="mis. Belanja harian"
        placeholderTextColor={C.abu}
        value={nama}
        onChangeText={setNama}
      />

      <Dropdown label="Rekening yang digunakan" nilai={rekId} opsi={opsiRek} onPilih={setRekId} />

      <PilihTanggal label="Periode mulai" nilai={mulai} onPilih={ubahMulai} />
      <PilihTanggal label="Periode sampai" nilai={selesai} onPilih={setSelesai} />
      <View style={[s.chipRow, { marginTop: 10 }]}>
        {pintas.map((p) => (
          <Chip key={p.label} label={p.label} aktif={false} onPress={p.pasang} />
        ))}
      </View>
      <Text style={[s.petunjuk, selesai < mulai && { color: C.merah }]}>
        {selesai < mulai
          ? 'Tanggal akhir tidak boleh sebelum tanggal mulai.'
          : `Periode ${jumlahHari} hari: ${labelPanjang(mulai)} sampai ${labelPanjang(selesai)}.`}
      </Text>

      <KartuNominal label="Nominal anggaran pengeluaran" nilai={nominal} onChange={setNominal} />

      <Text style={[s.label, { marginTop: 22 }]}>Apakah sudah terpakai?</Text>
      <View style={s.radioRow}>
        <TouchableOpacity style={[s.radio, !sudah && s.radioAktif]} onPress={() => setSudah(false)}>
          <Ionicons
            name={!sudah ? 'checkmark-circle-outline' : 'ellipse-outline'}
            size={22}
            color={!sudah ? C.teal : C.abu}
          />
          <Text style={[s.fieldTeks, { fontSize: 14 }, !sudah && { color: C.teal, fontWeight: '700' }]}>
            Belum terpakai
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.radio, sudah && s.radioAktif]} onPress={() => setSudah(true)}>
          <Ionicons
            name={sudah ? 'checkmark-circle-outline' : 'ellipse-outline'}
            size={22}
            color={sudah ? C.teal : C.abu}
          />
          <Text style={[s.fieldTeks, { fontSize: 14 }, sudah && { color: C.teal, fontWeight: '700' }]}>
            Sudah terpakai
          </Text>
        </TouchableOpacity>
      </View>

      {sudah ? (
        <>
          <Text style={s.label}>Nominal yang sudah terpakai</Text>
          <TextInput
            style={s.input}
            placeholder="Rp0"
            placeholderTextColor={C.abu}
            keyboardType="numeric"
            value={terpakaiTxt ? 'Rp' + terpakaiTxt : ''}
            onChangeText={(t) => setTerpakaiTxt(formatInput(t))}
          />
          <Text style={s.petunjuk}>
            Pengeluaran tercatat dari transaksi: {rupiah(tertaut)}. Selisihnya disimpan sebagai penyesuaian.
          </Text>
        </>
      ) : null}

      <View style={s.sisaKartu}>
        <View style={s.rowBetween}>
          <Text style={s.sisaLabel}>{sisa >= 0 ? 'Sisa anggaran' : 'Lebih anggaran'}</Text>
          <Text style={[s.sisaAngka, sisa < 0 && { color: C.merah }]}>{rupiah(Math.abs(sisa))}</Text>
        </View>
        <Text style={s.sisaSub}>
          {rupiah(jatah)} − {rupiah(terpakai)} terpakai
        </Text>
      </View>

      <Catatan
        ikon="information-circle-outline"
        teks="Mengatur anggaran tidak mengurangi saldo rekening. Saldo berubah saat kamu mencatat pengeluaran."
      />

      {a ? (
        <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 18 }} onPress={onHapus}>
          <Text style={{ color: C.merah, fontWeight: '700' }}>Hapus anggaran</Text>
        </TouchableOpacity>
      ) : null}
    </LayarForm>
  );
}
