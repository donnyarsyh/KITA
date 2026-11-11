import { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import {
  adaDiTanggal,
  angkaDariTeks,
  hariIni,
  jamSekarang,
  labelPanjang,
  labelPeriode,
  rupiah,
} from '../helper';
import { C, s } from '../tema';
import { Bar } from '../components/Dasar';
import { Dropdown, KartuNominal, PilihTanggal } from '../components/Input';
import { Catatan, LayarForm } from '../components/LayarForm';
import { PilihSering } from '../components/PilihSering';

export function FormKeluarHal({
  rekening, anggaran, saldoRek, totalSaldo, terpakaiPer, frekAng, opsiKat, onKatBaru, onKatHapus, onSimpan, onBatal,
}) {
  const [nominal, setNominal] = useState('');
  const [ket, setKet] = useState('');
  const [kategori, setKategori] = useState(opsiKat[0]?.key ?? null);
  const [rekId, setRekId] = useState(rekening[0]?.id ?? null);
  const [tanggal, setTanggal] = useState(hariIni());
  const [angId, setAngId] = useState(null);

  const jumlah = angkaDariTeks(nominal);
  const rek = rekening.find((r) => r.id === rekId);
  const saldoNow = rek ? saldoRek(rek) : 0;

  // Anggaran yang periodenya mencakup tanggal transaksi, diurutkan dari yang paling sering dipakai
  const opsiAng = anggaran
    .filter((a) => adaDiTanggal(a, tanggal))
    .map((a) => ({ key: a.id, label: a.nama, hitung: frekAng(a), a }))
    .sort((x, y) => y.hitung - x.hitung);
  const ang = opsiAng.find((o) => o.key === angId)?.a || null;

  const lebihTotal = jumlah > totalSaldo;
  const lebihRek = !!rek && jumlah > saldoNow;
  const kurang = jumlah > 0 && (lebihTotal || lebihRek);

  const opsiRek = rekening.map((r) => ({ key: r.id, label: `${r.nama} • ${rupiah(saldoRek(r))}` }));

  const pilihAnggaran = (k) => {
    setAngId(k);
    const o = opsiAng.find((x) => x.key === k);
    if (!o) return;
    const a = o.a;
    if (a.rekening_id && rekening.some((r) => r.id === a.rekening_id)) setRekId(a.rekening_id);
    const cocok = opsiKat.find((x) => x.key.toLowerCase() === a.nama.toLowerCase());
    if (cocok) setKategori(cocok.key);
  };

  const simpan = () => {
    if (!jumlah) return Alert.alert('Nominal belum diisi');
    if (!rek) return Alert.alert('Pilih rekening yang digunakan');
    const judul = ket.trim() || (ang ? ang.nama : kategori || '');
    if (!judul) return Alert.alert('Keterangan belum diisi');

    if (lebihTotal) {
      return Alert.alert(
        'Saldo tidak cukup',
        `Pengeluaran ${rupiah(jumlah)} melebihi total saldo semua rekening (${rupiah(totalSaldo)}).`
      );
    }
    if (lebihRek) {
      return Alert.alert(
        'Saldo rekening tidak cukup',
        `Pengeluaran ${rupiah(jumlah)} melebihi saldo ${rek.nama} (${rupiah(saldoNow)}). Pilih rekening lain atau kurangi nominal.`
      );
    }

    onSimpan({
      tipe: 'keluar',
      keterangan: judul,
      kategori: kategori || '',
      nominal: jumlah,
      tanggal,
      waktu: jamSekarang(),
      rekId: rek.id,
      tujuanId: null,
      angId: ang ? ang.id : null,
      catatan: null,
    });
  };

  const sesudah = ang ? terpakaiPer(ang) + jumlah : 0;
  const sisa = ang ? ang.nominal - sesudah : 0;
  const persen = ang && ang.nominal > 0 ? Math.round((sesudah / ang.nominal) * 100) : 0;

  return (
    <LayarForm
      judul="Tambah pengeluaran"
      sub="Tahu ke mana uangmu pergi."
      onBatal={onBatal}
      tombol="Simpan pengeluaran"
      onTombol={simpan}
    >
      <KartuNominal label="Nominal pengeluaran" nilai={nominal} onChange={setNominal} />

      <Text style={s.label}>Keterangan pengeluaran</Text>
      <TextInput
        style={s.input}
        placeholder="mis. Belanja kebutuhan dapur"
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

      <Dropdown label="Rekening yang digunakan" nilai={rekId} opsi={opsiRek} onPilih={setRekId} />

      <PilihTanggal label="Tanggal transaksi" nilai={tanggal} onPilih={setTanggal} />

      {opsiAng.length === 0 ? (
        <View>
          <Text style={s.label}>Hubungkan ke anggaran</Text>
          <Text style={s.petunjuk}>Belum ada anggaran yang periodenya mencakup {labelPanjang(tanggal)}.</Text>
        </View>
      ) : (
        <PilihSering
          label="Hubungkan ke anggaran"
          nilai={angId}
          opsi={opsiAng}
          onPilih={pilihAnggaran}
          kosongLabel="Tanpa anggaran"
        />
      )}

      {ang ? (
        <View style={s.ringkasKartu}>
          <Text style={s.ringkasJudulTebal}>Anggaran setelah disimpan</Text>
          <Text style={[s.trxSub, { marginTop: 2 }]}>{labelPeriode(ang)}</Text>
          <View style={[s.rowBetween, { marginTop: 12 }]}>
            <Text style={s.angTerpakai}>{rupiah(sesudah)} terpakai</Text>
            <Text style={[s.angPersen, persen > 100 && { color: C.merah }]}>{persen}%</Text>
          </View>
          <View style={{ marginVertical: 10 }}>
            <Bar persen={persen} warna={persen > 100 ? C.merah : C.teal} />
          </View>
          <View style={s.rowBetween}>
            <Text style={s.trxSub}>dari {rupiah(ang.nominal)}</Text>
            <Text style={[s.linkTeal, sisa < 0 && { color: C.merah }]}>
              {sisa >= 0 ? 'Sisa ' : 'Lebih '}
              {rupiah(Math.abs(sisa))}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={[s.rowBetween, { marginTop: 18, paddingHorizontal: 4 }]}>
        <Text style={s.ringkasLabel2}>Saldo {rek ? rek.nama : '-'} setelah disimpan</Text>
        <Text style={[s.ringkasNilai, { fontSize: 18 }, kurang && { color: C.merah }]}>
          {rupiah(saldoNow - jumlah)}
        </Text>
      </View>

      {kurang ? (
        <Catatan
          merah
          ikon="warning-outline"
          teks={
            lebihTotal
              ? `Nominal melebihi total saldo semua rekening (${rupiah(totalSaldo)}). Pengeluaran tidak bisa disimpan.`
              : `Nominal melebihi saldo ${rek.nama} (${rupiah(saldoNow)}). Pilih rekening lain atau kurangi nominal.`
          }
        />
      ) : (
        <Catatan
          ikon="information-circle-outline"
          teks={
            ang
              ? `Pengeluaran ini mengurangi saldo ${rek ? rek.nama : 'rekening'} dan otomatis menambah nominal terpakai di anggaran ${ang.nama}.`
              : `Pengeluaran ini mengurangi saldo ${rek ? rek.nama : 'rekening'}.`
          }
        />
      )}
    </LayarForm>
  );
}
