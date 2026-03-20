import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  remaining: number;
  onDismiss: () => void;
}

export default function RestTimerBanner({ remaining, onDismiss }: Props) {
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <TouchableOpacity style={styles.banner} onPress={onDismiss} activeOpacity={0.8}>
      <Text style={styles.label}>Rest Timer</Text>
      <Text style={styles.time}>{mins}:{pad(secs)}</Text>
      <Text style={styles.hint}>Tap to dismiss</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1b5e20',
    padding: 16,
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  label: { color: '#a5d6a7', fontSize: 13, fontWeight: '600' },
  time: { color: '#fff', fontSize: 36, fontWeight: '700', fontVariant: ['tabular-nums'], marginVertical: 4 },
  hint: { color: '#a5d6a7', fontSize: 12 },
});
