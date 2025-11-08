import { IonCard, IonCardTitle, IonContent, IonPage, IonRow, IonText, useIonModal, useIonAlert, IonNote, IonCol, IonGrid, IonRefresher, IonRefresherContent } from '@ionic/react';
import { Link } from 'react-router-dom'


import "./Page.css"
import "./Me.css"



const Me: React.FC = () => {


  
    return (
      <IonPage>
        <IonContent fullscreen >
          <IonRow className="me-title">
            <img src="../static/img/refresh-connections-white-v2.png" alt="refresh-logo"/>
          </IonRow>
          <IonGrid className="me-dashboard ">
            <IonRow >
              
                <IonCol size="6" >
                  <Link to="profile">
                  <IonCard>
                    <img src="../static/img/profile-resized.png" alt="profile"/>
                    <IonCardTitle>Profile</IonCardTitle>
                  </IonCard>
                  </Link>
                </IonCol>

                <IonCol size="6">
                <Link to="settings">
                  <IonCard >
                    <img src="../static/img/settings-resized.png" alt="settings"/>
                    <IonCardTitle>Settings</IonCardTitle>
                  </IonCard>
                  </Link>
                </IonCol>
             
            </IonRow>

            <IonRow>
              
                <IonCol size="6" >
                <Link to="activity">
                  <IonCard >
                    <img src="../static/img/activity-resized.png" alt="activity"/>
                    <IonCardTitle>Activity</IonCardTitle>
                  </IonCard>
                </Link>
                </IonCol>

                <IonCol size="6" >
                <Link to="store">
                  <IonCard>
                    <img src="../static/img/store-resized.png" alt="store"/>
                    <IonCardTitle>Store</IonCardTitle>
                  </IonCard>
                </Link>
                </IonCol>
             
            </IonRow>

            <IonRow>

                <IonCol size="6" >
                <Link to="faqs">
                  <IonCard >
                    <img src="../static/img/faq-resized.png" alt="faqs"/>
                    <IonCardTitle>FAQs</IonCardTitle>
                  </IonCard>
                </Link>
                </IonCol>
              
                <IonCol size="6" >
                <Link to="help">
                  <IonCard >
                    <img src="../static/img/help-resized.png" alt="help"/>
                    <IonCardTitle>Help</IonCardTitle>
                  </IonCard>
                </Link>
                </IonCol>

                

             
            </IonRow>

            <IonRow>
              
                <IonCol size="6" >
                <Link to="tips">
                  <IonCard >
                    <img src="../static/img/howto-resized.png" alt="tutorials"/>
                    <IonCardTitle>How To</IonCardTitle>
                  </IonCard>
                </Link>
                </IonCol>

                <IonCol size="6" >
                
                </IonCol>
             
            </IonRow>
          </IonGrid>
        </IonContent>
    </IonPage>
    );
  };


export default Me;
