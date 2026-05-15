import React, { useState } from 'react';
import { IonButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import EventFiltersSection from './EventFiltersSection';
import { EventFilters } from '../hooks/api/events';

type Props = {
  onDismiss: (filters?: EventFilters) => void;
  getInitialFilters: () => EventFilters;
};

const EventFiltersModal: React.FC<Props> = ({ onDismiss, getInitialFilters }) => {
  const [filters, setFilters] = useState<EventFilters>(() => getInitialFilters());

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="modal-title">
          <IonTitle>Event preferences</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => onDismiss(filters)}>Done</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <EventFiltersSection filters={filters} onChange={setFilters} />
      </IonContent>
    </IonPage>
  );
};

export default EventFiltersModal;
