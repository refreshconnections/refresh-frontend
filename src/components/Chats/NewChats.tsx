import { IonButton, IonList, IonRow, IonSpinner, IonText } from "@ionic/react";
import React, { useMemo } from "react";
import NewChatItem from "./NewChatItem";
import { useGetMutualConnectionsNoDialogV3 } from "../../hooks/api/profiles/mutuals-no-dialog-v3";



type Props = {
  currentUserProfile: any;
  filterUserIds?: number[];
};


const NewChats: React.FC<Props> = (props) => {
  const { currentUserProfile, filterUserIds } = props;

  const {
    data: noDialogsMutualConnectionsData,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetMutualConnectionsNoDialogV3();
  const noDialogsMutualConnections = noDialogsMutualConnectionsData?.pages.flatMap(page => page?.results ?? []) ?? [];

  const visibleChats = useMemo(() => {
    const seen = new Set();
    return noDialogsMutualConnections.filter(item => {
      const key = item.user_id;
      if (seen.has(key)) return false;
      seen.add(key);
      if (filterUserIds && !filterUserIds.includes(key)) return false;
      return true;
    });
  }, [noDialogsMutualConnections, filterUserIds]);

  return (
    <>
      {isLoading && <IonRow className="ion-justify-content-center" style={{paddingTop: "20pt"}}><IonSpinner name="bubbles"></IonSpinner></IonRow>}
      {!filterUserIds && noDialogsMutualConnections?.length > 0 ?
        <IonRow className="page-title">
          <IonText>
            <h2>Your new connections</h2>
          </IonText>
        </IonRow>
        : <></>
      }
      <IonList id="wl" lines="full">
        {visibleChats?.map((e) => (
          <li key={`new-chat-${e.user_id}`}>
            <NewChatItem
              user={e.user_id}
              currentUserProfile={currentUserProfile}
              opener={e.opener}
              name={e.name}
              pic1_main={e.pic1_main}
            />
          </li>
        ))}
      </IonList>
      {hasNextPage ? (
      <IonRow className="ion-justify-content-center">
        <IonButton size="small" fill="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? <IonSpinner name="bubbles"></IonSpinner> : "See more"}
        </IonButton>
      </IonRow>
      ) : null}
    </>
  )
};

export default NewChats;
