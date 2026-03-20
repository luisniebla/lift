import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutSet } from '../types';

interface Props {
  setIndex: number;
  set: WorkoutSet;
  onToggle: () => void;
  onUpdate: (field: 'weight' | 'reps', value: number) => void;
}

export default function SetRow({ setIndex, set, onToggle, onUpdate }: Props) {
  return (
    <View style={[styles.row, set.completed && styles.completedRow]}>
      <Text style={styles.setNum}>{setIndex + 1}</Text>
      <View style={styles.field}>
        <TextInput
          style={[styles.input, set.completed && styles.completedInput]}
          value={String(set.weight)}
          onChangeText={(t) => onUpdate('weight', parseFloat(t) || 0)}
          keyboardType="numeric"
          editable={!set.completed}
        />
        <Text style={styles.unit}>lbs</Text>
      </View>
      <View style={styles.field}>
        <TextInput
          style={[styles.input, set.completed && styles.completedInput]}
          value={String(set.reps)}
          onChangeText={(t) => onUpdate('reps', parseInt(t) || 0)}
          keyboardType="numeric"
          editable={!set.completed}
        />
        <Text style={styles.unit}>reps</Text>
      </View>
      <TouchableOpacity onPress={onToggle} style={styles.check}>
        <Ionicons
          name={set.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={28}
          color={set.completed ? '#66bb6a' : '#555'}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a3e',
  },
  completedRow: { opacity: 0.6 },
  setNum: { color: '#888', fontSize: 14, width: 24, textAlign: 'center' },
  field: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  input: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#1a1a3e',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 50,
  },
  completedInput: { color: '#888' },
  unit: { color: '#666', fontSize: 12, marginLeft: 4 },
  check: { width: 40, alignItems: 'center' },
});
