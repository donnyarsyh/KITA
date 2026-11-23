import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { db } from './db';

// Semua tabel yang ikut dicadangkan. Urutan tidak penting karena id asli dipertahankan.
const TABEL = ['rekening', 'kategori', 'anggaran', 'hutang', 'tabungan', 'transaksi', 'meta'];
const VERSI = 1;

const dua = (n) => String(n).padStart(2, '0');

// ----- Membuat isi cadangan (objek biasa, nanti diubah menjadi teks JSON) -----
export const buatCadangan = () => {
  const data = {};
  TABEL.forEach((t) => {
    data[t] = db.getAllSync(`SELECT * FROM ${t}`);
  });
  return { aplikasi: 'KITA', versi: VERSI, dibuat: new Date().toISOString(), data };
};

export const ringkasCadangan = (obj) => {
  const d = obj.data || {};
  const n = (k) => (Array.isArray(d[k]) ? d[k].length : 0);
  return `${n('rekening')} rekening, ${n('transaksi')} transaksi, ${n('anggaran')} anggaran, ${n('hutang')} hutang, ${n('tabungan')} target tabungan`;
};

// ----- Ekspor: tulis file JSON lalu buka menu "Bagikan" (Drive, WhatsApp, Simpan ke File, dll) -----
export const ekspor = async () => {
  const cadangan = buatCadangan();
  const w = new Date();
  const nama = `kita-cadangan-${w.getFullYear()}${dua(w.getMonth() + 1)}${dua(w.getDate())}-${dua(w.getHours())}${dua(w.getMinutes())}.json`;
  const file = new File(Paths.cache, nama);
  file.create({ overwrite: true });
  await file.write(JSON.stringify(cadangan));
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Menu bagikan file tidak tersedia di HP ini.');
  }
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Simpan cadangan KITA' });
  return cadangan;
};

// ----- Impor: pilih file, baca, periksa -----
// Mengembalikan null bila dibatalkan, atau { nama, isi } bila file cadangan KITA yang sah.
export const pilihFileCadangan = async () => {
  const hasil = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (hasil.canceled || !hasil.assets || hasil.assets.length === 0) return null;
  const aset = hasil.assets[0];
  const teks = await new File(aset.uri).text();
  let isi;
  try {
    isi = JSON.parse(teks);
  } catch {
    throw new Error('File ini bukan file cadangan KITA (isinya tidak terbaca).');
  }
  if (!isi || isi.aplikasi !== 'KITA' || typeof isi.data !== 'object' || isi.data === null) {
    throw new Error('File ini bukan file cadangan KITA.');
  }
  if (typeof isi.versi === 'number' && isi.versi > VERSI) {
    throw new Error('Cadangan ini dibuat oleh versi KITA yang lebih baru. Perbarui aplikasinya dulu.');
  }
  return { nama: aset.name, isi };
};

// ----- Pulihkan: SEMUA data di HP diganti isi cadangan. Berhasil semua atau batal semua. -----
export const pulihkan = (isi) => {
  db.withTransactionSync(() => {
    TABEL.forEach((t) => {
      const kolomAda = db.getAllSync(`PRAGMA table_info(${t})`).map((k) => k.name);
      db.runSync(`DELETE FROM ${t}`);
      const baris = Array.isArray(isi.data[t]) ? isi.data[t] : [];
      baris.forEach((b) => {
        const kolom = Object.keys(b).filter((k) => kolomAda.includes(k));
        if (kolom.length === 0) return;
        db.runSync(
          `INSERT INTO ${t} (${kolom.join(', ')}) VALUES (${kolom.map(() => '?').join(', ')})`,
          kolom.map((k) => b[k])
        );
      });
    });
  });
};
