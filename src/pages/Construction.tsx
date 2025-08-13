import { IonContent, RefresherEventDetail, IonHeader, IonCard, IonCardContent, IonPage, IonTitle, IonToolbar, IonCardTitle, IonCardSubtitle, IonButton, IonText, IonFab, IonFabButton, IonIcon, IonRow, IonModal, IonButtons, IonItem, IonLabel, IonList, IonCheckbox, IonInput, IonRefresher, IonRefresherContent, IonFabList, useIonAlert, useIonModal, IonNote, IonCol, IonChip, IonAccordionGroup, IonAccordion, IonAlert, IonActionSheet, IonAvatar } from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react'

import { refresh } from 'ionicons/icons';

import './Construction.css';



const Construction: React.FC = () => {

  return (
    <IonPage>
      <IonContent className="construction">
        <IonFab slot="fixed" vertical="bottom" horizontal="start">
            <IonFabButton href="/community" color="light" size="small">
                <IonIcon icon={refresh}></IonIcon>
            </IonFabButton>
          </IonFab>
        <IonCard>
          <img src="../static/img/Construction-freshy-clear.png"/>
        </IonCard>
      </IonContent>
    </IonPage>
  );

};



export default Construction;
