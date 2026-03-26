import React from 'react';
import { IonContent, IonButton, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons } from '@ionic/react';
import "./EditModal.css";

type Props = { onDismiss: () => void };

const BlockTypesExplainedModal: React.FC<Props> = ({ onDismiss: handleDismiss }) => (
    <IonPage>
        <IonHeader>
            <IonToolbar className="modal-title">
                <IonTitle>Block types explained</IonTitle>
                <IonButtons slot="end">
                    <IonButton onClick={handleDismiss}>Done</IonButton>
                </IonButtons>
            </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
            <p><strong>Personal block</strong><br />
                You won't appear in each other's Picks, you can't send likes or messages in 1:1 chats.<br />
                <em>Personal blocks are permanent and cannot be reversed.</em>
            </p>
            <p><strong>Community block</strong><br />
                Also blocks someone on the personal side, plus you won't see each other's posts or comments in the Refreshments Bar.<br />
                You can remove the community portion of the block later if you'd like to see their posts and comments again, but the personal block is irreversible.
            </p>
            <p><strong>Reporting someone</strong><br />
                Applies a full community block.
            </p>
            <IonButton expand="block" onClick={handleDismiss}>Got it</IonButton>
        </IonContent>
    </IonPage>
);

export default BlockTypesExplainedModal;
