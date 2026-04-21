import {
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonFooter,
  IonText,
  IonButtons,
  IonTextarea,
  IonItem,
  IonContent,
  IonCol,
  IonRow,
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import './LikeMessageAlertModal.css';
import { faCommentHeart } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Keyboard } from '@capacitor/keyboard'; // Capacitor plugin
import { isMobile } from '../hooks/utilities';


interface Props {
  onDismiss: () => void;
  onSendLike: () => void;
  onSendWithMessage: (message: string) => void;
  connectionName?: string;
  maxChars?: number;
}

export const LikeMessageAlertModal: React.FC<Props> = ({
  onDismiss,
  onSendLike,
  onSendWithMessage,
  connectionName = '',
  maxChars = 200,
}) => {
  const [message, setMessage] = useState('');

  const isSendDisabled = message.trim().length === 0;

  // Reset message on mount (for modal reuse with useIonModal)
  useEffect(() => {
    setMessage('');
  }, []);

  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    if (isMobile()) {
      Keyboard.addListener('keyboardWillShow', () => {
        setKeyboardOpen(true);
        document.querySelector('ion-modal.like-message-alert-modal')?.classList.add('keyboard-open');
      });
      Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardOpen(false);
        document.querySelector('ion-modal.like-message-alert-modal')?.classList.remove('keyboard-open');
      });
    }

    return () => {
      if (isMobile()) {
        Keyboard.removeAllListeners();
      }
    };
  }, []);

  return (
    <>
      <IonContent className="like-message-alert-modal-wrapper" scrollY={false}>
        <div className="like-message-alert-modal-container" style={{ minHeight: "50px !important" }}>

        <IonHeader>
          <IonToolbar className="like-message-toolbar">
            <div className="toolbar-inner">
              <div className="toolbar-side"></div>
              <div className="toolbar-title">
                Add a Message &nbsp;
                <FontAwesomeIcon icon={faCommentHeart} />
              </div>
              <div className="toolbar-side">
                <IonButton fill="clear" onClick={onDismiss}>Close</IonButton>
              </div>
            </div>
          </IonToolbar>
        </IonHeader>

          <div className="modal-body">
            <div className={`modal-collapsible${keyboardOpen ? ' modal-collapsible--hidden' : ''}`}>
              <IonText>
                <p style={{fontSize: "10pt"}}>
                  Get the conversation started by sending a message with your Like to{' '}
                  <strong>{connectionName}</strong>!
                </p>
              </IonText>
            </div>

            <IonItem lines="none" className="textarea-item">
              <IonTextarea
                value={message}
                placeholder={`Write a message to ${connectionName}`}
                maxlength={maxChars}
                autoGrow
                autocapitalize="sentences"
                autoCorrect="on"
                spellcheck
                onIonInput={(e) => setMessage(e.detail.value ?? '')}
                rows={3}
              />
            </IonItem>

            <IonText color="medium" className="char-count">
              {message.length} / {maxChars}
            </IonText>
          </div>
          <div className={`modal-collapsible modal-footer-collapsible${keyboardOpen ? ' modal-collapsible--hidden' : ''}`}>
            <IonFooter className="ion-padding modal-footer">
              <IonRow>
                <IonCol>
                  <IonButton expand="block" fill="clear" onClick={onDismiss}>
                    Go Back
                  </IonButton>
                </IonCol>
                <IonCol>
                  <IonButton expand="block" fill="outline" onClick={() => {
                    onSendLike();
                    onDismiss();
                  }}>
                    Just Send the Like
                  </IonButton>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonButton style={{ width: "100%" }} expand="block" disabled={isSendDisabled} onClick={() => {
                  onSendWithMessage(message.trim());
                  onDismiss();
                }}>
                  Send Message with Like
                </IonButton>
              </IonRow>
            </IonFooter>
          </div>
        </div>
      </IonContent>
      {keyboardOpen && !isSendDisabled && (
        <div className="floating-send-button">
          <IonButton
            expand="block"
            onClick={() => {
              onSendWithMessage(message.trim());
              onDismiss();
            }}
          >
            Send Message with Like
          </IonButton>
        </div>
      )}
    </>
  );
};

export default LikeMessageAlertModal;
