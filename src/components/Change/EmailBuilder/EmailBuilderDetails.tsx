import { IonActionSheet, IonAvatar, IonBadge, IonButton, IonCard, IonCardContent, IonCardSubtitle, IonCardTitle, IonChip, IonCol, IonContent, IonFab, IonFabButton, IonFooter, IonIcon, IonInput, IonItem, IonLabel, IonList, IonNote, IonPage, IonRow, IonText, IonTextarea, useIonAlert, useIonModal } from "@ionic/react";
import React, { useEffect, useState } from "react";

import { useParams } from "react-router-dom"
import { chevronBackOutline } from 'ionicons/icons';


import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faCircleInfo } from "@fortawesome/pro-solid-svg-icons/faCircleInfo";

import "./EmailBuilderDetails.css"

import { useQueryClient } from "@tanstack/react-query";
import { useGetCurrentProfile } from "../../../hooks/api/profiles/current-profile";
import { useEmailBuilderDetails } from "../../../hooks/api/emailbuilders/emailbuilder-by-id";
import { usePurposeById } from "../../../hooks/api/emailbuilders/purpose-by-id";
import { faDice } from "@fortawesome/pro-solid-svg-icons/faDice";
import Participated from "../Participated";




interface EmailDraft {
    recipient?: string,
    subject?: string,
    body?: string,
    personal?: string,
    intro: string,
}

const salutations = ['Dear ', 'Hi ', '', 'Hello ']
const signoffs = ['Thank you for your time,', 'Respectfully,', 'Kind regards,', 'Thanks,', 'Sincerely,']

const getRandomSubject = (subjects: any[]) =>{
    const index =  Math.floor(Math.random() * subjects?.length) ?? 0;
    return subjects[index]?.text ?? ''
}

const getRandomBody = (bodies: any[], statements: any[], name: string) =>{
    console.log("bodies", bodies)
    const bodyindex =  Math.floor(Math.random() * bodies?.length) ?? 0;
    const body =  !!bodies[bodyindex] ? bodies[bodyindex].text : ''
    console.log("body", body)

    console.log("statements", statements)
    const statementindex =  Math.floor(Math.random() * statements?.length) ?? 0;
    const statement = !!statements[statementindex] ? statements[statementindex].statement : '';

    const signoffIndex = Math.floor(Math.random() * signoffs?.length) ?? 0;
    const signoff =  !!signoffs[signoffIndex] ? signoffs[signoffIndex] : '';
    const bodyOrder =[statement, body]

    bodyOrder.sort(() => Math.random() - 0.5);

    const combined = bodyOrder[0] + "\n\n" + bodyOrder[1] + "\n\n" + signoff + "\n" + name
    return combined
}




