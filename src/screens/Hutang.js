import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  angkaDariTeks,
  formatInput,
  gayaIkon,
  hariIni,
  inisial,
  rupiah,
  sisaHutang,
  tglPendek,
  total,
} from '../helper';
import { C, s } from '../tema';
import { Bar, Chip, Header, IkonPanah, Judul, Kosong, Sheet } from '../components/Dasar';
import { Catatan } from '../components/LayarForm';

export function HutangTab({ hutang, rekMap, onTambah, onBuka }) {
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
                <View style={[s.hutAvatar, { backgroundColor: gayaIkon(beri ? '#dcf0e6' : '#e4eefc', beri ? '#047857' : '#1d4ed8').bg }]}>
                  <Text style={{ fontWeight: '700', color: gayaIkon(beri ? '#dcf0e6' : '#e4eefc', beri ? '#047857' : '#1d4ed8').fg }}>
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
                <View style={[s.badge, { backgroundColor: gayaIkon(badge.bg, badge.fg).bg }]}>
                  <Text style={{ color: gayaIkon(badge.bg, badge.fg).fg, fontSize: 12, fontWeight: '600' }}>{badge.teks}</Text>
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

export function DetailHutang({ h, rekMap, onClose, onBayar, onLunas, onHapus }) {
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
