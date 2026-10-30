/**
 * Unit tests for record updates in StorageService (SRD 013 WP4):
 * analysis entries set page state, cell counts and row labels, and never
 * count as quiz questions (ANA-03, ANA-04, ANA-06).
 */

import { describe, it, expect } from 'vitest';
import { StorageService, withAttempts } from '../../../src/services/storage-service.js';
import { buildCacheFromRecord } from '../../../src/services/session-cache.js';
import type { StudentRecord } from '../../../src/types/contracts.js';

const empty = (): StudentRecord => ({
  schema: 3,
  docId: '',
  release: 'R1',
  serviceId: '30012345',
  name: 'Jo',
  attempted: 0,
  correct: 0,
  updated: '',
  pages: {},
});

const service = new StorageService('UnitTestDB');

describe('StorageService record updates', () => {
  it('records the cell count and row label with an analysis entry', () => {
    const record = service.updateRecordWithAnalysis(
      empty(),
      'analysis-tactical',
      't1',
      'k1',
      'High',
      {
        totalCells: 6,
        label: 'Threat Assessment',
      },
    );
    const analysis = record.pages['analysis-tactical']!.analysis!;
    expect(analysis.totalCells).toBe(6);
    expect(analysis.labels).toEqual({ k1: 'Threat Assessment' });
  });

  it('turns the page amber, not red, after the first analysis entry', () => {
    const record = service.updateRecordWithAnalysis(empty(), 'p', 't', 'k1', 'High', {
      totalCells: 2,
    });
    expect(record.pages['p']!.state).toBe('incomplete');
  });

  it('turns the page green once every analysis cell is filled', () => {
    let record = service.updateRecordWithAnalysis(empty(), 'p', 't', 'k1', 'a', { totalCells: 2 });
    record = service.updateRecordWithAnalysis(record, 'p', 't', 'k2', 'b', { totalCells: 2 });
    expect(record.pages['p']!.state).toBe('complete');
  });

  it('stores the question count with a quiz answer', () => {
    const record = service.updateRecordWithAnswer(
      empty(),
      'quiz-mcq',
      0,
      { answer: '1', success: true, timestamp: 't' },
      5,
    );
    expect(record.pages['quiz-mcq']!.totalQuestions).toBe(5);
    expect(record.pages['quiz-mcq']!.state).toBe('incomplete');
  });

  it('never counts analysis cells as quiz questions (ANA-06)', () => {
    const record = service.updateRecordWithAnalysis(empty(), 'p', 't', 'k1', 'text', {
      totalCells: 6,
    });
    const cache = buildCacheFromRecord(record);
    expect(cache.totals).toEqual({ total: 0, answered: 0, correct: 0 });
  });
});

describe('attempt tracking (SRD 013 SCO-01, SCO-07)', () => {
  const ans = (answer: string, success: boolean) => ({ answer, success, timestamp: 't' });

  it('counts committed answers and keeps the first result', () => {
    let a = withAttempts(undefined, ans('2', false), true);
    expect(a).toMatchObject({ attempts: 1, firstSuccess: false });
    a = withAttempts(a, ans('3', true), true);
    expect(a).toMatchObject({ answer: '3', success: true, attempts: 2, firstSuccess: false });
  });

  it('does not count provisional saves while a number is typed', () => {
    let a = withAttempts(undefined, ans('1', false), false);
    a = withAttempts(a, ans('15', false), false);
    a = withAttempts(a, ans('1500', true), false);
    expect(a.attempts).toBe(0);
    expect(a.firstSuccess).toBeUndefined();
    a = withAttempts(a, ans('1500', true), true);
    expect(a).toMatchObject({ attempts: 1, firstSuccess: true });
  });

  it('keeps counts through provisional saves after a commit', () => {
    let a = withAttempts(undefined, ans('1500', true), true);
    a = withAttempts(a, ans('16', false), false);
    expect(a).toMatchObject({ answer: '16', attempts: 1, firstSuccess: true });
  });

  it('leaves answers from before v3 untracked rather than guessing', () => {
    const legacy = ans('2', false);
    const a = withAttempts(legacy, ans('3', true), true);
    expect(a.attempts).toBeUndefined();
    expect(a.firstSuccess).toBeUndefined();
  });

  it('treats a padded placeholder as unanswered', () => {
    const a = withAttempts(ans('', false), ans('1', true), true);
    expect(a).toMatchObject({ attempts: 1, firstSuccess: true });
  });

  it('is applied by updateRecordWithAnswer for commits only', () => {
    let r = service.updateRecordWithAnswer(empty(), 'q', 0, ans('2', false), 1, { commit: true });
    r = service.updateRecordWithAnswer(r, 'q', 0, ans('1', true), 1, { commit: true });
    expect(r.pages['q']!.answers[0]).toMatchObject({ attempts: 2, firstSuccess: false });
    r = service.updateRecordWithAnswer(r, 'q', 0, ans('1', true), 1);
    expect(r.pages['q']!.answers[0]!.attempts).toBe(2);
  });
});
