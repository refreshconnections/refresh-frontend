import React from 'react';
import {
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonPage,
    useIonActionSheet,
    useIonModal,
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';

const GuidelinesModal: React.FC<{ url: string; onDismiss: () => void }> = ({ url, onDismiss }) => (
    <IonPage>
        <IonContent>
            <IonFab className="very-top" slot="fixed" vertical="top" horizontal="start">
                <IonFabButton color="light" onClick={onDismiss}>
                    <IonIcon icon={chevronBackOutline} />
                </IonFabButton>
            </IonFab>
            <iframe
                title="guidelines"
                src={url}
                style={{ height: '100%', width: '100%', border: 'none' }}
            />
        </IonContent>
    </IonPage>
);

interface Props {
    label?: string;
    fill?: 'clear' | 'outline' | 'solid' | 'default';
    color?: string;
    includeMechanics?: boolean;
}

const GuidelinesButton: React.FC<Props> = ({
    label = 'Our guidelines',
    fill = 'clear',
    color = 'primary',
    includeMechanics = false,
}) => {
    const [presentActionSheet] = useIonActionSheet();

    const [presentMechanics, dismissMechanics] = useIonModal(GuidelinesModal, {
        url: 'https://refreshconnections.com/mechanics',
        onDismiss: () => dismissMechanics(),
    });
    const [presentLanguage, dismissLanguage] = useIonModal(GuidelinesModal, {
        url: 'https://refreshconnections.com/language',
        onDismiss: () => dismissLanguage(),
    });
    const [presentSteam, dismissSteam] = useIonModal(GuidelinesModal, {
        url: 'https://refreshconnections.com/steam',
        onDismiss: () => dismissSteam(),
    });

    const openPicker = () => {
        presentActionSheet({
            header: 'Guidelines',
            buttons: [
                ...(includeMechanics ? [{ text: 'Community posting mechanics', handler: () => presentMechanics() }] : []),
                { text: 'Language guide', handler: () => presentLanguage() },
                { text: 'STEAM principles', handler: () => presentSteam() },
                { text: 'Cancel', role: 'cancel' },
            ],
        });
    };

    return (
        <IonButton fill={fill} color={color} size="small" onClick={openPicker}>
            {label}
        </IonButton>
    );
};

export default GuidelinesButton;
