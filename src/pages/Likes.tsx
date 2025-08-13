import {
  IonAlert,
  IonButton,
  IonCard,
  IonCardTitle,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonGrid,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSpinner,
  IonText,
  RefresherEventDetail,
  useIonModal
} from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import {
  isPersonalPlus,
  onImgError
} from '../hooks/utilities';
import './Likes.css';
import './Page.css';

import ProfileModal from '../components/ProfileModal';
import CantAccessCard from '../components/CantAccessCard';
import LoadingCard from '../components/LoadingCard';
import StatusToast from '../components/StatusToast';

import { App } from '@capacitor/app';
import { useQueryClient } from '@tanstack/react-query';
import { chevronBackOutline } from 'ionicons/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentHeart } from '@fortawesome/pro-solid-svg-icons';

import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useGetStatuses } from '../hooks/api/status';
import { useGetMutualConnectionsNoDialogWOpenerCheck } from '../hooks/api/profiles/mutuals-no-dialog';
import { useGetCurrentStreak } from '../hooks/api/profiles/current-streak';
import { useIncomingConnectionsInf } from '../hooks/api/profiles/incoming-connections-paginated';

const Likes: React.FC = () => {
  const queryClient = useQueryClient();

  const currentUserProfile = useGetCurrentProfile().data;
  const currentStreak = useGetCurrentStreak().data;
  const mutuals = useGetMutualConnectionsNoDialogWOpenerCheck().data;
  const statuses = useGetStatuses().data;

  const [profileCardData, setProfileCardData] = useState<any>(null);
  const [showStoreAlert, setShowStoreAlert] = useState(false);
  const [littleLoading, setLittleLoading] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);

  const {
    data: incomingPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useIncomingConnectionsInf();



  const likesStatus = useMemo(
    () => statuses?.find((status) => status.page.includes('likes')),
    [statuses]
  );

  const isBeforeExpiration = useMemo(
    () =>
      likesStatus?.active &&
      (new Date() < new Date(likesStatus?.expirationDateTime) ||
        !likesStatus?.expirationDateTime),
    [likesStatus]
  );

  const isProOrStreak =
    isPersonalPlus(currentUserProfile?.subscription_level) || currentStreak?.streak_count >= 7;

  const paginatedVisibleConnections = useMemo(() => {
    return incomingPages?.pages?.map((page) => page.results) ?? [];
  }, [incomingPages]);

  const firstVisibleConnection = paginatedVisibleConnections.flat().find(conn => conn);

  const incomingCount = incomingPages?.pages?.[0]?.count;

  useEffect(() => {
    App.addListener('resume', async () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-paginated'] });
    });
  }, []);

   useEffect(() => {
    console.log(paginatedVisibleConnections)
    console.log(incomingPages)
  }, [paginatedVisibleConnections]);

  const handleProfileDismiss = (action: 'NoAction' | 'ActionTaken') => {
  if (action === 'ActionTaken' && profileCardData?.user) {
    // Optimistically remove this user from the cache
    queryClient.setQueryData(['incoming-paginated'], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          results: page.results.filter(
            (conn: any) => conn.user !== profileCardData.user
          ),
        })),
      };
    });
  }

  // Optionally update other queries (non-destructive)
  ['mutuals', 'mutuals-no-dialog'].forEach((key) => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
  profileDismiss();
};

  const [profilePresent, profileDismiss] = useIonModal(ProfileModal, {
    cardData: profileCardData,
    profiletype: 'unconnected',
    pro: isPersonalPlus(currentUserProfile?.subscription_level),
    settingsAlt: currentUserProfile?.settings_show_alt || true,
    yourName: currentUserProfile?.name || '',
    onDismiss: () => handleProfileDismiss('NoAction'), // optional, can keep for legacy
    onActionDismiss: (action: 'NoAction' | 'ActionTaken') => {
      handleProfileDismiss(action);
    },
  });

  const openModal = (item: any) => {
    setProfileCardData(item);
    profilePresent();
  };

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    setTimeout(async () => {
      ['current', 'mutuals', 'mutuals-no-dialog', 'incoming-paginated'].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      event.detail.complete();
    }, 500);
  };

  useEffect(() => {
    if (!isProOrStreak) {
      const stillEmpty = !firstVisibleConnection;
      if (stillEmpty && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  }, [
    isProOrStreak,
    firstVisibleConnection,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  const handleLeaveLikes = () => {
    setTimeout(async () => {
      ['mutuals', 'mutuals-no-dialog', 'incoming-paginated'].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    }, 500);
  }

  return (
    <IonPage>
      {currentUserProfile?.created_profile &&
        !currentUserProfile?.deactivated_profile &&
        !currentUserProfile?.paused_profile ? (
        <IonContent fullscreen>
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent />
          </IonRefresher>

          <IonFab class="very-top" slot="fixed" vertical="top" horizontal="start">
            <IonFabButton routerLink="/chats" routerDirection="back" color="light" onClick={handleLeaveLikes}>
              <IonIcon icon={chevronBackOutline} />
            </IonFabButton>
          </IonFab>

          <IonRow class="page-title bigger">
            <img className="color-invertible" src="../static/img/refresh_likes_navy.png" alt="likes" />
          </IonRow>

          {littleLoading && (
            <IonRow className="ion-justify-content-center">
              <IonSpinner name="dots" />
            </IonRow>
          )}

          <IonGrid>
            {isProOrStreak ? (
              <>
                {paginatedVisibleConnections.length > 0 &&
                  paginatedVisibleConnections.some(page => page.length > 0) ? (
                  <>
                    <IonRow className="like-card-grid">
                      {paginatedVisibleConnections.flat().map((conn) => (
                        <IonCol size="6" key={conn.user}>
                          <IonCard onClick={() => openModal(conn)} class="like-cards">
                            <img src={conn.pic1_main || "../static/img/null.png"} onError={onImgError} />
                            <IonCardTitle class="like-cards-name">{conn.name}</IonCardTitle>
                            {conn.latest_opener_text && (
                              <FontAwesomeIcon icon={faCommentHeart} className="message-icon" />
                            )}
                          </IonCard>
                        </IonCol>
                      ))}
                    </IonRow>
                    <IonInfiniteScroll
                      onIonInfinite={async (ev) => {
                        if (hasNextPage) await fetchNextPage();
                        ev.target.complete();
                      }}
                      threshold="100px"
                      disabled={!hasNextPage || isFetchingNextPage}
                    >
                      <IonInfiniteScrollContent
                        loadingSpinner="bubbles"
                        loadingText="Loading more likes..."
                      />
                    </IonInfiniteScroll>
                  </>
                ) : (
                  <IonRow class="empty-likes">
                    <img alt="Flower gif" src="../static/img/refresh-icon@3x.png" />
                    <IonText>
                      <br /><br />
                      No new likes at the moment, but it's okay!
                      <br /><br />
                      This would be a great time to join us at the Refreshments Bar!
                    </IonText>
                    {mutuals?.length > 0 && (
                      <IonCard class="new-connections-card">
                        <IonRow className="ion-text-center" style={{ flexDirection: 'column', alignItems: 'center' }}>
                          <IonText color="dark" style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
                            <p><strong>Plus, it looks like you've still got some new connections waiting to chat!</strong></p>
                          </IonText>
                          <IonButton routerLink="/chats" routerDirection="back" color="primary">
                            View new connections
                          </IonButton>
                        </IonRow>
                      </IonCard>
                    )}
                  </IonRow>
                )} </>) : (
              <>
                {firstVisibleConnection && (
                  <IonRow class="ion-justify-content-center">
                    <IonCard button onClick={() => openModal(firstVisibleConnection)} class="like-cards-free">
                      <img
                        src={firstVisibleConnection.pic1_main || "../static/img/null.png"}
                        alt="Profile"
                        onError={onImgError}
                      />
                      <IonCardTitle class="like-cards-name">{firstVisibleConnection.name}</IonCardTitle>
                      {firstVisibleConnection.latest_opener_text && (
                        <FontAwesomeIcon icon={faCommentHeart} className="message-icon" />
                      )}
                    </IonCard>
                    {(paginatedVisibleConnections.length >= 1 && paginatedVisibleConnections[0].length >= 1) ? 
                    <IonRow class="ion-justify-content-center ion-padding">
                      <IonButton onClick={() => setShowStoreAlert(true)} fill="clear" class="ion-text-wrap">You have {paginatedVisibleConnections[0].length > 6 ? "5+ " : ""} more likes waiting for you!</IonButton>
                    </IonRow>  
                      : <></>}
                      <IonAlert
                      isOpen={showStoreAlert}
                      onDidDismiss={() => setShowStoreAlert(false)}
                      header="See all your likes at once with Personal+ or Refresh Pro (or increase your streak)!"
                      subHeader="Click the picture to see who Liked you."
                      buttons={[{
                        text: "Not now",
                        role: 'destructive'
                      },
                      {
                        text: 'Get Pro!',
                        handler: async () => {
                          window.location.pathname = "/store"
                        }
                      }]}></IonAlert>
                      </IonRow>)}
                    


                {!firstVisibleConnection && isFetchingNextPage && (
                  <IonRow className="ion-justify-content-center">
                    <IonSpinner name="dots" />
                  </IonRow>
                )}

                {!hasNextPage && !firstVisibleConnection && !isFetchingNextPage && (
                  currentUserProfile?.initiate_mode === false ? (
                    <IonRow class="empty-likes">
                      <img alt="Flower gif" src="../static/img/refresh-icon@3x.png" />
                      <IonText>
                        <br /><br />
                        No new likes at the moment, but it's okay!
                        <br /><br />
                        This would be a great time to join us at the Refreshments Bar!
                      </IonText>
                      {mutuals?.length > 0 && (
                        <IonCard class="new-connections-card">
                          <IonRow className="ion-text-center" style={{ flexDirection: 'column', alignItems: 'center' }}>
                            <IonText color="dark" style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
                              <p><strong>Plus, it looks like you've still got some new connections waiting to chat!</strong></p>
                            </IonText>
                            <IonButton routerLink="/chats" routerDirection="back" color="primary">
                              View new connections
                            </IonButton>
                          </IonRow>
                        </IonCard>
                      )}
                    </IonRow>
                  ) : (
                    <IonRow class="empty-likes">
                      <IonText>
                        <br /><br />
                        You are in Initiate mode. Turn this off in Settings if you want others to be able to Like you first.
                        <br />
                      </IonText>
                    </IonRow>
                  )
                )}
              </>
            )}
          </IonGrid>

          {likesStatus?.active && (likesStatus?.header || likesStatus?.message) && isBeforeExpiration && (
            <StatusToast
              isToastOpen={true}
              setIsToastOpen={setIsToastOpen}
              header={likesStatus.header}
              message={likesStatus.message}
            />
          )}
        </IonContent>
      ) : (
        <IonContent>
          <IonFab class="very-top" slot="fixed" vertical="top" horizontal="start">
            <IonFabButton routerLink="/chats" routerDirection="back" color="light">
              <IonIcon icon={chevronBackOutline} />
            </IonFabButton>
          </IonFab>
          <IonRow class="page-title bigger">
            <img className="color-invertible" src="../static/img/refresh_likes_navy.png" alt="likes" />
          </IonRow>
          {littleLoading ? <LoadingCard /> : <CantAccessCard tabName="Likes" />}
        </IonContent>
      )}
    </IonPage>
  );
};

export default Likes;
