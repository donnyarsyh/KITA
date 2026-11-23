import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, StatusBar, BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ambilMeta, db, simpanMeta } from './db';
import {
  adaDiBulan,
  bulanIni,
  geserBulan,
  geserPeriode,
  hariIni,
  jamSekarang,
  konfirmasi,
  labelBulan,
  rupiah,
  sisaHutang,
  total,
} from './helper';
import { C, s } from './tema';
import { Chip, Sheet } from './components/Dasar';
import { PilihBulan } from './components/PilihBulan';
import { FormAnggaranHal } from './form/FormAnggaran';
import { FormHutangHal } from './form/FormHutang';
import { FormKeluarHal } from './form/FormKeluar';
import { FormMasukHal } from './form/FormMasuk';
import { FormPindahHal } from './form/FormPindah';
import { FormRekeningHal } from './form/FormRekening';
import { FormSaldoHal } from './form/FormSaldo';
import { Pengaturan } from './form/Pengaturan';
import { Anggaran } from './screens/Anggaran';
import { Beranda } from './screens/Beranda';
import { Tabungan } from './screens/Tabungan';
import { FormTabung } from './form/FormTabung';
import { FormTarget } from './form/FormTarget';
import { DetailHutang, HutangTab } from './screens/Hutang';
import { Transaksi } from './screens/Transaksi';

