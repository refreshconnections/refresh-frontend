import { IonButton, IonList, IonRow, IonSpinner } from "@ionic/react";
import React from "react";
import ChatItem from "./ChatItem";
import { useQueryClient } from "@tanstack/react-query";




type Props = {
  currentUserProfile: any;
  chatsList: any;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
};


const OngoingChats: React.FC<Props> = (props) => {
  const { currentUserProfile, chatsList, hasNextPage, isFetchingNextPage, onLoadMore } = props;








  return (
    <>
      <IonList id="wl" lines="full">
        {chatsList?.map((e: any) => (
          <li key={e.id}>
            <ChatItem user={parseInt(e.other_user_id)} currentUserProfile={currentUserProfile} chat={e} />

          </li>
        ))}
      </IonList>
      {hasNextPage ? (
        <IonRow className="ion-justify-content-center">
          <IonButton size="small" fill="outline" color="navy" onClick={onLoadMore} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? <IonSpinner name="dots" /> : "Load more"}
          </IonButton>
        </IonRow>
      ) : null}
    </>
  )
};

export default OngoingChats;
