import { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTemplates, saveTemplates } from '../../src/storage';
import { WorkoutTemplate, genId } from '../../src/types';
import { BUILT_IN_ROUTINES, Routine } from '../../src/routines';
import TemplateCard from '../../src/components/TemplateCard';

export default function TemplatesScreen() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      getTemplates().then(setTemplates);
    }, [])
  );

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Template', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = templates.filter((t) => t.id !== id);
          await saveTemplates(updated);
          setTemplates(updated);
        },
      },
    ]);
  };

  const handleAddRoutine = (routine: Routine) => {
    Alert.alert(
      `Add ${routine.name}`,
      `This will add ${routine.days.length} templates to your list:\n\n${routine.days.map((d) => d.name).join('\n')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add All',
          onPress: async () => {
            const current = await getTemplates();
            const newTemplates: WorkoutTemplate[] = routine.days.map((day) => ({
              id: genId(),
              name: day.name,
              exercises: day.exercises.map((e) => ({
                id: genId(),
                ...e,
              })),
            }));
            const updated = [...current, ...newTemplates];
            await saveTemplates(updated);
            setTemplates(updated);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Routines</Text>
        <Text style={styles.sectionSubtext}>Pre-built programs — tap to add all days as templates</Text>
        {BUILT_IN_ROUTINES.map((routine) => (
          <TouchableOpacity
            key={routine.id}
            style={styles.routineCard}
            onPress={() => handleAddRoutine(routine)}
            activeOpacity={0.7}
          >
            <View style={styles.routineInfo}>
              <Text style={styles.routineName}>{routine.name}</Text>
              <Text style={styles.routineDesc}>{routine.description}</Text>
              <Text style={styles.routineMeta}>{routine.days.length} days</Text>
            </View>
            <View style={styles.addIcon}>
              <Ionicons name="add-circle" size={28} color="#4fc3f7" />
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.divider} />

        <View style={styles.myTemplatesHeader}>
          <Text style={styles.sectionTitle}>My Templates</Text>
          <TouchableOpacity onPress={() => router.push('/template/new')}>
            <Ionicons name="add-circle" size={28} color="#4fc3f7" />
          </TouchableOpacity>
        </View>

        {templates.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No templates yet</Text>
            <Text style={styles.emptySubtext}>Add a routine above or create your own</Text>
          </View>
        ) : (
          templates.map((item) => (
            <TemplateCard
              key={item.id}
              template={item}
              onPress={() => router.push(`/template/new?id=${item.id}`)}
              onLongPress={() => handleDelete(item.id, item.name)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  sectionSubtext: { color: '#888', fontSize: 13, marginTop: 4, marginBottom: 12 },
  routineCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  routineInfo: { flex: 1 },
  routineName: { color: '#fff', fontSize: 18, fontWeight: '600' },
  routineDesc: { color: '#aaa', fontSize: 13, marginTop: 4 },
  routineMeta: { color: '#4fc3f7', fontSize: 13, marginTop: 6, fontWeight: '600' },
  addIcon: { marginLeft: 12 },
  divider: { height: 1, backgroundColor: '#2a2a4a', marginVertical: 20 },
  myTemplatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#888', fontSize: 14, marginTop: 8 },
});
