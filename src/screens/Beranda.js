import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  bulanIni,
  NAMA_BULAN,
  NAMA_HARI,
  ribuan,
  rupiah,
  total,
  WARNA_REK,
  warnaRekTema,
} from '../helper';
import { C, s } from '../tema';
import { BarisTransaksi } from '../components/BarisTransaksi';
import { Bar, Judul, Kosong } from '../components/Dasar';
import { PanelGrafik } from '../components/Grafik';

export function Beranda({
  nama, transaksi, rekening, rekMap, totalSaldo, totalTabungan, saldoRekening, hitungAng,
  sembunyi, setSembunyi, bukaHalaman, hapusRekening, setBulan, setTab, onPengaturan,
}) {
  const { width } = useWindowDimensions();

  // ----- Ringkasan bulan ini -----
  const bln = bulanIni();
  const trxBulan = transaksi.filter((t) => t.tanggal.startsWith(bln));
  const masukBulan = total(trxBulan.filter((t) => t.tipe === 'masuk'), (t) => t.nominal);
  const keluarBulan = total(trxBulan.filter((t) => t.tipe === 'keluar'), (t) => t.nominal);
  const bersih = masukBulan - keluarBulan;

  const angSekarang = hitungAng(bln);
  const persenBulan =
    angSekarang.jatah > 0 ? Math.round((angSekarang.terpakai / angSekarang.jatah) * 100) : 0;
  const sisaBulan = angSekarang.jatah - angSekarang.terpakai;

  const tampil = (teks) => (sembunyi ? '••••••' : teks);
  const sekarang = new Date();
  const teksTanggal = `${NAMA_HARI[sekarang.getDay()]}, ${sekarang.getDate()} ${NAMA_BULAN[sekarang.getMonth()]} ${sekarang.getFullYear()}`;
  const cardW = (width - 40 - 20) / 3;

  return (
    <>
      <View style={s.merek}>
        <Image source={require('../../assets/logo-kita.png')} style={s.merekLogo} />
        <View style={{ flex: 1 }}>
          <Text style={s.merekNama}>KITA</Text>
          <Text style={s.merekSub}>(Kelola Income, Transaksi, Anggaran)</Text>
        </View>
      </View>

      <View style={[s.rowBetween, { marginTop: 18 }]}>
        <View>
          <Text style={s.tglKecil}>{teksTanggal}</Text>
          <Text style={s.salam}>Halo, {nama} 👋</Text>
        </View>
        <TouchableOpacity style={s.avatar} onPress={onPengaturan} activeOpacity={0.7}>
          <Text style={s.avatarTeks}>{nama.slice(0, 2).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.hero}>
        <View style={s.rowBetween}>
          <Text style={s.heroLabel}>Total saldo kamu</Text>
          <TouchableOpacity onPress={() => setSembunyi(!sembunyi)} hitSlop={10}>
            <Ionicons name={sembunyi ? 'eye-off-outline' : 'eye-outline'} size={22} color="#cfe8e1" />
          </TouchableOpacity>
        </View>
        <Text style={s.heroAngka}>{sembunyi ? 'Rp ••••••••' : rupiah(totalSaldo)}</Text>
        <View style={s.heroTren}>
          <Ionicons name={bersih >= 0 ? 'trending-up' : 'trending-down'} size={16} color="#cfe8e1" />
          <Text style={s.heroTrenTeks}>
            {sembunyi ? '••••' : `${bersih >= 0 ? '+' : '-'}${rupiah(Math.abs(bersih))}`} bersih bulan ini
          </Text>
        </View>
        {totalTabungan > 0 ? (
          <Text style={s.heroTrenTeks}>
            Tabungan terpisah: {sembunyi ? '••••' : rupiah(totalTabungan)}
          </Text>
        ) : null}
        <View style={s.heroGaris} />
        <View style={s.rowBetween}>
          <View>
            <Text style={s.heroLabel}>↙  Pemasukan</Text>
            <Text style={s.heroSub}>{tampil(rupiah(masukBulan))}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.heroLabel}>↗  Pengeluaran</Text>
            <Text style={s.heroSub}>{tampil(rupiah(keluarBulan))}</Text>
          </View>
        </View>
      </View>

      <Judul teks="Grafik transaksi" />
      <PanelGrafik transaksi={transaksi} bulanAwal={bln} />

      <Judul teks="Rekening saya" aksi="+ Tambah" onAksi={() => bukaHalaman('rekening')} />
      {rekening.length === 0 ? (
        <Kosong teks="Belum ada rekening. Ketuk + Tambah untuk membuat rekening pertama." />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {rekening.map((r, i) => {
            const w = warnaRekTema()[(r.warna ?? i) % WARNA_REK.length];
            const bank = r.jenis === 'bank';
            return (
              <TouchableOpacity
                key={r.id}
                activeOpacity={0.8}
                onLongPress={() => hapusRekening(r)}
                style={[s.rekCard, { width: cardW, backgroundColor: w.bg }]}
              >
                <Ionicons
                  name={bank ? 'business-outline' : 'wallet-outline'}
                  size={22}
                  color={w.ikon}
                />
                <Text style={[s.rekRp, { color: w.ikon }]}>Rp</Text>
                <Text style={s.rekAngka} numberOfLines={1} adjustsFontSizeToFit>
                  {sembunyi ? '••••' : ribuan(saldoRekening(r))}
                </Text>
                <Text style={s.rekSub} numberOfLines={1}>
                  {bank ? (r.nomor ? `•• ${r.nomor}` : r.nama) : r.jenis === 'ewallet' ? 'E-wallet' : 'Dompet'}
                </Text>
                {bank && r.nomor ? <Text style={s.rekNama} numberOfLines={1}>{r.nama}</Text> : null}
                {!bank ? <Text style={s.rekNama} numberOfLines={1}>{r.nama}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
      {rekening.length > 0 ? (
        <Text style={s.petunjuk}>Tekan lama sebuah rekening untuk menghapusnya.</Text>
      ) : null}

      <Judul
        teks={`Anggaran ${NAMA_BULAN[sekarang.getMonth()]}`}
        aksi="Lihat detail"
        onAksi={() => {
          setBulan(bln);
          setTab('anggaran');
        }}
      />
      {angSekarang.daftar.length === 0 ? (
        <Kosong teks="Belum ada anggaran bulan ini. Buka menu Anggaran untuk membuatnya." />
      ) : (
        <View style={s.kartu}>
          <View style={s.rowBetween}>
            <Text style={s.angTerpakai}>{tampil(rupiah(angSekarang.terpakai))} terpakai</Text>
            <Text style={[s.angPersen, persenBulan > 100 && { color: C.merah }]}>{persenBulan}%</Text>
          </View>
          <View style={{ marginVertical: 10 }}>
            <Bar persen={persenBulan} warna={persenBulan > 100 ? C.merah : C.teal} />
          </View>
          <View style={s.rowBetween}>
            <Text style={s.trxSub}>dari {tampil(rupiah(angSekarang.jatah))}</Text>
            <Text style={[s.linkTeal, sisaBulan < 0 && { color: C.merah }]}>
              {sisaBulan >= 0 ? 'Sisa ' : 'Lebih '}
              {tampil(rupiah(Math.abs(sisaBulan)))}
            </Text>
          </View>
        </View>
      )}

      <Judul teks="Transaksi terbaru" aksi="Lihat semua" onAksi={() => setTab('transaksi')} />
      {transaksi.length === 0 ? (
        <Kosong teks="Belum ada transaksi." />
      ) : (
        transaksi.slice(0, 3).map((t) => (
          <BarisTransaksi key={t.id} t={t} rekMap={rekMap} tampilTanggal />
        ))
      )}
    </>
  );
}
