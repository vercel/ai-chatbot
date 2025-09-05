import { describe, it, expect } from 'vitest';
import { taskReducer, type TaskAction } from '../taskReducer';
import type { ToolStep } from '../types';

describe('taskReducer', () => {
  it('adds and updates steps', () => {
    const initial: ToolStep[] = [];
    const add: TaskAction = { type: 'add', step: { id: '1', label: 'a', status: 'pending' } };
    const state1 = taskReducer(initial, add);
    expect(state1).toHaveLength(1);
    const update: TaskAction = { type: 'update', id: '1', status: 'done', log: 'ok' };
    const state2 = taskReducer(state1, update);
    expect(state2[0].status).toBe('done');
    expect(state2[0].logs).toEqual(['ok']);
  });
});
