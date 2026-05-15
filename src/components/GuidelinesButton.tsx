import React from 'react';
import {
    IonButton,
    useIonActionSheet,
} from '@ionic/react';
import { openExternalUrl } from '../hooks/utilities';

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

    const openPicker = () => {
        presentActionSheet({
            header: 'Guidelines',
            buttons: [
                ...(includeMechanics ? [{ text: 'Posting and commenting mechanics', handler: () => openExternalUrl('https://refreshconnections.com/mechanics') }] : []),
                { text: 'Language guidelines', handler: () => openExternalUrl('https://refreshconnections.com/language') },
                { text: 'STEAM guidelines', handler: () => openExternalUrl('https://refreshconnections.com/science') },
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
