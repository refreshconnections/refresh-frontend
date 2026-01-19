import { IonButton, IonList, IonRow, IonSpinner, IonText } from "@ionic/react";
import React, { useMemo } from "react";
import NewChatItem from "./NewChatItem";
import { useGetMutualConnectionsNoDialogWOpenerCheck } from "../../hooks/api/profiles/mutuals-no-dialog";



type Props = {
  mutualConnectionsList: any;
  currentUserProfile: any;
  chatsList: any
};


const NewChats: React.FC<Props> = (props) => {
  const { currentUserProfile } = props;

  const {
    data: noDialogsMutualConnectionsData,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetMutualConnectionsNoDialogWOpenerCheck();
  const noDialogsMutualConnections = noDialogsMutualConnectionsData?.pages.flatMap(page => page?.results ?? []) ?? [];


  // // usememo here?
  // function getDifference(mutuals_list: any, chats_array: any) {

  //   return mutuals_list?.filter((id: number) => !(chats_array?.find(chat => chat.other_user_id === id.toString())))
  // }

  // const noDialogsMutualConnections = useMemo(() => getDifference(mutualConnectionsList, chatsList), [mutualConnectionsList, chatsList])

  const visibleChats = useMemo(() => {
  const seen = new Set();
  return noDialogsMutualConnections.filter(item => {
    const key = item.user_id || item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}, [noDialogsMutualConnections]);

  return (
    <>
      {isLoading && <IonRow className="ion-justify-content-center" style={{paddingTop: "20pt"}}><IonSpinner name="bubbles"></IonSpinner></IonRow>}
      {noDialogsMutualConnections?.length > 0 ?
        <IonRow className="page-title">
          <IonText>
            <h2>Your new connections</h2>
          </IonText>
        </IonRow>
        : <></>
      }
      <IonList id="wl" lines="full">
        {visibleChats?.map((e: any) => (
          <li key={`new-chat-${e.user_id}`}>
            <NewChatItem user={e.user_id} currentUserProfile={currentUserProfile} opener={e.opener ?? false}/>
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
