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
      header="Full blocks are here"
      message="You can now add a full block on top of a personal block. This also hides each other’s posts and comments in the Refreshments Bar, in addition to the personal side.\n\nWould you like to convert your existing personal blocks to full blocks?"
      buttons={[
        {
          text: 'Not now',
          role: 'cancel',
          handler: onDismiss,
        },
        {
          text: 'Yes, convert all',
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
