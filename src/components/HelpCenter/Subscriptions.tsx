import {
    IonAccordion,
    IonAccordionGroup,
    IonButton,
    IonItem,
    IonLabel,
    IonNavLink,
    IonNote,
    IonRouterLink,
    IonRow,
    IonText,
} from '@ionic/react';
import React from 'react'

import "./HelpCenter.css"


const Subscriptions: React.FC = () => {

    return (
        <div className="help-section">
        <IonRow class="ion-padding ion-justify-content-center">
        <IonText>Here are some quick answers:</IonText>
        </IonRow>
    <IonAccordionGroup class="help-faqs">
       
      <IonAccordion value="first">
        <IonItem slot="header" lines="none">
          <IonLabel class="ion-text-wrap">I have an active subscription but the app thinks I do not</IonLabel>
        </IonItem>
        <div className="ion-padding" slot="content">
          Sometimes the respective app store and the app get out of sync. Try the <span style={{fontWeight: "bold"}}>Restore purchases</span> button in the Me tab &gt; <a href="/Store">Store</a> section.
            <br/><br/>
            Also, make sure you are signed into the same iTunes or Google Play account used to purchase the subscription.
        </div>

      </IonAccordion>
      <IonAccordion value="second">
        <IonItem slot="header" lines="none">
          <IonLabel class="ion-text-wrap">How do I cancel my subscription?</IonLabel>
        </IonItem>
        <div className="ion-padding" slot="content">
        <span style={{fontWeight: "bold"}}><a href="https://support.apple.com/en-us/118428">Cancel a subscription from Apple</a></span><br/>
        If you subscribed using your Apple ID, cancellation of the subscription is handled by Apple, not Refresh Connections. To cancel a purchase made with your Apple ID, go to Settings &gt; iTunes & App Stores &gt; [click on your Apple ID] &gt; View Apple ID &gt; Subscriptions, then find your Refresh Connections subscription and follow the instructions to cancel. You can also request assistance at <a href="https://getsupport.apple.com">https://getsupport.apple.com</a>.
        <br/><br/>
        <span style={{fontWeight: "bold"}}><a href="https://support.google.com/googleplay/answer/7018481">Cancel a subscription from Google Play</a></span><br/>
        In the same vein, if you subscribed on Google Play, cancellation is handled by Google. To cancel a purchase made through Google Play, launch the Google Play app on your mobile device and go to Menu &gt; My Apps &gt; Subscriptions, then find your Refresh Connections subscription and follow the instructions to cancel. You can also request assistance at <a href="https://play.google.com">https://play.google.com</a>.
        </div>
      </IonAccordion>
    </IonAccordionGroup>
    <IonRow class="ion-padding ion-justify-content-center top-border">
        <IonText class="ion-text-center">Still haven't found what you're looking for? Send us a message.</IonText>
    </IonRow>
    </div>
    )
};
export default Subscriptions;