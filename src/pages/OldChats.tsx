import { AccordionGroupCustomEvent, IonAccordion, IonAccordionGroup, IonAlert, IonAvatar, IonBadge, IonButton, IonContent, IonFab, IonFabButton, IonIcon, IonItem, IonLabel, IonList, IonPage, IonRefresher, IonRefresherContent, IonRow, IonSegment, IonSegmentButton, IonSpinner, IonText, RefresherEventDetail, useIonModal } from '@ionic/react';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getChats, getGroupChatInvites, getGroupChats, getMessages, getMutualConnections, getWebsocketUrl, onImgError } from '../hooks/utilities';
import './Chats.css';
import TextModal from '../components/TextModal';

import "./Page.css"
import CantAccessCard from '../components/CantAccessCard';
import Loading from './Loading';
import LoadingCard from '../components/LoadingCard';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faMessagePlus } from '@fortawesome/pro-solid-svg-icons/faMessagePlus';
import { App } from '@capacitor/app';


import GroupTextModal from '../components/GroupTextModal';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupDetailsModal from '../components/GroupDetailsModal';
import { ChatBadgeContext } from '../components/ChatBadgeContext';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';


const OldChats: React.FC = () => {
  const webSocket = useRef<ReconnectingWebSocket | null>(null);

  const [data, setData] = useState<any>(null);
  const [chats, setChats] = useState<any>(null);
  const [littleLoading, setLittleLoading] = useState<boolean>(false);
  const [groupChats, setGroupChats] = useState<any>(null);
  const [groupChatInvites, setGroupChatInvites] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currSegment, setCurrSegment] = useState<"chats" | "groups">("chats");
  const [showStoreAlert, setShowStoreAlert] = useState(false);

  // const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);

  // const [currentUser, setCurrentUser] = useState<any>(null);

  const [textModalData, setTextModalData] = useState<any>(null)
  const [groupTextModalData, setGroupTextModalData] = useState<any>(null)
  const [groupDetailsData, setGroupDetailsData] = useState<any>(null)

  const { chatBadgeCount, setChatBadgeCount } = useContext(ChatBadgeContext);

  // tanstack query
  const currentUserProfile = useGetCurrentProfile().data;
  

//   App.addListener('resume', async () => {
//     console.log('Returned focus. Reloading.')
// });

// App.addListener('appStateChange', ({ isActive }) => {
//   console.log('App state changed. Is active?', isActive);
//       // setChats(await getOrderedChats(await getChats()));

