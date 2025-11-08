import {
  IonButton,
  IonButtons,
  IonCard, IonCardContent, IonCardTitle, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonNote, IonPage, IonRow, IonSelect, IonSelectOption, IonText, IonTitle, IonToolbar, useIonAlert,
} from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react'

import { getCurrentUserProfile, onImgError, updateCurrentUserProfile, uploadPhoto } from '../hooks/utilities';


import './CantAccessCard.css';
import './OnboardingCard.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/pro-solid-svg-icons/faHeart';

type Props = {
  onDismiss: () => void;
};


const EditRomanceGenderModal: React.FC<Props> = (props) => {

  const [romanceGender, setRomanceGender] = useState<string | null>(null);
  const { onDismiss } = props;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);


  const updateRomanceGender = async (e: any) => {
    if (romanceGender !== null) {
      const response = await updateCurrentUserProfile({ romance_gender: romanceGender })
    }
    onDismiss()
  }



  const greaterThanThirtyDays = (changed) => {
    if (changed == null) return true
    const nowDate = new Date()
    const lastChangedDate = new Date(changed)
    const milliseconds = Math.abs(nowDate.getTime() - lastChangedDate.getTime());
    const days = milliseconds / 86400000

    console.log("days", days)

    if (days >= 60) { return true }
    else { return false }


  }



  useEffect(() => {

    console.log("HEYmadeitinhere")

    setLoading(true); // set loading to true

    const fetchData = async () => {
      setError(null);
      setLoading(true);
      try {
        setData(await getCurrentUserProfile());

        setLoading(false);
      } catch (error: any) {
        setError(error.message);
        setLoading(false)
        console.log("error", error)
      }

    }

    fetchData();
  }, []);


  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="modal-title">
          <IonTitle>Update your preference</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>Cancel</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="create-post">
        <IonCard className="onboarding-slide">
          <IonCardContent>
            <IonCardTitle>Who should we show to you when you filter by romance?</IonCardTitle>
            <IonText>We don't show your gender preference on your profile and only use it when others filter their Picks by Romance <FontAwesomeIcon icon={faHeart} />.</IonText>
            <IonText>You can share more in "More gender and sexuality info" part of the profile. </IonText>
            <p> You can only update the gender(s) you are attracted to every 60 days.</p>
            <IonItem>
              <IonItem>
                <IonSelect placeholder="Romance Gender" onIonChange={e => setRomanceGender(e.detail.value!)} disabled={!(data?.romance_gender_last_updated == null || greaterThanThirtyDays(data?.romance_gender_last_updated))}>
                  <IonSelectOption value="men">men</IonSelectOption>
                  <IonSelectOption value="women">women</IonSelectOption>
                  <IonSelectOption value="any">any</IonSelectOption>
                </IonSelect>
              </IonItem>
            </IonItem>
            {!(data?.romance_gender_last_updated == null || greaterThanThirtyDays(data?.romance_gender_last_updated)) ?
            <IonText>You cannot update the gender(s) you are attracted to on your profile at this time.</IonText> :
            <>
              <IonButton disabled={romanceGender == null} onClick={updateRomanceGender}>Update your gender preference.</IonButton>

            </>
          }
          </IonCardContent>

        </IonCard>
      </IonContent>
    </IonPage>

  )
};
export default EditRomanceGenderModal;