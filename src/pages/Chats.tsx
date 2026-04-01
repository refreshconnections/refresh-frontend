import { IonBadge, IonButton, IonCol, IonContent, IonLabel, IonNote, IonPage, IonRefresher, IonRefresherContent, IonRow, IonSegment, IonSegmentButton, IonSpinner, RefresherEventDetail } from '@ionic/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getGroupChatInvites, getGroupChats, getWebsocketUrl } from '../hooks/utilities';
import './Chats.css';
import "./Page.css"
import CantAccessCard from '../components/CantAccessCard';
import LoadingCard from '../components/LoadingCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { App } from '@capacitor/app';


import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useQueryClient } from "@tanstack/react-query";

import ChatsSegment from '../components/Chats/ChatsSegment';
import { useGetCurrentUserChats } from '../hooks/api/chats/current-user-chats';
import { useGetCurrentUserChatsPaginated } from '../hooks/api/chats/current-user-chats-paginated';
import GroupChatsSegment from '../components/GroupChats/GroupChatsSegment';
import { useGetMutualConnections } from '../hooks/api/profiles/mutual-connections';
import { useGetStatuses } from '../hooks/api/status';
import StatusToast from '../components/StatusToast';
import { useGetIncomingConnections } from '../hooks/api/profiles/incoming-connections';
import { faMagnifyingGlass } from '@fortawesome/pro-solid-svg-icons/faMagnifyingGlass';
import { faMagnifyingGlassMinus } from '@fortawesome/pro-regular-svg-icons/faMagnifyingGlassMinus';
import { faHeart } from '@fortawesome/pro-solid-svg-icons/faHeart';
import { useWebSocketContext } from '../components/WebsocketContext';
import { useIncomingConnectionsInf } from '../hooks/api/profiles/incoming-connections-paginated';


function getDialogBySender(dialogsList: { id: number, other_user_id: string }[], field: string, value: string) {
  return dialogsList.find(chat => chat[field] === value);
}

