import React from 'react';
import {
  IonAccordion,
  IonAccordionGroup,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonText,
} from '@ionic/react';

import './HousingPostGuidance.css';

const HousingPostGuidance: React.FC = () => (
  <IonCard className="housing-post-guidance">
    <IonCardContent>
      <IonText color="dark">
        <strong>Housing post expectations</strong>
        <p>
          Provide enough information for people to determine whether they may be a good fit. For everyone's safety, share more specific details privately through Connect from Refreshments after connecting.
        </p>
      </IonText>
      <IonAccordionGroup>
        <IonAccordion value="housing-details">
          <IonItem slot="header" lines="none">
            <IonLabel>What to include and leave out</IonLabel>
          </IonItem>
          <div slot="content" className="housing-post-guidance-details">
            <IonText color="dark">
              <strong>Include:</strong>
            </IonText>
            <ul>
              <li>General location (neighborhood or area)</li>
              <li>Approximate budget or rent range</li>
              <li>Timeline or expected lease length</li>
              <li>General COVID precautions</li>
              <li>Relevant household expectations and values, needs, pets, or dealbreakers</li>
            </ul>
            <IonText color="dark">
              <strong>Don't include:</strong>
            </IonText>
            <ul>
              <li>Exact address, cross streets, apartment numbers, or other identifying location details</li>
              <li>Exact rent amounts</li>
              <li>Detailed schedules or routines, like specific workdays, class schedules, or travel plans</li>
              <li>Sensitive personal information about yourself or others</li>
              <li>Derogatory labels or exclusionary language describing who is not welcome. Please describe who you hope to live with instead.</li>
            </ul>
            <IonText color="medium">
              <p>
                Please note: Due to our guidelines around getting to know people before meeting up, Refresh is intended for longer-term housing connections and does not support temporary or short-term housing posts or requests to crash.
              </p>
            </IonText>
          </div>
        </IonAccordion>
      </IonAccordionGroup>
    </IonCardContent>
  </IonCard>
);

export default HousingPostGuidance;
