import { IonContent, IonPage, IonFab, IonFabButton, IonIcon } from '@ionic/react';
import React from 'react';
import { chevronBackOutline } from 'ionicons/icons';

type TipsProps = {
    onDismiss?: () => void;
};

const Tips: React.FC<TipsProps> = ({ onDismiss }) => {
    return (
        <IonPage>
            <IonContent>
                <IonFab className="very-top" slot="fixed" vertical="top" horizontal="start">
                    <IonFabButton
                        onClick={onDismiss}
                        routerLink={!onDismiss ? '/me' : undefined}
                        routerDirection={onDismiss ? undefined : 'back'}
                        color="light"
                    >
                        <IonIcon icon={chevronBackOutline} />
                    </IonFabButton>
                </IonFab>

                <iframe
                    title="tips"
                    src="https://refreshconnections.com/tips"
                    style={{ height: '100%', width: '100%', border: 'none' }}
                />
            </IonContent>
        </IonPage>
    );
};

export default Tips;
