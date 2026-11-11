import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, Modal, KeyboardAvoidingView, StatusBar, useWindowDimensions, BackHandler,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SQLite from 'expo-sqlite';

// Ganti dengan namamu
const NAMA_PENGGUNA = 'Donny';

// ====== DATABASE ======
const db = SQLite.openDatabaseSync('keuangan.db');

db.execSync(`
  CREATE TABLE IF NOT EXISTS rekening (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    jenis TEXT NOT NULL DEFAULT 'bank',
    nomor TEXT,
    saldo_awal INTEGER NOT NULL DEFAULT 0,
    warna INTEGER
  );
  CREATE TABLE IF NOT EXISTS anggaran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    nominal INTEGER NOT NULL,
    bulan TEXT NOT NULL,
    rekening_id INTEGER,
    ikon TEXT,
    penyesuaian INTEGER DEFAULT 0,
    mulai TEXT,
    selesai TEXT
  );
  CREATE TABLE IF NOT EXISTS transaksi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipe TEXT NOT NULL,
    keterangan TEXT NOT NULL,
    nominal INTEGER NOT NULL,
    tanggal TEXT NOT NULL,
    rekening_id INTEGER NOT NULL,
    tujuan_id INTEGER,
    anggaran_id INTEGER,
    kategori TEXT,
    waktu TEXT,
    catatan TEXT,
    hutang_id INTEGER
  );
  CREATE TABLE IF NOT EXISTS kategori (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    tipe TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS hutang (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    peran TEXT NOT NULL,
    nama TEXT NOT NULL,
    nominal INTEGER NOT NULL,
    dibayar INTEGER NOT NULL DEFAULT 0,
    rekening_id INTEGER,
    tanggal TEXT NOT NULL,
    tempo TEXT,
    catatan TEXT
  );
  CREATE TABLE IF NOT EXISTS meta (
    kunci TEXT PRIMARY KEY,
    nilai TEXT
  );
`);

// Tambah kolom baru untuk database lama (aman dijalankan berulang)
const tambahKolom = (tabel, kolom, tipe) => {
  const ada = db.getAllSync(`PRAGMA table_info(${tabel})`).some((k) => k.name === kolom);
  if (!ada) db.execSync(`ALTER TABLE ${tabel} ADD COLUMN ${kolom} ${tipe}`);
};
tambahKolom('transaksi', 'kategori', 'TEXT');
tambahKolom('transaksi', 'waktu', 'TEXT');
tambahKolom('transaksi', 'catatan', 'TEXT');
tambahKolom('transaksi', 'hutang_id', 'INTEGER');
tambahKolom('anggaran', 'rekening_id', 'INTEGER');
tambahKolom('anggaran', 'ikon', 'TEXT');
tambahKolom('anggaran', 'penyesuaian', 'INTEGER DEFAULT 0');
tambahKolom('anggaran', 'mulai', 'TEXT');
tambahKolom('anggaran', 'selesai', 'TEXT');
tambahKolom('rekening', 'warna', 'INTEGER');

// Anggaran lama (per bulan) diubah menjadi rentang 1 s.d. akhir bulan
db.execSync(`
  UPDATE anggaran SET mulai = bulan || '-01' WHERE mulai IS NULL OR mulai = '';
  UPDATE anggaran SET selesai = date(bulan || '-01', '+1 month', '-1 day') WHERE selesai IS NULL OR selesai = '';
`);

// Kategori bawaan (hanya diisi sekali, saat tabel masih kosong)
const KAT_AWAL = {
  masuk: ['Gaji', 'Pekerjaan lepas', 'Bonus', 'Pemasukan lainnya'],
  keluar: ['Makan & minum', 'Belanja harian', 'Transportasi', 'Tagihan bulanan', 'Hiburan', 'Kesehatan', 'Lainnya'],
};
if (db.getAllSync('SELECT id FROM kategori LIMIT 1').length === 0) {
  Object.entries(KAT_AWAL).forEach(([tipe, daftar]) => {
    daftar.forEach((nama) => db.runSync('INSERT INTO kategori (nama, tipe) VALUES (?, ?)', [nama, tipe]));
  });
}

// Impor sekali: kategori dari transaksi lama dimasukkan ke daftar kategori,
// supaya kategori yang kemudian dihapus tidak muncul lagi.
if (db.getAllSync("SELECT kunci FROM meta WHERE kunci = 'impor_kategori'").length === 0) {
  db.getAllSync(
    "SELECT DISTINCT tipe, kategori FROM transaksi WHERE tipe IN ('masuk','keluar') AND kategori IS NOT NULL AND kategori <> '' AND hutang_id IS NULL"
  ).forEach((r) => {
    const ada = db.getAllSync('SELECT id FROM kategori WHERE tipe = ? AND LOWER(nama) = LOWER(?)', [r.tipe, r.kategori]);
    if (ada.length === 0) db.runSync('INSERT INTO kategori (nama, tipe) VALUES (?, ?)', [r.kategori, r.tipe]);
  });
  db.runSync("INSERT INTO meta (kunci, nilai) VALUES ('impor_kategori', '1')");
}

// ====== WARNA ======
const C = {
  hijau: '#00574b',
  teal: '#007a66',
  bg: '#f4f7f5',
  teks: '#14231f',
  abu: '#6b7b75',
  garis: '#e3eae6',
  merah: '#d14343',
  kartu: '#ffffff',
};

const WARNA_REK = [
  { bg: '#dcf0e6', ikon: '#047857' },
  { bg: '#e4eefc', ikon: '#1d4ed8' },
  { bg: '#fdeee3', ikon: '#c2410c' },
  { bg: '#f1e8fb', ikon: '#7e22ce' },
  { bg: '#fcebf1', ikon: '#be185d' },
];

const WARNA_GRAF = ['#007a66', '#3b6b9a', '#d4a017', '#c4533f', '#8b5cf6', '#db2777'];

const JENIS = [
  { key: 'bank', label: 'Bank' },
  { key: 'ewallet', label: 'E-wallet' },
  { key: 'tunai', label: 'Tunai / Dompet' },
];

// Ikon anggaran (dipilih otomatis dari nama)
const IKON_ANG = {
  belanja: { ikon: 'basket-outline', bg: '#dcf0e6', fg: '#047857', bar: '#007a66' },
  tagihan: { ikon: 'receipt-outline', bg: '#e4eefc', fg: '#1d4ed8', bar: '#3b6b9a' },
  transport: { ikon: 'bus-outline', bg: '#fdeee3', fg: '#c2410c', bar: '#b0653a' },
  hiburan: { ikon: 'film-outline', bg: '#fdebe7', fg: '#c2410c', bar: '#c4533f' },
  makan: { ikon: 'restaurant-outline', bg: '#fff3d6', fg: '#b45309', bar: '#d4a017' },
  rumah: { ikon: 'home-outline', bg: '#f1e8fb', fg: '#7e22ce', bar: '#8b5cf6' },
  kesehatan: { ikon: 'medkit-outline', bg: '#fcebf1', fg: '#be185d', bar: '#db2777' },
  lainnya: { ikon: 'pricetag-outline', bg: '#eef2ef', fg: '#475569', bar: '#64748b' },
};

const tebakIkon = (nama) => {
  const k = nama.toLowerCase();
  if (/belanja|pasar|market|dapur/.test(k)) return 'belanja';
  if (/tagih|listrik|air|internet|pulsa|cicil|bayar/.test(k)) return 'tagihan';
  if (/transport|bensin|ojek|bus|parkir|kendara/.test(k)) return 'transport';
  if (/hibur|film|game|nonton|wisata/.test(k)) return 'hiburan';
  if (/makan|minum|kopi|resto|jajan/.test(k)) return 'makan';
  if (/rumah|kos|sewa|kontrak/.test(k)) return 'rumah';
  if (/sehat|obat|dokter|klinik/.test(k)) return 'kesehatan';
  return 'lainnya';
};

// ====== HELPER ======
const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
  'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const HARI_PENDEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const dua = (n) => String(n).padStart(2, '0');
const keISO = (d) => `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;
const hariIni = () => keISO(new Date());
const kemarin = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return keISO(d);
};
const tambahHari = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  return keISO(new Date(y, m - 1, d + n));
};
const bulanIni = () => hariIni().slice(0, 7);
const jamSekarang = () => {
  const d = new Date();
  return `${dua(d.getHours())}.${dua(d.getMinutes())}`;
};

// Awal / akhir sebuah bulan ('YYYY-MM')
const awalBulan = (b) => `${b}-01`;
const akhirBulan = (b) => {
  const [y, m] = b.split('-').map(Number);
  return keISO(new Date(y, m, 0));
};
// Selisih hari antara dua tanggal ISO
const selisihHari = (a, b) => {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
};
// Satu tahun dari tanggal mulai, dikurangi sehari
const satuTahun = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return keISO(new Date(y + 1, m - 1, d - 1));
};
// Periode sebuah anggaran (dengan cadangan untuk data lama)
const periode = (a) => ({
  mulai: a.mulai || awalBulan(a.bulan),
  selesai: a.selesai || akhirBulan(a.bulan),
});
// Apakah anggaran bersinggungan dengan bulan tertentu
const adaDiBulan = (a, b) => {
  const p = periode(a);
  return p.mulai <= akhirBulan(b) && p.selesai >= awalBulan(b);
};
// Apakah tanggal berada di dalam periode anggaran
const adaDiTanggal = (a, iso) => {
  const p = periode(a);
  return p.mulai <= iso && iso <= p.selesai;
};

const geserBulan = (b, delta) => {
  const [y, m] = b.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${dua(d.getMonth() + 1)}`;
};
const labelBulan = (b) => {
  const [y, m] = b.split('-').map(Number);
  return `${NAMA_BULAN[m - 1]} ${y}`;
};
const labelPanjang = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${NAMA_BULAN[m - 1]} ${y}`;
};
const tglPendek = (iso) => {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${BULAN_PENDEK[m - 1]} ${y}`;
};
const labelPeriode = (a) => {
  const p = periode(a);
  return `${tglPendek(p.mulai)} – ${tglPendek(p.selesai)}`;
};
const labelTanggal = (iso) => {
  if (iso === hariIni()) return 'Hari ini';
  if (iso === kemarin()) return 'Kemarin';
  return tglPendek(iso);
};
const judulGrup = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  let tgl = `${d} ${NAMA_BULAN[m - 1].toUpperCase()}`;
  if (y !== new Date().getFullYear()) tgl += ` ${y}`;
  return iso === hariIni() ? `HARI INI, ${tgl}` : tgl;
};

