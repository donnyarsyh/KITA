import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gayaTrx, labelTanggal, rupiah } from '../helper';
import { C, s } from '../tema';

export function BarisTransaksi({ t, rekMap, bisaHapus, onHapus, tampilTanggal }) {
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
      : t.tipe === 'keluar' || t.tipe === 'tabung'
        ? { teks: '-' + rupiah(t.nominal), warna: C.teks }
        : t.tipe === 'tarik'
          ? { teks: '+' + rupiah(t.nominal), warna: C.teal }
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
