import { useRef } from 'react';
import { useSheetModal } from './useSheetModal';
import { useQueryClient } from '@tanstack/react-query';
import { updateCommunityBlocked } from './utilities';
import { userQueryKeys } from './api';
import { postQueryKeys } from './api/refreshments';
import BlockProfileModal from '../components/BlockProfileModal';

export const useBlockProfile = () => {
  const queryClient = useQueryClient();
  const userIdRef = useRef<number>(0);
  const onBlockRef = useRef<() => void | Promise<void>>(() => {});

  const [present, dismiss] = useSheetModal(BlockProfileModal, {
    onDismiss: async (confirmed: boolean, alsoCommunity: boolean) => {
      dismiss();
      if (confirmed) {
        await onBlockRef.current();
        if (alsoCommunity) {
          await updateCommunityBlocked(userIdRef.current);
          queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
          queryClient.invalidateQueries({ queryKey: postQueryKeys.all });
        }
      }
    },
  });

  const blockProfile = (userId: number, onBlock: () => void | Promise<void>) => {
    userIdRef.current = userId;
    onBlockRef.current = onBlock;
    present({ initialBreakpoint: 0.65, cssClass: 'block-profile-modal' });
  };

  return blockProfile;
};
