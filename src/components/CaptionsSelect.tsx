import { IonContent, IonHeader, IonCard, IonCardContent, IonPage, IonTitle, IonToolbar, IonCardTitle, IonCardSubtitle, IonButton, IonText, IonFab, IonFabButton, IonIcon, IonModal, IonSelect, IonSelectOption, IonLabel, IonItem, IonInput, IonTextarea, useIonAlert } from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react'
import { updateCurrentUserProfile } from '../hooks/utilities';

import "./CaptionsSelect.css"
import { useQueryClient } from '@tanstack/react-query';



interface ContainerProps {
    picture: string;
    current_caption: string;
    onboarding?: boolean
}

interface CaptionInt {
    [key: string]: string;
 }
 

const CaptionsSelect: React.FC<ContainerProps> = ({ picture, current_caption, onboarding }) => {
    const queryClient = useQueryClient()

    const [presentCaptionAlert] = useIonAlert();

    const [customCaption, setCustomCaption] = useState<string | null>(null)


    const addCustomCaptionAlert = async () => {
        presentCaptionAlert({
            header: 'Add your own caption for this picture',
            buttons: [
                {
                    text: 'Nevermind',
                    role: 'cancel',

                },
                {
                    text: 'Yes!',
                    role: 'confirm',
                    handler: async (data: any) => {
                        setCustomCaption(data.description)
                        await updateCaption(data.description)
                    },
                },
            ],
            inputs: [
                {
                  name: 'description',
                  type: 'text',
                  placeholder: 'Add custom caption',
                  value: '',
                  attributes: {
                    maxlength: 30
                  }
                },
                
              ],
        })
    }


    const updateCaption = async ( caption: string ) => {
        let caption_update: CaptionInt = {}
        caption_update[picture] = caption

        await updateCurrentUserProfile(caption_update)
        queryClient.invalidateQueries({queryKey: ['current']})
    }

    return (
        <div className={onboarding? "photo-caps-onboarding" : "photo-caps"}>
        {onboarding?
        <></> :
        <IonLabel>Caption:</IonLabel>
        }
        <IonSelect onIonChange={(e) =>  e.detail.value == "custom" ? addCustomCaptionAlert() : updateCaption(e.detail.value)} placeholder={current_caption? current_caption : "(Select a caption)"}>
          <IonSelectOption value="Me in my best mask">Me in my best mask</IonSelectOption>
          <IonSelectOption value="Salting the vibes">Salting the vibes</IonSelectOption>
          <IonSelectOption value="A favorite from the-before-times">A favorite from the-before-times</IonSelectOption>
          <IonSelectOption value="The fam">The fam</IonSelectOption>
          <IonSelectOption value="A selfie">A selfie</IonSelectOption>
          <IonSelectOption value="My bestie">My bestie</IonSelectOption>
          <IonSelectOption value="The fam">The fam</IonSelectOption>
          <IonSelectOption value="Me at work">Me at work</IonSelectOption>
          <IonSelectOption value="My happy place">My happy place</IonSelectOption>
          <IonSelectOption value="A random picture I love">A random picture I love</IonSelectOption>
          <IonSelectOption value="I just liked this outfit">I just liked this outfit</IonSelectOption>
          <IonSelectOption value="Could use a buddy for this!">Could use a buddy for this!</IonSelectOption>
          <IonSelectOption value="It's not home without...">It's not home without...</IonSelectOption>
          <IonSelectOption value="Living life">Living life</IonSelectOption>
          <IonSelectOption value="Cheesin">Cheesin'</IonSelectOption>
          <IonSelectOption value="Recognize this place?">Recognize this place?</IonSelectOption>
          <IonSelectOption value="">(No caption)</IonSelectOption>
          {!onboarding &&
          <IonSelectOption value={'custom'}>{customCaption ? customCaption : '(Write your own)'} </IonSelectOption>}
        </IonSelect>

        </div>
    );

};



export default CaptionsSelect;
