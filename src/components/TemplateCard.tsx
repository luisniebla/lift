import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WorkoutTemplate } from '../types';

interface Props {
  template: WorkoutTemplate;
  onPress: () => void;
  onLongPress?: () => void;
  rightAction?: React.ReactNode;
}

export default function TemplateCard({ template, onPress, onLongPress, rightAction }: Props) {
  const exerciseCount = template.exercises.length;
  const totalSets = template.exercises.reduce((sum, e) => sum + e.sets, 0);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.7}>
      <View style={styles.info}>
        <Text style={styles.name}>{template.name}</Text>
        <Text style={styles.meta}>
          {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} · {totalSets} sets
        </Text>
        <Text style={styles.exercises} numberOfLines={2}>
          {template.exercises.map((e) => e.name).join(', ')}
        </Text>
      </View>
      {rightAction && <View style={styles.action}>{rightAction}</View>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: { flex: 1 },
  name: { color: '#fff', fontSize: 18, fontWeight: '600' },
  meta: { color: '#4fc3f7', fontSize: 13, marginTop: 4 },
  exercises: { color: '#aaa', fontSize: 13, marginTop: 4 },
  action: { marginLeft: 12 },
});
