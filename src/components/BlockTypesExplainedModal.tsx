import React from 'react';
import { IonContent, IonButton, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons } from '@ionic/react';
import "./EditModal.css";

type Props = { onDismiss: () => void };

const BlockTypesExplainedModal: React.FC<Props> = ({ onDismiss: handleDismiss }) => (
    <IonPage>
        <IonHeader>
            <IonToolbar className="modal-title">
                <IonTitle>Personal Block vs Full Community Block</IonTitle>
                <IonButtons slot="end">
                    <IonButton onClick={handleDismiss}>Done</IonButton>
                </IonButtons>
            </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
            <p><strong>Personal block</strong><br />
                You won’t appear in each other’s Discovery, and you can’t send Likes or one-to-one messages. A personal block does not also apply a community block, so posts and comments in the Refreshments Bar are not affected. Personal blocks are permanent and can’t be removed.
            </p>
            <p><strong>Full community block</strong><br />
                This also applies a personal block. In addition, you won’t see each other’s posts or comments in the Refreshments Bar. You can later remove the community block if you want to see their posts and comments again, but the personal block remains.
            </p>
            <p><strong>Reporting someone</strong><br />
                Reporting someone also applies a full community block.
            </p>
            <IonButton expand="block" onClick={handleDismiss}>Got it</IonButton>
        </IonContent>
    </IonPage>
);

export default BlockTypesExplainedModal;
