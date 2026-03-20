import { View, Text, StyleSheet } from 'react-native';
import { WorkoutExercise } from '../types';
import SetRow from './SetRow';

interface Props {
  exercise: WorkoutExercise;
  exerciseIndex: number;
  onToggleSet: (setIdx: number) => void;
  onUpdateSet: (setIdx: number, field: 'weight' | 'reps', value: number) => void;
}

export default function ExerciseCard({ exercise, exerciseIndex, onToggleSet, onUpdateSet }: Props) {
  const completedSets = exercise.sets.filter((s) => s.completed).length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.progress}>
          {completedSets}/{exercise.sets.length}
        </Text>
      </View>
      <View style={styles.colHeaders}>
        <Text style={[styles.colHeader, { width: 24 }]}>Set</Text>
        <Text style={[styles.colHeader, { flex: 1 }]}>Weight</Text>
        <Text style={[styles.colHeader, { flex: 1 }]}>Reps</Text>
        <Text style={[styles.colHeader, { width: 40 }]} />
      </View>
      {exercise.sets.map((set, idx) => (
        <SetRow
          key={idx}
          setIndex={idx}
          set={set}
          onToggle={() => onToggleSet(idx)}
          onUpdate={(field, value) => onUpdateSet(idx, field, value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: { color: '#fff', fontSize: 17, fontWeight: '600' },
  progress: { color: '#4fc3f7', fontSize: 14, fontWeight: '600' },
  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  colHeader: { color: '#666', fontSize: 12, textAlign: 'center' },
});
