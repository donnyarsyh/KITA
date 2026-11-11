import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  adaDiRentang,
  akhirBulan,
  awalBulan,
  gayaIkon,
  geserBulan,
  hariIni,
  IKON_ANG,
  labelBulan,
  labelPanjang,
  labelPeriode,
  rupiah,
  selisihHari,
  statusAnggaran,
  tambahHari,
  tglPendek,
  total,
} from '../helper';
import { C, s } from '../tema';
import { Bar, Chip, Header, Judul, Kosong } from '../components/Dasar';
import { PilihTanggal } from '../components/Input';

export function Anggaran({
  anggaran, transaksi, rekMap, bulan, terpakaiPer, bukaAnggaran, setModalBulan, onSalin,
}) {
  // Filter: 'bulan' = per bulan kalender, 'rentang' = periode bebas (mis. 21 Okt - 22 Nov)
  const [mode, setMode] = useState('bulan');
  const [dari, setDari] = useState(awalBulan(bulan));
  const [sampai, setSampai] = useState(akhirBulan(bulan));
  const rentang = mode === 'rentang';
  const dariEf = rentang ? dari : awalBulan(bulan);
  const sampaiEf = rentang ? (sampai < dari ? dari : sampai) : akhirBulan(bulan);

  const ubahDari = (t) => {
    setDari(t);
    if (sampai < t) setSampai(t);
  };
  const pintas = [
    { label: '7 hari terakhir', pasang: () => { setDari(tambahHari(hariIni(), -6)); setSampai(hariIni()); } },
    { label: '30 hari terakhir', pasang: () => { setDari(tambahHari(hariIni(), -29)); setSampai(hariIni()); } },
    { label: 'Bulan ini', pasang: () => { setDari(awalBulan(hariIni().slice(0, 7))); setSampai(akhirBulan(hariIni().slice(0, 7))); } },
    { label: 'Tahun ini', pasang: () => { setDari(hariIni().slice(0, 4) + '-01-01'); setSampai(hariIni().slice(0, 4) + '-12-31'); } },
  ];

  const daftar = anggaran.filter((a) => adaDiRentang(a, dariEf, sampaiEf));
  const angPilih = {
    daftar,
    jatah: total(daftar, (a) => a.nominal),
    terpakai: total(daftar, terpakaiPer),
  };
  const diLuar = total(
    transaksi.filter(
      (t) =>
        t.tipe === 'keluar' &&
        t.tanggal >= dariEf &&
        t.tanggal <= sampaiEf &&
        !anggaran.some((a) => a.id === t.anggaran_id)
    ),
    (t) => t.nominal
  );
  const persenAng = angPilih.jatah > 0 ? Math.round((angPilih.terpakai / angPilih.jatah) * 100) : 0;
  const sisaAng = angPilih.jatah - angPilih.terpakai;

  return (
    <>
      <Header
        judul="Anggaran"
        sub="Rencana kecil, keuangan lebih tenang."
        onPlus={() => bukaAnggaran(null)}
      />

      <View style={[s.chipRow, { marginTop: 16 }]}>
        <Chip label="Per bulan" aktif={!rentang} onPress={() => setMode('bulan')} />
        <Chip label="Rentang tanggal" aktif={rentang} onPress={() => setMode('rentang')} />
      </View>

      {rentang ? (
        <>
          <PilihTanggal label="Dari tanggal" nilai={dari} onPilih={ubahDari} />
          <PilihTanggal label="Sampai tanggal" nilai={sampaiEf} onPilih={setSampai} />
          <View style={[s.chipRow, { marginTop: 10 }]}>
            {pintas.map((p) => (
              <Chip key={p.label} label={p.label} aktif={false} onPress={p.pasang} />
            ))}
          </View>
          <Text style={s.petunjuk}>
            {`${selisihHari(dariEf, sampaiEf) + 1} hari: ${labelPanjang(dariEf)} sampai ${labelPanjang(sampaiEf)}. Menampilkan anggaran yang periodenya bersinggungan dengan rentang ini.`}
          </Text>
        </>
      ) : (
        <>
          <TouchableOpacity style={[s.rowBetween, { marginTop: 14 }]} onPress={() => setModalBulan(true)}>
            <Text style={s.bulanBtnTeks}>{labelBulan(bulan)}</Text>
            <Ionicons name="chevron-down" size={20} color={C.teks} />
          </TouchableOpacity>
          <Text style={s.petunjuk}>Menampilkan anggaran yang periodenya bersinggungan dengan bulan ini.</Text>
        </>
      )}

      <View style={s.heroAng}>
        <Text style={s.heroLabel}>{rentang ? 'Sisa anggaran periode ini' : 'Sisa anggaran bulan ini'}</Text>
        <Text style={s.heroAngBesar} numberOfLines={1} adjustsFontSizeToFit>
          {rupiah(sisaAng)}
        </Text>
        <View style={s.rowBetween}>
          <Text style={s.heroLabel}>{rupiah(angPilih.terpakai)} terpakai</Text>
          <Text style={s.heroPersen}>{persenAng}%</Text>
        </View>
        <View style={{ marginVertical: 12 }}>
          <Bar
            persen={persenAng}
            warna={persenAng > 100 ? '#ffb4a8' : '#9fd8c8'}
            latar="rgba(255,255,255,0.22)"
          />
        </View>
        <Text style={s.heroLabel}>Total anggaran {rupiah(angPilih.jatah)}</Text>
      </View>

      {rentang ? null : (
        <TouchableOpacity style={s.salinBtn} activeOpacity={0.7} onPress={() => onSalin(bulan)}>
          <Ionicons name="copy-outline" size={18} color={C.teal} />
          <Text style={s.chipLinkTeks}>Salin anggaran dari {labelBulan(geserBulan(bulan, -1))}</Text>
        </TouchableOpacity>
      )}

      <Judul teks="Alokasi pengeluaran" aksi={`${angPilih.daftar.length} anggaran`} />

      {angPilih.daftar.length === 0 ? (
        <Kosong teks={rentang ? `Tidak ada anggaran pada ${tglPendek(dariEf)} – ${tglPendek(sampaiEf)}. Ketuk + di kanan atas untuk membuatnya.` : `Belum ada anggaran untuk ${labelBulan(bulan)}. Ketuk + di kanan atas, atau salin dari bulan lalu.`} />
      ) : (
        angPilih.daftar.map((a) => {
          const ik0 = IKON_ANG[a.ikon] || IKON_ANG.lainnya;
          const ikg = gayaIkon(ik0.bg, ik0.fg);
          const ik = { ...ik0, bg: ikg.bg, fg: ikg.fg };
          const terpakai = terpakaiPer(a);
          const sisa = a.nominal - terpakai;
          const persen = a.nominal > 0 ? Math.round((terpakai / a.nominal) * 100) : 0;
          const st = statusAnggaran(terpakai, a.nominal);
          const rek = rekMap[a.rekening_id]?.nama;
          return (
            <TouchableOpacity
              key={a.id}
              activeOpacity={0.8}
              style={s.angKartu}
              onPress={() => bukaAnggaran(a.id)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[s.angIkon, { backgroundColor: ik.bg }]}>
                  <Ionicons name={ik.ikon} size={22} color={ik.fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.trxJudul} numberOfLines={1}>{a.nama}</Text>
                  <Text style={s.trxSub} numberOfLines={1}>
                    {[rek, st.teks].filter(Boolean).join(' • ')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={C.abu} />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <Ionicons name="calendar-outline" size={14} color={C.abu} />
                <Text style={s.trxSub}>{labelPeriode(a)}</Text>
              </View>

              <View style={[s.rowBetween, { marginTop: 12 }]}>
                <Text style={s.angTerpakai}>{rupiah(terpakai)}</Text>
                <Text style={s.trxSub}>/ {rupiah(a.nominal)}</Text>
              </View>
              <View style={{ marginTop: 8, marginBottom: 10 }}>
                <Bar persen={persen} warna={st.warna === C.merah ? C.merah : ik.bar} />
              </View>
              <Text style={{ color: sisa >= 0 ? C.teal : C.merah, fontWeight: '700', fontSize: 14 }}>
                {sisa >= 0 ? 'Sisa ' : 'Lebih '}
                {rupiah(Math.abs(sisa))}
              </Text>
            </TouchableOpacity>
          );
        })
      )}

      {angPilih.daftar.length > 0 ? (
        <Text style={s.petunjuk}>Ketuk kartu anggaran untuk mengatur nominal, periode, atau jumlah terpakai.</Text>
      ) : null}
      {diLuar > 0 ? (
        <Text style={s.petunjuk}>Pengeluaran di luar anggaran {rentang ? 'pada periode ini' : 'bulan ini'}: {rupiah(diLuar)}</Text>
      ) : null}
    </>
  );
}
