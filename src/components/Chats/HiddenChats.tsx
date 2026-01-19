import { AccordionGroupCustomEvent, IonAccordion, IonAccordionGroup, IonButton, IonItem, IonLabel, IonList, IonRow, IonSpinner } from "@ionic/react";
import React, { useState } from "react";
import HiddenChatItem from "./HiddenChatItem";
import { useGetHiddenChats } from "../../hooks/api/chats/hidden-chats";



type Props = {
  currentUserProfile: any;
};


const HiddenChats: React.FC<Props> = (props) => {
  const { currentUserProfile } = props;

  const [open, setOpen] = useState<boolean>(false)
  const { data: hiddenChatsData, isLoading: hiddenChatsLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useGetHiddenChats(
    open && currentUserProfile?.hidden_dialogs?.length > 0,
  );
  const hiddenChats = hiddenChatsData?.pages.flatMap(page => page?.results ?? []) ?? [];

  const accordionGroupChange = (ev: AccordionGroupCustomEvent) => {
    const selectedValue = ev.detail.value;

    if (selectedValue) {
      setOpen(true)
    }
    else {
      setOpen(false)
    }

  };

  return (
    <>
      {currentUserProfile?.hidden_dialogs.length > 0 ?
        <div>
          <IonAccordionGroup onIonChange={accordionGroupChange}>
            <IonAccordion value="first">
              <IonItem slot="header">
                <IonLabel>Hidden chats</IonLabel>
              </IonItem>
              <div slot="content">
                {open ?
                  <>
                    {hiddenChatsLoading ? (
                      <IonRow className="ion-justify-content-center ion-padding">
                        <IonSpinner name="dots" />
                      </IonRow>
                    ) : (
                      <>
                        <IonList id="wl" lines="full">
                          {hiddenChats?.map((e: any) => (
                            <li key={e.id}>
                              {!(currentUserProfile?.blocked_connections.includes(parseInt(e.other_user_id))) ?
                                <HiddenChatItem user={parseInt(e.other_user_id)} currentUserProfile={currentUserProfile} chat={e} />
                                : <></>}
                            </li>
                          ))}
                        </IonList>
                        {hasNextPage ? (
                          <IonRow className="ion-justify-content-center ion-padding">
                            <IonButton
                              size="small"
                              fill="outline"
                              onClick={() => fetchNextPage()}
                              disabled={isFetchingNextPage}
                            >
                              {isFetchingNextPage ? <IonSpinner name="dots" /> : 'Load more'}
                            </IonButton>
                          </IonRow>
                        ) : null}
                      </>
                    )}
                    {/* {currentUserProfile?.blocked_connections.length > 0 ?
                      <div>
                        <IonAccordionGroup >
                          <IonAccordion value="second">
                            <IonItem slot="header">
                              <IonLabel>Blocked Chats</IonLabel>
                            </IonItem>
                            <div slot="content">
                              <IonList id="wl" lines="full">

                                {chatsList?.map((e) => (
                                  <li key={e.id}>
                                    {currentUserProfile?.blocked_connections.includes(parseInt(e.other_user_id)) ?
                                      <HiddenChatItem user={parseInt(e.other_user_id)} currentUserProfile={currentUserProfile} chat={e} />
                                      : <></>}
                                  </li>
                                ))}
                              </IonList>
                            </div>
                          </IonAccordion>
                        </IonAccordionGroup>
                      </div>
                      : <></>} */}
                    </>
                  : <></>}
              </div>
            </IonAccordion>
          </IonAccordionGroup>
        </div>
        : <></>}
    </>

  )
};

export default HiddenChats;
