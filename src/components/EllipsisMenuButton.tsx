import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { ellipsisHorizontal } from 'ionicons/icons';
import './EllipsisMenuButton.css';

type EllipsisMenuButtonProps = {
  onClick: (e: React.MouseEvent) => void;
  className?: string;
};

const EllipsisMenuButton: React.FC<EllipsisMenuButtonProps> = ({ onClick, className }) => (
  <IonButton
    fill="clear"
    size="small"
    className={`ellipsis-menu-button ${className ?? ''}`}
    onClick={onClick}
    aria-label="More options"
  >
    <IonIcon icon={ellipsisHorizontal} />
  </IonButton>
);

export default EllipsisMenuButton;
