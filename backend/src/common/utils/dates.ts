export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const addMonths = (date: Date, months: number): Date => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

export const isFuture = (date: Date | null | undefined): boolean =>
  !!date && date.getTime() > Date.now();

export const iso = (date: Date | null | undefined): string | null =>
  date ? date.toISOString() : null;
