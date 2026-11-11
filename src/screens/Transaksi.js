import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { judulGrup, labelBulan, rupiah, total } from '../helper';
import { C, s } from '../tema';
import { BarisTransaksi } from '../components/BarisTransaksi';
import { Header, IkonPanah, Judul, Kosong, Pil } from '../components/Dasar';

export function Transaksi({
  transaksi, rekMap, bulan, filter, setFilter, filterRek, batas, setBatas,
  cari, setCari, bukaHalaman, hapusTransaksi, setModalBulan, setModalFilter,
}) {
  // Jika kolom cari terisi, pencarian berlaku di SEMUA bulan.
  const kata = cari.trim().toLowerCase();
  const mencari = kata.length > 0;
  const cocokCari = (t) =>
    !mencari ||
    (t.keterangan || '').toLowerCase().includes(kata) ||
    (t.kategori || '').toLowerCase().includes(kata);

  const cocokRek = (t) => !filterRek || t.rekening_id === filterRek || t.tujuan_id === filterRek;
  const trxPilih = transaksi.filter(
    (t) => (mencari || t.tanggal.startsWith(bulan)) && cocokRek(t) && cocokCari(t)
  );
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

  return (
    <>
      <Header
        judul="Transaksi"
        sub="Setiap rupiah, tercatat rapi."
        onPlus={() => bukaHalaman('keluar')}
      />

      <View style={s.cari}>
        <Ionicons name="search-outline" size={20} color={C.abu} />
        <TextInput
          style={s.cariInput}
          placeholder="Cari keterangan atau kategori"
          placeholderTextColor={C.abu}
          value={cari}
          onChangeText={setCari}
          returnKeyType="search"
        />
        {cari ? (
          <TouchableOpacity onPress={() => setCari('')} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color={C.abu} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={s.bulanRow}>
        {mencari ? (
          <View style={s.bulanBtn}>
            <Ionicons name="search-outline" size={20} color={C.teks} />
            <Text style={s.bulanBtnTeks}>Semua bulan</Text>
          </View>
        ) : (
          <TouchableOpacity style={s.bulanBtn} onPress={() => setModalBulan(true)}>
            <Ionicons name="calendar-outline" size={22} color={C.teks} />
            <Text style={s.bulanBtnTeks}>{labelBulan(bulan)}</Text>
            <Ionicons name="chevron-down" size={18} color={C.teks} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={s.filterBtn} onPress={() => setModalFilter(true)} hitSlop={8}>
          <Ionicons name="options-outline" size={24} color={C.teks} />
          {filterRek ? <View style={s.titikFilter} /> : null}
        </TouchableOpacity>
      </View>

      <View style={s.ringkasRow}>
        <View style={[s.ringkas, { backgroundColor: C.mint }]}>
          <View style={s.ringkasLabelRow}>
            <IkonPanah masuk size={14} color={C.ok} />
            <Text style={[s.ringkasLabel, { color: C.ok }]}>Pemasukan</Text>
          </View>
          <Text style={s.ringkasAngka} numberOfLines={1} adjustsFontSizeToFit>
            {rupiah(masukPilih)}
          </Text>
        </View>
        <View style={[s.ringkas, { backgroundColor: C.bahaya }]}>
          <View style={s.ringkasLabelRow}>
            <IkonPanah masuk={false} size={14} color={C.oren} />
            <Text style={[s.ringkasLabel, { color: C.oren }]}>Pengeluaran</Text>
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
          <Kosong
            teks={
              mencari
                ? `Tidak ada transaksi yang cocok dengan "${cari.trim()}".`
                : `Tidak ada transaksi di ${labelBulan(bulan)}.`
            }
          />
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
              {mencari ? `${daftarTrx.length} transaksi ditemukan. ` : ''}Tekan lama sebuah transaksi untuk menghapusnya.
            </Text>
          )}
        </>
      )}
    </>
  );
}