const EmailBuilderDetails: React.FC = () => {

    let { id } = useParams<{id: string}>()

    const queryClient = useQueryClient()
    const me = useGetCurrentProfile().data
    const emailbuilder = useEmailBuilderDetails(parseInt(id)).data;
    const purpose = usePurposeById(emailbuilder?.purpose).data

    const [presentWhatIsEmailBuilderAlert] = useIonAlert();

    const [personal, setPersonal] = useState(localStorage.getItem("emailbuilder_personal" +id) ?? '')
    const [intro, setIntro] = useState('')


    const [afterSendWait, setAfterSendWait] = useState(false)
    const [isDisabled, setIsDisabled] = useState(true);
   
    const [emailDraft, setEmailDraft] = useState<EmailDraft>();
    const [getARandomOneAlert] = useIonAlert();

    useEffect(() => {
    
        if (emailbuilder?.recipient) {
            const index =  Math.floor(Math.random() * salutations?.length) ?? 0;
            setIntro((salutations[index] ?? '') + emailbuilder?.recipient + ',')
        }
    
    
      }, [emailbuilder]);

    useEffect(() => {
    
        if (emailbuilder) {

            let startbody = ''
            if (!!localStorage.getItem("emailbuilder_body"+id)) {
                startbody = localStorage.getItem("emailbuilder_body"+id)!
            }
            else {
                startbody = getRandomBody(emailbuilder?.bodies ?? [], purpose?.statements ?? [], me?.name)
            }
            setEmailDraft({...emailDraft!, subject: getRandomSubject(emailbuilder?.subjects ?? []), body: startbody, personal: personal, intro: intro})
        }
    
    
      }, [emailbuilder, purpose, personal]);


      useEffect(() => {
        if (!!personal) {
            localStorage.setItem("emailbuilder_personal" + id, personal)
        }
      }, [personal])

      useEffect(() => {
    
        if (!!emailbuilder?.body) {
            localStorage.setItem("emailbuilder_body" + id, emailbuilder?.body)
        }
    
    
      }, [emailbuilder?.body]);

    


    const delay = (ms: any) => new Promise(res => setTimeout(res, ms));

    const getARandomOne = async () => {
        getARandomOneAlert({
          header: 'Refresh the email started for you?',
          subHeader: "You'll lose any changes you've made to this section. Your personal statement will stay.",
          buttons: [
            {
                text: 'Nevermind',
                role: 'destructive'
            },
            {
              text: 'Ok!',
              handler: () => {
                handleRandomEmail()
              }
            },
          ],
        })
      }

    const emailBuilderInfo = () => {
        presentWhatIsEmailBuilderAlert({
            header: 'What is the Email Builder?',
            subHeader: "Composing effective emails can be a pain, so we've done the background work and heavy lifting!",
            message: 'We have started an email out of a randomized template of carefully crafted sections. Add a personal statement and make changes to make it your own. Then hit “Ready to Send”. Your finished email will open in your default email app. All you have to do is hit “Send”.',
            buttons: [
                {
                    text: 'Ok',
                    role: 'cancel',
                }
            ],
        })
    }


    function handleRandomEmail() {
        setEmailDraft({...emailDraft!, subject: getRandomSubject(emailbuilder?.subjects ?? []), body: getRandomBody(emailbuilder?.bodies ?? [], purpose?.statements ?? [], me.name)})
    }

    function createEmail() {
        const personalfinal = personal? personal + "\n\n" : ''
        const introfinal = intro? intro + "\n\n" : ''
        let mailurl = "mailto:"


        mailurl += emailbuilder?.email ?? ''
        mailurl += "?"
        mailurl += emailbuilder?.cc_list? `&cc=${emailbuilder?.cc_list}` : ''
        mailurl += "&subject=" + encodeURI(emailDraft?.subject ?? '')
        mailurl += "&body=" + encodeURI(introfinal) + encodeURI(personalfinal) + encodeURI(emailDraft?.body ?? '')

        return mailurl
    }


    return (
        <IonPage>
            <IonContent>
                <IonFab className="very-top" slot="fixed" vertical="top" horizontal="start">
                    <IonFabButton routerLink={`/change/#${id}`} routerDirection="back" color="light">
                        <IonIcon icon={chevronBackOutline}></IonIcon>
                    </IonFabButton>
                </IonFab>

                <IonRow className="page-title">
                    <img className="color-invertible" src="../../static/img/navy-emailbuilder.png" style={{maxHeight: "50pt"}} alt="email builder" />
                </IonRow>

                <IonCard className="email-builder">

                    <IonRow className="ion-align-items-center">
                            <IonCol size="11">
                            <IonCardTitle>
                            {purpose?.purpose ?  purpose?.purpose : ""}
                            </IonCardTitle>
                            </IonCol>
                            <IonCol size="1">
                                <IonButton fill="clear" size="small" onClick={emailBuilderInfo}><FontAwesomeIcon icon={faCircleInfo} /></IonButton>
                            </IonCol>
                        </IonRow>

                    
                    <IonCardContent >
                        <IonText>
                        
                        {emailbuilder?.recipient? <><h2><strong>Recipient</strong>: {emailbuilder?.recipient}</h2><br/></> : <></>}
                        {emailbuilder?.purpose_detail? <><h2 className="css-fix"><strong>Goal</strong>: {emailbuilder?.purpose_detail}</h2><br/></> : <></>}
                        {emailbuilder?.location? <><h2><strong>Location</strong>: {emailbuilder?.location}</h2><br/></> : <></>}
                    
                        </IonText>
                        
                        

                    </IonCardContent>
                    {emailbuilder?.link?
                          <IonRow className="ion-justify-content-center" style={{paddingBottom: "0px"}}>
                        <IonButton fill="outline" href={emailbuilder?.link}>Learn more</IonButton>
                        </IonRow>
                        : <></>}
                    
                   
                </IonCard>

                <IonCard>
                    <IonItem className="ion-text-wrap" color="white" lines="none">
                        <IonLabel position="stacked">Personal Statement:</IonLabel>
                        <IonTextarea autoGrow autoCapitalize="sentences" debounce={1000} rows={3} autoCorrect="on" spellcheck={true} placeholder="(Optional, but makes your email far more powerful. If you are local to this issue, DEFINITELY put that here.)"  value={personal} onIonChange={(e)=>setPersonal(e.detail.value!)}/>
                    </IonItem>
                </IonCard>

                <IonRow className="ion-text-center">
                    <IonText style={{padding: "25px"}}>You can edit any part of the sample email started for you.</IonText>
                </IonRow>
                <IonRow className="ion-justify-content-center">
                    <IonButton onClick={()=>getARandomOne()}><FontAwesomeIcon icon={faDice}/> &nbsp; Randomize email </IonButton>
                </IonRow>   
                

                <IonCard className="email-builder-creation ">
                    <IonItem color="white" lines="full" className="ion-text-wrap">

                    <IonLabel position="stacked">Subject:</IonLabel>
                        <IonInput value={emailDraft?.subject ?? ''} onIonInput={(e)=>setEmailDraft({...emailDraft!, subject: e.detail.value!})}/>
                    </IonItem>

                    {emailbuilder?.recipient ?
                    <IonItem className="ion-text-wrap" color="white" lines="none">
                        <IonTextarea autoGrow autoCorrect="on" spellcheck={true} value={intro} onIonInput={(e)=>setIntro(e.detail.value!)}/>
                    </IonItem>
                    : <></>}


                    {personal ?
                    <IonItem className="ion-text-wrap" color="white" lines="none">
                        <IonTextarea autoGrow autoCorrect="on" spellcheck={true} value={personal} onIonInput={(e)=>setPersonal(e.detail.value!)}/>
                    </IonItem>
                    : <></>}
                    
                    <IonItem className="ion-text-wrap" color="white" lines="none">
                        <IonTextarea autoGrow autoCorrect="on" spellcheck={true} value={emailDraft?.body ?? ''} onIonInput={(e)=>setEmailDraft({...emailDraft!, body: e.detail.value!})}/>
                    </IonItem>
                    
                </IonCard>
                <IonRow className="ion-justify-content-center email-ready-to-send-button">
                        <IonButton href={createEmail()}>Open in email app</IonButton>
                </IonRow>
                <IonCard className="email-builder" style={{paddingBottom: "35px", marginBottom: "25px"}}>
                    <IonRow>
                        <IonText style={{padding: "25px"}}>
                        Once you've sent the email, come back here and let us know!
                        </IonText>
                    </IonRow>
                    <Participated campaign_id={emailbuilder?.campaign} />
                </IonCard>
            </IonContent>
        </IonPage>
    )


};

export default EmailBuilderDetails;

