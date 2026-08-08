export const MINIMUM_SCHEDULE_DELAY = 5 * 60 * 1000;

const MINUTE = 60 * 1000;

export const toLocalDateTimeValue = (date: Date) => {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * MINUTE,
  );

  return localDate.toISOString().slice(0, 16);
};

export const getMinimumScheduledDate = (now = new Date()) =>
  new Date(
    Math.floor((now.getTime() + MINIMUM_SCHEDULE_DELAY) / MINUTE) * MINUTE +
      MINUTE,
  );

export const getDefaultScheduledDate = (now = new Date()) =>
  new Date(Math.ceil((now.getTime() + 10 * MINUTE) / MINUTE) * MINUTE);

export const isScheduledAtValid = (value: string | Date, now = new Date()) => {
  const timestamp =
    value instanceof Date ? value.getTime() : new Date(value).getTime();

  return (
    Number.isFinite(timestamp) &&
    timestamp > now.getTime() + MINIMUM_SCHEDULE_DELAY
  );
};
