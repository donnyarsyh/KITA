import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { angkaDariTeks, hariIni, rupiah, tambahHari } from '../helper';
import { C, s } from '../tema';
import { Dropdown, KartuNominal, PilihTanggal } from '../components/Input';
import { BarisRingkas, Catatan, LayarForm, Ringkasan } from '../components/LayarForm';

export function FormHutangHal({ rekening, saldoRek, onSimpan, onBatal }) {
  const [peran, setPeran] = useState('beri');
  const [nama, setNama] = useState('');
  const [nominal, setNominal] = useState('');
  const [rekId, setRekId] = useState(rekening[0]?.id ?? null);
  const [tanggal, setTanggal] = useState(hariIni());
  const [tempo, setTempo] = useState(tambahHari(hariIni(), 30));
  const [catatan, setCatatan] = useState('');

  const beri = peran === 'beri';
  const jumlah = angkaDariTeks(nominal);
  const rek = rekening.find((r) => r.id === rekId);
  const saldoNow = rek ? saldoRek(rek) : 0;
  const kurang = beri && jumlah > 0 && jumlah > saldoNow;
  const opsiRek = rekening.map((r) => ({ key: r.id, label: `${r.nama} • ${rupiah(saldoRek(r))}` }));

  const ubahTanggal = (t) => {
    setTanggal(t);
    if (tempo < t) setTempo(tambahHari(t, 30));
  };

  const simpan = () => {
    if (!nama.trim()) return Alert.alert(beri ? 'Nama penerima hutang belum diisi' : 'Nama pemberi hutang belum diisi');
    if (!jumlah) return Alert.alert('Nominal belum diisi');
    if (!rek) return Alert.alert('Pilih rekening terkait');
    if (tempo < tanggal) return Alert.alert('Jatuh tempo tidak boleh sebelum tanggal pinjaman');
    if (beri && jumlah > saldoNow) {
      return Alert.alert(
        'Saldo rekening tidak cukup',
        `Saldo ${rek.nama} hanya ${rupiah(saldoNow)}, tidak cukup untuk meminjamkan ${rupiah(jumlah)}. Pilih rekening lain atau kurangi nominal.`
      );
    }
    onSimpan({
      peran,
      nama: nama.trim(),
      nominal: jumlah,
      rekId: rek.id,
      tanggal,
      tempo,
      catatan: catatan.trim() || null,
    });
  };

  return (
    <LayarForm
      judul="Tambah hutang"
      sub="Catat pinjaman sesuai peran kamu."
      onBatal={onBatal}
      tombol="Simpan hutang"
      onTombol={simpan}
    >
      <Text style={s.label}>Peran kamu</Text>
      <View style={s.radioRow}>
        <TouchableOpacity style={[s.radio, beri && s.radioAktif]} onPress={() => setPeran('beri')}>
          <Ionicons
            name={beri ? 'checkmark-circle-outline' : 'ellipse-outline'}
            size={22}
            color={beri ? C.teal : C.abu}
          />
          <Text style={[s.fieldTeks, { fontSize: 14 }, beri && { color: C.teal, fontWeight: '700' }]}>
            Pemberi hutang
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.radio, !beri && s.radioAktif]} onPress={() => setPeran('terima')}>
          <Ionicons
            name={!beri ? 'checkmark-circle-outline' : 'ellipse-outline'}
            size={22}
            color={!beri ? C.teal : C.abu}
          />
          <Text style={[s.fieldTeks, { fontSize: 14 }, !beri && { color: C.teal, fontWeight: '700' }]}>
            Penerima hutang
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={[s.petunjuk, { color: C.teal }]}>
        {beri
          ? 'Saya meminjamkan uang. Orang lain berhutang kepada saya.'
          : 'Saya meminjam uang. Saya berhutang kepada orang lain.'}
      </Text>

      <Text style={s.label}>{beri ? 'Nama penerima hutang' : 'Nama pemberi hutang'}</Text>
      <TextInput
        style={s.input}
        placeholder="mis. Dimas Pratama"
        placeholderTextColor={C.abu}
        value={nama}
        onChangeText={setNama}
      />

      <KartuNominal
        label={beri ? 'Nominal yang dipinjamkan' : 'Nominal yang dipinjam'}
        nilai={nominal}
        onChange={setNominal}
      />

      <Dropdown
        label={beri ? 'Dana diambil dari rekening' : 'Dana masuk ke rekening'}
        nilai={rekId}
        opsi={opsiRek}
        onPilih={setRekId}
      />

      <PilihTanggal label="Tanggal pinjaman" nilai={tanggal} onPilih={ubahTanggal} />
      <PilihTanggal label="Jatuh tempo" nilai={tempo} onPilih={setTempo} />

      <Text style={s.label}>Catatan (opsional)</Text>
      <TextInput
        style={[s.input, { minHeight: 90, textAlignVertical: 'top' }]}
        placeholder="mis. Pinjaman keperluan pribadi"
        placeholderTextColor={C.abu}
        multiline
        value={catatan}
        onChangeText={setCatatan}
      />

      <Ringkasan judul="SALDO SETELAH DISIMPAN">
        <BarisRingkas
          label={rek ? rek.nama : '-'}
          nilai={rupiah(beri ? saldoNow - jumlah : saldoNow + jumlah)}
          teal={!beri}
          tebal
          merah={kurang}
        />
      </Ringkasan>

      {kurang ? (
        <Catatan
          merah
          ikon="warning-outline"
          teks={`Nominal melebihi saldo ${rek.nama} (${rupiah(saldoNow)}). Hutang tidak bisa disimpan.`}
        />
      ) : (
        <Catatan
          ikon="information-circle-outline"
          teks={
            beri
              ? 'Saldo rekening langsung berkurang dan tercatat sebagai pengeluaran. Nominal ini dicatat sebagai piutang saya.'
              : 'Saldo rekening langsung bertambah dan tercatat sebagai pemasukan. Nominal ini dicatat sebagai hutang saya.'
          }
        />
      )}
    </LayarForm>
  );
}
