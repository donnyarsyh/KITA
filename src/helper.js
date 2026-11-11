import { Alert } from 'react-native';
import { C } from './tema';

export const WARNA_REK = [
  { bg: '#dcf0e6', ikon: '#047857' },
  { bg: '#e4eefc', ikon: '#1d4ed8' },
  { bg: '#fdeee3', ikon: '#c2410c' },
  { bg: '#f1e8fb', ikon: '#7e22ce' },
  { bg: '#fcebf1', ikon: '#be185d' },
];

export const WARNA_GRAF = ['#007a66', '#3b6b9a', '#d4a017', '#c4533f', '#8b5cf6', '#db2777'];

export const JENIS = [
  { key: 'bank', label: 'Bank' },
  { key: 'ewallet', label: 'E-wallet' },
  { key: 'tunai', label: 'Tunai / Dompet' },
];

// Ikon anggaran (dipilih otomatis dari nama)
export const IKON_ANG = {
  belanja: { ikon: 'basket-outline', bg: '#dcf0e6', fg: '#047857', bar: '#007a66' },
  tagihan: { ikon: 'receipt-outline', bg: '#e4eefc', fg: '#1d4ed8', bar: '#3b6b9a' },
  transport: { ikon: 'bus-outline', bg: '#fdeee3', fg: '#c2410c', bar: '#b0653a' },
  hiburan: { ikon: 'film-outline', bg: '#fdebe7', fg: '#c2410c', bar: '#c4533f' },
  makan: { ikon: 'restaurant-outline', bg: '#fff3d6', fg: '#b45309', bar: '#d4a017' },
  rumah: { ikon: 'home-outline', bg: '#f1e8fb', fg: '#7e22ce', bar: '#8b5cf6' },
  kesehatan: { ikon: 'medkit-outline', bg: '#fcebf1', fg: '#be185d', bar: '#db2777' },
  lainnya: { ikon: 'pricetag-outline', bg: '#eef2ef', fg: '#475569', bar: '#64748b' },
};

export const tebakIkon = (nama) => {
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
export const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
  'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
export const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const HARI_PENDEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const dua = (n) => String(n).padStart(2, '0');
export const keISO = (d) => `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;
export const hariIni = () => keISO(new Date());
export const kemarin = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return keISO(d);
};
export const tambahHari = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  return keISO(new Date(y, m - 1, d + n));
};
export const bulanIni = () => hariIni().slice(0, 7);
export const jamSekarang = () => {
  const d = new Date();
  return `${dua(d.getHours())}.${dua(d.getMinutes())}`;
};

// Awal / akhir sebuah bulan ('YYYY-MM')
export const awalBulan = (b) => `${b}-01`;
export const akhirBulan = (b) => {
  const [y, m] = b.split('-').map(Number);
  return keISO(new Date(y, m, 0));
};
// Selisih hari antara dua tanggal ISO
export const selisihHari = (a, b) => {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
};
// Satu tahun dari tanggal mulai, dikurangi sehari
export const satuTahun = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return keISO(new Date(y + 1, m - 1, d - 1));
};
// Periode sebuah anggaran (dengan cadangan untuk data lama)
export const periode = (a) => ({
  mulai: a.mulai || awalBulan(a.bulan),
  selesai: a.selesai || akhirBulan(a.bulan),
});
// Apakah anggaran bersinggungan dengan bulan tertentu
export const adaDiBulan = (a, b) => {
  const p = periode(a);
  return p.mulai <= akhirBulan(b) && p.selesai >= awalBulan(b);
};
// Apakah anggaran bersinggungan dengan rentang tanggal (dari..sampai)
export const adaDiRentang = (a, dari, sampai) => {
  const p = periode(a);
  return p.mulai <= sampai && p.selesai >= dari;
};
// Apakah tanggal berada di dalam periode anggaran
export const adaDiTanggal = (a, iso) => {
  const p = periode(a);
  return p.mulai <= iso && iso <= p.selesai;
};

export const geserBulan = (b, delta) => {
  const [y, m] = b.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${dua(d.getMonth() + 1)}`;
};
export const labelBulan = (b) => {
  const [y, m] = b.split('-').map(Number);
  return `${NAMA_BULAN[m - 1]} ${y}`;
};
export const labelPanjang = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${NAMA_BULAN[m - 1]} ${y}`;
};
export const tglPendek = (iso) => {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${BULAN_PENDEK[m - 1]} ${y}`;
};
export const labelPeriode = (a) => {
  const p = periode(a);
  return `${tglPendek(p.mulai)} – ${tglPendek(p.selesai)}`;
};
export const labelTanggal = (iso) => {
  if (iso === hariIni()) return 'Hari ini';
  if (iso === kemarin()) return 'Kemarin';
  return tglPendek(iso);
};
export const judulGrup = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  let tgl = `${d} ${NAMA_BULAN[m - 1].toUpperCase()}`;
  if (y !== new Date().getFullYear()) tgl += ` ${y}`;
  return iso === hariIni() ? `HARI INI, ${tgl}` : tgl;
};

export const ribuan = (n) =>
  String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const rupiah = (n) => (n < 0 ? '-Rp' : 'Rp') + ribuan(n);
