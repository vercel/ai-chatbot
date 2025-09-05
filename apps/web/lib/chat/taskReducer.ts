import type { ToolStep } from './types';

export type TaskAction =
  | { type: 'add'; step: ToolStep }
  | { type: 'update'; id: string; status: ToolStep['status']; log?: string };

export function taskReducer(state: ToolStep[], action: TaskAction): ToolStep[] {
  switch (action.type) {
    case 'add':
      return [...state, action.step];
    case 'update':
      return state.map((s) =>
        s.id === action.id
          ? {
              ...s,
              status: action.status,
              logs: action.log ? [...(s.logs || []), action.log] : s.logs,
            }
          : s,
      );
    default:
      return state;
  }
}
