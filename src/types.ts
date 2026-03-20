export interface ExerciseTemplate {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: ExerciseTemplate[];
}

export interface WorkoutSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface WorkoutExercise {
  name: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  templateId: string;
  templateName: string;
  startedAt: string;
  completedAt: string;
  exercises: WorkoutExercise[];
}

export const genId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);