export const angkaDariTeks = (t) => Number(String(t).replace(/\D/g, '')) || 0;
export const formatInput = (t) => {
  const a = String(t).replace(/\D/g, '');
  return a ? ribuan(Number(a)) : '';
};
export const total = (arr, fn) => arr.reduce((a, b) => a + fn(b), 0);
export const inisial = (nama) =>
  nama.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
export const sisaHutang = (h) => Math.max(0, h.nominal - h.dibayar);

export const statusAnggaran = (terpakai, jatah) => {
  if (terpakai === 0) return { teks: 'Belum dipakai', warna: '#d97706' };
  if (terpakai > jatah) return { teks: 'Melebihi jatah', warna: C.merah };
  if (terpakai === jatah) return { teks: 'Terpakai semua', warna: '#16a34a' };
  return { teks: 'Sudah terpakai', warna: '#2563eb' };
};

export const konfirmasi = (judul, pesan, aksi) => {
  Alert.alert(judul, pesan, [
    { text: 'Batal', style: 'cancel' },
    { text: 'Hapus', style: 'destructive', onPress: aksi },
  ]);
};

// Pilih ikon & warna baris transaksi
const gayaTrxAsli = (t) => {
  if (t.hutang_id) {
    const masuk = t.tipe === 'masuk';
    return { ikon: 'people-outline', bg: masuk ? '#dcf0e6' : '#eef2ef', fg: masuk ? '#047857' : C.teks };
  }
  if (t.tipe === 'pindah') return { ikon: 'swap-horizontal', bg: '#e4eefc', fg: '#1d4ed8' };
  if (t.tipe === 'tabung' || t.tipe === 'tarik') return { ikon: 'flag-outline', bg: '#fff3d6', fg: '#b45309' };
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

// ----- Warna ikon yang menyesuaikan mode gelap -----
// Mode terang: pakai warna pastel apa adanya. Mode gelap: latar dibuat transparan
// dari warna ikonnya, dan warna ikon dicerahkan supaya terbaca.
const cerah = (hex) => {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const n = (i) => parseInt(h.slice(i, i + 2), 16);
  const campur = (v) => Math.round(v + (255 - v) * 0.45).toString(16).padStart(2, '0');
  return `#${campur(n(0))}${campur(n(2))}${campur(n(4))}`;
};

export const gayaIkon = (bg, fg) =>
  C.gelap ? { bg: fg.length === 7 ? fg + '2e' : bg, fg: cerah(fg) } : { bg, fg };

export const warnaRekTema = () =>
  WARNA_REK.map((w) => {
    const g = gayaIkon(w.bg, w.ikon);
    return { bg: g.bg, ikon: g.fg };
  });

export const gayaTrx = (t) => {
  const g = gayaTrxAsli(t);
  const x = gayaIkon(g.bg, g.fg);
  return { ikon: g.ikon, bg: x.bg, fg: x.fg };
};

// ----- Periode anggaran (untuk "Salin anggaran bulan lalu") -----
// Menggeser tanggal n bulan. Hari 31 yang jatuh di bulan pendek dipotong ke hari terakhir bulan itu.
export const geserTanggal = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  const hariTerakhir = new Date(y, m + n, 0).getDate();
  return keISO(new Date(y, m - 1 + n, Math.min(d, hariTerakhir)));
};

// Menggeser seluruh periode anggaran n bulan. Anggaran "satu bulan penuh" tetap satu bulan penuh.
export const geserPeriode = (a, n) => {
  const p = periode(a);
  const akhirBulanPenuh = p.selesai === akhirBulan(p.selesai.slice(0, 7));
  return {
    mulai: geserTanggal(p.mulai, n),
    selesai: akhirBulanPenuh
      ? akhirBulan(geserBulan(p.selesai.slice(0, 7), n))
      : geserTanggal(p.selesai, n),
  };
};


// ----- Tabungan -----
export const IKON_TABUNGAN = [
  'flag-outline', 'heart-outline', 'home-outline', 'car-outline', 'airplane-outline',
  'school-outline', 'gift-outline', 'phone-portrait-outline', 'medkit-outline', 'shield-checkmark-outline',
];

export const tebakIkonTabungan = (nama) => {
  const k = (nama || '').toLowerCase();
  if (/nikah|kawin|wedding|pernikahan/.test(k)) return 'heart-outline';
  if (/rumah|kpr|tanah|renovasi/.test(k)) return 'home-outline';
  if (/mobil|motor|kendara/.test(k)) return 'car-outline';
  if (/liburan|wisata|haji|umroh|umrah|travel|jalan/.test(k)) return 'airplane-outline';
  if (/sekolah|kuliah|pendidikan|kursus/.test(k)) return 'school-outline';
  if (/hadiah|kado|ulang tahun/.test(k)) return 'gift-outline';
  if (/hp|laptop|gadget|kamera/.test(k)) return 'phone-portrait-outline';
  if (/sehat|obat|rumah sakit|medis/.test(k)) return 'medkit-outline';
  if (/darurat|dana cadangan/.test(k)) return 'shield-checkmark-outline';
  return 'flag-outline';
};
