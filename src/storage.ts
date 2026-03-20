import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutTemplate, Workout } from './types';

const TEMPLATES_KEY = '@lift/templates';
const HISTORY_KEY = '@lift/history';
const REST_TIMER_KEY = '@lift/restTimer';

export async function getTemplates(): Promise<WorkoutTemplate[]> {
  const raw = await AsyncStorage.getItem(TEMPLATES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveTemplates(templates: WorkoutTemplate[]): Promise<void> {
  await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export async function getHistory(): Promise<Workout[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveWorkout(workout: Workout): Promise<void> {
  const history = await getHistory();
  history.unshift(workout);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export async function getRestTimerSeconds(): Promise<number> {
  const raw = await AsyncStorage.getItem(REST_TIMER_KEY);
  return raw ? JSON.parse(raw) : 90;
}

export async function saveRestTimerSeconds(seconds: number): Promise<void> {
  await AsyncStorage.setItem(REST_TIMER_KEY, JSON.stringify(seconds));
}
