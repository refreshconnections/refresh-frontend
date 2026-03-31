import React from 'react';
import { IonText } from '@ionic/react';
import { useProfileDetails } from '../hooks/api/profiles/details';
import { onImgError } from '../hooks/utilities';

type Props = {
  userId: number;
  name?: string;
  pic1_main?: string | null;
  onTap?: () => void;
};

const PersonBadge: React.FC<Props> = ({ userId, name: nameProp, pic1_main: picProp, onTap }) => {
  const profile = useProfileDetails(userId, !nameProp || picProp === undefined).data;
  const name = nameProp ?? profile?.name;
  const pic1_main = picProp !== undefined ? picProp : profile?.pic1_main;

  return (
    <div
      onClick={onTap}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        cursor: onTap ? 'pointer' : 'default',
        width: '64px',
      }}
    >
      <img
        src={pic1_main ?? '../static/img/null.png'}
        onError={onImgError}
        alt={name ?? ''}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          objectFit: 'cover',
        }}
      />
      <IonText style={{ fontSize: '11px', textAlign: 'center', lineHeight: '1.2', wordBreak: 'break-word' }}>
        {name ?? '…'}
      </IonText>
    </div>
  );
};

export default PersonBadge;
