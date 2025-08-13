// MessageLikePopover.tsx
import { IonContent } from '@ionic/react';
import './MessageLikePopover.css'

const MessageLikePopover: React.FC = () => (
  <IonContent className="ion-padding no-scroll">
    <p style={{ margin: 0 }}>Sent with Like</p>
  </IonContent>
);

export default MessageLikePopover;
