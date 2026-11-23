

import * as SQLite from 'expo-sqlite';

// Semua urusan database ada di file ini: membuka database, membuat tabel, dan migrasi.
export const db = SQLite.openDatabaseSync('keuangan.db');

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
  CREATE TABLE IF NOT EXISTS tabungan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    target INTEGER NOT NULL,
    ikon TEXT,
    tenggat TEXT
  );
  CREATE TABLE IF NOT EXISTS meta (
    kunci TEXT PRIMARY KEY,
    nilai TEXT
  );
`);

// Tambah kolom baru untuk database lama (aman dijalankan berulang)
export const tambahKolom = (tabel, kolom, tipe) => {
  const ada = db.getAllSync(`PRAGMA table_info(${tabel})`).some((k) => k.name === kolom);
  if (!ada) db.execSync(`ALTER TABLE ${tabel} ADD COLUMN ${kolom} ${tipe}`);
};
tambahKolom('transaksi', 'kategori', 'TEXT');
tambahKolom('transaksi', 'waktu', 'TEXT');
tambahKolom('transaksi', 'catatan', 'TEXT');
tambahKolom('transaksi', 'hutang_id', 'INTEGER');
tambahKolom('transaksi', 'tabungan_id', 'INTEGER');
tambahKolom('anggaran', 'rekening_id', 'INTEGER');
tambahKolom('anggaran', 'ikon', 'TEXT');
tambahKolom('anggaran', 'penyesuaian', 'INTEGER DEFAULT 0');
tambahKolom('anggaran', 'mulai', 'TEXT');
tambahKolom('anggaran', 'selesai', 'TEXT');
tambahKolom('rekening', 'warna', 'INTEGER');
tambahKolom('rekening', 'khusus_tabungan', 'INTEGER DEFAULT 0');

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

// ----- Pengaturan kecil (nama, tema) disimpan di tabel meta -----
export const ambilMeta = (kunci) => {
  const baris = db.getAllSync('SELECT nilai FROM meta WHERE kunci = ?', [kunci]);
  return baris.length ? baris[0].nilai : null;
};

export const simpanMeta = (kunci, nilai) => {
  db.runSync('INSERT OR REPLACE INTO meta (kunci, nilai) VALUES (?, ?)', [kunci, String(nilai)]);
};


export const hapusMeta = (kunci) => {
  db.runSync('DELETE FROM meta WHERE kunci = ?', [kunci]);
};
