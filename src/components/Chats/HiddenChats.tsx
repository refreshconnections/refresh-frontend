import { AccordionGroupCustomEvent, IonAccordion, IonAccordionGroup, IonAvatar, IonBadge, IonItem, IonLabel, IonList, IonRow, IonText } from "@ionic/react";
import React, { useState } from "react";
import HiddenChatItem from "./HiddenChatItem";
import { useGetMutualConnectionsNoDialogWOpenerCheck } from "../../hooks/api/profiles/mutuals-no-dialog";




type Props = {
  currentUserProfile: any;
  chatsList: any
};


const HiddenChats: React.FC<Props> = (props) => {
  const { currentUserProfile, chatsList } = props;

  const [open, setOpen] = useState<boolean>(false)

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
                    <IonList id="wl" lines="full">
                      {chatsList?.map((e) => (
                        <li key={e.id}>
                          {!(currentUserProfile?.blocked_connections.includes(parseInt(e.other_user_id))) ?
                            <HiddenChatItem user={parseInt(e.other_user_id)} currentUserProfile={currentUserProfile} chat={e} />
                            : <></>}
                        </li>
                      ))}
                    </IonList>
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
