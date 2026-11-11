import { StyleSheet } from 'react-native';

// ====== PALET WARNA ======
// Semua warna layar diambil dari sini. Mau ganti warna? Cukup ubah di sini.
export const PALET = {
  terang: {
    gelap: false,
    hijau: '#00574b',
    hero: '#00574b',
    hijauTeks: '#00574b',
    teal: '#007a66',
    tombol: '#007a66',
    bg: '#f4f7f5',
    kartu: '#ffffff',
    teks: '#14231f',
    abu: '#6b7b75',
    garis: '#e3eae6',
    garis2: '#cdd9d3',
    lembut: '#e6ede9',
    lembut2: '#e8eeeb',
    mint: '#dff1e8',
    detail: '#f1f7f4',
    sorot: '#e3f1ec',
    bahaya: '#fde8e2',
    merah: '#d14343',
    ok: '#047857',
    oren: '#c2410c',
  },
  gelap: {
    gelap: true,
    hijau: '#0e8a74',
    hero: '#0b4f45',
    hijauTeks: '#5fd3b8',
    teal: '#34c7a8',
    tombol: '#0e8a74',
    bg: '#0f1715',
    kartu: '#18221f',
    teks: '#e6efeb',
    abu: '#93a39d',
    garis: '#26342f',
    garis2: '#33433d',
    lembut: '#212d29',
    lembut2: '#1f2a26',
    mint: '#1b3a33',
    detail: '#1c2824',
    sorot: '#1f3a33',
    bahaya: '#3a211d',
    merah: '#ef6b66',
    ok: '#4ade80',
    oren: '#fb923c',
  },
};

// C (warna) dan s (gaya) sengaja berupa objek yang ISINYA diganti saat tema berubah.
// Semua file cukup `import { C, s } from '../tema'` dan memakainya seperti biasa.
export const C = { ...PALET.terang };
export const s = {};

let modeAktif = null;

export function terapkanTema(mode) {
  if (mode === modeAktif) return;
  modeAktif = mode;
  Object.assign(C, PALET[mode]);
  Object.assign(s, buatGaya());
}

