import { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';

export default function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const hrs = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const display = hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;

  return <Text style={styles.timer}>{display}</Text>;
}

const styles = StyleSheet.create({
  timer: { color: '#4fc3f7', fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
