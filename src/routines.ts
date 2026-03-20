import { genId } from './types';

export interface RoutineDay {
  name: string;
  exercises: { name: string; sets: number; reps: number; weight: number }[];
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  days: RoutineDay[];
}

export const BUILT_IN_ROUTINES: Routine[] = [
  {
    id: 'classic-4day-split',
    name: '4-Day Split',
    description: 'Classic bodybuilding split: Chest/Tri, Back/Bi, Legs/Lower Back, Shoulders/Core',
    days: [
      {
        name: 'Day 1 - Chest & Triceps',
        exercises: [
          { name: 'Barbell Bench Press', sets: 4, reps: 6, weight: 195 },
          { name: 'Incline Dumbbell Press', sets: 4, reps: 8, weight: 75 },
          { name: 'Dumbbell Flyes', sets: 3, reps: 12, weight: 40 },
          { name: 'Cable Crossovers', sets: 3, reps: 12, weight: 30 },
          { name: 'Close-Grip Bench Press', sets: 4, reps: 8, weight: 155 },
          { name: 'Tricep Rope Pushdowns', sets: 3, reps: 12, weight: 50 },
          { name: 'Overhead Tricep Extension', sets: 3, reps: 10, weight: 55 },
        ],
      },
      {
        name: 'Day 2 - Back & Biceps',
        exercises: [
          { name: 'Barbell Deadlift', sets: 4, reps: 5, weight: 275 },
          { name: 'Weighted Pull-Ups', sets: 4, reps: 8, weight: 25 },
          { name: 'Barbell Bent-Over Row', sets: 4, reps: 8, weight: 185 },
          { name: 'Seated Cable Row', sets: 3, reps: 10, weight: 150 },
          { name: 'Single-Arm Dumbbell Row', sets: 3, reps: 10, weight: 75 },
          { name: 'Barbell Curl', sets: 3, reps: 10, weight: 75 },
          { name: 'Incline Dumbbell Curl', sets: 3, reps: 12, weight: 30 },
        ],
      },
      {
        name: 'Day 3 - Legs & Lower Back',
        exercises: [
          { name: 'Barbell Back Squat', sets: 4, reps: 6, weight: 255 },
          { name: 'Romanian Deadlift', sets: 4, reps: 8, weight: 205 },
          { name: 'Leg Press', sets: 4, reps: 10, weight: 360 },
          { name: 'Walking Lunges', sets: 3, reps: 12, weight: 50 },
          { name: 'Leg Curl Machine', sets: 3, reps: 12, weight: 120 },
          { name: 'Standing Calf Raises', sets: 4, reps: 15, weight: 180 },
          { name: 'Back Extensions', sets: 3, reps: 12, weight: 45 },
        ],
      },
      {
        name: 'Day 4 - Shoulders & Core',
        exercises: [
          { name: 'Overhead Barbell Press', sets: 4, reps: 6, weight: 135 },
          { name: 'Seated Dumbbell Shoulder Press', sets: 4, reps: 8, weight: 60 },
          { name: 'Dumbbell Lateral Raises', sets: 4, reps: 12, weight: 25 },
          { name: 'Face Pulls', sets: 3, reps: 15, weight: 40 },
          { name: 'Barbell Shrugs', sets: 3, reps: 10, weight: 225 },
          { name: 'Hanging Leg Raises', sets: 3, reps: 15, weight: 0 },
          { name: 'Cable Woodchops', sets: 3, reps: 12, weight: 40 },
        ],
      },
    ],
  },
];
