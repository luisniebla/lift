import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTemplates, saveTemplates } from '../../src/storage';
import { WorkoutTemplate, ExerciseTemplate, genId } from '../../src/types';

function newExercise(): ExerciseTemplate {
  return { id: genId(), name: '', sets: 3, reps: 10, weight: 0 };
}

export default function NewTemplateScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<ExerciseTemplate[]>([newExercise()]);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (id) {
      getTemplates().then((templates) => {
        const found = templates.find((t) => t.id === id);
        if (found) {
          setName(found.name);
          setExercises(found.exercises);
          setIsEdit(true);
        }
      });
    }
  }, [id]);

  const updateExercise = (idx: number, field: keyof ExerciseTemplate, value: string | number) => {
    setExercises((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e))
    );
  };

  const removeExercise = (idx: number) => {
    if (exercises.length === 1) return;
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }
    const validExercises = exercises.filter((e) => e.name.trim());
    if (validExercises.length === 0) {
      Alert.alert('Error', 'Add at least one exercise with a name');
      return;
    }

    const templates = await getTemplates();
    if (isEdit && id) {
      const idx = templates.findIndex((t) => t.id === id);
      if (idx >= 0) {
        templates[idx] = { ...templates[idx], name: name.trim(), exercises: validExercises };
      }
    } else {
      const template: WorkoutTemplate = {
        id: genId(),
        name: name.trim(),
        exercises: validExercises,
      };
      templates.push(template);
    }
    await saveTemplates(templates);
    router.back();
  };

  const Stepper = ({ value, onValue, min = 0 }: { value: number; onValue: (v: number) => void; min?: number }) => (
    <View style={styles.stepper}>
      <TouchableOpacity onPress={() => onValue(Math.max(min, value - 1))} style={styles.stepBtn}>
        <Text style={styles.stepBtnText}>-</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.stepValue}
        value={String(value)}
        onChangeText={(t) => onValue(Math.max(min, parseInt(t) || 0))}
        keyboardType="numeric"
      />
      <TouchableOpacity onPress={() => onValue(value + 1)} style={styles.stepBtn}>
        <Text style={styles.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Template Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Push Day"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, { marginTop: 24 }]}>Exercises</Text>
        {exercises.map((ex, idx) => (
          <View key={ex.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <TextInput
                style={styles.exerciseName}
                placeholder="Exercise name"
                placeholderTextColor="#666"
                value={ex.name}
                onChangeText={(t) => updateExercise(idx, 'name', t)}
              />
              {exercises.length > 1 && (
                <TouchableOpacity onPress={() => removeExercise(idx)}>
                  <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.exerciseRow}>
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>Sets</Text>
                <Stepper value={ex.sets} onValue={(v) => updateExercise(idx, 'sets', v)} min={1} />
              </View>
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>Reps</Text>
                <Stepper value={ex.reps} onValue={(v) => updateExercise(idx, 'reps', v)} min={1} />
              </View>
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>Weight</Text>
                <Stepper value={ex.weight} onValue={(v) => updateExercise(idx, 'weight', v)} />
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={() => setExercises((prev) => [...prev, newExercise()])}>
          <Ionicons name="add-circle-outline" size={20} color="#4fc3f7" />
          <Text style={styles.addBtnText}>Add Exercise</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{isEdit ? 'Update Template' : 'Save Template'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  scroll: { padding: 16, paddingBottom: 40 },
  label: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 16,
  },
  exerciseCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
    paddingBottom: 6,
    marginRight: 8,
  },
  exerciseRow: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldCol: { alignItems: 'center', flex: 1 },
  fieldLabel: { color: '#888', fontSize: 12, marginBottom: 6 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2a2a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { color: '#4fc3f7', fontSize: 18, fontWeight: '700' },
  stepValue: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    minWidth: 36,
    marginHorizontal: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    marginTop: 4,
  },
  addBtnText: { color: '#4fc3f7', fontSize: 15, fontWeight: '600', marginLeft: 6 },
  saveBtn: {
    backgroundColor: '#4fc3f7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: { color: '#0f0f23', fontSize: 16, fontWeight: '700' },
});
