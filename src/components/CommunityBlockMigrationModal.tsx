import React from 'react';
import { IonAlert } from '@ionic/react';
import { useQueryClient } from '@tanstack/react-query';
import { communityBlockMigration } from '../hooks/utilities';
import { userQueryKeys } from '../hooks/api/profiles/user-query-keys';

type Props = {
  isOpen: boolean;
  onDismiss: () => void;
};

const CommunityBlockMigrationModal: React.FC<Props> = ({ isOpen, onDismiss }) => {
  const queryClient = useQueryClient();

  return (
    <IonAlert
      isOpen={isOpen}
      header="Full community blocks are here"
      message="You can now add a full community block on top of a personal block — hiding each other's posts and comments in the Refreshments Bar. Want to upgrade all your existing personal blocks to full community blocks?"
      buttons={[
        {
          text: 'Not now',
          role: 'cancel',
          handler: onDismiss,
        },
        {
          text: 'Yes, upgrade all',
          handler: async () => {
            await communityBlockMigration();
            queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
            onDismiss();
          },
        },
      ]}
      onDidDismiss={onDismiss}
    />
  );
};

export default CommunityBlockMigrationModal;