const ribuan = (n) =>
  String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const rupiah = (n) => (n < 0 ? '-Rp' : 'Rp') + ribuan(n);
const angkaDariTeks = (t) => Number(String(t).replace(/\D/g, '')) || 0;
const formatInput = (t) => {
  const a = String(t).replace(/\D/g, '');
  return a ? ribuan(Number(a)) : '';
};
const total = (arr, fn) => arr.reduce((a, b) => a + fn(b), 0);
const inisial = (nama) =>
  nama.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
const sisaHutang = (h) => Math.max(0, h.nominal - h.dibayar);

const statusAnggaran = (terpakai, jatah) => {
  if (terpakai === 0) return { teks: 'Belum dipakai', warna: '#d97706' };
  if (terpakai > jatah) return { teks: 'Melebihi jatah', warna: C.merah };
  if (terpakai === jatah) return { teks: 'Terpakai semua', warna: '#16a34a' };
  return { teks: 'Sudah terpakai', warna: '#2563eb' };
};

const konfirmasi = (judul, pesan, aksi) => {
  Alert.alert(judul, pesan, [
    { text: 'Batal', style: 'cancel' },
    { text: 'Hapus', style: 'destructive', onPress: aksi },
  ]);
};

// Pilih ikon & warna baris transaksi
const gayaTrx = (t) => {
  if (t.hutang_id) {
    const masuk = t.tipe === 'masuk';
    return { ikon: 'people-outline', bg: masuk ? '#dcf0e6' : '#eef2ef', fg: masuk ? '#047857' : C.teks };
  }
  if (t.tipe === 'pindah') return { ikon: 'swap-horizontal', bg: '#e4eefc', fg: '#1d4ed8' };
  const k = (t.kategori || t.keterangan || '').toLowerCase();
  if (t.tipe === 'masuk') {
    const kerja = /gaji|proyek|kerja|freelance|bonus|lepas|honor/.test(k);
    return { ikon: kerja ? 'briefcase-outline' : 'cash-outline', bg: '#dcf0e6', fg: '#047857' };
  }
  let ikon = 'pricetag-outline';
  if (/makan|minum|kopi|resto/.test(k)) ikon = 'restaurant-outline';
  else if (/belanja|pasar|market|dapur/.test(k)) ikon = 'basket-outline';
  else if (/transport|bensin|ojek|bus|parkir/.test(k)) ikon = 'bus-outline';
  else if (/tagih|listrik|air|internet|pulsa|cicil/.test(k)) ikon = 'receipt-outline';
  else if (/hibur|film|game|nonton/.test(k)) ikon = 'film-outline';
  else if (/sehat|obat|dokter/.test(k)) ikon = 'medkit-outline';
  return { ikon, bg: '#eef2ef', fg: C.teks };
};

// ====== KOMPONEN KECIL ======
function Bar({ persen, warna = C.teal, latar }) {
  const lebar = Math.min(100, Math.max(0, persen));
  return (
    <View style={[s.barLatar, latar ? { backgroundColor: latar } : null]}>
      <View style={[s.barIsi, { width: `${lebar}%`, backgroundColor: warna }]} />
    </View>
  );
}

function IkonPanah({ masuk, size = 20, color }) {
  return (
    <Ionicons
      name={masuk ? 'arrow-down' : 'arrow-up'}
      size={size}
      color={color}
      style={{ transform: [{ rotate: '45deg' }] }}
    />
  );
}

function Judul({ teks, aksi, onAksi }) {
  return (
    <View style={s.judulRow}>
      <Text style={s.judulSeksi}>{teks}</Text>
      {aksi && onAksi ? (
        <TouchableOpacity onPress={onAksi} hitSlop={10}>
          <Text style={s.linkTeal}>{aksi}</Text>
        </TouchableOpacity>
      ) : aksi ? (
        <Text style={s.linkTeal}>{aksi}</Text>
      ) : null}
    </View>
  );
}

