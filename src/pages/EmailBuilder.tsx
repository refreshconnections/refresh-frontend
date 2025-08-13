import { IonContent, RefresherEventDetail, IonHeader, IonCard, IonCardContent, IonPage, IonTitle, IonToolbar, IonCardTitle, IonCardSubtitle, IonButton, IonText, IonFab, IonFabButton, IonIcon, IonRow, IonModal, IonButtons, IonItem, IonLabel, IonList, IonCheckbox, IonInput, IonRefresher, IonRefresherContent, IonFabList, useIonAlert, useIonModal, IonNote, IonCol, IonGrid, IonSelect, IonSelectOption, IonTextarea, IonReorderGroup, IonReorder, ItemReorderEventDetail } from '@ionic/react';
import ProfileCard from '../components/ProfileCard';
import React, { useEffect, useRef, useState } from 'react'
import { close as closeIcon, filter as filterIcon, flower as flowerIcon, heartHalf as heartHalfIcon, person as personIcon, chatbubble, heartOutline as heartIcon, bugOutline as bugIcon } from 'ionicons/icons';
import { chevronBackOutline } from 'ionicons/icons';

import "./Page.css"
import "./EmailBuilder.css"

import { Link } from 'react-router-dom';
import { useGetPurposes } from '../hooks/api/emailbuilders/purposes';
import { useQueryClient } from '@tanstack/react-query';
import { useGetEmailsByPurposes } from '../hooks/api/emailbuilders/emails-by-purpose';
import { faRotate } from '@fortawesome/pro-solid-svg-icons/faRotate';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';



interface Purpose {
    id: number,
    purpose: string,
    statements: any[]
}

interface EmailBuilder {
    id: number,
    email: string,
    bodies: any[],
    subjects:  any[]
}

interface EmailDraft {
    purpose: Purpose,
    recipient?: EmailBuilder,
    subject?: string,
    body?: string,
    personal?: string,
    statement?: string,
    signoff?: string,
    name?: string
}

const getRandomSubject = (subjects: any[]) =>{
    const index =  Math.floor(Math.random() * subjects?.length) ?? 0;
    return subjects[index]?.text ?? ''
}

const getRandomBody = (bodies: any[]) =>{
    console.log("bodies", bodies)
    const index =  Math.floor(Math.random() * bodies?.length) ?? 0;
    return bodies[index].text ?? ''
}

const getRandomStatement = (statements: any[]) => {
    const index =  Math.floor(Math.random() * statements?.length) ?? 0;
    return statements[index].statement ?? ''
}

