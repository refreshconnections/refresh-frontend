type CalendarEventInput = {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string | null;
  notes?: string | null;
};

type AddToCalendarResult = 'success' | 'denied' | 'unavailable';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getCalendarPlugin = () => (window as any).plugins?.calendar as any | undefined;

const addToCalendar = (event: CalendarEventInput): Promise<AddToCalendarResult> =>
  new Promise((resolve) => {
    const cal = getCalendarPlugin();
    if (!cal) {
      resolve('unavailable');
      return;
    }
    cal.createEvent(
      event.title,
      event.location ?? '',
      event.notes ?? '',
      event.startDate,
      event.endDate,
      () => resolve('success'),
      () => resolve('denied'),
    );
  });

export const useAddToCalendar = () => ({
  addToCalendar,
  isAvailable: typeof getCalendarPlugin() !== 'undefined',
});
