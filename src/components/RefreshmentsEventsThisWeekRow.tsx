import { IonIcon } from '@ionic/react';
import React from 'react';
import { star, starOutline } from 'ionicons/icons';
import moment from 'moment';

import type { RefreshEvent } from '../hooks/api/events';

import './RefreshmentsEventsThisWeekRow.css';

type RefreshmentsEventsThisWeekRowProps = {
  events: RefreshEvent[];
  onSelectEvent: (event: RefreshEvent) => void;
};

const RefreshmentsEventsThisWeekRow: React.FC<RefreshmentsEventsThisWeekRowProps> = ({
  events,
  onSelectEvent,
}) => (
  <div className="refreshments-events-this-week">
    <div className="refreshments-events-this-week-strip" role="list" aria-label="Events this week">
      {events.map((event) => (
        <button
          type="button"
          key={event.id}
          className="refreshments-events-this-week-card"
          onClick={() => onSelectEvent(event)}
        >
          <div className="refreshments-events-this-week-card-top">
            <span className="refreshments-events-this-week-card-date">
              {moment(event.start_datetime).format('ddd')}
            </span>
            <IonIcon
              icon={event.interested ? star : starOutline}
              color={event.interested ? 'warning' : 'medium'}
              className="refreshments-events-this-week-card-star"
            />
          </div>
          <span className="refreshments-events-this-week-card-title">{event.name}</span>
          <span className="refreshments-events-this-week-card-time">
            {moment(event.start_datetime).format('MMM D • h:mm A')}
          </span>
        </button>
      ))}
    </div>
  </div>
);

export default RefreshmentsEventsThisWeekRow;