const Chats: React.FC = () => {

  const { addListener } = useWebSocketContext();

  const [littleLoading, setLittleLoading] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);

  const [groupChats, setGroupChats] = useState<any>(null);
  const [groupChatInvites, setGroupChatInvites] = useState<any>(null);
  const [currSegment, setCurrSegment] = useState<"chats" | "groups">("chats");



  // tanstack query
  const currentUserProfile = useGetCurrentProfile().data;
  const currentUserProfileLoading = useGetCurrentProfile().isLoading;
  const chatsQuery = useGetCurrentUserChats();
  const allChats = chatsQuery.data
  const chatsLoading = chatsQuery.isLoading
  const {
    data: paginatedChatsData,
    hasNextPage: chatsHasNextPage,
    isFetchingNextPage: chatsIsFetchingNextPage,
    fetchNextPage: fetchNextChatsPage,
  } = useGetCurrentUserChatsPaginated();
  const paginatedChats = paginatedChatsData?.pages.flatMap(page => page?.results ?? []) ?? [];
  const visibleChats = paginatedChats.length ? paginatedChats : (allChats ?? []);
  const mutualsQuery = useGetMutualConnections();
  const dataFlat = mutualsQuery.data
  const queryClient = useQueryClient()


  const incoming = useIncomingConnectionsInf().data
  const incomingCount = incoming?.pages?.[0]?.count;


  const [isToastOpen, setIsToastOpen] = useState<boolean>(false)
  const isRefreshingChats = Boolean(
    !littleLoading &&
    visibleChats.length > 0 &&
    dataFlat &&
    (chatsQuery.isFetching || mutualsQuery.isFetching || chatsIsFetchingNextPage)
  );

  const statuses = useGetStatuses().data;

  const chatsStatus = useMemo(
    () => statuses?.find(status => {
      return status.page.includes('chats')
    }),
    [statuses]
  );


  const isBeforeExpiration = useMemo(
    () =>
      chatsStatus?.active &&
      (!chatsStatus?.expirationDateTime ||
        new Date() < new Date(chatsStatus.expirationDateTime)),
    [chatsStatus?.active, chatsStatus?.expirationDateTime]
  );

  useEffect(() => {
    console.log("Chats use effect")

    let resumeHandle: { remove: () => void } | null = null;

    const listen = async () => {
      resumeHandle = await App.addListener('resume', async () => {
        try {
          // Refresh mutuals
          await queryClient.invalidateQueries({ queryKey: ['mutuals'] });
          await queryClient.invalidateQueries({ queryKey: ['mutuals-no-dialog'] });

          // Invalidate and wait for fresh chat list
          await queryClient.invalidateQueries({ queryKey: ['chats'] });
          await queryClient.invalidateQueries({ queryKey: ['chats', 'paginated'] });
          await queryClient.ensureQueryData({ queryKey: ['chats'] });

          // Safely fetch fresh chat data
          const freshChats = queryClient.getQueryData<any[]>(['chats']);
          if (!freshChats || freshChats.length === 0) {
            console.warn('No chats found after refresh.');
            return;
          }

          // Invalidate details for the top 3 chats
          const topThree = freshChats.slice(0, 3);
          topThree.forEach(chat => {
            queryClient.invalidateQueries({ queryKey: ['chats', 'details', chat.id] });
          });

          console.log('Successfully refreshed top 3 chat details.');
        } catch (error) {
          console.error('Error refreshing chat data on resume:', error);
        }
      });
    };

    listen();

    return () => {
      resumeHandle?.remove();
    };
  }, []);




  useEffect(() => {
    const unsubscribe = addListener((msg) => {
      if (msg.msg_type === 9) {
        const dialog = getDialogBySender(allChats, 'other_user_id', msg.sender);
        if (dialog) {
          queryClient.invalidateQueries({ queryKey: ['chats', 'details', dialog.id] });
        }
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        queryClient.invalidateQueries({ queryKey: ['chats', 'paginated'] });
        queryClient.invalidateQueries({ queryKey: ['unread'] });
      }
    });
    return unsubscribe;
  }, [addListener, allChats]);


  useEffect(() => {

    const fetchGroupChatData = async () => {
      try {
        setGroupChats(await getGroupChats());
        setGroupChatInvites(await getGroupChatInvites());
      } catch (error: any) {
        console.log(error)
      }
    }
    if (currSegment == "chats") {
    }
    else {
      fetchGroupChatData();
    }


  }, [currSegment]);


  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    setLittleLoading(true)
    setTimeout(async () => {
      setGroupChats(await getGroupChats());
      setGroupChatInvites(await getGroupChatInvites());
      queryClient.invalidateQueries({
        queryKey: ['mutuals'],
      })
      event.detail.complete();
      setLittleLoading(false)
    }, 2000);
  }


  return (
    <IonPage>
      {currentUserProfile && currentUserProfile.created_profile && !(currentUserProfile.deactivated_profile) ?
        <IonContent fullscreen>
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>
          <IonRow className="page-title" >
            <img className="color-invertible" src="../static/img/refresh_chats_navy.png" alt="chats" />
          </IonRow>
          {littleLoading ? <IonRow className="ion-justify-content-center"><IonSpinner name="dots"></IonSpinner></IonRow> : <></>}
          {isRefreshingChats ? (
            <IonRow className="ion-justify-content-center">
              <IonNote color="medium">Refreshing chats...</IonNote>
            </IonRow>
          ) : null}
          <IonRow className="segments">
            <IonCol size="2">
              <IonButton disabled={currSegment == "groups" || dataFlat?.length == 0} onClick={showSearch ? () => setShowSearch(false) : () => setShowSearch(true)}>
                {showSearch ? <FontAwesomeIcon icon={faMagnifyingGlassMinus} /> : <FontAwesomeIcon icon={faMagnifyingGlass} />}
              </IonButton>
            </IonCol>
            <IonCol size="8" style={{ alignContent: "center" }}>
              <IonSegment value={currSegment} mode="ios">
                <IonSegmentButton value="chats" onClick={() => setCurrSegment("chats")}>
                  <IonLabel>Chats</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="groups" onClick={() => setCurrSegment("groups")}>
                  <IonLabel>Groups</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            </IonCol>
            <IonCol size="2">
              {(incomingCount) ?
                <>
                  <IonBadge className="chats-likes-badge" color="danger">{incomingCount > 5 ? "5+" : incomingCount}</IonBadge>
                  <IonButton routerLink="/likes" color="navy" className="likes-in-chats-segment" style={{ height: "2.0em" }}>
                    <FontAwesomeIcon icon={faHeart} />
                  </IonButton>
                </>
                :
                <IonButton size="small" routerLink="/likes" className="likes-in-chats-segment" color="navy">
                  <FontAwesomeIcon icon={faHeart} />
                </IonButton>
              }
            </IonCol>
          </IonRow>
          {currSegment == "chats" ?
            <>
              {dataFlat ?
                <ChatsSegment
                  mutualConnectionsList={dataFlat}
                  chats={visibleChats}
                  currentUserProfile={currentUserProfile}
                  showSearch={showSearch}
                  chatsHasNextPage={!!chatsHasNextPage}
                  chatsIsFetchingNextPage={!!chatsIsFetchingNextPage}
                  onLoadMoreChats={() => fetchNextChatsPage()}
                />
                :
                <LoadingCard />
              }
            </>
            :
            <GroupChatsSegment groupChats={groupChats} groupChatInvites={groupChatInvites}></GroupChatsSegment>
          }
          {chatsStatus?.active && (chatsStatus?.header || chatsStatus?.message) && isBeforeExpiration ?
            <StatusToast isToastOpen={true} setIsToastOpen={setIsToastOpen} header={chatsStatus?.header} message={chatsStatus?.message} />
            : <></>}
        </IonContent>
        :
        <IonContent>
          <IonRow className="page-title">
            <img className="color-invertible" src="../static/img/refresh_chats_navy.png" alt="chats" />
          </IonRow>
          {(chatsLoading || currentUserProfileLoading) ? <LoadingCard /> : <CantAccessCard tabName="Chats" />}
        </IonContent>
      }
    </IonPage>
  );
};

export default Chats;
