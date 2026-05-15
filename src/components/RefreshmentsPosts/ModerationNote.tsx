// ModerationNoteModal.tsx
import {
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonRow,
    IonText,
    IonCol,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
    useIonRouter,
} from '@ionic/react';
import Linkify from 'react-linkify';
import { getInternalAppPath, openExternalUrl } from '../../hooks/utilities';


import './ModerationNote.css';
import { useSheetModal } from '../../hooks/useSheetModal';
import { faMemoCircleInfo } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import GuidelinesButton from '../GuidelinesButton';

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
    const router = useIonRouter();
    const openAppOrExternalUrl = (url: string) => {
        const internalPath = getInternalAppPath(url);
        if (internalPath) {
            router.push(internalPath);
            return;
        }
        openExternalUrl(url);
    };

    const ModalContent: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
        <IonContent className="ion-padding">
            <IonRow>
                <IonCol size="8">
                    <h4>Moderation Note</h4>
                </IonCol>
                <IonCol size="2">
                    <div style={{ textAlign: "center" }}>
                        <img alt="loading-freshy" src="../static/img/flower-mask.png" style={{ alignSelf: "center" }}></img>
                    </div>
                </IonCol>
            </IonRow>
            <p className="moderation-note-main"><Linkify componentDecorator={(href, text, key) => <a key={key} onClick={(e) => { e.preventDefault(); openAppOrExternalUrl(href); }} style={{ cursor: 'pointer' }}>{text}</a>}>{moderationNote}</Linkify></p>
            <p className="moderation-note-longer css-fix"><Linkify componentDecorator={(href, text, key) => <a key={key} onClick={(e) => { e.preventDefault(); openAppOrExternalUrl(href); }} style={{ cursor: 'pointer' }}>{text}</a>}>{moderationNoteLonger}</Linkify></p>
            <IonAccordionGroup className="moderation-accordion" expand="compact">
                <IonAccordion value="how" >
                    <IonItem slot="header" lines="none" className="acc-header">
                        <IonLabel className="acc-label">How we moderate</IonLabel>
                    </IonItem>
                    <div slot="content" className="ion-padding moderation-disclaimer">
                        <p>
                            We know our approach to moderation might feel a little different from
                            the rest of the internet — that's intentional. We want to build a space
                            that's inclusive, kind, and COVID Conscientious. Thanks for being part
                            of that effort. We're always open to thoughtful feedback.
                        </p>
                        <GuidelinesButton label="Our guidelines" fill="outline" />
                    </div>
                </IonAccordion>
            </IonAccordionGroup>

            <IonButton expand="block" onClick={onDismiss}>Close</IonButton>
        </IonContent>
    );

    const handleDismiss = () => {
        dismissModal();
    };

    const [present, dismissModal] = useSheetModal(ModalContent, {
        onDismiss: handleDismiss,
    });

    if (!moderationNote) return null;

    const openModal = () => {
        present({ initialBreakpoint: 0.6, cssClass: 'moderation-modal' });
    };

    return (
        <div className="moderation-wrapper">
            {moderationIconOnly ? (
                <IonButton fill="clear" color="secondary" onClick={openModal} className="moderation-icon-button">
                    <FontAwesomeIcon className="alt-desc" icon={faMemoCircleInfo} />
                </IonButton>
            ) : (
                <div className="moderation-note" onClick={openModal}>
                    <IonRow className="moderation-description">
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
