import React from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';
import { EventFilters } from '../hooks/api/events';

const EVENT_TYPE_OPTIONS = [
  { value: 'all', label: 'Any' },
  { value: 'virtual_only', label: 'Virtual only' },
  { value: 'in_person_only', label: 'In person only' },
  { value: 'in_person_with_virtual_option', label: 'In person with virtual option' },
];

const ATTENDEE_PRECAUTION_OPTIONS = [
  { value: 'all', label: 'Any' },
  { value: 'precautions_only', label: 'Covid conscientious only' },
  { value: 'precautions_preferred', label: 'Covid conscientious preferred' },
  { value: 'open', label: 'Open to everyone' },
];

const IN_PERSON_PRECAUTION_OPTIONS = [
  { value: 'all', label: 'Any' },
  { value: 'masks_encouraged', label: 'Masks encouraged' },
  { value: 'masks_required', label: 'Masks required' },
  { value: 'tests_required', label: 'Tests required' },
  { value: 'outdoors', label: 'Outdoors' },
  { value: 'partially_outdoors', label: 'Partially outdoors' },
  { value: 'air_purifiers', label: 'Air purifiers' },
];

const syncPopover = (values: string[]) => {
  requestAnimationFrame(() => {
    const popover = document.querySelector('ion-select-popover');
    if (popover) {
      const opts = (popover as any).options;
      if (opts) {
        (popover as any).options = opts.map((opt: any) => ({
          ...opt,
          checked: values.includes(opt.value),
        }));
      }
    }
  });
};

const applyAllToggle = (next: string[], prev: string[], allSpecific: string[]): string[] => {
  const added = next.find(v => !prev.includes(v));
  if (added === 'all') return ['all'];
  if (added) {
    const filtered = next.filter(v => v !== 'all');
    if (allSpecific.every(v => filtered.includes(v))) return ['all'];
    return filtered;
  }
  if (next.length === 0) return ['all'];
  return next;
};

type Props = {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
};

const EventFiltersSection: React.FC<Props> = ({ filters, onChange }) => {
  const handleEventTypeChange = (event: CustomEvent) => {
    const specific = EVENT_TYPE_OPTIONS.filter(o => o.value !== 'all').map(o => o.value);
    const next = applyAllToggle(event.detail.value ?? [], filters.eventTypes, specific);
    onChange({ ...filters, eventTypes: next });
    syncPopover(next);
  };

  const handleAttendeeChange = (event: CustomEvent) => {
    const specific = ATTENDEE_PRECAUTION_OPTIONS.filter(o => o.value !== 'all').map(o => o.value);
    const next = applyAllToggle(event.detail.value ?? [], filters.attendeePrecautionPreferences, specific);
    onChange({ ...filters, attendeePrecautionPreferences: next });
    syncPopover(next);
  };

  const handlePrecautionsChange = (event: CustomEvent) => {
    const specific = IN_PERSON_PRECAUTION_OPTIONS.filter(o => o.value !== 'all').map(o => o.value);
    const next = applyAllToggle(event.detail.value ?? [], filters.inPersonPrecautions, specific);
    onChange({ ...filters, inPersonPrecautions: next });
    syncPopover(next);
  };

  return (
    <>
      <IonItem>
        <IonLabel position="stacked">Event type</IonLabel>
        <IonSelect
          value={filters.eventTypes}
          multiple
          interface="popover"
          onIonChange={handleEventTypeChange}
        >
          {EVENT_TYPE_OPTIONS.map(opt => (
            <IonSelectOption key={opt.value} value={opt.value}>{opt.label}</IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>
      <IonItem>
        <IonLabel position="stacked">Attendee preference</IonLabel>
        <IonSelect
          value={filters.attendeePrecautionPreferences}
          multiple
          interface="popover"
          onIonChange={handleAttendeeChange}
        >
          {ATTENDEE_PRECAUTION_OPTIONS.map(opt => (
            <IonSelectOption key={opt.value} value={opt.value}>{opt.label}</IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>
      <IonItem>
        <IonLabel position="stacked">In-person precautions</IonLabel>
        <IonSelect
          value={filters.inPersonPrecautions}
          multiple
          interface="popover"
          onIonChange={handlePrecautionsChange}
        >
          {IN_PERSON_PRECAUTION_OPTIONS.map(opt => (
            <IonSelectOption key={opt.value} value={opt.value}>{opt.label}</IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>
    </>
  );
};

export default EventFiltersSection;
