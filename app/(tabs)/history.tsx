import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getHistory } from '../../src/storage';
import { Workout } from '../../src/types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<Workout[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setHistory);
    }, [])
  );

  const renderWorkout = ({ item }: { item: Workout }) => {
    const totalSets = item.exercises.reduce((s, e) => s + e.sets.length, 0);
    const completedSets = item.exercises.reduce((s, e) => s + e.sets.filter((s) => s.completed).length, 0);
    const isExpanded = expanded === item.id;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpanded(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.name}>{item.templateName}</Text>
            <Text style={styles.meta}>
              {formatDate(item.startedAt)} · {formatTime(item.startedAt)} · {formatDuration(item.startedAt, item.completedAt)}
            </Text>
          </View>
          <Text style={styles.setsCount}>{completedSets}/{totalSets}</Text>
        </View>

        {isExpanded && (
          <View style={styles.detail}>
            {item.exercises.map((ex, i) => (
              <View key={i} style={styles.exerciseRow}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                {ex.sets.map((set, j) => (
                  <Text key={j} style={styles.setDetail}>
                    {set.completed ? '✓' : '○'} {set.weight} lbs × {set.reps}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No workout history</Text>
            <Text style={styles.emptySubtext}>Completed workouts will appear here</Text>
          </View>
        }
        renderItem={renderWorkout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: { color: '#fff', fontSize: 17, fontWeight: '600' },
  meta: { color: '#888', fontSize: 13, marginTop: 4 },
  setsCount: { color: '#4fc3f7', fontSize: 16, fontWeight: '700' },
  detail: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4a', paddingTop: 12 },
  exerciseRow: { marginBottom: 10 },
  exerciseName: { color: '#ccc', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  setDetail: { color: '#888', fontSize: 13, marginLeft: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 12 },
  emptySubtext: { color: '#888', fontSize: 14, marginTop: 8 },
});