export default function Aplikasi({ pilihanTema, onTema, onPulih }) {
  const insets = useSafeAreaInsets();

  const [nama, setNama] = useState(() => ambilMeta('nama') || 'Donny');
  const [tab, setTab] = useState('beranda');
  // null | 'rekening' | 'saldo' | 'pindah' | 'masuk' | 'keluar' | 'anggaran' | 'hutangForm' | 'pengaturan' | 'target' | 'tabung' | 'rekTabungan'
  const [halaman, setHalaman] = useState(null);
  const [editAngId, setEditAngId] = useState(null);
  const [detailHutangId, setDetailHutangId] = useState(null);
  const [sembunyi, setSembunyi] = useState(false);
  const [filter, setFilter] = useState('semua');
  const [filterRek, setFilterRek] = useState(null);
  const [cari, setCari] = useState('');
  const [bulan, setBulan] = useState(bulanIni()); // dipakai Transaksi & Anggaran
  const [batas, setBatas] = useState(10);

  const [rekening, setRekening] = useState([]);
  const [transaksi, setTransaksi] = useState([]);
  const [anggaran, setAnggaran] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [hutang, setHutang] = useState([]);
  const [tabungan, setTabungan] = useState([]);
  const [editTargetId, setEditTargetId] = useState(null);
  const [tabungAwal, setTabungAwal] = useState({ mode: 'tabung', targetId: null });

  const [modalBulan, setModalBulan] = useState(false);
  const [modalFilter, setModalFilter] = useState(false);

  const muatData = () => {
    setRekening(db.getAllSync('SELECT * FROM rekening ORDER BY id'));
    setTransaksi(
      db.getAllSync('SELECT * FROM transaksi ORDER BY tanggal DESC, waktu DESC, id DESC')
    );
    setAnggaran(db.getAllSync('SELECT * FROM anggaran ORDER BY mulai, id'));
    setKategori(db.getAllSync('SELECT * FROM kategori ORDER BY id'));
    setHutang(db.getAllSync('SELECT * FROM hutang ORDER BY id DESC'));
    setTabungan(db.getAllSync('SELECT * FROM tabungan ORDER BY id'));
  };

  useEffect(() => {
    muatData();
  }, []);

  useEffect(() => {
    setBatas(10);
  }, [bulan, filter, filterRek, cari]);

  // Tombol Back Android menutup halaman form
  useEffect(() => {
    if (!halaman) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setHalaman(null);
      return true;
    });
    return () => sub.remove();
  }, [halaman]);

  // ----- Perhitungan -----
  const rekMap = Object.fromEntries(rekening.map((r) => [r.id, r]));
  // Rekening biasa (dipakai transaksi sehari-hari) dan rekening khusus tabungan dipisah
  const rekUtama = rekening.filter((r) => !r.khusus_tabungan);
  const rekTabungan = rekening.filter((r) => r.khusus_tabungan);

  // kecuali = id (atau daftar id) transaksi yang diabaikan, dipakai untuk cek sebelum menghapus
  const saldoRekening = (r, kecuali = null) => {
    const abaikan = Array.isArray(kecuali) ? kecuali : [kecuali];
    let saldo = r.saldo_awal;
    transaksi.forEach((t) => {
      if (abaikan.includes(t.id)) return;
      if (t.tipe === 'masuk' && t.rekening_id === r.id) saldo += t.nominal;
      if (t.tipe === 'keluar' && t.rekening_id === r.id) saldo -= t.nominal;
      if (t.tipe === 'tabung' && t.rekening_id === r.id) saldo -= t.nominal;
      if (t.tipe === 'tarik' && t.rekening_id === r.id) saldo += t.nominal;
      if (t.tipe === 'pindah') {
        if (t.rekening_id === r.id) saldo -= t.nominal;
        if (t.tujuan_id === r.id) saldo += t.nominal;
      }
    });
    return saldo;
  };

  const totalSaldo = total(rekUtama, (r) => saldoRekening(r));

  // Saldo sebuah target tabungan = uang yang ditabung dikurangi yang ditarik
  const saldoTabungan = (tb, kecuali = null) =>
    transaksi.reduce((n, t) => {
      if (t.id === kecuali || t.tabungan_id !== tb.id) return n;
      if (t.tipe === 'tabung') return n + t.nominal;
      if (t.tipe === 'tarik') return n - t.nominal;
      return n;
    }, 0);
  const totalTarget = total(tabungan, (tb) => saldoTabungan(tb));
  const totalRekTabungan = total(rekTabungan, (r) => saldoRekening(r));
  const totalTabungan = totalTarget + totalRekTabungan;

  // Pengeluaran yang terhubung ke anggaran + penyesuaian manual
  const tertautPer = (a) =>
    total(transaksi.filter((t) => t.tipe === 'keluar' && t.anggaran_id === a.id), (t) => t.nominal);
  const terpakaiPer = (a) => Math.max(0, tertautPer(a) + (a.penyesuaian || 0));

  // Anggaran yang periodenya bersinggungan dengan bulan b
  const hitungAng = (b) => {
    const daftar = anggaran.filter((a) => adaDiBulan(a, b));
    return {
      daftar,
      jatah: total(daftar, (a) => a.nominal),
      terpakai: total(daftar, terpakaiPer),
    };
  };

  // Seberapa sering sebuah anggaran (berdasarkan nama) dipakai di semua periode
  const frekAnggaran = (a) =>
    transaksi.reduce((n, t) => {
      if (t.tipe !== 'keluar' || !t.anggaran_id) return n;
      const x = anggaran.find((q) => q.id === t.anggaran_id);
      return x && x.nama.toLowerCase() === a.nama.toLowerCase() ? n + 1 : n;
    }, 0);

  // Kategori dari daftar kategori, diurutkan dari yang paling sering dipakai
  const opsiKategori = (tipe) => {
    const hitung = {};
    transaksi.forEach((t) => {
      if (t.tipe === tipe && t.kategori && !t.hutang_id) {
        const k = t.kategori.toLowerCase();
        hitung[k] = (hitung[k] || 0) + 1;
      }
    });
    return kategori
      .filter((k) => k.tipe === tipe)
      .map((k, i) => ({ key: k.nama, label: k.nama, hitung: hitung[k.nama.toLowerCase()] || 0, i }))
      .sort((a, b) => b.hitung - a.hitung || a.i - b.i);
  };

  const tambahKategori = (tipe) => (teks) => {
    const nama = (teks || '').trim();
    if (!nama) {
      Alert.alert('Nama kategori belum diisi');
      return null;
    }
    const ada = opsiKategori(tipe).find((o) => o.key.toLowerCase() === nama.toLowerCase());
    if (ada) return ada.key;
    db.runSync('INSERT INTO kategori (nama, tipe) VALUES (?, ?)', [nama, tipe]);
    muatData();
    return nama;
  };

  const hapusKategori = (tipe) => (nama, selesai) => {
    konfirmasi(
      'Hapus kategori?',
      `Kategori "${nama}" akan dihapus dari daftar pilihan. Transaksi lama yang memakainya tetap tersimpan.`,
      () => {
        db.runSync('DELETE FROM kategori WHERE tipe = ? AND LOWER(nama) = LOWER(?)', [tipe, nama]);
        muatData();
        if (selesai) selesai();
      }
    );
  };

  // ----- Aksi data -----
  const simpanRekening = (d) => {
    db.runSync('INSERT INTO rekening (nama, jenis, nomor, saldo_awal, warna, khusus_tabungan) VALUES (?, ?, ?, ?, ?, ?)', [
      d.nama, d.jenis, d.nomor, d.saldo, d.warna, d.khusus ? 1 : 0,
    ]);
    muatData();
    setHalaman(null);
  };

  const hapusRekening = (r) => {
    konfirmasi(
      'Hapus rekening?',
      `"${r.nama}" beserta semua transaksinya akan dihapus permanen.`,
      () => {
        db.runSync('DELETE FROM transaksi WHERE rekening_id = ? OR tujuan_id = ?', [r.id, r.id]);
        db.runSync('UPDATE anggaran SET rekening_id = NULL WHERE rekening_id = ?', [r.id]);
        db.runSync('UPDATE hutang SET rekening_id = NULL WHERE rekening_id = ?', [r.id]);
        db.runSync('DELETE FROM rekening WHERE id = ?', [r.id]);
        if (filterRek === r.id) setFilterRek(null);
        muatData();
      }
    );
  };

  // Menyisipkan transaksi tanpa memuat ulang data
  const sisipTrx = (d) =>
    db.runSync(
      'INSERT INTO transaksi (tipe, keterangan, nominal, tanggal, rekening_id, tujuan_id, anggaran_id, kategori, waktu, catatan, hutang_id, tabungan_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        d.tipe, d.keterangan, d.nominal, d.tanggal, d.rekId, d.tujuanId ?? null,
        d.angId ?? null, d.kategori ?? '', d.waktu, d.catatan ?? null, d.hutangId ?? null, d.tabunganId ?? null,
      ]
    );

  const simpanTransaksi = (d) => {
    sisipTrx(d);
    muatData();
  };

  const simpanDariHalaman = (d) => {
    simpanTransaksi(d);
    setHalaman(null);
  };

  const hapusTransaksi = (t) => {
    if (t.hutang_id) {
      Alert.alert(
        'Transaksi terkait hutang',
        'Transaksi ini dibuat otomatis dari menu Hutang. Untuk mengubahnya, hapus catatan hutangnya di menu Hutang.'
      );
      return;
    }
    // Pemasukan / uang pindahan yang sudah terpakai tidak boleh dihapus
    const terdampak =
      t.tipe === 'masuk' || t.tipe === 'tarik' ? t.rekening_id : t.tipe === 'pindah' ? t.tujuan_id : null;
    const r = terdampak ? rekening.find((x) => x.id === terdampak) : null;
    if (r && saldoRekening(r, t.id) < 0) {
      Alert.alert(
        'Transaksi tidak bisa dihapus',
        `Menghapus "${t.keterangan}" membuat saldo ${r.nama} menjadi ${rupiah(saldoRekening(r, t.id))}. Uangnya sudah terpakai oleh transaksi lain.`
      );
      return;
    }
    // Setoran tabungan yang sudah ditarik/dipakai tidak boleh dihapus
    if (t.tipe === 'tabung') {
      const tb = tabungan.find((x) => x.id === t.tabungan_id);
      if (tb && saldoTabungan(tb, t.id) < 0) {
        Alert.alert(
          'Transaksi tidak bisa dihapus',
          `Menghapus "${t.keterangan}" membuat saldo tabungan "${tb.nama}" menjadi ${rupiah(saldoTabungan(tb, t.id))}. Uangnya sudah ditarik.`
        );
        return;
      }
    }
    konfirmasi('Hapus transaksi?', `"${t.keterangan}" akan dihapus permanen.`, () => {
      db.runSync('DELETE FROM transaksi WHERE id = ?', [t.id]);
      muatData();
    });
  };

  const simpanAnggaran = (d) => {
    if (d.id) {
      db.runSync(
        'UPDATE anggaran SET nama = ?, nominal = ?, bulan = ?, mulai = ?, selesai = ?, rekening_id = ?, ikon = ?, penyesuaian = ? WHERE id = ?',
        [d.nama, d.nominal, d.bulan, d.mulai, d.selesai, d.rekId, d.ikon, d.penyesuaian, d.id]
      );
    } else {
      db.runSync(
        'INSERT INTO anggaran (nama, nominal, bulan, mulai, selesai, rekening_id, ikon, penyesuaian) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [d.nama, d.nominal, d.bulan, d.mulai, d.selesai, d.rekId, d.ikon, d.penyesuaian]
      );
    }
    muatData();
    setHalaman(null);
  };

  const hapusAnggaran = (a) => {
    konfirmasi('Hapus anggaran?', `"${a.nama}" akan dihapus. Transaksinya tetap ada.`, () => {
      db.runSync('UPDATE transaksi SET anggaran_id = NULL WHERE anggaran_id = ?', [a.id]);
      db.runSync('DELETE FROM anggaran WHERE id = ?', [a.id]);
      setHalaman(null);
      muatData();
    });
  };

  // ----- Hutang (sinkron dengan saldo rekening) -----
  const simpanHutang = (d) => {
    const beri = d.peran === 'beri';
    const res = db.runSync(
      'INSERT INTO hutang (peran, nama, nominal, dibayar, rekening_id, tanggal, tempo, catatan) VALUES (?, ?, ?, 0, ?, ?, ?, ?)',
      [d.peran, d.nama, d.nominal, d.rekId, d.tanggal, d.tempo, d.catatan]
    );
    sisipTrx({
      tipe: beri ? 'keluar' : 'masuk',
      keterangan: beri ? `Beri hutang ke ${d.nama}` : `Terima hutang dari ${d.nama}`,
      kategori: beri ? 'Pemberian hutang' : 'Penerimaan hutang',
      nominal: d.nominal,
      tanggal: d.tanggal,
      waktu: jamSekarang(),
      rekId: d.rekId,
      catatan: d.catatan,
      hutangId: res.lastInsertRowId,
    });
    muatData();
    setHalaman(null);
  };

  // Mencatat pembayaran/pengembalian + transaksi pada rekening
  const catatBayar = (h, jumlah, rekId) => {
    if (!jumlah) {
      Alert.alert('Nominal belum diisi');
      return false;
    }
    const sisa = sisaHutang(h);
    if (jumlah > sisa) {
      Alert.alert('Melebihi sisa', `Sisa pinjaman hanya ${rupiah(sisa)}.`);
      return false;
    }
    const beri = h.peran === 'beri';
    // Rekening yang dipilih saat membayar; bila tidak ada, pakai rekening asal hutang
    const rek = rekMap[rekId ?? h.rekening_id];
    if (rek && !beri && jumlah > saldoRekening(rek)) {
      Alert.alert(
        'Saldo rekening tidak cukup',
        `Saldo ${rek.nama} hanya ${rupiah(saldoRekening(rek))}, tidak cukup untuk membayar ${rupiah(jumlah)}.`
      );
      return false;
    }
    db.runSync('UPDATE hutang SET dibayar = dibayar + ? WHERE id = ?', [jumlah, h.id]);
    if (rek) {
      sisipTrx({
        tipe: beri ? 'masuk' : 'keluar',
        keterangan: beri ? `Pengembalian dari ${h.nama}` : `Bayar hutang ke ${h.nama}`,
        kategori: beri ? 'Pengembalian hutang' : 'Pembayaran hutang',
        nominal: jumlah,
        tanggal: hariIni(),
        waktu: jamSekarang(),
        rekId: rek.id,
        hutangId: h.id,
      });
    }
    muatData();
    return true;
  };

  const bayarHutang = (h, jumlah, rekId) => catatBayar(h, jumlah, rekId);
  const lunasHutang = (h, rekId) => catatBayar(h, sisaHutang(h), rekId);

  const hapusHutang = (h) => {
    const ids = transaksi.filter((t) => t.hutang_id === h.id).map((t) => t.id);
    if (ids.length) {
      const rusak = rekening.find((r) => saldoRekening(r, ids) < 0);
      if (rusak) {
        Alert.alert(
          'Catatan tidak bisa dihapus',
          `Menghapus transaksi terkait hutang ini membuat saldo ${rusak.nama} menjadi ${rupiah(saldoRekening(rusak, ids))}. Uangnya sudah terpakai oleh transaksi lain.`
        );
        return;
      }
    }
    konfirmasi(
      'Hapus catatan?',
      ids.length
        ? `Catatan hutang "${h.nama}" dan ${ids.length} transaksi terkaitnya akan dihapus. Saldo rekening menyesuaikan.`
        : `Catatan hutang "${h.nama}" akan dihapus permanen.`,
      () => {
        db.runSync('DELETE FROM transaksi WHERE hutang_id = ?', [h.id]);
        db.runSync('DELETE FROM hutang WHERE id = ?', [h.id]);
        setDetailHutangId(null);
        muatData();
      }
    );
  };

  const bukaHalaman = (mode) => {
    const butuhRek = ['saldo', 'pindah', 'masuk', 'keluar', 'hutangForm'].includes(mode);
    if (butuhRek && rekUtama.length === 0) {
      Alert.alert('Belum ada rekening', 'Buat rekening dulu.');
      setHalaman('rekening');
      return;
    }
    if (mode === 'pindah' && rekening.length < 2) {
      Alert.alert('Rekening kurang', 'Pindah saldo butuh minimal 2 rekening.');
      return;
    }
    setHalaman(mode);
  };

  const bukaAnggaran = (id = null) => {
    setEditAngId(id);
    setHalaman('anggaran');
  };

  // ----- Tabungan -----
  const simpanTarget = (d) => {
    if (d.id) {
      db.runSync('UPDATE tabungan SET nama = ?, target = ?, ikon = ?, tenggat = ? WHERE id = ?', [
        d.nama, d.target, d.ikon, d.tenggat, d.id,
      ]);
    } else {
      db.runSync('INSERT INTO tabungan (nama, target, ikon, tenggat) VALUES (?, ?, ?, ?)', [
        d.nama, d.target, d.ikon, d.tenggat,
      ]);
    }
    muatData();
    setHalaman(null);
  };

  const hapusTarget = (tb) => {
    const saldo = saldoTabungan(tb);
    if (saldo > 0) {
      Alert.alert(
        'Target belum kosong',
        `Masih ada ${rupiah(saldo)} di "${tb.nama}". Tarik dulu ke rekening, baru target bisa dihapus.`
      );
      return;
    }
    konfirmasi('Hapus target tabungan?', `"${tb.nama}" akan dihapus. Riwayat setoran tetap ada di Transaksi.`, () => {
      db.runSync('DELETE FROM tabungan WHERE id = ?', [tb.id]);
      setHalaman(null);
      muatData();
    });
  };

  const bukaTabung = (mode = 'tabung', targetId = null) => {
    if (rekUtama.length === 0) {
      Alert.alert('Belum ada rekening', 'Buat rekening dulu.');
      setHalaman('rekening');
      return;
    }
    if (tabungan.length === 0) {
      Alert.alert('Belum ada target', 'Buat target tabungan dulu, mis. "Tabungan nikah".');
      setEditTargetId(null);
      setHalaman('target');
      return;
    }
    setTabungAwal({ mode, targetId: targetId ?? tabungan[0].id });
    setHalaman('tabung');
  };

  const bukaTarget = (id = null) => {
    setEditTargetId(id);
    setHalaman('target');
  };

  // ----- Salin anggaran bulan lalu ke bulan yang sedang dipilih -----
  const simpanNama = (teks) => {
    simpanMeta('nama', teks);
    setNama(teks);
    setHalaman(null);
  };

  const salinAnggaran = (target) => {
    const lalu = geserBulan(target, -1);
    const sumber = anggaran.filter((a) => adaDiBulan(a, lalu));
    if (sumber.length === 0) {
      Alert.alert('Tidak ada yang bisa disalin', `Belum ada anggaran di ${labelBulan(lalu)}.`);
      return;
    }
    // Lewati anggaran yang sudah ada di bulan tujuan (periodenya sudah mencakup, atau namanya sama)
    const baru = sumber.filter(
      (a) =>
        !adaDiBulan(a, target) &&
        !anggaran.some((x) => adaDiBulan(x, target) && x.nama.toLowerCase() === a.nama.toLowerCase())
    );
    if (baru.length === 0) {
      Alert.alert('Sudah lengkap', `Semua anggaran ${labelBulan(lalu)} sudah ada di ${labelBulan(target)}.`);
      return;
    }
    const dilewati = sumber.length - baru.length;
    Alert.alert(
      'Salin anggaran?',
      `${baru.length} anggaran dari ${labelBulan(lalu)} akan disalin ke ${labelBulan(target)} ` +
        '(periode digeser satu bulan, nominal sama, jumlah terpakai mulai dari nol).' +
        (dilewati > 0 ? ` ${dilewati} anggaran dilewati karena sudah ada.` : ''),
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Salin',
          onPress: () => {
            baru.forEach((a) => {
              const p = geserPeriode(a, 1);
              db.runSync(
                'INSERT INTO anggaran (nama, nominal, bulan, mulai, selesai, rekening_id, ikon, penyesuaian) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
                [a.nama, a.nominal, p.mulai.slice(0, 7), p.mulai, p.selesai, a.rekening_id, a.ikon]
              );
            });
            muatData();
          },
        },
      ]
    );
  };

  const editAng = anggaran.find((a) => a.id === editAngId) || null;
  const editTarget = tabungan.find((x) => x.id === editTargetId) || null;

  // ====== RENDER ======
  const TAB = [
    { k: 'beranda', label: 'Beranda', ikon: 'grid' },
    { k: 'transaksi', label: 'Transaksi', ikon: 'swap-horizontal' },
    { k: 'anggaran', label: 'Anggaran', ikon: 'pie-chart' },
    { k: 'tabungan', label: 'Tabungan', ikon: 'flag' },
    { k: 'hutang', label: 'Hutang', ikon: 'wallet' },
  ];

  return (
    <View style={s.layar}>
      <StatusBar barStyle={C.gelap ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: 30,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {tab === 'beranda' ? (
          <Beranda
            nama={nama}
            transaksi={transaksi}
            rekening={rekUtama}
            rekMap={rekMap}
            totalSaldo={totalSaldo}
            totalTabungan={totalTabungan}
            saldoRekening={saldoRekening}
            hitungAng={hitungAng}
            sembunyi={sembunyi}
            setSembunyi={setSembunyi}
            bukaHalaman={bukaHalaman}
            hapusRekening={hapusRekening}
            setBulan={setBulan}
            setTab={setTab}
            onPengaturan={() => setHalaman('pengaturan')}
          />
        ) : tab === 'transaksi' ? (
          <Transaksi
            transaksi={transaksi}
            rekMap={rekMap}
            bulan={bulan}
            filter={filter}
            setFilter={setFilter}
            filterRek={filterRek}
            batas={batas}
            setBatas={setBatas}
            cari={cari}
            setCari={setCari}
            bukaHalaman={bukaHalaman}
            hapusTransaksi={hapusTransaksi}
            setModalBulan={setModalBulan}
            setModalFilter={setModalFilter}
          />
        ) : tab === 'anggaran' ? (
          <Anggaran
            anggaran={anggaran}
            transaksi={transaksi}
            rekMap={rekMap}
            bulan={bulan}
            terpakaiPer={terpakaiPer}
            bukaAnggaran={bukaAnggaran}
            setModalBulan={setModalBulan}
            onSalin={salinAnggaran}
          />
        ) : tab === 'tabungan' ? (
          <Tabungan
            tabungan={tabungan}
            saldoTabungan={saldoTabungan}
            totalTabungan={totalTabungan}
            totalTarget={totalTarget}
            rekTabungan={rekTabungan}
            saldoRekening={saldoRekening}
            onTarget={bukaTarget}
            onTabung={bukaTabung}
            onTambahRek={() => setHalaman('rekTabungan')}
            onPindah={() => bukaHalaman('pindah')}
            onHapusRek={hapusRekening}
          />
        ) : (
          <HutangTab
            hutang={hutang}
            rekMap={rekMap}
            onTambah={() => bukaHalaman('hutangForm')}
            onBuka={setDetailHutangId}
          />
        )}
      </ScrollView>

      <View style={[s.nav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {TAB.map((t) => {
          const aktif = tab === t.k;
          return (
            <TouchableOpacity key={t.k} style={s.navItem} onPress={() => setTab(t.k)}>
              <View style={[s.navPil, aktif && { backgroundColor: C.mint }]}>
                <Ionicons
                  name={aktif ? t.ikon : `${t.ikon}-outline`}
                  size={22}
                  color={aktif ? C.teal : C.abu}
                />
              </View>
              <Text style={[s.navLabel, aktif && { color: C.teal, fontWeight: '700' }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <PilihBulan
        visible={modalBulan}
        onClose={() => setModalBulan(false)}
        bulan={bulan}
        onPilih={setBulan}
      />
      <Sheet visible={modalFilter} onClose={() => setModalFilter(false)} judul="Filter transaksi">
        <Text style={s.label}>Rekening</Text>
        <View style={s.chipRow}>
          <Chip
            label="Semua rekening"
            aktif={filterRek === null}
            onPress={() => {
              setFilterRek(null);
              setModalFilter(false);
            }}
          />
          {rekening.map((r) => (
            <Chip
              key={r.id}
              label={r.nama}
              aktif={filterRek === r.id}
              onPress={() => {
                setFilterRek(r.id);
                setModalFilter(false);
              }}
            />
          ))}
        </View>
      </Sheet>

      {halaman === 'rekening' ? (
        <FormRekeningHal
          totalSaldo={totalSaldo}
          onSimpan={simpanRekening}
          onBatal={() => setHalaman(null)}
          onGanti={bukaHalaman}
        />
      ) : null}
      {halaman === 'rekTabungan' ? (
        <FormRekeningHal khusus totalSaldo={totalTabungan} onSimpan={simpanRekening} onBatal={() => setHalaman(null)} />
      ) : null}
      {halaman === 'saldo' ? (
        <FormSaldoHal
          rekening={rekUtama}
          saldoRek={saldoRekening}
          totalSaldo={totalSaldo}
          opsiKat={opsiKategori('masuk')}
          onKatBaru={tambahKategori('masuk')}
          onKatHapus={hapusKategori('masuk')}
          onSimpan={simpanDariHalaman}
          onBatal={() => setHalaman(null)}
          onGanti={bukaHalaman}
        />
      ) : null}
      {halaman === 'pindah' ? (
        <FormPindahHal
          rekening={rekening}
          saldoRek={saldoRekening}
          totalSaldo={totalSaldo}
          onSimpan={simpanDariHalaman}
          onBatal={() => setHalaman(null)}
        />
      ) : null}
      {halaman === 'masuk' ? (
        <FormMasukHal
          rekening={rekUtama}
          saldoRek={saldoRekening}
          totalSaldo={totalSaldo}
          opsiKat={opsiKategori('masuk')}
          onKatBaru={tambahKategori('masuk')}
          onKatHapus={hapusKategori('masuk')}
          onSimpan={simpanDariHalaman}
          onBatal={() => setHalaman(null)}
        />
      ) : null}
      {halaman === 'keluar' ? (
        <FormKeluarHal
          rekening={rekUtama}
          anggaran={anggaran}
          saldoRek={saldoRekening}
          totalSaldo={totalSaldo}
          terpakaiPer={terpakaiPer}
          frekAng={frekAnggaran}
          opsiKat={opsiKategori('keluar')}
          onKatBaru={tambahKategori('keluar')}
          onKatHapus={hapusKategori('keluar')}
          onSimpan={simpanDariHalaman}
          onBatal={() => setHalaman(null)}
        />
      ) : null}
      {halaman === 'anggaran' ? (
        <FormAnggaranHal
          key={editAng ? editAng.id : 'baru'}
          a={editAng}
          bulanAwal={bulan}
          rekening={rekUtama}
          tertaut={editAng ? tertautPer(editAng) : 0}
          terpakaiSekarang={editAng ? terpakaiPer(editAng) : 0}
          onSimpan={simpanAnggaran}
          onBatal={() => setHalaman(null)}
          onHapus={() => editAng && hapusAnggaran(editAng)}
        />
      ) : null}
      {halaman === 'hutangForm' ? (
        <FormHutangHal
          rekening={rekUtama}
          saldoRek={saldoRekening}
          onSimpan={simpanHutang}
          onBatal={() => setHalaman(null)}
        />
      ) : null}

      {halaman === 'target' ? (
        <FormTarget
          key={editTarget ? editTarget.id : 'baru'}
          tb={editTarget}
          saldo={editTarget ? saldoTabungan(editTarget) : 0}
          onSimpan={simpanTarget}
          onBatal={() => setHalaman(null)}
          onHapus={() => editTarget && hapusTarget(editTarget)}
        />
      ) : null}
      {halaman === 'tabung' ? (
        <FormTabung
          modeAwal={tabungAwal.mode}
          targetAwal={tabungAwal.targetId}
          rekening={rekUtama}
          tabungan={tabungan}
          saldoRek={saldoRekening}
          saldoTab={saldoTabungan}
          totalSaldo={totalSaldo}
          onSimpan={simpanDariHalaman}
          onBatal={() => setHalaman(null)}
        />
      ) : null}
      {halaman === 'pengaturan' ? (
        <Pengaturan
          nama={nama}
          pilihanTema={pilihanTema}
          onTema={onTema}
          onSimpan={simpanNama}
          onBatal={() => setHalaman(null)}
          onPulih={onPulih}
        />
      ) : null}

      <DetailHutang
        key={detailHutangId ?? 'x'}
        h={hutang.find((x) => x.id === detailHutangId) || null}
        rekMap={rekMap}
        rekening={rekUtama}
        saldoRek={saldoRekening}
        onClose={() => setDetailHutangId(null)}
        onBayar={bayarHutang}
        onLunas={lunasHutang}
        onHapus={hapusHutang}
      />
    </View>
  );
}
