import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BULAN_PENDEK,
  geserBulan,
  labelBulan,
  NAMA_BULAN,
  rupiah,
  total,
  WARNA_GRAF,
} from '../helper';
import { C, s } from '../tema';
import { Bar, Chip, Kosong } from './Dasar';

export function GrafikBatang({ data, terpilih, onPilih, tinggi = 130, lebarKolom = 24, lebarBar = 8, scroll }) {
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
            terpilih === d.key && { backgroundColor: C.sorot, borderRadius: 8 },
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

export function PanelGrafik({ transaksi, bulanAwal }) {
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
              <Text style={{ color: C.oren, fontWeight: '700' }}>{rupiah(sel.keluar)}</Text>
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
            style={[s.rincianRow, pilih === d.key && { backgroundColor: C.sorot }]}
          >
            <Text style={[s.trxSub, { flex: 1, marginTop: 0 }, pilih === d.key && { color: C.teks, fontWeight: '700' }]}>
              {mode === 'harian' ? `${d.label} ${BULAN_PENDEK[Number(bulan.slice(5, 7)) - 1]}` : d.nama}
            </Text>
            <Text style={{ color: C.teal, fontSize: 13, fontWeight: '600', minWidth: 96, textAlign: 'right' }}>
              +{rupiah(d.masuk)}
            </Text>
            <Text style={{ color: C.oren, fontSize: 13, fontWeight: '600', minWidth: 96, textAlign: 'right' }}>
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
