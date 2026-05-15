import { IonContent, IonPage, IonFab, IonFabButton, IonIcon, IonRow } from '@ionic/react';
import React, { useMemo, useState } from 'react';
import { chevronBackOutline } from 'ionicons/icons';

import "./Page.css"
import "./Help.css"

import { useGetStatuses } from '../hooks/api/status';
import StatusToast from '../components/StatusToast';
import ContactForm from '../components/HelpCenter/ContactForm';

const Help: React.FC = () => {
    const [isToastOpen, setIsToastOpen] = useState<boolean>(false);
    const statuses = useGetStatuses().data;

    const helpStatus = useMemo(
        () => statuses?.find(status => status.page.includes('help')),
        [statuses]
    );

    const isBeforeExpiration = useMemo(
        () => helpStatus?.active && new Date() < new Date(helpStatus?.expirationDateTime) || !helpStatus?.expirationDateTime,
        [helpStatus?.expirationDateTime]
    );

    return (
        <IonPage>
            <IonContent className="help">
                <IonFab className="very-top" slot="fixed" vertical="top" horizontal="start">
                    <IonFabButton routerLink="/me" routerDirection="back" color="light">
                        <IonIcon icon={chevronBackOutline}></IonIcon>
                    </IonFabButton>
                </IonFab>
                <IonRow className="page-title bigger">
                    <img className="color-invertible" src="../static/img/help.png" alt="help" />
                </IonRow>
                <ContactForm />
                {helpStatus?.active && (helpStatus?.header || helpStatus?.message) && isBeforeExpiration ?
                    <StatusToast isToastOpen={true} setIsToastOpen={setIsToastOpen} header={helpStatus?.header} message={helpStatus?.message} />
                    : <></>}
            </IonContent>
        </IonPage>
    );
};

export default Help;