const EmailBuilder: React.FC = () => {

    const [items, setItems] = useState([3, 1, 2]);
    const [afterSendWait, setAfterSendWait] = useState(false)
    const [isDisabled, setIsDisabled] = useState(true);
   
    const [emailDraft, setEmailDraft] = useState<EmailDraft>();
    const [getARandomOneAlert] = useIonAlert();

    
    

    // tanstack query
    const purposes = useGetPurposes().data;
    const emails = useGetEmailsByPurposes(emailDraft?.purpose?.id).data
    const queryClient = useQueryClient()

    useEffect(() => {
    
        if (emailDraft?.recipient?.id) {

            setEmailDraft({...emailDraft, statement: getRandomStatement(emailDraft?.purpose?.statements), body: getRandomBody(emailDraft?.recipient?.bodies), subject: getRandomSubject(emailDraft?.recipient?.subjects)})
    
        }
    
    
      }, [emailDraft?.recipient]);
    


    function handleReorder(event: CustomEvent<ItemReorderEventDetail>) {
        // Before complete is called with the items they will remain in the
        // order before the drag
        console.log('Before complete', items);

        // Finish the reorder and position the item in the DOM based on
        // where the gesture ended. Update the items variable to the
        // new order of items
        setItems(event.detail.complete(items));
        // After complete is called the items will be in the new order
        console.log('After complete', items);
    }

    function handleRandomStatement() {
        setEmailDraft({...emailDraft!, statement: getRandomSubject(emailDraft?.recipient?.subjects ?? [])})
    }


    function handleRandomSubject() {
        
        setEmailDraft({...emailDraft!, subject: getRandomSubject(emailDraft?.recipient?.subjects ?? [])})
    }

    function handleRandomBody() {
        console.log("bbb")
        setEmailDraft({...emailDraft!, body: getRandomBody(emailDraft?.recipient?.bodies ?? [])})
        
    }

    const getARandomOne = async (thefunction) => {
        getARandomOneAlert({
          header: 'Try a different one?',
          subHeader: "You'll lose any changes you've made to this section.",
          buttons: [
            {
                text: 'Nevermind',
                role: 'destructive'
            },
            {
              text: 'Ok!',
              handler: () => {
                thefunction()
              }
            },
          ],
        })
      }


    return (
        <IonPage>
            <IonContent className="builder">
                <IonFab className="very-top " slot="fixed" vertical="top" horizontal="start">
                    <IonFabButton routerLink="/action" routerDirection="back" color="light">
                        <IonIcon icon={chevronBackOutline}></IonIcon>
                    </IonFabButton>
                </IonFab>

                <IonRow className="page-title">
                    <img className="color-invertible" src="../static/img/navy-emailbuilder.png" style={{maxHeight: "50pt"}} alt="help" />
                </IonRow>
                <IonCard>
                    
                    <IonItem>
                        <IonLabel position="stacked">Purpose</IonLabel>

                        <IonSelect value={emailDraft?.purpose} placeholder="Send an email to create change" onIonChange={e => setEmailDraft({...emailDraft, purpose: e.detail.value!})}>
                            {purposes?.map((p: Purpose) => (
                                <IonSelectOption key={p.id} value={p}>{p.purpose}</IonSelectOption>
                            ))}
                        </IonSelect>
                    </IonItem>
                    {emailDraft?.purpose ?
                        <>
                            <IonItem>
                                <IonLabel position="stacked">Who are we emailing?</IonLabel>

                                <IonSelect value={emailDraft?.recipient ?? {}} placeholder="Recipient" onIonChange={e => setEmailDraft({...emailDraft!, recipient: e.detail.value!})}>
                                {emails?.map((e: EmailBuilder) => (
                                <IonSelectOption key={e.id} value={e}>{e.email}</IonSelectOption>
                                ))}
                                    
                                </IonSelect>
                            </IonItem>
                            {emailDraft?.recipient?.email  ? 
                            <>
                            <IonItem className="input">
                                <IonLabel position="stacked" className="has-button ">Subject &nbsp;<IonButton size="small" onClick={()=>getARandomOne(handleRandomSubject)}><FontAwesomeIcon icon={faRotate}/></IonButton></IonLabel>
                                <IonTextarea
                                    onIonChange={e => setEmailDraft({...emailDraft!, subject: e.detail.value!})}
                                    value={emailDraft?.subject ?? ''}
                                    autoCorrect='on'
                                    autoGrow>
                                </IonTextarea>
                            </IonItem>
                            <IonList>
                                <IonReorderGroup disabled={false} onIonItemReorder={handleReorder}>
                                    {items.map((item) => (
                                        <>
                                            {item == 1 ?
                                                <IonItem key={item} >
                                                    
                                                            <IonLabel position="stacked" className="has-button">
                                                                Purpose &nbsp;
                                                            <IonButton size="small" slot="end" onClick={()=>getARandomOne(handleRandomStatement)}><FontAwesomeIcon icon={faRotate}/></IonButton>
                                                            </IonLabel>
                                                        
                                                            
                                                    
                                                    
                                                    <IonTextarea
                                                        onIonChange={e => setEmailDraft({...emailDraft!, statement: e.detail.value!})}
                                                        value={emailDraft?.statement ?? ''}
                                                        autoCorrect='on'
                                                        autoGrow>
                                                    </IonTextarea>
                                                    <IonReorder slot="end"></IonReorder>
                                                </IonItem>
                                                : item == 2 ?
                                                    <IonItem key={item} >
                                                        <IonLabel position="stacked" className="has-button">Body &nbsp;<IonButton size="small" onClick={()=>getARandomOne(handleRandomBody)}><FontAwesomeIcon icon={faRotate}/></IonButton></IonLabel>
                                                        <IonTextarea
                                                            onIonChange={e => setEmailDraft({...emailDraft!, body: e.detail.value!})}
                                                            value={emailDraft?.body ?? ''}
                                                            autoCorrect='on'
                                                            autoGrow>
                                                        </IonTextarea>
                                                        <IonReorder slot="end"></IonReorder>
                                                    </IonItem>
                                                    : item == 3 ?
                                                        <IonItem key={item} >
                                                            <IonLabel position="stacked">Personal</IonLabel>
                                                            <IonTextarea
                                                                onIonChange={e => setEmailDraft({...emailDraft!, personal: e.detail.value!})}
                                                                value={emailDraft?.personal ?? ''}
                                                                autoCorrect='on'
                                                                spellCheck
                                                                autoGrow
                                                                rows={5}
                                                                placeholder='Optional, but makes your email more powerful. If you are local to this issue, DEFINITELY put that here.'>
                                                            </IonTextarea>
                                                            <IonReorder slot="end"></IonReorder>
                                                        </IonItem>
                                                        :
                                                        <></>}
                                        </>))}
                                </IonReorderGroup>
                                

                            </IonList>
                            </>
                                : <></> }
                        </>
                        : <></>}
                </IonCard>
                <IonRow className="send">
                    <IonButton href="mailto:les@ventureguitars.com?subject=Music%20Lessons
&body=I'm%20interested%20in%20learning%20to%20play
%20the:%0A%0AThe%20days%20of%20the%20week%20
that%20work%20best%20for%20me%20are:%0A%0AThe
%20best%20times%20for%20lessons%20are:%20" disabled={afterSendWait}>Create</IonButton>
                </IonRow>

            </IonContent>
        </IonPage>
    );

};



export default EmailBuilder;
