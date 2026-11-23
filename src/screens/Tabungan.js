import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gayaIkon, hariIni, rupiah, selisihHari, tglPendek, total } from '../helper';
import { C, s } from '../tema';
import { Bar, Header, Judul, Kosong } from '../components/Dasar';

export function Tabungan({
  tabungan, saldoTabungan, totalTabungan, totalTarget: saldoTarget, rekTabungan, saldoRekening,
  onTarget, onTabung, onTambahRek, onPindah, onHapusRek,
}) {
  const totalTarget = total(tabungan, (tb) => tb.target);
  const persenTotal = totalTarget > 0 ? Math.round((saldoTarget / totalTarget) * 100) : 0;

  return (
    <>
      <Header judul="Tabungan" sub="Sisihkan sedikit, wujudkan yang besar." onPlus={() => onTarget(null)} />

      <View style={s.heroAng}>
        <Text style={s.heroLabel}>Total tabungan</Text>
        <Text style={s.heroAngBesar} numberOfLines={1} adjustsFontSizeToFit>
          {rupiah(totalTabungan)}
        </Text>
        {totalTarget > 0 ? (
          <>
            <View style={s.rowBetween}>
              <Text style={s.heroLabel}>Target terkumpul {rupiah(saldoTarget)} dari {rupiah(totalTarget)}</Text>
              <Text style={s.heroPersen}>{persenTotal}%</Text>
            </View>
            <View style={{ marginVertical: 12 }}>
              <Bar persen={persenTotal} warna="#9fd8c8" latar="rgba(255,255,255,0.22)" />
            </View>
          </>
        ) : null}
        <Text style={s.heroLabel}>
          Rekening tabungan {rupiah(totalTabungan - saldoTarget)} • Uang di sini sudah keluar dari Total saldo.
        </Text>
      </View>

      <View style={[s.aksiRow, { marginTop: 16 }]}>
        <TouchableOpacity style={s.aksiKartu} onPress={() => onTabung('tabung')}>
          <View style={s.aksiIkon}>
            <Ionicons name="arrow-down" size={22} color={C.teal} />
          </View>
          <Text style={s.aksiTeks}>Tabung</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.aksiKartu} onPress={() => onTabung('tarik')}>
          <View style={s.aksiIkon}>
            <Ionicons name="arrow-up" size={22} color={C.teal} />
          </View>
          <Text style={s.aksiTeks}>Tarik ke rekening</Text>
        </TouchableOpacity>
      </View>

      <Judul teks="Rekening tabungan" aksi={`${rekTabungan.length} rekening`} />
      {rekTabungan.length === 0 ? (
        <Kosong teks="Belum ada rekening khusus tabungan, mis. Celengan BCA atau Tabungan Emas." />
      ) : (
        rekTabungan.map((r) => (
          <View key={r.id} style={s.angKartu}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[s.angIkon, { backgroundColor: C.mint }]}>
                <Ionicons name="business-outline" size={22} color={C.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.trxJudul} numberOfLines={1}>{r.nama}</Text>
                <Text style={s.trxSub}>Rekening tabungan</Text>
              </View>
              <Text style={s.angTerpakai}>{rupiah(saldoRekening(r))}</Text>
            </View>
            <View style={[s.rowBetween, { marginTop: 12 }]}>
              <TouchableOpacity onPress={onPindah} hitSlop={8}>
                <Text style={s.linkTeal}>Pindah saldo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onHapusRek(r)} hitSlop={8}>
                <Text style={{ color: C.merah, fontWeight: '700' }}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
      <TouchableOpacity style={s.salinBtn} activeOpacity={0.7} onPress={onTambahRek}>
        <Ionicons name="add-circle-outline" size={18} color={C.teal} />
        <Text style={s.chipLinkTeks}>Tambah rekening tabungan</Text>
      </TouchableOpacity>

      <Judul teks="Target tabungan" aksi={`${tabungan.length} target`} />

      {tabungan.length === 0 ? (
        <Kosong teks={'Belum ada target. Ketuk + di kanan atas untuk membuat, mis. "Tabungan nikah".'} />
      ) : (
        tabungan.map((tb) => {
          const saldo = saldoTabungan(tb);
          const persen = tb.target > 0 ? Math.round((saldo / tb.target) * 100) : 0;
          const kurang = tb.target - saldo;
          const tercapai = kurang <= 0;
          const g = gayaIkon('#fff3d6', '#b45309');
          const sisaHari = tb.tenggat ? selisihHari(hariIni(), tb.tenggat) : null;
          return (
            <TouchableOpacity key={tb.id} activeOpacity={0.8} style={s.angKartu} onPress={() => onTarget(tb.id)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[s.angIkon, { backgroundColor: g.bg }]}>
                  <Ionicons name={tb.ikon || 'flag-outline'} size={22} color={g.fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.trxJudul} numberOfLines={1}>{tb.nama}</Text>
                  <Text style={s.trxSub} numberOfLines={1}>
                    {tercapai ? 'Target tercapai' : `${persen}% terkumpul`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={C.abu} />
              </View>

              {tb.tenggat ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <Ionicons name="calendar-outline" size={14} color={C.abu} />
                  <Text style={s.trxSub}>
                    Tenggat {tglPendek(tb.tenggat)}
                    {sisaHari !== null && !tercapai
                      ? sisaHari >= 0
                        ? ` • ${sisaHari} hari lagi`
                        : ' • lewat tenggat'
                      : ''}
                  </Text>
                </View>
              ) : null}

              <View style={[s.rowBetween, { marginTop: 12 }]}>
                <Text style={s.angTerpakai}>{rupiah(saldo)}</Text>
                <Text style={s.trxSub}>/ {rupiah(tb.target)}</Text>
              </View>
              <View style={{ marginTop: 8, marginBottom: 10 }}>
                <Bar persen={persen} warna={tercapai ? '#16a34a' : C.teal} />
              </View>

              <View style={s.rowBetween}>
                <Text style={{ color: C.teal, fontWeight: '700', fontSize: 14 }}>
                  {tercapai ? 'Tercapai 🎉' : `Kurang ${rupiah(kurang)}`}
                </Text>
                <View style={{ flexDirection: 'row', gap: 18 }}>
                  <TouchableOpacity onPress={() => onTabung('tarik', tb.id)} hitSlop={8}>
                    <Text style={s.linkTeal}>Tarik</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onTabung('tabung', tb.id)} hitSlop={8}>
                    <Text style={s.linkTeal}>+ Tabung</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {tabungan.length > 0 ? (
        <Text style={s.petunjuk}>Ketuk kartu untuk mengubah target. Setoran dan penarikan tercatat di menu Transaksi.</Text>
      ) : null}
    </>
  );
}