function buatGaya() {
  return StyleSheet.create({
    layar: { flex: 1, backgroundColor: C.bg },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    // Header halaman
    judulHal: { fontSize: 30, fontWeight: '700', color: C.teks },
    subHal: { color: C.abu, fontSize: 14, marginTop: 2 },
    plus: {
      width: 52,
      height: 52,
      borderRadius: 14,
      backgroundColor: C.hijau,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Beranda
    merek: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    merekLogo: { width: 44, height: 44, borderRadius: 12 },
    merekNama: { fontSize: 22, fontWeight: '800', color: C.teks, letterSpacing: 1 },
    merekSub: { fontSize: 12, color: C.abu, marginTop: 1 },
    tglKecil: { color: C.abu, fontSize: 13 },
    salam: { fontSize: 26, fontWeight: '700', color: C.teks, marginTop: 2 },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: C.mint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarTeks: { color: C.teal, fontWeight: '700' },

    hero: { backgroundColor: C.hero, borderRadius: 22, padding: 20, marginTop: 18 },
    heroLabel: { color: '#cfe8e1', fontSize: 14 },
    heroAngka: { color: '#fff', fontSize: 38, fontWeight: '700', marginTop: 10 },
    heroTren: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    heroTrenTeks: { color: '#cfe8e1', fontSize: 13, marginTop: 4 },
    heroGaris: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 16 },
    heroSub: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 4 },

    judulRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 12,
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
      backgroundColor: C.kartu,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: C.garis,
      marginBottom: 4,
    },
    angTerpakai: { fontSize: 16, fontWeight: '700', color: C.teks },
    angPersen: { fontSize: 15, fontWeight: '700', color: C.teal },
    barLatar: { height: 8, borderRadius: 4, backgroundColor: C.garis, overflow: 'hidden' },
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
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.lembut,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailGraf: {
      backgroundColor: C.detail,
      borderRadius: 14,
      padding: 14,
      marginTop: 12,
      borderWidth: 1,
      borderColor: C.garis,
    },
    rincianRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 9,
      paddingHorizontal: 8,
      borderRadius: 10,
      gap: 4,
    },

    // Chip kategori / anggaran
    chipLink: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: C.lembut,
    },
    chipBaru: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.teal,
      borderStyle: 'dashed',
    },
    chipLinkTeks: { color: C.teal, fontSize: 14, fontWeight: '600' },
    tambahBtn: {
      backgroundColor: C.tombol,
      borderRadius: 14,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Baris transaksi
    trxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    trxIkon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    trxJudul: { fontSize: 16, fontWeight: '700', color: C.teks },
    trxSub: { fontSize: 13, color: C.abu, marginTop: 2 },
    trxAngka: { fontSize: 15, fontWeight: '700' },

    kosong: {
      borderWidth: 1,
      borderColor: C.garis,
      borderStyle: 'dashed',
      borderRadius: 14,
      padding: 18,
      backgroundColor: C.kartu,
    },

    // Menu Transaksi
    bulanRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 18,
    },
    bulanBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    bulanBtnTeks: { fontSize: 16, fontWeight: '700', color: C.teks },
    filterBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    titikFilter: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: C.merah,
    },
    ringkasRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
    ringkas: { flex: 1, borderRadius: 18, padding: 16 },
    ringkasLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ringkasLabel: { fontSize: 13, fontWeight: '600' },
    ringkasAngka: { fontSize: 20, fontWeight: '700', color: C.teks, marginTop: 10 },

    aksiRow: { flexDirection: 'row', gap: 10 },
    aksiKartu: {
      flex: 1,
      backgroundColor: C.kartu,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.garis,
      alignItems: 'center',
      paddingVertical: 16,
    },
    aksiIkon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: C.mint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aksiTeks: { fontSize: 13, fontWeight: '600', color: C.teks, marginTop: 10 },

    filterRow: { flexDirection: 'row', gap: 10, marginTop: 22, marginBottom: 4 },
    pil: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 20,
      alignItems: 'center',
      backgroundColor: C.lembut,
    },
    pilTeks: { fontSize: 14, color: C.abu, fontWeight: '600' },

    grupJudul: {
      fontSize: 12,
      letterSpacing: 0.6,
      fontWeight: '600',
      color: C.abu,
      marginTop: 18,
      marginBottom: 4,
    },
    lebih: { alignItems: 'center', paddingVertical: 20 },

    // Menu Anggaran
    heroAng: { backgroundColor: C.hero, borderRadius: 22, padding: 20, marginTop: 16 },
    heroAngBesar: { color: '#fff', fontSize: 40, fontWeight: '700', marginVertical: 8 },
    heroPersen: { color: '#fff', fontSize: 14, fontWeight: '700' },
    angKartu: {
      backgroundColor: C.kartu,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: C.garis,
      padding: 16,
      marginBottom: 12,
    },
    angIkon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

    // Hutang
    hutAvatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
    tombolIkon: { flexDirection: 'row', justifyContent: 'center', gap: 8 },

    // Pilih bulan
    bulanBar: {
      backgroundColor: C.kartu,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginVertical: 14,
      borderWidth: 1,
      borderColor: C.garis,
    },
    bulanTeks: { fontSize: 16, fontWeight: '700', color: C.teks },
    bulanChip: {
      width: '31%',
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.garis2,
      backgroundColor: C.kartu,
    },

    // Navigasi bawah
    nav: {
      flexDirection: 'row',
      backgroundColor: C.kartu,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: C.garis,
    },
    navItem: { flex: 1, alignItems: 'center' },
    navPil: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 16 },
    navLabel: { fontSize: 12, color: C.abu, marginTop: 2 },

    // Form umum
    tombolTeks: { color: '#fff', fontWeight: '700', fontSize: 15 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.garis2,
      backgroundColor: C.kartu,
    },
    chipTeks: { color: C.teks, fontSize: 14 },

    label: { color: C.teks, fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 8 },
    input: {
      borderWidth: 1,
      borderColor: C.garis,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: C.kartu,
      fontSize: 15,
      color: C.teks,
    },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: C.bg,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      padding: 20,
      maxHeight: '88%',
    },
    sheetHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    sheetJudul: { fontSize: 20, fontWeight: '700', color: C.teks, flex: 1, paddingRight: 10 },

    // Halaman form penuh
    back: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: C.kartu,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.garis,
    },
    seg: {
      flexDirection: 'row',
      backgroundColor: C.lembut,
      borderRadius: 16,
      padding: 4,
      marginTop: 4,
      marginBottom: 4,
    },
    segItem: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    segAktif: { backgroundColor: C.kartu },
    segTeks: { color: C.abu, fontSize: 14, fontWeight: '600' },

    field: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      backgroundColor: C.kartu,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.garis,
      paddingHorizontal: 16,
      paddingVertical: 15,
    },
    fieldTeks: { fontSize: 15, color: C.teks },
    dropList: {
      backgroundColor: C.kartu,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.garis,
      marginTop: 6,
      overflow: 'hidden',
    },
    dropItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },

    kartuNom: { backgroundColor: C.mint, borderRadius: 18, padding: 18, marginTop: 16 },
    kartuNomLabel: { color: C.teal, fontSize: 14, fontWeight: '600' },
    kartuNomTeks: { fontSize: 36, fontWeight: '700', color: C.hijauTeks },

    penanda: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },

    ringkasKartu: {
      backgroundColor: C.kartu,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: C.garis,
      padding: 16,
      marginTop: 20,
    },
    ringkasJudul: { fontSize: 12, letterSpacing: 0.6, color: C.abu, fontWeight: '600' },
    ringkasJudulTebal: { fontSize: 14, fontWeight: '700', color: C.teks },
    ringkasBesar: { fontSize: 28, fontWeight: '700', color: C.teal, marginVertical: 8 },
    ringkasLabel2: { fontSize: 14, color: C.abu },
    ringkasNilai: { fontSize: 16, fontWeight: '700', color: C.teks },
    pemisah: { height: 1, backgroundColor: C.garis, marginTop: 12 },

    catatan: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: C.lembut2,
      borderRadius: 14,
      padding: 14,
      marginTop: 14,
    },
    catatanTeks: { flex: 1, color: C.abu, fontSize: 13, lineHeight: 19 },

    panahBulat: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.mint,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Atur anggaran / peran hutang
    radioRow: { flexDirection: 'row', gap: 12 },
    radio: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: C.kartu,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.garis,
      paddingVertical: 15,
      paddingHorizontal: 14,
    },
    radioAktif: { backgroundColor: C.mint, borderColor: C.teal },
    sisaKartu: { backgroundColor: C.mint, borderRadius: 18, padding: 18, marginTop: 20 },
    sisaLabel: { color: C.teal, fontSize: 15, fontWeight: '700' },
    sisaAngka: { fontSize: 26, fontWeight: '700', color: C.hijauTeks },
    sisaSub: { color: C.teal, fontSize: 13, marginTop: 6 },

    bawah: {
      paddingHorizontal: 20,
      paddingTop: 12,
      backgroundColor: C.bg,
      borderTopWidth: 1,
      borderTopColor: C.garis,
    },
    tombolBesar: {
      backgroundColor: C.tombol,
      borderRadius: 14,
      paddingVertical: 17,
      alignItems: 'center',
    },

    // Kalender
    kalender: {
      backgroundColor: C.kartu,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.garis,
      padding: 12,
      marginTop: 6,
    },
    kalRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    kalHari: { width: '14.285%', textAlign: 'center', color: C.abu, fontSize: 12, fontWeight: '600' },
    kalSel: { width: '14.285%', height: 40, alignItems: 'center', justifyContent: 'center' },
    kalBulat: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    kalAngka: { fontSize: 14, color: C.teks },

    // Pencarian transaksi
    cari: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 16,
      backgroundColor: C.kartu,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.garis,
      paddingHorizontal: 14,
    },
    cariInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.teks },

    // Tombol "Salin dari bulan lalu"
    salinBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 13,
      borderRadius: 14,
      marginTop: 14,
      borderWidth: 1,
      borderColor: C.teal,
      borderStyle: 'dashed',
    },

    // Pengaturan
    pilihTema: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: C.kartu,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.garis,
      paddingVertical: 14,
      paddingHorizontal: 14,
      marginBottom: 10,
    },
    pilihTemaAktif: { backgroundColor: C.mint, borderColor: C.teal },
  });
}

terapkanTema('terang');
