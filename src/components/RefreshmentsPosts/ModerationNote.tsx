// ModerationNoteModal.tsx
import {
    IonContent,
    IonButton,
    IonIcon,
    useIonModal,
    IonCard,
    IonRow,
    IonText,
    IonCol
} from '@ionic/react';
import Linkify from 'react-linkify';


import './ModerationNote.css'
import { faMemoCircleInfo } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface ModerationNoteModalProps {
    moderationNote: string | null;
    moderationIconOnly: boolean;
    moderationNoteLonger: string | null;
}

export const ModerationNote: React.FC<ModerationNoteModalProps> = ({
    moderationNote,
    moderationIconOnly,
    moderationNoteLonger,
}) => {
    const ModalContent: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
        <IonContent className="ion-padding">
            <h4>Moderation Note</h4>
            <p>{moderationNote}</p>
            <p className="css-fix"><Linkify>{moderationNoteLonger}</Linkify></p>
            <div style={{textAlign: "center"}}>
                <img alt="loading-freshy" src="../static/img/flower-mask.png" style={{ width: "50pt", alignSelf: "center" }}></img>
            </div>
            <div className="moderation-disclaimer" style={{ fontSize: '11px', opacity: 0.7 }}>
                <p>
                    We know our approach to moderation might feel a little different from the rest of the internet — that's intentional. We want to build a space that's inclusive, kind, and COVID Conscientious. Thanks for being part of that effort. We're always open to thoughtful feedback.
                </p>
            </div>
            <IonButton expand="block" onClick={onDismiss}>Close</IonButton>
        </IonContent>
    );

    const handleDismiss = () => {
        dismissModal();
    };

    const [present, dismissModal] = useIonModal(ModalContent, {
        onDismiss: handleDismiss,
    });

    if (!moderationNote) return null;

    const openModal = () => {
        present({
            showBackdrop: false,
            backdropDismiss: true,
            initialBreakpoint: 0.6,
            handleBehavior: 'none',
            cssClass: 'moderation-modal'
        });
    };

    return (
        <div className="moderation-wrapper">
            {moderationIconOnly ? (
                <IonButton fill="clear" color="secondary" onClick={openModal} className="moderation-icon-button">
                    <FontAwesomeIcon className="alt-desc" icon={faMemoCircleInfo} />
                </IonButton>
            ) : (
                <div className="moderation-note" onClick={openModal}>
                    <IonRow class="moderation-description">
                        <IonCol size="2" style={{ textAlign: "center" }}>
                            <FontAwesomeIcon style={{ color: "var(--ion-color-secondary)" }} className="alt-desc" icon={faMemoCircleInfo} />
                        </IonCol>
                        <IonCol size="10" style={{ textAlign: "left", paddingBottom: "5pt" }}>
                            <IonText>{moderationNote}</IonText>
                        </IonCol>
                    </IonRow>
                </div>
            )}
        </div>
    );
};
