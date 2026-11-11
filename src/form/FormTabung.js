import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { angkaDariTeks, hariIni, jamSekarang, rupiah } from '../helper';
import { C, s } from '../tema';
import { Dropdown, KartuNominal, PilihTanggal } from '../components/Input';
import { BarisRingkas, Catatan, LayarForm, Ringkasan } from '../components/LayarForm';

export function FormTabung({
  modeAwal, targetAwal, rekening, tabungan, saldoRek, saldoTab, totalSaldo, onSimpan, onBatal,
}) {
  const [mode, setMode] = useState(modeAwal); // 'tabung' = rekening -> tabungan, 'tarik' = tabungan -> rekening
  const [tbId, setTbId] = useState(targetAwal);
  const [rekId, setRekId] = useState(rekening[0]?.id ?? null);
  const [nominal, setNominal] = useState('');
  const [tanggal, setTanggal] = useState(hariIni());

  const menabung = mode === 'tabung';
  const jumlah = angkaDariTeks(nominal);
  const tb = tabungan.find((x) => x.id === tbId);
  const rek = rekening.find((x) => x.id === rekId);
  const saldoT = tb ? saldoTab(tb) : 0;
  const saldoR = rek ? saldoRek(rek) : 0;

  const opsiTb = tabungan.map((x) => ({ key: x.id, label: `${x.nama} • ${rupiah(saldoTab(x))}` }));
  const opsiRek = rekening.map((x) => ({ key: x.id, label: `${x.nama} • ${rupiah(saldoRek(x))}` }));

  const kurang = jumlah > 0 && (menabung ? jumlah > saldoR : jumlah > saldoT);

  const simpan = () => {
    if (!tb) return Alert.alert('Pilih target tabungan');
    if (!rek) return Alert.alert('Pilih rekening');
    if (!jumlah) return Alert.alert('Nominal belum diisi');
    if (menabung) {
      if (jumlah > totalSaldo) {
        return Alert.alert(
          'Saldo tidak cukup',
          `Nominal ${rupiah(jumlah)} melebihi total saldo semua rekening (${rupiah(totalSaldo)}).`
        );
      }
      if (jumlah > saldoR) {
        return Alert.alert(
          'Saldo rekening tidak cukup',
          `Saldo ${rek.nama} hanya ${rupiah(saldoR)}, tidak cukup untuk menabung ${rupiah(jumlah)}.`
        );
      }
    } else if (jumlah > saldoT) {
      return Alert.alert(
        'Saldo tabungan tidak cukup',
        `Saldo "${tb.nama}" hanya ${rupiah(saldoT)}, tidak cukup untuk menarik ${rupiah(jumlah)}.`
      );
    }
    onSimpan({
      tipe: mode,
      keterangan: menabung ? `Tabung ke ${tb.nama}` : `Tarik dari ${tb.nama}`,
      kategori: 'Tabungan',
      nominal: jumlah,
      tanggal,
      waktu: jamSekarang(),
      rekId: rek.id,
      tabunganId: tb.id,
      angId: null,
      catatan: null,
    });
  };

  return (
    <LayarForm
      judul={menabung ? 'Tabung' : 'Tarik tabungan'}
      sub={menabung ? 'Pindahkan saldo rekening ke tabungan.' : 'Kembalikan saldo tabungan ke rekening.'}
      onBatal={onBatal}
      tombol={menabung ? 'Simpan tabungan' : 'Simpan penarikan'}
      onTombol={simpan}
    >
      <View style={s.seg}>
        {[
          { k: 'tabung', label: 'Tabung' },
          { k: 'tarik', label: 'Tarik ke rekening' },
        ].map((t) => (
          <TouchableOpacity key={t.k} style={[s.segItem, mode === t.k && s.segAktif]} onPress={() => setMode(t.k)}>
            <Text style={[s.segTeks, mode === t.k && { color: C.teal, fontWeight: '700' }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <KartuNominal label={menabung ? 'Nominal yang ditabung' : 'Nominal yang ditarik'} nilai={nominal} onChange={setNominal} />

      <Dropdown label="Target tabungan" nilai={tbId} opsi={opsiTb} onPilih={setTbId} />
      <Dropdown label={menabung ? 'Dari rekening' : 'Ke rekening'} nilai={rekId} opsi={opsiRek} onPilih={setRekId} />
      <PilihTanggal label="Tanggal" nilai={tanggal} onPilih={setTanggal} />

      <Ringkasan judul="SETELAH DISIMPAN">
        <BarisRingkas
          label={rek ? rek.nama : '-'}
          nilai={rupiah(menabung ? saldoR - jumlah : saldoR + jumlah)}
          tebal
          merah={kurang && menabung}
        />
        <BarisRingkas
          label={tb ? tb.nama : '-'}
          nilai={rupiah(menabung ? saldoT + jumlah : saldoT - jumlah)}
          teal
          merah={kurang && !menabung}
        />
      </Ringkasan>

      {kurang ? (
        <Catatan
          merah
          ikon="warning-outline"
          teks={
            menabung
              ? `Nominal melebihi saldo ${rek.nama} (${rupiah(saldoR)}).`
              : `Nominal melebihi saldo tabungan "${tb.nama}" (${rupiah(saldoT)}).`
          }
        />
      ) : (
        <Catatan
          ikon="swap-horizontal"
          teks={
            menabung
              ? 'Saldo rekening berkurang, total saldo di Beranda ikut berkurang, dan saldo tabungan bertambah.'
              : 'Saldo tabungan berkurang dan saldo rekening bertambah, sehingga total saldo di Beranda ikut naik.'
          }
        />
      )}
    </LayarForm>
  );
}
