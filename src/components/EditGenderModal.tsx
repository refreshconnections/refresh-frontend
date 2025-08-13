import {
  IonButton,
  IonButtons,
  IonCard, IonCardContent, IonCardTitle, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonNote, IonPage, IonRow, IonSelect, IonSelectOption, IonText, IonTitle, IonToolbar, useIonAlert,
} from '@ionic/react';
import React, { useEffect, useState } from 'react'

import { updateCurrentUserProfile } from '../hooks/utilities';


import './CantAccessCard.css';
import './OnboardingCard.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';

type Props = {
  onDismiss: () => void;
};


const EditGenderModal: React.FC<Props> = (props) => {

  const [gender, setGender] = useState<string | null>(null);
  const { onDismiss } = props;

  // const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);

  // tanstack query
  const currentUserProfile = useGetCurrentProfile().data;


  const updateGender = async (e: any) => {
    if (gender !== null) {
      const response = await updateCurrentUserProfile({ gender: gender })
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
        // setData(await getCurrentUserProfile());

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
        <IonToolbar class="modal-title">
          <IonTitle>Update your gender</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>Cancel</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent class="create-post">
        <IonCard className="onboarding-slide">
          <IonCardContent>
            <IonCardTitle>Want to update the gender on your profile?</IonCardTitle>
            <IonText>We don't show your gender on your profile and only use it when others filter their Picks by gender.</IonText>
            <IonText>You can share more in the "More gender and sexuality info" part of the profile. </IonText>
            <p> You can only update your gender identity every 60 days.</p>
            <IonItem counter={true}>
              <IonItem>
                <IonSelect placeholder="Gender Identity" onIonChange={e => setGender(e.detail.value!)}
                  disabled={!(currentUserProfile?.gender_last_updated == null || greaterThanThirtyDays(currentUserProfile?.gender_last_updated))}>
                  <IonSelectOption value="man">man</IonSelectOption>
                  <IonSelectOption value="woman">woman</IonSelectOption>
                  <IonSelectOption value="nonbinary">nonbinary</IonSelectOption>
                </IonSelect>
              </IonItem>
            </IonItem>
            {!(currentUserProfile?.gender_last_updated == null || greaterThanThirtyDays(currentUserProfile?.gender_last_updated)) ?
              <IonText>You cannot update the gender identity attached to your profile at this time.</IonText> :
              <>
                <IonButton disabled={gender == null} onClick={updateGender}>Update your gender identity.</IonButton>

              </>
            }
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>

  )
};
export default EditGenderModal;