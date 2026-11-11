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

  const mode = pilihanTema === 'sistem' ? (sistem === 'dark' ? 'gelap' : 'terang') : pilihanTema;
  terapkanTema(mode); // aman dipanggil berulang: hanya bekerja bila mode berubah

  const gantiTema = (pilihan) => {
    simpanMeta('tema', pilihan);
    setPilihanTema(pilihan);
  };

  return (
    <SafeAreaProvider>
      <Aplikasi pilihanTema={pilihanTema} onTema={gantiTema} />
    </SafeAreaProvider>
  );
}