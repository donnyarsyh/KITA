import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  dua,
  formatInput,
  geserBulan,
  HARI_PENDEK,
  hariIni,
  labelBulan,
  labelPanjang,
} from '../helper';
import { C, s } from '../tema';

export function Dropdown({ label, nilai, opsi, onPilih, placeholder = 'Pilih' }) {
  const [buka, setBuka] = useState(false);
  const dipilih = opsi.find((o) => o.key === nilai);
  return (
    <View>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TouchableOpacity style={s.field} activeOpacity={0.7} onPress={() => setBuka(!buka)}>
        <Text style={[s.fieldTeks, !dipilih && { color: C.abu }]} numberOfLines={1}>
          {dipilih ? dipilih.label : placeholder}
        </Text>
        <Ionicons name={buka ? 'chevron-up' : 'chevron-down'} size={20} color={C.abu} />
      </TouchableOpacity>
      {buka ? (
        <View style={s.dropList}>
          {opsi.map((o, i) => (
            <TouchableOpacity
              key={String(o.key)}
              style={[s.dropItem, i > 0 && { borderTopWidth: 1, borderTopColor: C.garis }]}
              onPress={() => {
                onPilih(o.key);
                setBuka(false);
              }}
            >
              <Text
                style={[s.fieldTeks, { flex: 1 }, o.key === nilai && { color: C.teal, fontWeight: '700' }]}
                numberOfLines={1}
              >
                {o.label}
              </Text>
              {o.key === nilai ? <Ionicons name="checkmark" size={20} color={C.teal} /> : null}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function PilihTanggal({ label, nilai, onPilih }) {
  const [buka, setBuka] = useState(false);
  const [bln, setBln] = useState(nilai.slice(0, 7));
  const [y, m] = bln.split('-').map(Number);

  const awal = new Date(y, m - 1, 1).getDay();
  const jumlah = new Date(y, m, 0).getDate();
  const sel = [];
  for (let i = 0; i < awal; i++) sel.push(null);
  for (let d = 1; d <= jumlah; d++) sel.push(d);
  while (sel.length % 7 !== 0) sel.push(null);

  return (
    <View>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TouchableOpacity
        style={s.field}
        activeOpacity={0.7}
        onPress={() => {
          if (!buka) setBln(nilai.slice(0, 7));
          setBuka(!buka);
        }}
      >
        <Text style={s.fieldTeks}>{labelPanjang(nilai)}</Text>
        <Ionicons name="calendar-outline" size={22} color={C.abu} />
      </TouchableOpacity>

      {buka ? (
        <View style={s.kalender}>
          <View style={s.rowBetween}>
            <TouchableOpacity onPress={() => setBln(geserBulan(bln, -1))} hitSlop={10}>
              <Ionicons name="chevron-back" size={22} color={C.teal} />
            </TouchableOpacity>
            <Text style={s.bulanTeks}>{labelBulan(bln)}</Text>
            <TouchableOpacity onPress={() => setBln(geserBulan(bln, 1))} hitSlop={10}>
              <Ionicons name="chevron-forward" size={22} color={C.teal} />
            </TouchableOpacity>
          </View>
          <View style={s.kalRow}>
            {HARI_PENDEK.map((h) => (
              <Text key={h} style={s.kalHari}>{h}</Text>
            ))}
          </View>
          <View style={s.kalRow}>
            {sel.map((d, i) => {
              if (!d) return <View key={i} style={s.kalSel} />;
              const iso = `${y}-${dua(m)}-${dua(d)}`;
              const aktif = iso === nilai;
              const hari = iso === hariIni();
              return (
                <TouchableOpacity
                  key={i}
                  style={s.kalSel}
                  onPress={() => {
                    onPilih(iso);
                    setBuka(false);
                  }}
                >
                  <View style={[s.kalBulat, aktif && { backgroundColor: C.hijau }]}>
                    <Text
                      style={[
                        s.kalAngka,
                        hari && { color: C.teal, fontWeight: '700' },
                        aktif && { color: '#fff', fontWeight: '700' },
                      ]}
                    >
                      {d}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function KartuNominal({ label, nilai, onChange }) {
  return (
    <View style={s.kartuNom}>
      <Text style={s.kartuNomLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
        <Text style={s.kartuNomTeks}>Rp</Text>
        <TextInput
          style={[s.kartuNomTeks, { flex: 1, paddingVertical: 0 }]}
          value={nilai}
          onChangeText={(t) => onChange(formatInput(t))}
          placeholder="0"
          placeholderTextColor="#8fb9ad"
          keyboardType="numeric"
        />
      </View>
    </View>
  );
}
