import { IonButton, IonList, IonRow } from "@ionic/react";
import React, { useEffect, useMemo, useState } from "react";
import ChatItem from "./ChatItem";
import { useQueryClient } from "@tanstack/react-query";




type Props = {
  mutualConnectionsList: number[];
  currentUserProfile: any;
  chatsList: any
};


const OngoingChats: React.FC<Props> = (props) => {
  const { mutualConnectionsList, currentUserProfile, chatsList } = props;


  const [length, setLength] = useState(5)
  const [someChats, setSomeChats] = useState(chatsList?.slice(0, 5))

  useEffect(() => {

    setSomeChats(chatsList?.slice(0, length))

    console.log("chatsList", chatsList)


  }, [chatsList, length])








  return (
    <>
      <IonList id="wl" lines="full">
        {someChats?.map((e: any) => (
          <li key={e.id}>
            <ChatItem user={parseInt(e.other_user_id)} currentUserProfile={currentUserProfile} chat={e} />

          </li>
        ))}
      </IonList>
      {chatsList?.length > length ?
        <IonRow className="ion-justify-content-center">
          <IonButton size="small" fill="outline" onClick={() => setLength(length + 3)}>See more</IonButton>
        </IonRow>
        : <></>
      }
    </>
  )
};

export default OngoingChats;
