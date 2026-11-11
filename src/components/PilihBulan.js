import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BULAN_PENDEK, dua, NAMA_BULAN } from '../helper';
import { C, s } from '../tema';
import { Sheet } from './Dasar';

export function PilihBulan({ visible, onClose, bulan, onPilih }) {
  const [tahun, setTahun] = useState(Number(bulan.slice(0, 4)));

  useEffect(() => {
    if (visible) setTahun(Number(bulan.slice(0, 4)));
  }, [visible]);

  return (
    <Sheet visible={visible} onClose={onClose} judul="Pilih bulan">
      <View style={[s.rowBetween, s.bulanBar]}>
        <TouchableOpacity onPress={() => setTahun(tahun - 1)} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={C.teal} />
        </TouchableOpacity>
        <Text style={s.bulanTeks}>{tahun}</Text>
        <TouchableOpacity onPress={() => setTahun(tahun + 1)} hitSlop={10}>
          <Ionicons name="chevron-forward" size={22} color={C.teal} />
        </TouchableOpacity>
      </View>
      <View style={s.chipRow}>
        {NAMA_BULAN.map((n, i) => {
          const v = `${tahun}-${dua(i + 1)}`;
          const aktif = v === bulan;
          return (
            <TouchableOpacity
              key={v}
              onPress={() => {
                onPilih(v);
                onClose();
              }}
              style={[s.bulanChip, aktif && { backgroundColor: C.hijau, borderColor: C.hijau }]}
            >
              <Text style={[s.chipTeks, aktif && { color: '#fff' }]}>{BULAN_PENDEK[i]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Sheet>
  );
}
