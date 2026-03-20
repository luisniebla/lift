import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getTemplates } from '../../src/storage';
import { WorkoutTemplate } from '../../src/types';
import { useWorkout } from '../../src/context/WorkoutContext';
import ElapsedTimer from '../../src/components/ElapsedTimer';
import ExerciseCard from '../../src/components/ExerciseCard';
import RestTimerBanner from '../../src/components/RestTimerBanner';

export default function ActiveWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state, startWorkout, toggleSet, updateSet, dismissRestTimer, finishWorkout, cancelWorkout } = useWorkout();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (state.active) {
      setLoading(false);
      return;
    }
    getTemplates().then((templates) => {
      const template = templates.find((t) => t.id === id);
      if (template) {
        startWorkout(template).then(() => setLoading(false));
      }
    });
  }, [id]);

  const handleFinish = () => {
    const totalCompleted = state.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0
    );
    const totalSets = state.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

    if (totalCompleted === 0) {
      Alert.alert('No sets completed', 'Complete at least one set before finishing.');
      return;
    }

    const message = totalCompleted < totalSets
      ? `You completed ${totalCompleted}/${totalSets} sets. Finish anyway?`
      : 'Great workout! Save it?';

    Alert.alert('Finish Workout', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          await finishWorkout();
          router.back();
        },
      },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Workout', 'Your progress will be lost.', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Cancel Workout',
        style: 'destructive',
        onPress: () => {
          cancelWorkout();
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>{state.templateName}</Text>
            {state.startedAt && <ElapsedTimer startedAt={state.startedAt} />}
          </View>
          <TouchableOpacity onPress={handleFinish}>
            <Text style={styles.finishText}>Finish</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {state.exercises.map((exercise, idx) => (
            <ExerciseCard
              key={idx}
              exercise={exercise}
              exerciseIndex={idx}
              onToggleSet={(setIdx) => toggleSet(idx, setIdx)}
              onUpdateSet={(setIdx, field, value) => updateSet(idx, setIdx, field, value)}
            />
          ))}
        </ScrollView>

        {state.restTimer.active && (
          <RestTimerBanner remaining={state.restTimer.remaining} onDismiss={dismissRestTimer} />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  headerCenter: { alignItems: 'center' },
  title: { color: '#fff', fontSize: 17, fontWeight: '600' },
  cancelText: { color: '#ff6b6b', fontSize: 15, fontWeight: '600' },
  finishText: { color: '#66bb6a', fontSize: 15, fontWeight: '600' },
  body: { padding: 16, paddingBottom: 40 },
});