function Header({ judul, sub, onPlus }) {
  return (
    <View style={s.rowBetween}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={s.judulHal}>{judul}</Text>
        <Text style={s.subHal}>{sub}</Text>
      </View>
      <TouchableOpacity style={s.plus} onPress={onPlus}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function Chip({ label, aktif, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.chip, aktif && { backgroundColor: C.hijau, borderColor: C.hijau }]}
    >
      <Text style={[s.chipTeks, aktif && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Pil({ label, aktif, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.pil, aktif && { backgroundColor: C.hijau }]}>
      <Text style={[s.pilTeks, aktif && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Kosong({ teks }) {
  return (
    <View style={s.kosong}>
      <Text style={{ color: C.abu, textAlign: 'center' }}>{teks}</Text>
    </View>
  );
}

function Sheet({ visible, onClose, judul, children }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior="padding">
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.sheetHead}>
            <Text style={s.sheetJudul}>{judul}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={C.abu} />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function BarisTransaksi({ t, rekMap, bisaHapus, onHapus, tampilTanggal }) {
  const asal = rekMap[t.rekening_id]?.nama ?? '-';
  const tujuan = rekMap[t.tujuan_id]?.nama ?? '-';
  const rute = t.tipe === 'pindah' ? `${asal} → ${tujuan}` : asal;

  let bagian;
  if (tampilTanggal) bagian = [labelTanggal(t.tanggal), rute];
  else if (t.tipe === 'pindah') bagian = [rute, t.waktu];
  else bagian = [t.kategori, asal, t.waktu];
  const sub = bagian.filter(Boolean).join(' • ');

  const g = gayaTrx(t);
  const angka =
    t.tipe === 'masuk'
      ? { teks: '+' + rupiah(t.nominal), warna: C.teal }
      : t.tipe === 'keluar'
        ? { teks: '-' + rupiah(t.nominal), warna: C.teks }
        : { teks: rupiah(t.nominal), warna: C.teks };

  return (
    <TouchableOpacity
      activeOpacity={bisaHapus ? 0.6 : 1}
      onLongPress={bisaHapus ? onHapus : undefined}
      style={s.trxRow}
    >
      <View style={[s.trxIkon, { backgroundColor: g.bg }]}>
        <Ionicons name={g.ikon} size={22} color={g.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.trxJudul} numberOfLines={1}>{t.keterangan}</Text>
        <Text style={s.trxSub} numberOfLines={1}>{sub}</Text>
      </View>
      <Text style={[s.trxAngka, { color: angka.warna }]}>{angka.teks}</Text>
    </TouchableOpacity>
  );
}

// ====== GRAFIK ======
function GrafikBatang({ data, terpilih, onPilih, tinggi = 130, lebarKolom = 24, lebarBar = 8, scroll }) {
  const maks = Math.max(1, ...data.flatMap((d) => [d.masuk, d.keluar]));
  const tinggiBar = (n) => (n > 0 ? Math.max(3, (n / maks) * tinggi) : 0);

  const isi = (
    <View style={{ flexDirection: 'row' }}>
      {data.map((d) => (
        <TouchableOpacity
          key={d.key}
          activeOpacity={0.7}
          onPress={() => onPilih(d.key)}
          style={[
            { alignItems: 'center', paddingBottom: 4 },
            scroll ? { width: lebarKolom } : { flex: 1 },
            terpilih === d.key && { backgroundColor: '#e3f1ec', borderRadius: 8 },
          ]}
        >
          <View style={[s.grafBatangArea, { height: tinggi }]}>
            <View
              style={{
                width: lebarBar, height: tinggiBar(d.masuk), backgroundColor: C.teal,
                borderTopLeftRadius: 3, borderTopRightRadius: 3,
              }}
            />
            <View
              style={{
                width: lebarBar, height: tinggiBar(d.keluar), backgroundColor: '#e07a5f',
                borderTopLeftRadius: 3, borderTopRightRadius: 3,
              }}
            />
          </View>
          <Text style={[s.grafLabel, terpilih === d.key && { color: C.teal, fontWeight: '700' }]}>
            {d.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={{ marginTop: 14 }}>
      <Text style={s.grafMaks}>Tertinggi {rupiah(maks)}</Text>
      <View style={{ marginTop: 6 }}>
        {scroll ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {isi}
          </ScrollView>
        ) : (
          isi
        )}
      </View>
      <View style={s.legenda}>
        <View style={s.legendaItem}>
          <View style={[s.titik, { backgroundColor: C.teal }]} />
          <Text style={s.legendaTeks}>Pemasukan</Text>
        </View>
        <View style={s.legendaItem}>
          <View style={[s.titik, { backgroundColor: '#e07a5f' }]} />
          <Text style={s.legendaTeks}>Pengeluaran</Text>
        </View>
      </View>
    </View>
  );
}

function PanelGrafik({ transaksi, bulanAwal }) {
  const [mode, setMode] = useState('harian');
  const [jenis, setJenis] = useState('keluar');
  const [bulan, setBulan] = useState(bulanAwal);
  const [pilih, setPilih] = useState(null);
  const trx = transaksi.filter((t) => t.tipe === 'masuk' || t.tipe === 'keluar');

  const geser = (delta) => {
    setBulan(geserBulan(bulan, delta));
    setPilih(null);
  };
  const gantiMode = (m) => {
    setMode(m);
    setPilih(null);
  };

  let data = [];
  let isi = null;

  if (mode === 'harian') {
    const [y, m] = bulan.split('-').map(Number);
    const n = new Date(y, m, 0).getDate();
    const peta = {};
    trx.forEach((t) => {
      if (t.tanggal.startsWith(bulan)) {
        const d = Number(t.tanggal.slice(8, 10));
        peta[d] = peta[d] || { masuk: 0, keluar: 0 };
        peta[d][t.tipe] += t.nominal;
      }
    });
    for (let d = 1; d <= n; d++) {
      data.push({
        key: d,
        label: String(d),
        nama: `${d} ${NAMA_BULAN[m - 1]} ${y}`,
        masuk: peta[d]?.masuk || 0,
        keluar: peta[d]?.keluar || 0,
      });
    }
  } else if (mode === 'bulan') {
    for (let i = 5; i >= 0; i--) {
      const b = geserBulan(bulan, -i);
      const daftar = trx.filter((t) => t.tanggal.startsWith(b));
      data.push({
        key: b,
        label: BULAN_PENDEK[Number(b.slice(5, 7)) - 1],
        nama: labelBulan(b),
        masuk: total(daftar.filter((t) => t.tipe === 'masuk'), (t) => t.nominal),
        keluar: total(daftar.filter((t) => t.tipe === 'keluar'), (t) => t.nominal),
      });
    }
  }

  if (mode === 'harian' || mode === 'bulan') {
    const kosong = data.every((d) => !d.masuk && !d.keluar);
    const sel = data.find((d) => d.key === pilih) || null;
    const rincian = data.filter((d) => d.masuk || d.keluar).slice().reverse();

    isi = kosong ? (
      <View style={{ marginTop: 14 }}>
        <Kosong teks={mode === 'harian' ? `Belum ada transaksi di ${labelBulan(bulan)}.` : 'Belum ada transaksi pada 6 bulan ini.'} />
      </View>
    ) : (
      <>
        <GrafikBatang
          data={data}
          terpilih={pilih}
          onPilih={setPilih}
          scroll={mode === 'harian'}
          lebarBar={mode === 'harian' ? 8 : 14}
        />

        {sel ? (
          <View style={s.detailGraf}>
            <Text style={s.trxJudul}>{sel.nama}</Text>
            <View style={[s.rowBetween, { marginTop: 8 }]}>
              <Text style={s.trxSub}>Pemasukan</Text>
              <Text style={{ color: C.teal, fontWeight: '700' }}>{rupiah(sel.masuk)}</Text>
            </View>
            <View style={[s.rowBetween, { marginTop: 4 }]}>
              <Text style={s.trxSub}>Pengeluaran</Text>
              <Text style={{ color: '#c2410c', fontWeight: '700' }}>{rupiah(sel.keluar)}</Text>
            </View>
            <View style={[s.rowBetween, { marginTop: 4 }]}>
              <Text style={s.trxSub}>Selisih</Text>
              <Text style={{ color: sel.masuk - sel.keluar >= 0 ? C.teal : C.merah, fontWeight: '700' }}>
                {rupiah(sel.masuk - sel.keluar)}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={s.petunjuk}>Ketuk sebuah batang untuk melihat nominalnya.</Text>
        )}

        <Text style={[s.label, { marginTop: 18 }]}>Rincian</Text>
        {rincian.map((d) => (
          <TouchableOpacity
            key={d.key}
            activeOpacity={0.7}
            onPress={() => setPilih(d.key)}
            style={[s.rincianRow, pilih === d.key && { backgroundColor: '#e3f1ec' }]}
          >
            <Text style={[s.trxSub, { flex: 1, marginTop: 0 }, pilih === d.key && { color: C.teks, fontWeight: '700' }]}>
              {mode === 'harian' ? `${d.label} ${BULAN_PENDEK[Number(bulan.slice(5, 7)) - 1]}` : d.nama}
            </Text>
            <Text style={{ color: C.teal, fontSize: 13, fontWeight: '600', minWidth: 96, textAlign: 'right' }}>
              +{rupiah(d.masuk)}
            </Text>
            <Text style={{ color: '#c2410c', fontSize: 13, fontWeight: '600', minWidth: 96, textAlign: 'right' }}>
              -{rupiah(d.keluar)}
            </Text>
          </TouchableOpacity>
        ))}
      </>
    );
  } else {
    const peta = {};
    trx.forEach((t) => {
      if (t.tipe === jenis && t.tanggal.startsWith(bulan)) {
        const k = t.kategori && t.kategori.trim() ? t.kategori : 'Tanpa kategori';
        peta[k] = (peta[k] || 0) + t.nominal;
      }
    });
    const baris = Object.entries(peta).sort((a, b) => b[1] - a[1]);
    const jumlah = total(baris, (b) => b[1]);
    isi = (
      <View style={{ marginTop: 14 }}>
        <View style={[s.chipRow, { marginBottom: 10 }]}>
          <Chip label="Pengeluaran" aktif={jenis === 'keluar'} onPress={() => setJenis('keluar')} />
          <Chip label="Pemasukan" aktif={jenis === 'masuk'} onPress={() => setJenis('masuk')} />
        </View>
        {baris.length === 0 ? (
          <Kosong teks={`Belum ada data kategori di ${labelBulan(bulan)}.`} />
        ) : (
          baris.slice(0, 8).map(([nama, nilai], i) => {
            const persen = jumlah > 0 ? Math.round((nilai / jumlah) * 100) : 0;
            return (
              <View key={nama} style={{ marginBottom: 12 }}>
                <View style={s.rowBetween}>
                  <Text style={[s.trxJudul, { flex: 1 }]} numberOfLines={1}>{nama}</Text>
                  <Text style={s.trxSub}>{rupiah(nilai)} • {persen}%</Text>
                </View>
                <View style={{ marginTop: 6 }}>
                  <Bar persen={persen} warna={WARNA_GRAF[i % WARNA_GRAF.length]} />
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  }

  return (
    <View style={s.kartu}>
      <View style={s.seg}>
        {[
          { k: 'harian', label: 'Harian' },
          { k: 'bulan', label: '6 bulan' },
          { k: 'kategori', label: 'Kategori' },
        ].map((t) => (
          <TouchableOpacity
            key={t.k}
            style={[s.segItem, mode === t.k && s.segAktif]}
            onPress={() => gantiMode(t.k)}
          >
            <Text style={[s.segTeks, mode === t.k && { color: C.teal, fontWeight: '700' }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[s.rowBetween, { marginTop: 12 }]}>
        <TouchableOpacity onPress={() => geser(-1)} hitSlop={10} style={s.navGraf}>
          <Ionicons name="chevron-back" size={20} color={C.teal} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.bulanTeks}>{labelBulan(bulan)}</Text>
          {bulan !== bulanAwal ? (
            <TouchableOpacity
              onPress={() => {
                setBulan(bulanAwal);
                setPilih(null);
              }}
              hitSlop={8}
            >
              <Text style={[s.linkTeal, { fontSize: 12, marginTop: 2 }]}>Kembali ke bulan ini</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity onPress={() => geser(1)} hitSlop={10} style={s.navGraf}>
          <Ionicons name="chevron-forward" size={20} color={C.teal} />
        </TouchableOpacity>
      </View>

      {isi}
    </View>
  );
}

// ====== PILIH DENGAN URUTAN "SERING DIPAKAI" ======
// opsi: [{ key, label, hitung }] sudah diurutkan dari yang paling sering dipakai
// onHapus(key, selesai): bila diberikan, muncul tombol Hapus untuk menghapus pilihan
function PilihSering({ label, nilai, opsi, onPilih, onBaru, onHapus, kosongLabel, batas = 6 }) {
  const [semua, setSemua] = useState(false);
  const [baru, setBaru] = useState(false);
  const [hapus, setHapus] = useState(false);
  const [teks, setTeks] = useState('');

  const tampil = semua ? opsi : opsi.slice(0, batas);
  const tersembunyi =
    !semua && nilai != null && !tampil.some((o) => o.key === nilai)
      ? opsi.find((o) => o.key === nilai)
      : null;
  const daftar = tersembunyi ? [...tampil, tersembunyi] : tampil;
  const adaSering = opsi.some((o) => o.hitung > 0);

  const tambah = () => {
    const hasil = onBaru(teks);
    if (hasil) {
      onPilih(hasil);
      setTeks('');
      setBaru(false);
    }
  };

  const tekanChip = (o) => {
    if (hapus && onHapus) {
      onHapus(o.key, () => {
        if (nilai === o.key) onPilih(opsi.find((x) => x.key !== o.key)?.key ?? null);
      });
    } else {
      onPilih(o.key);
    }
  };

  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <View style={s.chipRow}>
        {daftar.map((o, i) => {
          const aktif = o.key === nilai && !hapus;
          return (
            <TouchableOpacity
              key={String(o.key)}
              onPress={() => tekanChip(o)}
              style={[
                s.chip,
                aktif && { backgroundColor: C.hijau, borderColor: C.hijau },
                hapus && { borderColor: C.merah },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                {hapus ? (
                  <Ionicons name="close-circle" size={15} color={C.merah} />
                ) : o.hitung > 0 && i < 3 ? (
                  <Ionicons name="star" size={12} color={aktif ? '#ffd966' : '#d4a017'} />
                ) : null}
                <Text style={[s.chipTeks, aktif && { color: '#fff' }]}>{o.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {kosongLabel ? (
          <TouchableOpacity
            onPress={() => onPilih(null)}
            style={[s.chip, nilai == null && { backgroundColor: C.hijau, borderColor: C.hijau }]}
          >
            <Text style={[s.chipTeks, nilai == null && { color: '#fff' }]}>{kosongLabel}</Text>
          </TouchableOpacity>
        ) : null}

        {opsi.length > batas ? (
          <TouchableOpacity style={s.chipLink} onPress={() => setSemua(!semua)}>
            <Text style={s.chipLinkTeks}>{semua ? 'Ringkas' : `Lainnya (${opsi.length - batas})`}</Text>
          </TouchableOpacity>
        ) : null}

        {onBaru ? (
          <TouchableOpacity style={s.chipBaru} onPress={() => setBaru(!baru)}>
            <Ionicons name={baru ? 'close' : 'add'} size={16} color={C.teal} />
            <Text style={s.chipLinkTeks}>{baru ? 'Batal' : 'Baru'}</Text>
          </TouchableOpacity>
        ) : null}

        {onHapus ? (
          <TouchableOpacity
            style={[s.chipBaru, { borderColor: C.merah }, hapus && { backgroundColor: '#fde8e2' }]}
            onPress={() => setHapus(!hapus)}
          >
            <Ionicons name={hapus ? 'checkmark' : 'trash-outline'} size={16} color={C.merah} />
            <Text style={[s.chipLinkTeks, { color: C.merah }]}>{hapus ? 'Selesai' : 'Hapus'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {hapus ? (
        <Text style={[s.petunjuk, { color: C.merah }]}>Ketuk kategori yang ingin dihapus.</Text>
      ) : adaSering ? (
        <Text style={s.petunjuk}>★ = sering dipakai, otomatis diurutkan paling atas.</Text>
      ) : null}

      {baru ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="Nama kategori baru"
            placeholderTextColor={C.abu}
            value={teks}
            onChangeText={setTeks}
            autoFocus
          />
          <TouchableOpacity style={s.tambahBtn} onPress={tambah}>
            <Text style={s.tombolTeks}>Tambah</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

// ====== KOMPONEN FORM HALAMAN PENUH ======
function Dropdown({ label, nilai, opsi, onPilih, placeholder = 'Pilih' }) {
  const [buka, setBuka] = useState(false);
  const dipilih = opsi.find((o) => o.key === nilai);
  return (
    <View>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TouchableOpacity style={s.field} activeOpacity={0.7} onPress={() => setBuka(!buka)}>
        <Text style={[s.fieldTeks, !dipilih && { color: C.abu }]} numberOfLines={1}>
          {dipilih ? dipilih.label : placeholder}
        </Text>
        <Ionicons name={buka ? 'chevron-up' : 'chevron-down'} size={20} color={C.abu} />
      </TouchableOpacity>
      {buka ? (
        <View style={s.dropList}>
          {opsi.map((o, i) => (
            <TouchableOpacity
              key={String(o.key)}
              style={[s.dropItem, i > 0 && { borderTopWidth: 1, borderTopColor: C.garis }]}
              onPress={() => {
                onPilih(o.key);
                setBuka(false);
              }}
            >
              <Text
                style={[s.fieldTeks, { flex: 1 }, o.key === nilai && { color: C.teal, fontWeight: '700' }]}
                numberOfLines={1}
              >
                {o.label}
              </Text>
              {o.key === nilai ? <Ionicons name="checkmark" size={20} color={C.teal} /> : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function PilihTanggal({ label, nilai, onPilih }) {
  const [buka, setBuka] = useState(false);
  const [bln, setBln] = useState(nilai.slice(0, 7));
  const [y, m] = bln.split('-').map(Number);

  const awal = new Date(y, m - 1, 1).getDay();
  const jumlah = new Date(y, m, 0).getDate();
  const sel = [];
  for (let i = 0; i < awal; i++) sel.push(null);
  for (let d = 1; d <= jumlah; d++) sel.push(d);
  while (sel.length % 7 !== 0) sel.push(null);

  return (
    <View>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TouchableOpacity
        style={s.field}
        activeOpacity={0.7}
        onPress={() => {
          if (!buka) setBln(nilai.slice(0, 7));
          setBuka(!buka);
        }}
      >
        <Text style={s.fieldTeks}>{labelPanjang(nilai)}</Text>
        <Ionicons name="calendar-outline" size={22} color={C.abu} />
      </TouchableOpacity>

      {buka ? (
        <View style={s.kalender}>
          <View style={s.rowBetween}>
            <TouchableOpacity onPress={() => setBln(geserBulan(bln, -1))} hitSlop={10}>
              <Ionicons name="chevron-back" size={22} color={C.teal} />
            </TouchableOpacity>
            <Text style={s.bulanTeks}>{labelBulan(bln)}</Text>
            <TouchableOpacity onPress={() => setBln(geserBulan(bln, 1))} hitSlop={10}>
              <Ionicons name="chevron-forward" size={22} color={C.teal} />
            </TouchableOpacity>
          </View>
          <View style={s.kalRow}>
            {HARI_PENDEK.map((h) => (
              <Text key={h} style={s.kalHari}>{h}</Text>
            ))}
          </View>
          <View style={s.kalRow}>
            {sel.map((d, i) => {
              if (!d) return <View key={i} style={s.kalSel} />;
              const iso = `${y}-${dua(m)}-${dua(d)}`;
              const aktif = iso === nilai;
              const hari = iso === hariIni();
              return (
                <TouchableOpacity
                  key={i}
                  style={s.kalSel}
                  onPress={() => {
                    onPilih(iso);
                    setBuka(false);
                  }}
                >
                  <View style={[s.kalBulat, aktif && { backgroundColor: C.hijau }]}>
                    <Text
                      style={[
                        s.kalAngka,
                        hari && { color: C.teal, fontWeight: '700' },
                        aktif && { color: '#fff', fontWeight: '700' },
                      ]}
                    >
                      {d}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function KartuNominal({ label, nilai, onChange }) {
  return (
    <View style={s.kartuNom}>
      <Text style={s.kartuNomLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
        <Text style={s.kartuNomTeks}>Rp</Text>
        <TextInput
          style={[s.kartuNomTeks, { flex: 1, paddingVertical: 0 }]}
          value={nilai}
          onChangeText={(t) => onChange(formatInput(t))}
          placeholder="0"
          placeholderTextColor="#8fb9ad"
          keyboardType="numeric"
        />
      </View>
    </View>
  );
}

function Ringkasan({ judul, children }) {
  return (
    <View style={s.ringkasKartu}>
      {judul ? <Text style={s.ringkasJudul}>{judul}</Text> : null}
      {children}
    </View>
  );
}

function BarisRingkas({ label, nilai, teal, tebal, merah }) {
  return (
    <View style={[s.rowBetween, { marginTop: 10 }]}>
      <Text style={[s.ringkasLabel2, tebal && { color: C.teks, fontWeight: '700' }]}>{label}</Text>
      <Text style={[s.ringkasNilai, teal && { color: C.teal }, merah && { color: C.merah }]}>{nilai}</Text>
    </View>
  );
}

function Catatan({ ikon = 'shield-checkmark-outline', teks, merah }) {
  return (
    <View style={[s.catatan, merah && { backgroundColor: '#fde8e2' }]}>
      <Ionicons name={ikon} size={18} color={merah ? C.merah : C.teal} style={{ marginTop: 1 }} />
      <Text style={[s.catatanTeks, merah && { color: C.merah }]}>{teks}</Text>
    </View>
  );
}

function LayarForm({ judul, sub, tabAktif, onGanti, onBatal, tombol, onTombol, children }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: C.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: insets.top + 12,
            paddingBottom: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.rowBetween}>
            <TouchableOpacity style={s.back} onPress={onBatal}>
              <Ionicons name="arrow-back" size={22} color={C.teal} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onBatal} hitSlop={10}>
              <Text style={{ color: C.abu, fontSize: 14 }}>Batal</Text>
            </TouchableOpacity>
          </View>

          <Text style={[s.judulHal, { marginTop: 18 }]}>{judul}</Text>
          <Text style={s.subHal}>{sub}</Text>

          {tabAktif ? (
            <View style={s.seg}>
              {[
                { k: 'rekening', label: 'Rekening baru' },
                { k: 'saldo', label: 'Tambah saldo' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.k}
                  style={[s.segItem, tabAktif === t.k && s.segAktif]}
                  onPress={() => tabAktif !== t.k && onGanti(t.k)}
                >
                  <Text style={[s.segTeks, tabAktif === t.k && { color: C.teal, fontWeight: '700' }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={{ height: 16 }} />
          )}

          {children}
        </ScrollView>

        <View style={[s.bawah, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity style={s.tombolBesar} onPress={onTombol}>
            <Text style={s.tombolTeks}>{tombol}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ====== HALAMAN: TAMBAH REKENING ======
function FormRekeningHal({ totalSaldo, onSimpan, onBatal, onGanti }) {
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
        {WARNA_REK.map((w, i) => (
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

// ====== HALAMAN: TAMBAH SALDO ======
function FormSaldoHal({
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

// ====== HALAMAN: TAMBAH PEMASUKAN ======
function FormMasukHal({ rekening, saldoRek, totalSaldo, opsiKat, onKatBaru, onKatHapus, onSimpan, onBatal }) {
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

// ====== HALAMAN: TAMBAH PENGELUARAN ======
function FormKeluarHal({
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

// ====== HALAMAN: PINDAH SALDO ======
function FormPindahHal({ rekening, saldoRek, totalSaldo, onSimpan, onBatal }) {
  const [dariId, setDariId] = useState(rekening[0]?.id ?? null);
  const [keId, setKeId] = useState(rekening[1]?.id ?? null);
  const [nominal, setNominal] = useState('');
  const [tanggal, setTanggal] = useState(hariIni());
  const [ket, setKet] = useState('');

  const jumlah = angkaDariTeks(nominal);
  const dari = rekening.find((r) => r.id === dariId);
  const ke = rekening.find((r) => r.id === keId);
  const opsiRek = rekening.map((r) => ({ key: r.id, label: `${r.nama} • ${rupiah(saldoRek(r))}` }));
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
    if (jumlah > totalSaldo) {
      return Alert.alert(
        'Saldo tidak cukup',
        `Nominal ${rupiah(jumlah)} melebihi total saldo semua rekening (${rupiah(totalSaldo)}).`
      );
    }
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
      sub="Antarrekening, tanpa mengubah total saldo."
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
          teks={`Total saldo tetap ${rupiah(totalSaldo)}. Pindah saldo tidak masuk ke laporan pemasukan atau pengeluaran.`}
        />
      )}
    </LayarForm>
  );
}

// ====== HALAMAN: ATUR ANGGARAN (baru & edit) ======
function FormAnggaranHal({ a, bulanAwal, rekening, tertaut, terpakaiSekarang, onSimpan, onBatal, onHapus }) {
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

// ====== MENU: HUTANG ======
function HutangTab({ hutang, rekMap, onTambah, onBuka }) {
  const [filter, setFilter] = useState('semua');

  const piutang = hutang.filter((h) => h.peran === 'beri');
  const utang = hutang.filter((h) => h.peran === 'terima');
  const totPiutang = total(piutang, sisaHutang);
  const totUtang = total(utang, sisaHutang);
  const nPiutang = piutang.filter((h) => sisaHutang(h) > 0).length;
  const nUtang = utang.filter((h) => sisaHutang(h) > 0).length;

  const daftar = hutang
    .filter((h) => filter === 'semua' || h.peran === filter)
    .sort((a, b) => {
      const la = sisaHutang(a) === 0;
      const lb = sisaHutang(b) === 0;
      if (la !== lb) return la ? 1 : -1;
      return (a.tempo || '9999').localeCompare(b.tempo || '9999');
    });

  return (
    <>
      <Header judul="Hutang" sub="Catat pinjaman, jaga keuangan tetap tenang." onPlus={onTambah} />

      <View style={[s.hero, { marginTop: 18 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IkonPanah masuk={false} size={16} color="#cfe8e1" />
          <Text style={s.heroLabel}>Piutang saya</Text>
        </View>
        <Text style={s.heroAngka}>{rupiah(totPiutang)}</Text>
        <Text style={s.heroTrenTeks}>Orang lain meminjam kepada saya • {nPiutang} belum lunas</Text>
        <View style={s.heroGaris} />
        <View style={s.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={[s.heroSub, { marginTop: 0 }]}>Hutang saya</Text>
            <Text style={s.heroTrenTeks}>Saya meminjam • {nUtang} belum lunas</Text>
          </View>
          <Text style={[s.heroSub, { fontSize: 22, marginTop: 0 }]}>{rupiah(totUtang)}</Text>
        </View>
      </View>

      <Catatan
        ikon="information-circle-outline"
        teks="Memberi, menerima, dan membayar hutang otomatis tercatat sebagai transaksi dan menyesuaikan saldo rekening terkait. Nilai piutang di atas tidak dihitung sebagai saldo."
      />

      <Judul teks="Daftar pinjaman" aksi={`${hutang.length} catatan`} />

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <Chip label="Semua" aktif={filter === 'semua'} onPress={() => setFilter('semua')} />
        <Chip label="Pemberi hutang" aktif={filter === 'beri'} onPress={() => setFilter('beri')} />
        <Chip label="Penerima hutang" aktif={filter === 'terima'} onPress={() => setFilter('terima')} />
      </View>

      {daftar.length === 0 ? (
        <Kosong teks="Belum ada catatan hutang. Ketuk tombol + atau Tambah hutang untuk membuatnya." />
      ) : (
        daftar.map((h) => {
          const sisa = sisaHutang(h);
          const lunas = sisa === 0;
          const telat = !lunas && !!h.tempo && h.tempo < hariIni();
          const beri = h.peran === 'beri';
          const rek = rekMap[h.rekening_id]?.nama;
          const badge = lunas
            ? { teks: 'Lunas', bg: '#dcf0e6', fg: '#047857' }
            : telat
              ? { teks: 'Terlambat', bg: '#fde8e2', fg: C.merah }
              : { teks: 'Belum lunas', bg: '#fdeee3', fg: '#c2410c' };
          return (
            <TouchableOpacity
              key={h.id}
              activeOpacity={0.8}
              style={s.angKartu}
              onPress={() => onBuka(h.id)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[s.hutAvatar, { backgroundColor: beri ? '#dcf0e6' : '#e4eefc' }]}>
                  <Text style={{ fontWeight: '700', color: beri ? '#047857' : '#1d4ed8' }}>
                    {inisial(h.nama)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.trxJudul} numberOfLines={1}>{h.nama}</Text>
                  <Text style={s.trxSub} numberOfLines={1}>
                    {[beri ? 'Pemberi hutang' : 'Penerima hutang', rek].filter(Boolean).join(' • ')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.trxSub}>Tersisa</Text>
                  <Text style={s.trxJudul}>{rupiah(sisa)}</Text>
                </View>
              </View>
              <View style={[s.rowBetween, { marginTop: 14 }]}>
                <Text style={s.trxSub}>Jatuh tempo {tglPendek(h.tempo)}</Text>
                <View style={[s.badge, { backgroundColor: badge.bg }]}>
                  <Text style={{ color: badge.fg, fontSize: 12, fontWeight: '600' }}>{badge.teks}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      <TouchableOpacity style={[s.tombolBesar, s.tombolIkon, { marginTop: 8 }]} onPress={onTambah}>
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={s.tombolTeks}>Tambah hutang</Text>
      </TouchableOpacity>
    </>
  );
}

// ====== HALAMAN: TAMBAH HUTANG ======
function FormHutangHal({ rekening, saldoRek, onSimpan, onBatal }) {
  const [peran, setPeran] = useState('beri');
  const [nama, setNama] = useState('');
  const [nominal, setNominal] = useState('');
  const [rekId, setRekId] = useState(rekening[0]?.id ?? null);
  const [tanggal, setTanggal] = useState(hariIni());
  const [tempo, setTempo] = useState(tambahHari(hariIni(), 30));
  const [catatan, setCatatan] = useState('');

  const beri = peran === 'beri';
  const jumlah = angkaDariTeks(nominal);
  const rek = rekening.find((r) => r.id === rekId);
  const saldoNow = rek ? saldoRek(rek) : 0;
  const kurang = beri && jumlah > 0 && jumlah > saldoNow;
  const opsiRek = rekening.map((r) => ({ key: r.id, label: `${r.nama} • ${rupiah(saldoRek(r))}` }));

  const ubahTanggal = (t) => {
    setTanggal(t);
    if (tempo < t) setTempo(tambahHari(t, 30));
  };

  const simpan = () => {
    if (!nama.trim()) return Alert.alert(beri ? 'Nama penerima hutang belum diisi' : 'Nama pemberi hutang belum diisi');
    if (!jumlah) return Alert.alert('Nominal belum diisi');
    if (!rek) return Alert.alert('Pilih rekening terkait');
    if (tempo < tanggal) return Alert.alert('Jatuh tempo tidak boleh sebelum tanggal pinjaman');
    if (beri && jumlah > saldoNow) {
      return Alert.alert(
        'Saldo rekening tidak cukup',
        `Saldo ${rek.nama} hanya ${rupiah(saldoNow)}, tidak cukup untuk meminjamkan ${rupiah(jumlah)}. Pilih rekening lain atau kurangi nominal.`
      );
    }
    onSimpan({
      peran,
      nama: nama.trim(),
      nominal: jumlah,
      rekId: rek.id,
      tanggal,
      tempo,
      catatan: catatan.trim() || null,
    });
  };

  return (
    <LayarForm
      judul="Tambah hutang"
      sub="Catat pinjaman sesuai peran kamu."
      onBatal={onBatal}
      tombol="Simpan hutang"
      onTombol={simpan}
    >
      <Text style={s.label}>Peran kamu</Text>
      <View style={s.radioRow}>
        <TouchableOpacity style={[s.radio, beri && s.radioAktif]} onPress={() => setPeran('beri')}>
          <Ionicons
            name={beri ? 'checkmark-circle-outline' : 'ellipse-outline'}
            size={22}
            color={beri ? C.teal : C.abu}
          />
          <Text style={[s.fieldTeks, { fontSize: 14 }, beri && { color: C.teal, fontWeight: '700' }]}>
            Pemberi hutang
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.radio, !beri && s.radioAktif]} onPress={() => setPeran('terima')}>
          <Ionicons
            name={!beri ? 'checkmark-circle-outline' : 'ellipse-outline'}
            size={22}
            color={!beri ? C.teal : C.abu}
          />
          <Text style={[s.fieldTeks, { fontSize: 14 }, !beri && { color: C.teal, fontWeight: '700' }]}>
            Penerima hutang
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={[s.petunjuk, { color: C.teal }]}>
        {beri
          ? 'Saya meminjamkan uang. Orang lain berhutang kepada saya.'
          : 'Saya meminjam uang. Saya berhutang kepada orang lain.'}
      </Text>

      <Text style={s.label}>{beri ? 'Nama penerima hutang' : 'Nama pemberi hutang'}</Text>
      <TextInput
        style={s.input}
        placeholder="mis. Dimas Pratama"
        placeholderTextColor={C.abu}
        value={nama}
        onChangeText={setNama}
      />

      <KartuNominal
        label={beri ? 'Nominal yang dipinjamkan' : 'Nominal yang dipinjam'}
        nilai={nominal}
        onChange={setNominal}
      />

      <Dropdown
        label={beri ? 'Dana diambil dari rekening' : 'Dana masuk ke rekening'}
        nilai={rekId}
        opsi={opsiRek}
        onPilih={setRekId}
      />

      <PilihTanggal label="Tanggal pinjaman" nilai={tanggal} onPilih={ubahTanggal} />
      <PilihTanggal label="Jatuh tempo" nilai={tempo} onPilih={setTempo} />

      <Text style={s.label}>Catatan (opsional)</Text>
      <TextInput
        style={[s.input, { minHeight: 90, textAlignVertical: 'top' }]}
        placeholder="mis. Pinjaman keperluan pribadi"
        placeholderTextColor={C.abu}
        multiline
        value={catatan}
        onChangeText={setCatatan}
      />

      <Ringkasan judul="SALDO SETELAH DISIMPAN">
        <BarisRingkas
          label={rek ? rek.nama : '-'}
          nilai={rupiah(beri ? saldoNow - jumlah : saldoNow + jumlah)}
          teal={!beri}
          tebal
          merah={kurang}
        />
      </Ringkasan>

      {kurang ? (
        <Catatan
          merah
          ikon="warning-outline"
          teks={`Nominal melebihi saldo ${rek.nama} (${rupiah(saldoNow)}). Hutang tidak bisa disimpan.`}
        />
      ) : (
        <Catatan
          ikon="information-circle-outline"
          teks={
            beri
              ? 'Saldo rekening langsung berkurang dan tercatat sebagai pengeluaran. Nominal ini dicatat sebagai piutang saya.'
              : 'Saldo rekening langsung bertambah dan tercatat sebagai pemasukan. Nominal ini dicatat sebagai hutang saya.'
          }
        />
      )}
    </LayarForm>
  );
}

// ====== SHEET: DETAIL HUTANG ======
function DetailHutang({ h, rekMap, onClose, onBayar, onLunas, onHapus }) {
  const [bayar, setBayar] = useState('');
  if (!h) return null;
  const sisa = sisaHutang(h);
  const beri = h.peran === 'beri';
  const persen = h.nominal > 0 ? Math.round((h.dibayar / h.nominal) * 100) : 0;
  const rek = rekMap[h.rekening_id];

  return (
    <Sheet visible onClose={onClose} judul={h.nama}>
      <Text style={{ color: C.abu, marginBottom: 12 }}>
        {[beri ? 'Pemberi hutang' : 'Penerima hutang', rek?.nama].filter(Boolean).join(' • ')}
      </Text>
      <Bar persen={persen} warna={sisa === 0 ? '#16a34a' : C.teal} />
      <View style={{ marginTop: 14, gap: 6 }}>
        <View style={s.rowBetween}>
          <Text style={s.trxSub}>Nominal pinjaman</Text>
          <Text style={s.trxJudul}>{rupiah(h.nominal)}</Text>
        </View>
        <View style={s.rowBetween}>
          <Text style={s.trxSub}>{beri ? 'Sudah dikembalikan' : 'Sudah dibayar'}</Text>
          <Text style={s.trxJudul}>{rupiah(h.dibayar)}</Text>
        </View>
        <View style={s.rowBetween}>
          <Text style={s.trxSub}>Tersisa</Text>
          <Text style={[s.trxJudul, { color: sisa === 0 ? '#16a34a' : C.teal }]}>{rupiah(sisa)}</Text>
        </View>
        <View style={s.rowBetween}>
          <Text style={s.trxSub}>Tanggal pinjaman</Text>
          <Text style={s.trxJudul}>{tglPendek(h.tanggal)}</Text>
        </View>
        <View style={s.rowBetween}>
          <Text style={s.trxSub}>Jatuh tempo</Text>
          <Text style={s.trxJudul}>{tglPendek(h.tempo)}</Text>
        </View>
      </View>
      {h.catatan ? <Catatan ikon="document-text-outline" teks={h.catatan} /> : null}

      {sisa > 0 ? (
        <>
          <Text style={[s.label, { marginTop: 18 }]}>
            {beri ? 'Catat pengembalian' : 'Catat pembayaran'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="Nominal"
              placeholderTextColor={C.abu}
              keyboardType="numeric"
              value={bayar}
              onChangeText={(t) => setBayar(formatInput(t))}
            />
            <TouchableOpacity
              style={s.tambahBtn}
              onPress={() => {
                if (onBayar(h, angkaDariTeks(bayar))) setBayar('');
              }}
            >
              <Text style={s.tombolTeks}>Catat</Text>
            </TouchableOpacity>
          </View>
          <Catatan
            ikon="information-circle-outline"
            teks={
              rek
                ? beri
                  ? `Pengembalian akan menambah saldo ${rek.nama} dan tercatat sebagai pemasukan.`
                  : `Pembayaran akan mengurangi saldo ${rek.nama} dan tercatat sebagai pengeluaran.`
                : 'Rekening terkait sudah tidak ada, jadi pembayaran hanya dicatat di hutang ini.'
            }
          />
          <TouchableOpacity style={[s.tombolBesar, { marginTop: 12 }]} onPress={() => onLunas(h)}>
            <Text style={s.tombolTeks}>Lunasi sisa ({rupiah(sisa)})</Text>
          </TouchableOpacity>
        </>
      ) : null}

      <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 18 }} onPress={() => onHapus(h)}>
        <Text style={{ color: C.merah, fontWeight: '700' }}>Hapus catatan</Text>
      </TouchableOpacity>
    </Sheet>
  );
}

// ====== SHEET: PILIH BULAN ======
function PilihBulan({ visible, onClose, bulan, onPilih }) {
  const [tahun, setTahun] = useState(Number(bulan.slice(0, 4)));

  useEffect(() => {
    if (visible) setTahun(Number(bulan.slice(0, 4)));
  }, [visible]);

  return (
    <Sheet visible={visible} onClose={onClose} judul="Pilih bulan">
      <View style={[s.rowBetween, s.bulanBar]}>
        <TouchableOpacity onPress={() => setTahun(tahun - 1)} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={C.teal} />
        </TouchableOpacity>
        <Text style={s.bulanTeks}>{tahun}</Text>
        <TouchableOpacity onPress={() => setTahun(tahun + 1)} hitSlop={10}>
          <Ionicons name="chevron-forward" size={22} color={C.teal} />
        </TouchableOpacity>
      </View>
      <View style={s.chipRow}>
        {NAMA_BULAN.map((n, i) => {
          const v = `${tahun}-${dua(i + 1)}`;
          const aktif = v === bulan;
          return (
            <TouchableOpacity
              key={v}
              onPress={() => {
                onPilih(v);
                onClose();
              }}
              style={[s.bulanChip, aktif && { backgroundColor: C.hijau, borderColor: C.hijau }]}
            >
              <Text style={[s.chipTeks, aktif && { color: '#fff' }]}>{BULAN_PENDEK[i]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Sheet>
  );
}

// ====== APLIKASI UTAMA ======
function Aplikasi() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [tab, setTab] = useState('beranda');
  // null | 'rekening' | 'saldo' | 'pindah' | 'masuk' | 'keluar' | 'anggaran' | 'hutangForm'
  const [halaman, setHalaman] = useState(null);
  const [editAngId, setEditAngId] = useState(null);
  const [detailHutangId, setDetailHutangId] = useState(null);
  const [sembunyi, setSembunyi] = useState(false);
  const [filter, setFilter] = useState('semua');
  const [filterRek, setFilterRek] = useState(null);
  const [bulan, setBulan] = useState(bulanIni()); // dipakai Transaksi & Anggaran
  const [batas, setBatas] = useState(10);

  const [rekening, setRekening] = useState([]);
  const [transaksi, setTransaksi] = useState([]);
  const [anggaran, setAnggaran] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [hutang, setHutang] = useState([]);

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
  };

  useEffect(() => {
    muatData();
  }, []);

  useEffect(() => {
    setBatas(10);
  }, [bulan, filter, filterRek]);

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

  // kecuali = id (atau daftar id) transaksi yang diabaikan, dipakai untuk cek sebelum menghapus
  const saldoRekening = (r, kecuali = null) => {
    const abaikan = Array.isArray(kecuali) ? kecuali : [kecuali];
    let saldo = r.saldo_awal;
    transaksi.forEach((t) => {
      if (abaikan.includes(t.id)) return;
      if (t.tipe === 'masuk' && t.rekening_id === r.id) saldo += t.nominal;
      if (t.tipe === 'keluar' && t.rekening_id === r.id) saldo -= t.nominal;
      if (t.tipe === 'pindah') {
        if (t.rekening_id === r.id) saldo -= t.nominal;
        if (t.tujuan_id === r.id) saldo += t.nominal;
      }
    });
    return saldo;
  };

  const totalSaldo = total(rekening, (r) => saldoRekening(r));

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
    db.runSync('INSERT INTO rekening (nama, jenis, nomor, saldo_awal, warna) VALUES (?, ?, ?, ?, ?)', [
      d.nama, d.jenis, d.nomor, d.saldo, d.warna,
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
      'INSERT INTO transaksi (tipe, keterangan, nominal, tanggal, rekening_id, tujuan_id, anggaran_id, kategori, waktu, catatan, hutang_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        d.tipe, d.keterangan, d.nominal, d.tanggal, d.rekId, d.tujuanId ?? null,
        d.angId ?? null, d.kategori ?? '', d.waktu, d.catatan ?? null, d.hutangId ?? null,
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
      t.tipe === 'masuk' ? t.rekening_id : t.tipe === 'pindah' ? t.tujuan_id : null;
    const r = terdampak ? rekening.find((x) => x.id === terdampak) : null;
    if (r && saldoRekening(r, t.id) < 0) {
      Alert.alert(
        'Transaksi tidak bisa dihapus',
        `Menghapus "${t.keterangan}" membuat saldo ${r.nama} menjadi ${rupiah(saldoRekening(r, t.id))}. Uangnya sudah terpakai oleh transaksi lain.`
      );
      return;
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
  const catatBayar = (h, jumlah) => {
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
    const rek = rekMap[h.rekening_id];
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

  const bayarHutang = (h, jumlah) => catatBayar(h, jumlah);
  const lunasHutang = (h) => catatBayar(h, sisaHutang(h));

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
    if (butuhRek && rekening.length === 0) {
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

  // ====== TAMPILAN: BERANDA ======
  const Beranda = (
    <>
      <View style={s.merek}>
        <Image source={require('./assets/logo-kita.png')} style={s.merekLogo} />
        <View style={{ flex: 1 }}>
          <Text style={s.merekNama}>KITA</Text>
          <Text style={s.merekSub}>(Kelola Income, Transaksi, Anggaran)</Text>
        </View>
      </View>

      <View style={[s.rowBetween, { marginTop: 18 }]}>
        <View>
          <Text style={s.tglKecil}>{teksTanggal}</Text>
          <Text style={s.salam}>Halo, {NAMA_PENGGUNA} 👋</Text>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarTeks}>{NAMA_PENGGUNA.slice(0, 2).toUpperCase()}</Text>
        </View>
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
            const w = WARNA_REK[(r.warna ?? i) % WARNA_REK.length];
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

  // ====== TAMPILAN: TRANSAKSI ======
  const cocokRek = (t) => !filterRek || t.rekening_id === filterRek || t.tujuan_id === filterRek;
  const trxPilih = transaksi.filter((t) => t.tanggal.startsWith(bulan) && cocokRek(t));
  const masukPilih = total(trxPilih.filter((t) => t.tipe === 'masuk'), (t) => t.nominal);
  const keluarPilih = total(trxPilih.filter((t) => t.tipe === 'keluar'), (t) => t.nominal);
  const daftarTrx = trxPilih.filter((t) => filter === 'semua' || t.tipe === filter);
  const tampilTrx = daftarTrx.slice(0, batas);

  const grup = [];
  tampilTrx.forEach((t) => {
    const g = grup[grup.length - 1];
    if (g && g.tanggal === t.tanggal) g.items.push(t);
    else grup.push({ tanggal: t.tanggal, items: [t] });
  });

  const Transaksi = (
    <>
      <Header
        judul="Transaksi"
        sub="Setiap rupiah, tercatat rapi."
        onPlus={() => bukaHalaman('keluar')}
      />

      <View style={s.bulanRow}>
        <TouchableOpacity style={s.bulanBtn} onPress={() => setModalBulan(true)}>
          <Ionicons name="calendar-outline" size={22} color={C.teks} />
          <Text style={s.bulanBtnTeks}>{labelBulan(bulan)}</Text>
          <Ionicons name="chevron-down" size={18} color={C.teks} />
        </TouchableOpacity>
        <TouchableOpacity style={s.filterBtn} onPress={() => setModalFilter(true)} hitSlop={8}>
          <Ionicons name="options-outline" size={24} color={C.teks} />
          {filterRek ? <View style={s.titikFilter} /> : null}
        </TouchableOpacity>
      </View>

      <View style={s.ringkasRow}>
        <View style={[s.ringkas, { backgroundColor: '#dff1e8' }]}>
          <View style={s.ringkasLabelRow}>
            <IkonPanah masuk size={14} color="#047857" />
            <Text style={[s.ringkasLabel, { color: '#047857' }]}>Pemasukan</Text>
          </View>
          <Text style={s.ringkasAngka} numberOfLines={1} adjustsFontSizeToFit>
            {rupiah(masukPilih)}
          </Text>
        </View>
        <View style={[s.ringkas, { backgroundColor: '#fde8e2' }]}>
          <View style={s.ringkasLabelRow}>
            <IkonPanah masuk={false} size={14} color="#c2410c" />
            <Text style={[s.ringkasLabel, { color: '#c2410c' }]}>Pengeluaran</Text>
          </View>
          <Text style={s.ringkasAngka} numberOfLines={1} adjustsFontSizeToFit>
            {rupiah(keluarPilih)}
          </Text>
        </View>
      </View>

      <Judul teks="Catat transaksi" />
      <View style={s.aksiRow}>
        <TouchableOpacity style={s.aksiKartu} onPress={() => bukaHalaman('pindah')}>
          <View style={s.aksiIkon}>
            <Ionicons name="swap-horizontal" size={22} color={C.teal} />
          </View>
          <Text style={s.aksiTeks}>Pindah saldo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.aksiKartu} onPress={() => bukaHalaman('masuk')}>
          <View style={s.aksiIkon}>
            <IkonPanah masuk size={22} color={C.teal} />
          </View>
          <Text style={s.aksiTeks}>Pemasukan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.aksiKartu} onPress={() => bukaHalaman('keluar')}>
          <View style={s.aksiIkon}>
            <IkonPanah masuk={false} size={22} color={C.teal} />
          </View>
          <Text style={s.aksiTeks}>Pengeluaran</Text>
        </TouchableOpacity>
      </View>

      <View style={s.filterRow}>
        <Pil label="Semua" aktif={filter === 'semua'} onPress={() => setFilter('semua')} />
        <Pil label="Masuk" aktif={filter === 'masuk'} onPress={() => setFilter('masuk')} />
        <Pil label="Keluar" aktif={filter === 'keluar'} onPress={() => setFilter('keluar')} />
        <Pil label="Pindah" aktif={filter === 'pindah'} onPress={() => setFilter('pindah')} />
      </View>

      {daftarTrx.length === 0 ? (
        <View style={{ marginTop: 14 }}>
          <Kosong teks={`Tidak ada transaksi di ${labelBulan(bulan)}.`} />
        </View>
      ) : (
        <>
          {grup.map((g) => (
            <View key={g.tanggal}>
              <Text style={s.grupJudul}>{judulGrup(g.tanggal)}</Text>
              {g.items.map((t) => (
                <BarisTransaksi
                  key={t.id}
                  t={t}
                  rekMap={rekMap}
                  bisaHapus
                  onHapus={() => hapusTransaksi(t)}
                />
              ))}
            </View>
          ))}
          {daftarTrx.length > batas ? (
            <TouchableOpacity style={s.lebih} onPress={() => setBatas(batas + 10)}>
              <Text style={s.linkTeal}>Lihat transaksi sebelumnya ↓</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[s.petunjuk, { textAlign: 'center', marginTop: 14 }]}>
              Tekan lama sebuah transaksi untuk menghapusnya.
            </Text>
          )}
        </>
      )}
    </>
  );

  // ====== TAMPILAN: ANGGARAN ======
  const angPilih = hitungAng(bulan);
  const diLuar = total(
    transaksi.filter(
      (t) =>
        t.tipe === 'keluar' &&
        t.tanggal.startsWith(bulan) &&
        !anggaran.some((a) => a.id === t.anggaran_id)
    ),
    (t) => t.nominal
  );
  const persenAng = angPilih.jatah > 0 ? Math.round((angPilih.terpakai / angPilih.jatah) * 100) : 0;
  const sisaAng = angPilih.jatah - angPilih.terpakai;
  const editAng = anggaran.find((a) => a.id === editAngId) || null;

  const Anggaran = (
    <>
      <Header
        judul="Anggaran"
        sub="Rencana kecil, keuangan lebih tenang."
        onPlus={() => bukaAnggaran(null)}
      />

      <TouchableOpacity style={[s.rowBetween, { marginTop: 18 }]} onPress={() => setModalBulan(true)}>
        <Text style={s.bulanBtnTeks}>{labelBulan(bulan)}</Text>
        <Ionicons name="chevron-down" size={20} color={C.teks} />
      </TouchableOpacity>
      <Text style={s.petunjuk}>Menampilkan anggaran yang periodenya bersinggungan dengan bulan ini.</Text>

      <View style={s.heroAng}>
        <Text style={s.heroLabel}>Sisa anggaran bulan ini</Text>
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

      <Judul teks="Alokasi pengeluaran" aksi={`${angPilih.daftar.length} anggaran`} />

      {angPilih.daftar.length === 0 ? (
        <Kosong teks={`Belum ada anggaran untuk ${labelBulan(bulan)}. Ketuk + di kanan atas untuk membuatnya.`} />
      ) : (
        angPilih.daftar.map((a) => {
          const ik = IKON_ANG[a.ikon] || IKON_ANG.lainnya;
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
        <Text style={s.petunjuk}>Pengeluaran di luar anggaran bulan ini: {rupiah(diLuar)}</Text>
      ) : null}
    </>
  );

  // ====== RENDER ======
  const TAB = [
    { k: 'beranda', label: 'Beranda', ikon: 'grid' },
    { k: 'transaksi', label: 'Transaksi', ikon: 'swap-horizontal' },
    { k: 'anggaran', label: 'Anggaran', ikon: 'pie-chart' },
    { k: 'hutang', label: 'Hutang', ikon: 'wallet' },
  ];

  return (
    <View style={s.layar}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
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
          Beranda
        ) : tab === 'transaksi' ? (
          Transaksi
        ) : tab === 'anggaran' ? (
          Anggaran
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
              <View style={[s.navPil, aktif && { backgroundColor: '#d9f0e8' }]}>
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
      {halaman === 'saldo' ? (
        <FormSaldoHal
          rekening={rekening}
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
          rekening={rekening}
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
          rekening={rekening}
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
          rekening={rekening}
          tertaut={editAng ? tertautPer(editAng) : 0}
          terpakaiSekarang={editAng ? terpakaiPer(editAng) : 0}
          onSimpan={simpanAnggaran}
          onBatal={() => setHalaman(null)}
          onHapus={() => editAng && hapusAnggaran(editAng)}
        />
      ) : null}
      {halaman === 'hutangForm' ? (
        <FormHutangHal
          rekening={rekening}
          saldoRek={saldoRekening}
          onSimpan={simpanHutang}
          onBatal={() => setHalaman(null)}
        />
      ) : null}

      <DetailHutang
        key={detailHutangId ?? 'x'}
        h={hutang.find((x) => x.id === detailHutangId) || null}
        rekMap={rekMap}
        onClose={() => setDetailHutangId(null)}
        onBayar={bayarHutang}
        onLunas={lunasHutang}
        onHapus={hapusHutang}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Aplikasi />
    </SafeAreaProvider>
  );
}

// ====== STYLE ======
const s = StyleSheet.create({
  layar: { flex: 1, backgroundColor: C.bg },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Header halaman
  judulHal: { fontSize: 30, fontWeight: '700', color: C.teks },
  subHal: { color: C.abu, fontSize: 14, marginTop: 2 },
  plus: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: C.hijau,
    alignItems: 'center', justifyContent: 'center',
  },

  // Beranda
  merek: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  merekLogo: { width: 44, height: 44, borderRadius: 12 },
  merekNama: { fontSize: 22, fontWeight: '800', color: C.teks, letterSpacing: 1 },
  merekSub: { fontSize: 12, color: C.abu, marginTop: 1 },
  tglKecil: { color: C.abu, fontSize: 13 },
  salam: { fontSize: 26, fontWeight: '700', color: C.teks, marginTop: 2 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#d9f0e8',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTeks: { color: C.teal, fontWeight: '700' },

  hero: { backgroundColor: C.hijau, borderRadius: 22, padding: 20, marginTop: 18 },
  heroLabel: { color: '#cfe8e1', fontSize: 14 },
  heroAngka: { color: '#fff', fontSize: 38, fontWeight: '700', marginTop: 10 },
  heroTren: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  heroTrenTeks: { color: '#cfe8e1', fontSize: 13, marginTop: 4 },
  heroGaris: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 16 },
  heroSub: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 4 },

  judulRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 24, marginBottom: 12,
  },
  judulSeksi: { fontSize: 20, fontWeight: '700', color: C.teks },
  linkTeal: { color: C.teal, fontWeight: '700', fontSize: 14 },

  rekCard: { borderRadius: 16, padding: 12, minHeight: 130 },
  rekRp: { fontSize: 12, marginTop: 10 },
  rekAngka: { fontSize: 17, fontWeight: '700', color: C.teks },
  rekSub: { color: C.abu, fontSize: 12, marginTop: 8 },
  rekNama: { color: C.abu, fontSize: 11 },
  petunjuk: { color: C.abu, fontSize: 12, marginTop: 8 },

  kartu: {
    backgroundColor: C.kartu, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.garis, marginBottom: 4,
  },
  angTerpakai: { fontSize: 16, fontWeight: '700', color: C.teks },
  angPersen: { fontSize: 15, fontWeight: '700', color: C.teal },
  barLatar: { height: 8, borderRadius: 4, backgroundColor: '#e3eae6', overflow: 'hidden' },
  barIsi: { height: 8, borderRadius: 4 },

  // Grafik
  grafBatangArea: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 2 },
  grafLabel: { fontSize: 10, color: C.abu, marginTop: 4 },
  grafMaks: { fontSize: 11, color: C.abu },
  legenda: { flexDirection: 'row', gap: 16, marginTop: 12 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendaTeks: { fontSize: 12, color: C.abu },
  titik: { width: 10, height: 10, borderRadius: 5 },
  navGraf: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#e6ede9',
    alignItems: 'center', justifyContent: 'center',
  },
  detailGraf: {
    backgroundColor: '#f1f7f4', borderRadius: 14, padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: C.garis,
  },
  rincianRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 8,
    borderRadius: 10, gap: 4,
  },

  // Chip kategori / anggaran
  chipLink: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#e6ede9',
  },
  chipBaru: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: C.teal, borderStyle: 'dashed',
  },
  chipLinkTeks: { color: C.teal, fontSize: 14, fontWeight: '600' },
  tambahBtn: {
    backgroundColor: C.teal, borderRadius: 14, paddingHorizontal: 18,
    alignItems: 'center', justifyContent: 'center',
  },

  // Baris transaksi
  trxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  trxIkon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  trxJudul: { fontSize: 16, fontWeight: '700', color: C.teks },
  trxSub: { fontSize: 13, color: C.abu, marginTop: 2 },
  trxAngka: { fontSize: 15, fontWeight: '700' },

  kosong: {
    borderWidth: 1, borderColor: C.garis, borderStyle: 'dashed', borderRadius: 14,
    padding: 18, backgroundColor: '#fff',
  },

  // Menu Transaksi
  bulanRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18,
  },
  bulanBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulanBtnTeks: { fontSize: 16, fontWeight: '700', color: C.teks },
  filterBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titikFilter: {
    position: 'absolute', top: 6, right: 6, width: 9, height: 9, borderRadius: 5,
    backgroundColor: C.merah,
  },
  ringkasRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  ringkas: { flex: 1, borderRadius: 18, padding: 16 },
  ringkasLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ringkasLabel: { fontSize: 13, fontWeight: '600' },
  ringkasAngka: { fontSize: 20, fontWeight: '700', color: C.teks, marginTop: 10 },

  aksiRow: { flexDirection: 'row', gap: 10 },
  aksiKartu: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: C.garis,
    alignItems: 'center', paddingVertical: 16,
  },
  aksiIkon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#dff1e8',
    alignItems: 'center', justifyContent: 'center',
  },
  aksiTeks: { fontSize: 13, fontWeight: '600', color: C.teks, marginTop: 10 },

  filterRow: { flexDirection: 'row', gap: 10, marginTop: 22, marginBottom: 4 },
  pil: {
    flex: 1, paddingVertical: 11, borderRadius: 20, alignItems: 'center',
    backgroundColor: '#e6ede9',
  },
  pilTeks: { fontSize: 14, color: C.abu, fontWeight: '600' },

  grupJudul: {
    fontSize: 12, letterSpacing: 0.6, fontWeight: '600', color: C.abu,
    marginTop: 18, marginBottom: 4,
  },
  lebih: { alignItems: 'center', paddingVertical: 20 },

  // Menu Anggaran
  heroAng: { backgroundColor: C.hijau, borderRadius: 22, padding: 20, marginTop: 16 },
  heroAngBesar: { color: '#fff', fontSize: 40, fontWeight: '700', marginVertical: 8 },
  heroPersen: { color: '#fff', fontSize: 14, fontWeight: '700' },
  angKartu: {
    backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: C.garis,
    padding: 16, marginBottom: 12,
  },
  angIkon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Hutang
  hutAvatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  tombolIkon: { flexDirection: 'row', justifyContent: 'center', gap: 8 },

  // Pilih bulan
  bulanBar: {
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14,
    marginVertical: 14, borderWidth: 1, borderColor: C.garis,
  },
  bulanTeks: { fontSize: 16, fontWeight: '700', color: C.teks },
  bulanChip: {
    width: '31%', alignItems: 'center', paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#cdd9d3', backgroundColor: '#fff',
  },

  // Navigasi bawah
  nav: {
    flexDirection: 'row', backgroundColor: '#fff', paddingTop: 8,
    borderTopWidth: 1, borderTopColor: C.garis,
  },
  navItem: { flex: 1, alignItems: 'center' },
  navPil: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 16 },
  navLabel: { fontSize: 12, color: C.abu, marginTop: 2 },

  // Form umum
  tombolTeks: { color: '#fff', fontWeight: '700', fontSize: 15 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#cdd9d3', backgroundColor: '#fff',
  },
  chipTeks: { color: C.teks, fontSize: 14 },

  label: { color: C.teks, fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: C.garis, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', fontSize: 15, color: C.teks,
  },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 20, maxHeight: '88%',
  },
  sheetHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  sheetJudul: { fontSize: 20, fontWeight: '700', color: C.teks, flex: 1, paddingRight: 10 },

  // Halaman form penuh
  back: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.garis,
  },
  seg: {
    flexDirection: 'row', backgroundColor: '#e6ede9', borderRadius: 16,
    padding: 4, marginTop: 4, marginBottom: 4,
  },
  segItem: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  segAktif: { backgroundColor: '#fff' },
  segTeks: { color: C.abu, fontSize: 14, fontWeight: '600' },

  field: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: C.garis,
    paddingHorizontal: 16, paddingVertical: 15,
  },
  fieldTeks: { fontSize: 15, color: C.teks },
  dropList: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: C.garis,
    marginTop: 6, overflow: 'hidden',
  },
  dropItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 14,
  },

  kartuNom: { backgroundColor: '#dff1e8', borderRadius: 18, padding: 18, marginTop: 16 },
  kartuNomLabel: { color: C.teal, fontSize: 14, fontWeight: '600' },
  kartuNomTeks: { fontSize: 36, fontWeight: '700', color: C.hijau },

  penanda: {
    width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },

  ringkasKartu: {
    backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: C.garis,
    padding: 16, marginTop: 20,
  },
  ringkasJudul: { fontSize: 12, letterSpacing: 0.6, color: C.abu, fontWeight: '600' },
  ringkasJudulTebal: { fontSize: 14, fontWeight: '700', color: C.teks },
  ringkasBesar: { fontSize: 28, fontWeight: '700', color: C.teal, marginVertical: 8 },
  ringkasLabel2: { fontSize: 14, color: C.abu },
  ringkasNilai: { fontSize: 16, fontWeight: '700', color: C.teks },
  pemisah: { height: 1, backgroundColor: C.garis, marginTop: 12 },

  catatan: {
    flexDirection: 'row', gap: 10, backgroundColor: '#e8eeeb', borderRadius: 14,
    padding: 14, marginTop: 14,
  },
  catatanTeks: { flex: 1, color: C.abu, fontSize: 13, lineHeight: 19 },

  panahBulat: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#dff1e8',
    alignItems: 'center', justifyContent: 'center',
  },

  // Atur anggaran / peran hutang
  radioRow: { flexDirection: 'row', gap: 12 },
  radio: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: C.garis,
    paddingVertical: 15, paddingHorizontal: 14,
  },
  radioAktif: { backgroundColor: '#dff1e8', borderColor: C.teal },
  sisaKartu: { backgroundColor: '#dff1e8', borderRadius: 18, padding: 18, marginTop: 20 },
  sisaLabel: { color: C.teal, fontSize: 15, fontWeight: '700' },
  sisaAngka: { fontSize: 26, fontWeight: '700', color: C.hijau },
  sisaSub: { color: C.teal, fontSize: 13, marginTop: 6 },

  bawah: {
    paddingHorizontal: 20, paddingTop: 12, backgroundColor: C.bg,
    borderTopWidth: 1, borderTopColor: C.garis,
  },
  tombolBesar: {
    backgroundColor: C.teal, borderRadius: 14, paddingVertical: 17, alignItems: 'center',
  },

  // Kalender
  kalender: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: C.garis,
    padding: 12, marginTop: 6,
  },
  kalRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  kalHari: { width: '14.285%', textAlign: 'center', color: C.abu, fontSize: 12, fontWeight: '600' },
  kalSel: { width: '14.285%', height: 40, alignItems: 'center', justifyContent: 'center' },
  kalBulat: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  kalAngka: { fontSize: 14, color: C.teks },
});