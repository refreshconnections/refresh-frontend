import { IonButton, IonCard, IonCardTitle, IonCol, IonContent, IonIcon, IonItem, IonLabel, IonList, IonNote, IonPage, IonRow, IonSpinner, IonText, useIonModal } from '@ionic/react';



import "./Page.css"
import "./Change.css"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/pro-solid-svg-icons/faPaperPlane';
import { faSparkles } from '@fortawesome/pro-solid-svg-icons/faSparkles';
import { faHammer } from '@fortawesome/pro-solid-svg-icons/faHammer';


import { useMemo, useState } from 'react';
import { useGetCampaigns } from '../hooks/api/campaigns/campaigns';
import { useGetStatuses } from '../hooks/api/status';
import StatusToast from '../components/StatusToast';
import ChangeSuggestionModal from '../components/ChangeSuggestionModal';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';

import { chevronForward, checkmarkCircle } from 'ionicons/icons';
import { faBoltLightning } from '@fortawesome/pro-solid-svg-icons/faBoltLightning';




const Change: React.FC = () => {

  const [campaignType, setCampaignType] = useState<string>("")
  const [search, setSearch] = useState<string>("")

  const currentUserProfile = useGetCurrentProfile().data;


  const projects = useGetCampaigns(campaignType, search).data
  const isLoading = useGetCampaigns(campaignType, search).isLoading

  const [isToastOpen, setIsToastOpen] = useState<boolean>(false)

  const [length, setLength] = useState(5)

  const statuses = useGetStatuses().data;

  const changeStatus = useMemo(
    () => statuses?.find(status => {
      return status.page.includes('picks')
    }),
    [statuses]
  );

  const isBeforeExpiration = useMemo(
    () => changeStatus?.active && new Date() < new Date(changeStatus?.expirationDateTime) || !changeStatus?.expirationDateTime,
    [changeStatus?.expirationDateTime]
  );

  const [changeProjectSuggestionPresent, changeProjectSuggestionDismiss] = useIonModal(ChangeSuggestionModal, {
    onDismiss: () => changeProjectSuggestionDismiss(),
  });



  return (
    <IonPage>
      <IonContent fullscreen >

        <IonRow className="page-title bigger">
          <img className="color-invertible " src="../static/img/change.png" alt="change" />
        </IonRow>

        {isLoading ? <IonRow className="ion-justify-content-center"><IonSpinner name="bubbles"></IonSpinner></IonRow> : <></>}

        {projects?.length == 0 ?
        <>
          <IonRow className="padding ion-text-wrap ion-justify-content-center ion-text-center" style={{paddingTop: "30pt"}}>
            <IonNote className="ion-padding" style={{fontSize:"16pt"}} color="navy">More change projects coming soon!</IonNote>
          </IonRow>
           <IonRow className="ion-padding ion-text-wrap ion-justify-content-center" style={{paddingTop: "30pt"}}>
           <IonNote style={{fontSize:"30pt"}} color="navy"> <FontAwesomeIcon icon={faBoltLightning} /></IonNote>
         </IonRow>
         </>
          : <></>

        }

        <IonRow>

          <IonList className="change-projects" lines="none">

            {projects?.slice(0, length).map((p: any) => (

              <IonItem color="white" key={p.id} button detail={true} detailIcon={currentUserProfile?.participated_in?.includes(p.id) ? checkmarkCircle : chevronForward} routerLink={p.campaign_type == "emailbuilder" ? `/change/emailbuilder/${p.email_builder}` : `/change/other/${p.other}`}>

                <IonLabel color="navy" className="ion-text-wrap">
                  <h2>
                    {p.campaign_type == "emailbuilder" ?
                      <FontAwesomeIcon icon={faPaperPlane} />
                      :
                      <FontAwesomeIcon icon={faSparkles} />
                    }
                    &nbsp; {p.title}
                  </h2>
                  <p>
                    {p.description}
                  </p>
                </IonLabel>
              </IonItem>
            ))}
            <IonItem color="midblue" button onClick={() => changeProjectSuggestionPresent()}>
              <IonLabel color="navy" className="ion-text-wrap">
                <h2>
                  <FontAwesomeIcon icon={faHammer} />

                  &nbsp; Know another project?
                </h2>
                <p>
                  Want to see it on this list? Let the Refresh Connections team know.
                </p>
              </IonLabel>
            </IonItem>
            <IonRow className="ion-justify-content-center">
              {projects?.length > length ?
                <IonButton size="small" fill="outline" onClick={() => setLength(length + 5)}>See more</IonButton>
                : <></>
              }
            </IonRow>
          </IonList>
        </IonRow>

        {/* <IonRow className="surrounding-room ion-justify-content-center">
        <img  src="../static/img/mapcomingsoon.png" alt="Refresh Connections Action Map coming soon" />
        <IonText className="ion-text-center"><h3>Plus, get ready to put Covid Conscientious on the map!</h3></IonText>
        </IonRow> */}
        {changeStatus?.active && (changeStatus?.header || changeStatus?.message) && isBeforeExpiration ?
          <StatusToast isToastOpen={true} setIsToastOpen={setIsToastOpen} header={changeStatus?.header} message={changeStatus?.message} />
          : <></>}

      </IonContent>
    </IonPage>
  );
};


export default Change;
