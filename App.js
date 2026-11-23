import { useState } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ambilMeta, simpanMeta } from './src/db';
import { terapkanTema } from './src/tema';
import Aplikasi from './src/Aplikasi';

// App.js sengaja dibuat pendek: hanya memilih tema lalu menampilkan <Aplikasi />.
export default function App() {
  const sistem = useColorScheme(); // 'light' | 'dark' (dari pengaturan HP)
  const [pilihanTema, setPilihanTema] = useState(() => ambilMeta('tema') || 'sistem');
  const [versi, setVersi] = useState(0); // naik 1 setiap kali data dipulihkan, untuk memuat ulang seluruh aplikasi

  const mode = pilihanTema === 'sistem' ? (sistem === 'dark' ? 'gelap' : 'terang') : pilihanTema;
  terapkanTema(mode); // aman dipanggil berulang: hanya bekerja bila mode berubah

  const gantiTema = (pilihan) => {
    simpanMeta('tema', pilihan);
    setPilihanTema(pilihan);
  };

  // Setelah data dipulihkan dari cadangan: baca ulang tema dan muat ulang aplikasi dari awal
  const sesudahPulih = () => {
    setPilihanTema(ambilMeta('tema') || 'sistem');
    setVersi((v) => v + 1);
  };

  return (
    <SafeAreaProvider>
      <Aplikasi key={versi} pilihanTema={pilihanTema} onTema={gantiTema} onPulih={sesudahPulih} />
    </SafeAreaProvider>
  );
}