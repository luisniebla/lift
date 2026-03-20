import { useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTemplates } from '../../src/storage';
import { WorkoutTemplate } from '../../src/types';
import { useWorkout } from '../../src/context/WorkoutContext';
import TemplateCard from '../../src/components/TemplateCard';

export default function WorkoutScreen() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const router = useRouter();
  const { state } = useWorkout();

  useFocusEffect(
    useCallback(() => {
      getTemplates().then(setTemplates);
    }, [])
  );

  if (state.active) {
    return (
      <View style={styles.container}>
        <View style={styles.resumeContainer}>
          <Text style={styles.resumeTitle}>Workout in Progress</Text>
          <Text style={styles.resumeName}>{state.templateName}</Text>
          <TouchableOpacity
            style={styles.resumeBtn}
            onPress={() => router.push(`/workout/${state.templateId}`)}
          >
            <Ionicons name="play" size={20} color="#0f0f23" />
            <Text style={styles.resumeBtnText}>Resume Workout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Start Workout</Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No templates yet</Text>
            <Text style={styles.emptySubtext}>Create a template in the Templates tab to get started</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TemplateCard
            template={item}
            onPress={() => router.push(`/workout/${item.id}`)}
            rightAction={
              <View style={styles.startIcon}>
                <Ionicons name="play" size={18} color="#fff" />
              </View>
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  list: { padding: 16 },
  sectionTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 12 },
  emptySubtext: { color: '#888', fontSize: 14, marginTop: 8, textAlign: 'center' },
  startIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4fc3f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  resumeTitle: { color: '#4fc3f7', fontSize: 16, fontWeight: '600' },
  resumeName: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 8, marginBottom: 24 },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4fc3f7',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    gap: 8,
  },
  resumeBtnText: { color: '#0f0f23', fontSize: 16, fontWeight: '700' },
});
