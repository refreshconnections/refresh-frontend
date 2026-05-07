import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';
import { Capacitor } from '@capacitor/core';

type CalendarEventInput = {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string | null;
  notes?: string | null;
  alerts?: number[];
};

type AddToCalendarResult = 'success' | 'denied' | 'unavailable';

const addToCalendar = async (event: CalendarEventInput): Promise<AddToCalendarResult> => {
  if (!Capacitor.isNativePlatform()) return 'unavailable';

  try {
    const permissionFn = Capacitor.getPlatform() === 'android'
      ? CapacitorCalendar.requestFullCalendarAccess
      : CapacitorCalendar.requestWriteOnlyCalendarAccess;
    const { result } = await permissionFn();
    if (result !== 'granted') return 'denied';

    await CapacitorCalendar.createEvent({
      title: event.title,
      startDate: event.startDate.getTime(),
      endDate: event.endDate.getTime(),
      location: event.location ?? undefined,
      description: `${event.notes ? event.notes + "\n\n" : ""}Saved from the Refresh Connections community calendar. www.refreshconnections.com`,
      alerts: event.alerts,
    });

    return 'success';
  } catch {
    return 'unavailable';
  }
};

export const useAddToCalendar = () => ({
  addToCalendar,
  isAvailable: Capacitor.isNativePlatform(),
});
