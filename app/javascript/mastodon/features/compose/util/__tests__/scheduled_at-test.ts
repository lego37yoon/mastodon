import {
  getDefaultScheduledDate,
  getMinimumScheduledDate,
  isScheduledAtValid,
  toLocalDateTimeValue,
} from '../scheduled_at';

describe('scheduled_at utilities', () => {
  const now = new Date('2026-01-01T12:00:00.000Z');

  it('requires a time strictly more than five minutes away', () => {
    expect(isScheduledAtValid(new Date('2026-01-01T12:05:00.000Z'), now)).toBe(
      false,
    );
    expect(isScheduledAtValid(new Date('2026-01-01T12:05:00.001Z'), now)).toBe(
      true,
    );
  });

  it('rounds the input minimum to the next safe minute', () => {
    expect(getMinimumScheduledDate(now).toISOString()).toBe(
      '2026-01-01T12:06:00.000Z',
    );
    expect(
      getMinimumScheduledDate(
        new Date('2026-01-01T12:00:45.000Z'),
      ).toISOString(),
    ).toBe('2026-01-01T12:06:00.000Z');
  });

  it('uses a rounded ten-minute default', () => {
    expect(getDefaultScheduledDate(now).toISOString()).toBe(
      '2026-01-01T12:10:00.000Z',
    );
  });

  it('converts a date to a datetime-local input value', () => {
    const date = new Date('2026-01-01T12:15:00.000Z');
    const expected = new Date(
      date.getTime() - date.getTimezoneOffset() * 60_000,
    )
      .toISOString()
      .slice(0, 16);

    expect(toLocalDateTimeValue(date)).toBe(expected);
  });
});
