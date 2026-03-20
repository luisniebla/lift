import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { WorkoutTemplate, WorkoutExercise, WorkoutSet, Workout, genId } from '../types';
import { saveWorkout, getRestTimerSeconds } from '../storage';

interface WorkoutState {
  active: boolean;
  startedAt: string | null;
  templateId: string;
  templateName: string;
  exercises: WorkoutExercise[];
  restTimer: { active: boolean; remaining: number; endTime: number | null };
  restTimerDuration: number;
}

type Action =
  | { type: 'START'; template: WorkoutTemplate; restDuration: number }
  | { type: 'TOGGLE_SET'; exerciseIdx: number; setIdx: number }
  | { type: 'UPDATE_SET'; exerciseIdx: number; setIdx: number; field: 'weight' | 'reps'; value: number }
  | { type: 'REST_TICK'; now: number }
  | { type: 'DISMISS_REST' }
  | { type: 'RESET' };

const initialState: WorkoutState = {
  active: false,
  startedAt: null,
  templateId: '',
  templateName: '',
  exercises: [],
  restTimer: { active: false, remaining: 0, endTime: null },
  restTimerDuration: 90,
};

function reducer(state: WorkoutState, action: Action): WorkoutState {
  switch (action.type) {
    case 'START': {
      const exercises: WorkoutExercise[] = action.template.exercises.map((e) => ({
        name: e.name,
        sets: Array.from({ length: e.sets }, () => ({
          reps: e.reps,
          weight: e.weight,
          completed: false,
        })),
      }));
      return {
        ...state,
        active: true,
        startedAt: new Date().toISOString(),
        templateId: action.template.id,
        templateName: action.template.name,
        exercises,
        restTimerDuration: action.restDuration,
      };
    }
    case 'TOGGLE_SET': {
      const exercises = state.exercises.map((ex, ei) => {
        if (ei !== action.exerciseIdx) return ex;
        const sets = ex.sets.map((s, si) => {
          if (si !== action.setIdx) return s;
          return { ...s, completed: !s.completed };
        });
        return { ...ex, sets };
      });
      const wasCompleted = state.exercises[action.exerciseIdx].sets[action.setIdx].completed;
      const restTimer = !wasCompleted
        ? { active: true, remaining: state.restTimerDuration, endTime: Date.now() + state.restTimerDuration * 1000 }
        : state.restTimer;
      return { ...state, exercises, restTimer };
    }
    case 'UPDATE_SET': {
      const exercises = state.exercises.map((ex, ei) => {
        if (ei !== action.exerciseIdx) return ex;
        const sets = ex.sets.map((s, si) => {
          if (si !== action.setIdx) return s;
          return { ...s, [action.field]: action.value };
        });
        return { ...ex, sets };
      });
      return { ...state, exercises };
    }
    case 'REST_TICK': {
      if (!state.restTimer.active || !state.restTimer.endTime) return state;
      const remaining = Math.max(0, Math.round((state.restTimer.endTime - action.now) / 1000));
      if (remaining <= 0) {
        return { ...state, restTimer: { active: false, remaining: 0, endTime: null } };
      }
      return { ...state, restTimer: { ...state.restTimer, remaining } };
    }
    case 'DISMISS_REST':
      return { ...state, restTimer: { active: false, remaining: 0, endTime: null } };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface WorkoutContextValue {
  state: WorkoutState;
  startWorkout: (template: WorkoutTemplate) => Promise<void>;
  toggleSet: (exerciseIdx: number, setIdx: number) => void;
  updateSet: (exerciseIdx: number, setIdx: number, field: 'weight' | 'reps', value: number) => void;
  dismissRestTimer: () => void;
  finishWorkout: () => Promise<Workout>;
  cancelWorkout: () => void;
}

const WorkoutCtx = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.restTimer.active) {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'REST_TICK', now: Date.now() });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.restTimer.active, state.restTimer.endTime]);

  const startWorkout = useCallback(async (template: WorkoutTemplate) => {
    const restDuration = await getRestTimerSeconds();
    dispatch({ type: 'START', template, restDuration });
  }, []);

  const toggleSet = useCallback((exerciseIdx: number, setIdx: number) => {
    dispatch({ type: 'TOGGLE_SET', exerciseIdx, setIdx });
  }, []);

  const updateSet = useCallback((exerciseIdx: number, setIdx: number, field: 'weight' | 'reps', value: number) => {
    dispatch({ type: 'UPDATE_SET', exerciseIdx, setIdx, field, value });
  }, []);

  const dismissRestTimer = useCallback(() => {
    dispatch({ type: 'DISMISS_REST' });
  }, []);

  const finishWorkout = useCallback(async (): Promise<Workout> => {
    const workout: Workout = {
      id: genId(),
      templateId: state.templateId,
      templateName: state.templateName,
      startedAt: state.startedAt!,
      completedAt: new Date().toISOString(),
      exercises: state.exercises,
    };
    await saveWorkout(workout);
    dispatch({ type: 'RESET' });
    return workout;
  }, [state]);

  const cancelWorkout = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <WorkoutCtx.Provider value={{ state, startWorkout, toggleSet, updateSet, dismissRestTimer, finishWorkout, cancelWorkout }}>
      {children}
    </WorkoutCtx.Provider>
  );
}

export function useWorkout() {
  const ctx = useContext(WorkoutCtx);
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider');
  return ctx;
}