// });

  const options = {
    connectionTimeout: 1000000,
    maxRetries: 10
  }

  const delay = (ms: any) => new Promise(res => setTimeout(res, ms));


  useEffect(() => {


    const listen = async () => {
      App.addListener('resume', async () => {
        console.log('Returned focus. Reloading.')
        setChats(await getOrderedChats(await getChats()));
      });
    }

    listen();

    console.log("main use effect")

    setLoading(true); // set loading to true


    webSocket.current = new ReconnectingWebSocket(getWebsocketUrl(), [], options)

    webSocket.current.onopen = () => {
      console.log("websocket", webSocket.current)
      console.log("Chats websocket open!")
    }


    const fetchData = async () => {
      setError(null);
      setLoading(true);
      try {
        setData(await getMutualConnections());
        // setCurrentUser(useGetCurrentProfile());
        // setCurrentUser(await getCurrentUserProfile()); // pretanstack
        // setChats(await getOrderedChats(await getChats()));
        setLoading(false);
      } catch (error: any) {
        setError(error.message);
        setLoading(false)
        console.log(error)
      }

    }

    fetchData();

    webSocket.current.onmessage = async (e) => {

      const jsone = JSON.parse(e.data)


      if (jsone.msg_type == 9) {
        // If the message is about the new unread count.
        setChats(await getOrderedChats(await getChats()));

      }


    };

    webSocket.current.onclose = () => {
      console.log("big chat one close!")
    }

    return () => {
      webSocket.current?.close()
    }

  }, []);



  useEffect(() => {

    console.log("text modal data use effect")


    const fetchData = async () => {

      try {
        setChats(getOrderedChats(await getChats()));
        // await getBadgeCount()
      } catch (error: any) {
        console.log(error)
      }

    }
    fetchData();

  }, [textModalData]);

  useEffect(() => {

    console.log("badge count use effect")

    const fetchData = async () => {

      try {
        await getBadgeCount()
      } catch (error: any) {
        console.log(error)
      }

    }

    fetchData();

  }, [chats]);


  useEffect(() => {

    const fetchChatData = async () => {

      try {
        setChats(getOrderedChats(await getChats()));
      } catch (error: any) {
        console.log(error)
      }

    }

    const fetchGroupChatData = async () => {

      try {
        setGroupChats(await getGroupChats());
        setGroupChatInvites(await getGroupChatInvites());
      } catch (error: any) {
        console.log(error)
      }

    }
    if (currSegment == "chats") {
      fetchChatData();
    }
    else {
      fetchGroupChatData();
    }


  }, [currSegment]);




  function getDifference(mutuals_array: any, chats_array: any) {
    return mutuals_array.filter((object1: { user: number }) => {
      return !chats_array.some((object2: { other_user_id: string; }) => {
        return object1.user === parseInt(object2.other_user_id);
      });
    });
  }

  let newChats = []
  if (data && chats) {
    newChats = getDifference(data, chats.data)
  }

  const getBadgeCount = async () => {
    // const chats = await getChats();
    const chatsArray = chats?.data
    let newCount = 0
    chatsArray?.forEach((chat) => newCount = newCount + chat.unread_count);
    console.log("Badge count:", newCount)
    setChatBadgeCount(newCount)
  }

  const handleDismiss = async () => {
    // setLittleLoading(true)
    dismiss();
    // setCurrentUser(await getCurrentUserProfile());
    // delay(500)
    // setData(await getMutualConnections());
    delay(200)
    setChats(getOrderedChats(await getChats()));
    // delay(500)
    // setLittleLoading(false)
  };

  const handleGroupDismiss = () => {
    dismissGroup();
  };

  const handleCreateGroupDismiss = () => {
    dismissCreateGroup();
  };

  function handleRefresh(event: CustomEvent<RefresherEventDetail>) {
    setLittleLoading(true)
    setTimeout(async () => {
      setChats(getOrderedChats(await getChats()));
      setData(await getMutualConnections());
      setGroupChats(await getGroupChats());
      setGroupChatInvites(await getGroupChatInvites());
      event.detail.complete();
      setLittleLoading(false)
    }, 2000);
  }

  const [present, dismiss] = useIonModal(TextModal, {
    textModalData: textModalData,
    pro: currentUserProfile?.subscription_level == "pro",
    settingsAlt: currentUserProfile?.settings_alt_text,
    from_name: currentUserProfile?.name, 
    onDismiss: handleDismiss,
  });

  const [presentGroup, dismissGroup] = useIonModal(GroupTextModal, {
    groupTextModalData: groupTextModalData,
    currentUser: currentUserProfile?.user,
    onDismiss: handleGroupDismiss,
  });


  const [presentCreateGroup, dismissCreateGroup] = useIonModal(CreateGroupModal, {
    onDismiss: handleCreateGroupDismiss,
  });

  const openModal = (item: any, name_override: string, profile_picture: string, current_user_name: string) => {

    item.name = name_override
    item.from = current_user_name
    item.profilePicture = profile_picture
    setTextModalData(item)
    present();
  }

  const openGroupTextModal = (item: any) => {

    setGroupTextModalData(item)
    presentGroup();
  }

  const openCreateGroupModal = () => {

    presentCreateGroup();
  }

  const getOrderedChats = (chats: any) => {
    const chatsArray = chats
    chatsArray?.data.sort((prev: { last_message: { sent: number; }; }, curr: { last_message: { sent: number; }; }) => (curr?.last_message?.sent ?? 0) - (prev?.last_message?.sent ?? 0));
    return chatsArray
  }

  const handleGroupDetailsDismiss = async () => {
    setGroupChats(await getGroupChats());
    setGroupChatInvites(await getGroupChatInvites());
    groupDetailsDismiss()
  }

  const [groupDetailsPresent, groupDetailsDismiss] = useIonModal(GroupDetailsModal, {
    groupDetailsData: groupDetailsData,
    currentUser: currentUserProfile,
    onDismiss: () => handleGroupDetailsDismiss()
  });

  const openGroupDetailsModal = (item: any) => {
    setGroupDetailsData(item)
    groupDetailsPresent();
  }

  const accordionGroupChange = (ev: AccordionGroupCustomEvent) => {
    if (ev.detail.value === "first") {
      console.log(
        "opened and closeds"
      );
    }
  };

  return (
    <IonPage>
      {currentUserProfile && currentUserProfile.created_profile && !(currentUserProfile.deactivated_profile)?
        <IonContent fullscreen>
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>
          <IonRow className="page-title" >
            <img className="color-invertible" src="../static/img/refresh_chats_navy.png" alt="chats" />
          </IonRow>
          {littleLoading ? <IonRow className="ion-justify-content-center"><IonSpinner name="dots"></IonSpinner></IonRow> : <></>}
          <IonRow className="segments">
            <IonSegment value={currSegment}>
              <IonSegmentButton value="chats" onClick={() => setCurrSegment("chats")}>
                <IonLabel>Chats</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="groups" onClick={() => setCurrSegment("groups")}>
                <IonLabel>Groups</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonRow>
          {currSegment == "chats" ?
            <>
              {chats?.data && chats?.data.length == 0 && newChats?.length == 0 ?
                <IonRow className="empty-chats">
                  <img alt="Flower gif" src="../static/img/refresh-icon@3x.png" />
                  <IonText>
                    <br /><br />
                    Connect with others in Picks and Likes to start Chats!
                  </IonText>
                </IonRow>
                : <></>
              }
              <IonList id="wl" lines="full">
                {chats?.data.map((item: any, index: number) => (
                  <li key={index}>
                    { (!(currentUserProfile?.hidden_dialogs.includes(parseInt(item.other_user_id))) && !(currentUserProfile?.blocked_connections.includes(parseInt(item.other_user_id)) )) ?
                    <IonItem className="chat-item" button detail={true} onClick={() => { openModal(item, data?.find((x: { user: number; }) => x.user === Number(item.other_user_id))?.name, data?.find((x: { user: number; }) => x.user === Number(item.other_user_id))?.pic1_main || "../static/img/null.png", currentUserProfile.name) }}>
                      <IonAvatar>
                        <img alt="chat avatar" src={data?.find((x: { user: number; }) => x.user === Number(item.other_user_id))?.pic1_main || "../static/img/null.png"} onError={(e) => onImgError(e)} />
                      </IonAvatar>
                      <IonText className="name">{data?.find((x: { user: number; }) => x.user === Number(item.other_user_id))?.name || "User"}</IonText>
                      {item.unread_count > 0 ? <IonBadge className="unread-badge" slot="end">
                                {currentUserProfile.subscription_level !== "none" && currentUserProfile.settings_new_message_count == true ?
                                  item.unread_count + " new"
                                  : "New message"}
                      </IonBadge>
                        : item.last_message.out == false && item.last_message.heart == false && currentUserProfile.settings_chats_next_reminder? <IonBadge color="gray" slot="end">Keep it going!</IonBadge>
                      : <></>}
                    </IonItem>
                    : <></>}
                  </li>
                ))}
              </IonList>

              {newChats.length > 0 ?
                <div>
                  <IonRow className="page-title">
                    <IonText>
                      <h2>Start a new chat!</h2>
                    </IonText>
                  </IonRow>
                  <IonList id="wl" lines="full">
                    {newChats?.map((item: any, index: number) => (
                      <li key={index}>
                        {!(currentUserProfile?.hidden_dialogs.includes(parseInt(item.user))) ?
                        <IonItem className="chat-item" button detail={true} onClick={() => { openModal({ other_user_id: item.user.toString() }, item.name, item.pic1_main || "../static/img/null.png", currentUserProfile.name) }}>
                          <IonAvatar>
                            <img alt="chat avatar" src={item.pic1_main} onError={(e) => onImgError(e)} />
                          </IonAvatar>
                          <IonText className="name">{item.name}</IonText>
                        </IonItem>
                        : <></>}
                      </li>
                    ))}
                  </IonList>
                </div>
                : <></>}
                {currentUserProfile?.blocked_connections.length + currentUserProfile?.hidden_dialogs.length > 0 ?
              <div>
                <IonAccordionGroup onIonChange={accordionGroupChange}>
                  <IonAccordion value="first">
                    <IonItem slot="header">
                      <IonLabel>Hidden chats</IonLabel>
                    </IonItem>
                      <div slot="content">
                      <IonList id="wl" lines="full">

                        {chats?.data.map((item: any, index: number) => (
                          <li key={index}>
                            {currentUserProfile?.hidden_dialogs.includes(parseInt(item.other_user_id)) ?
                            <IonItem className="chat-item" button detail={true} onClick={() => { openModal(item, data?.find((x: { user: number; }) => x.user === Number(item.other_user_id))?.name, data?.find((x: { user: number; }) => x.user === Number(item.other_user_id))?.pic1_main || "../static/img/null.png", currentUserProfile.name) }}>
                              <IonAvatar>
                                <img alt="chat avatar" src={data?.find((x: { user: number; }) => x.user === Number(item.other_user_id))?.pic1_main || "../static/img/null.png"} onError={(e) => onImgError(e)} />
                              </IonAvatar>
                              <IonText className="name">{data?.find((x: { user: number; }) => x.user === Number(item.other_user_id))?.name || "User"}</IonText>
                              {item.unread_count > 0 ? <IonBadge className="unread-badge" slot="end">
                                {currentUserProfile.subscription_level !== "none" && currentUserProfile.settings_new_message_count == true ?
                                  item.unread_count
                                  : "New message"}
                              </IonBadge>
                                : <></>}
                            </IonItem>
                            : <></>}
                          </li>
                        ))}

                      </IonList>
                      {currentUserProfile?.blocked_connections.length > 0 ?
                      <div>
                      <IonItem>
                        <IonText>Blocked Chats</IonText>
                      </IonItem>
                      <IonList id="wl" lines="full">
                      {chats?.data.map((item: any, index: number) => (
                          <li key={index}>
                            {currentUserProfile?.blocked_connections.includes(parseInt(item.other_user_id)) ?
                            <IonItem className="chat-item" button detail={true} onClick={() => { openModal(item, data?.find((x: { user: number; }) => x.user === Number(item.other_user_id))?.name || "Blocked User", data?.find((x: { user: number; }) => x.user === Number(item.other_user_id))?.pic1_main || "../static/img/null.png", currentUserProfile.name) }}>
                              <IonAvatar>
                                <img alt="chat avatar" src={data?.find((x: { user: number; }) => x.user === Number(item.other_user_id))?.pic1_main || "../static/img/null.png"} onError={(e) => onImgError(e)} />
                              </IonAvatar>
                              <IonText className="name">{data?.find((x: { user: number; }) => x.user === Number(item.other_user_id))?.name || "Blocked User"}</IonText>
                              {item.unread_count > 0 ? <IonBadge className="unread-badge" slot="end">
                                {currentUserProfile.subscription_level !== "none" && currentUserProfile.settings_new_message_count == true ?
                                  item.unread_count
                                  : "New message"}
                              </IonBadge>
                                : <></>}
                            </IonItem>
                            : <></>}
                          </li>
                        ))}
                      </IonList>
                      </div>
                      : <></>}
                    </div>
                  </IonAccordion>
                </IonAccordionGroup>
              </div>
             : <></>}
            </>
            :
            <>
              {groupChats?.data && groupChats?.data.length == 0 && groupChatInvites?.data && groupChatInvites?.data.length == 0 ?
                <IonRow className="empty-chats">
                  <img alt="Flower gif" src="../static/img/refresh-icon@3x.png" />
                  <IonText>
                    <br /><br />
                    Only Subscription holders can start Group Chats.
                  </IonText>
                </IonRow>
                : <></>
              }
              <IonList id="wl" lines="full">
                {groupChats?.data.map((item: any, index: number) => (
                  <li key={index}>
                    <IonItem className="chat-item" button detail={true} onClick={() => openGroupTextModal(item)}>
                      <IonText className="name">{item.group_name !== null ? item.group_name : "New group"}</IonText>
                    </IonItem>
                  </li>
                ))}
              </IonList>
              {groupChatInvites?.data.length > 0 ?
                <div>
                  <IonRow className="page-title">
                    <IonText>
                      <h2>Invites</h2>
                    </IonText>
                  </IonRow>
                  <IonList id="wl" lines="full">
                    {groupChatInvites?.data.map((item: any, index: number) => (
                      <li key={index}>
                        <IonItem className="chat-item" button detail={true} onClick={() => openGroupDetailsModal(item)}>
                          <IonText className="name">{item.group_name !== null ? item.group_name : "New group"}</IonText>
                        </IonItem>
                      </li>
                    ))}
                  </IonList>
                </div>
                : <></>}
              <IonFab className="very-bottom" slot="fixed" vertical="bottom" horizontal="end">
                {currentUserProfile.subscription_level == "pro" && currentUserProfile.settings_create_groups ?
                  <IonFabButton onClick={() => openCreateGroupModal()}>
                    <FontAwesomeIcon icon={faMessagePlus} />
                  </IonFabButton>
                  : currentUserProfile.subscription_level == "pro" && !currentUserProfile.settings_create_groups ?
                    <></>
                    :
                    <IonFabButton onClick={() => setShowStoreAlert(true)}>
                      <FontAwesomeIcon icon={faMessagePlus} />
                      <IonAlert
                        isOpen={showStoreAlert}
                        onDidDismiss={() => setShowStoreAlert(false)}
                        header="Become a Refresh Pro to start groups!"
                        buttons={[{
                          text: "Not now",
                          role: 'destructive'
                        },
                        {
                          text: 'Get Pro!',
                          handler: async () => {
                            window.location.pathname = "/store"
                          }
                        }]}
                      />
                    </IonFabButton>}
              </IonFab>

            </>
          }
        </IonContent>
        :
        <IonContent>
          <IonRow className="page-title">
            <img src="../static/img/refresh_chats_navy.png" alt="chats" />
          </IonRow>
          {loading ? <LoadingCard /> : <CantAccessCard tabName="Chats" />}
        </IonContent>
      }
    </IonPage>
  );
};

export default OldChats;
