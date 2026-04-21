import React, { useEffect, useState } from "react";
import { Preferences } from '@capacitor/preferences';
import OngoingChats from "./OngoingChats";
import NewChats from "./NewChats";
import HiddenChatItem from "./HiddenChatItem";
import ChatItem from "./ChatItem";
import {
  IonButton, IonChip, IonLabel,
  IonList, IonNote, IonRow, IonSearchbar, IonSpinner, IonText, useIonModal,
} from "@ionic/react";
import { useUpsellAlert } from "../../hooks/useUpsellAlert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFrown } from "@fortawesome/pro-regular-svg-icons/faFrown";
import { faAddressBook } from "@fortawesome/pro-solid-svg-icons/faAddressBook";

import './Chats.css';

import { useGetMutualConnectionsFiltered } from "../../hooks/api/profiles/mutual-connections-filtered";
import NewChatItem from "./NewChatItem";
import { useChatGroups } from "../../hooks/api/chats/chat-groups";
import { useLocalMutualConnections } from "../../hooks/api/chats/local-mutual-connections";
import { useGetHiddenChats } from "../../hooks/api/chats/hidden-chats";
import { useFilteredChats } from "../../hooks/api/chats/filtered-chats";
import OrganizeChatsModal from "./OrganizeChatsModal";
import { isPersonalPlus, isPro } from "../../hooks/utilities";

type ActiveTab = 'all' | 'local' | 'hidden' | 'group1' | 'group2' | 'group3';

type Props = {
    mutualConnectionsList: number[],
    chats: any[],
    currentUserProfile: any,
    showSearch: boolean,
    chatsHasNextPage: boolean,
    chatsIsFetchingNextPage: boolean,
    onLoadMoreChats: () => void,
};

const ChatsSegment: React.FC<Props> = (props) => {
    const { mutualConnectionsList, currentUserProfile, chats, showSearch, chatsHasNextPage, chatsIsFetchingNextPage, onLoadMoreChats } = props;

    const [search, setSearch] = useState<string>("");
    const [activeTab, setActiveTab] = useState<ActiveTab>('all');
    const [chatOrganizerEnabled, setChatOrganizerEnabled] = useState<boolean>(true);
    const [chatOrganizerShowHidden, setChatOrganizerShowHidden] = useState<boolean>(false);

    useEffect(() => {
        Preferences.get({ key: 'chat_organizer' }).then(({ value }) => {
            setChatOrganizerEnabled(value !== 'false');
        });
        Preferences.get({ key: 'chat_organizer_show_hidden' }).then(({ value }) => {
            setChatOrganizerShowHidden(value === 'true');
        });
        const handler = (e: Event) => setChatOrganizerEnabled((e as CustomEvent<boolean>).detail);
        const hiddenHandler = (e: Event) => setChatOrganizerShowHidden((e as CustomEvent<boolean>).detail);
        window.addEventListener('chat_organizer_changed', handler);
        window.addEventListener('chat_organizer_show_hidden_changed', hiddenHandler);
        return () => {
            window.removeEventListener('chat_organizer_changed', handler);
            window.removeEventListener('chat_organizer_show_hidden_changed', hiddenHandler);
        };
    }, []);

    useEffect(() => {
        if (activeTab === 'hidden' && !chatOrganizerShowHidden) {
            setActiveTab('all');
        }
    }, [chatOrganizerShowHidden, activeTab]);

    const subscriptionLevel = currentUserProfile?.subscription_level;
    const userIsPro = isPro(subscriptionLevel);
    const userIsPersonalPlus = isPersonalPlus(subscriptionLevel);

    const searchedChats = useGetMutualConnectionsFiltered(search).data;
    const { data: groupsData } = useChatGroups();
    const { data: localIds } = useLocalMutualConnections();
    const {
        data: hiddenChatsData,
        isFetchingNextPage: hiddenIsFetchingNextPage,
        hasNextPage: hiddenHasNextPage,
        fetchNextPage: fetchHiddenNextPage,
    } = useGetHiddenChats(activeTab === 'hidden');
    const hiddenChats = hiddenChatsData?.pages.flatMap(page => page?.results ?? []) ?? [];

    // Derive filter IDs from enriched group member objects
    const group1Ids = groupsData?.group1?.map(m => m.id) ?? [];
    const group2Ids = groupsData?.group2?.map(m => m.id) ?? [];
    const group3Ids = groupsData?.group3?.map(m => m.id) ?? [];

    const getFilterIds = (): number[] | null => {
        if (activeTab === 'local') return localIds ?? [];
        if (activeTab === 'group1') return group1Ids;
        if (activeTab === 'group2') return group2Ids;
        if (activeTab === 'group3') return group3Ids;
        return null;
    };
    const filterIds = getFilterIds();

    // Load chats for non-All tabs on demand
    const { data: filteredChatsData, isFetching: filteredIsFetching } = useFilteredChats(
        filterIds ?? [],
        activeTab !== 'all' && activeTab !== 'hidden' && filterIds !== null && filterIds.length > 0,
    );
    const filteredChats = filteredChatsData ?? [];

    // recentUsers for quick-add in OrganizeChatsModal — already have name/pic from chat list
    const recentUsers = chats.slice(0, 10).map((c: any) => ({
        id: parseInt(c.other_user_id),
        name: c.name,
        pic1_main: c.pic1_main,
    }));

    const [presentManageLists, dismissManageLists] = useIonModal(OrganizeChatsModal, {
        subscriptionLevel,
        recentUsers,
        onDismiss: () => dismissManageLists(),
    });
    const presentUpsellAlert = useUpsellAlert();

    // Build tab list — order: All, Local, named lists, Hidden, address-book chip
    type TabDef = { key: ActiveTab; label: string };
    const tabs: TabDef[] = [{ key: 'all', label: 'All' }];
    if (localIds !== null && localIds !== undefined && localIds.length > 0) {
        tabs.push({ key: 'local', label: 'Local' });
    }

    if (userIsPersonalPlus && groupsData) {
        const slots: { key: ActiveTab; name: string | null; hidden: boolean; memberCount: number }[] = [
            { key: 'group1', name: groupsData.group1_name, hidden: groupsData.group1_hidden, memberCount: group1Ids.length },
        ];
        if (userIsPro || group2Ids.length > 0) {
            slots.push({ key: 'group2', name: groupsData.group2_name, hidden: groupsData.group2_hidden, memberCount: group2Ids.length });
        }
        if (userIsPro || group3Ids.length > 0) {
            slots.push({ key: 'group3', name: groupsData.group3_name, hidden: groupsData.group3_hidden, memberCount: group3Ids.length });
        }
        slots.forEach(({ key, name, hidden, memberCount }) => {
            if (hidden) return;
            if (memberCount > 0) {
                tabs.push({ key, label: name || 'My List' });
            }
        });
    }

    if (chatOrganizerShowHidden) {
        tabs.push({ key: 'hidden', label: 'Hidden' });
    }

    return (
        <>
            {mutualConnectionsList?.length > 0 ?
                <>
                    {/* Filter tabs */}
                    {chatOrganizerEnabled && <div style={{ overflowX: 'auto', display: 'flex', padding: '4px 3px 0', gap: '6px', justifyContent: 'center' }}>
                        {tabs.map(tab => (
                            <IonChip
                                key={tab.key}
                                color={activeTab === tab.key ? 'navy' : 'medium'}
                                onClick={() => setActiveTab(tab.key)}
                                style={{ flexShrink: 0 }}
                            >
                                <IonLabel>{tab.label}</IonLabel>
                            </IonChip>
                        ))}
                        <IonChip color="medium" onClick={() => {
                            if (userIsPersonalPlus) {
                                presentManageLists();
                            } else {
                                presentUpsellAlert({
                                    header: 'Organize your chats',
                                    message: 'Create custom chat filters with a Personal+ or Pro subscription.',
                                });
                            }
                        }} style={{ flexShrink: 0 }}>
                            <IonLabel><FontAwesomeIcon icon={faAddressBook} /></IonLabel>
                        </IonChip>
                    </div>}

                    {/* Search bar */}
                    {showSearch &&
                        <IonRow className="filter-row">
                            <IonSearchbar
                                debounce={500}
                                value={search}
                                onIonInput={e => setSearch(e.detail.value!)}
                                color="navy"
                                placeholder="Looking for someone specific?"
                            />
                        </IonRow>
                    }

                    {/* Search results override */}
                    {showSearch && search ?
                        <IonList id="wl" lines="full">
                            {searchedChats?.map((e: any) => (
                                <li key={String(e)}>
                                    <NewChatItem user={parseInt(e)} currentUserProfile={currentUserProfile} opener={false} />
                                </li>
                            ))}
                            {searchedChats?.length === 0 &&
                                <IonRow className="ion-padding ion-justify-content-center">
                                    <IonNote>Couldn't find anyone &nbsp;<FontAwesomeIcon icon={faFrown} /></IonNote>
                                    <IonNote className="ion-padding ion-justify-content-center">Please note: Unmatched and blocked connections are removed from your chats.</IonNote>
                                </IonRow>
                            }
                            {searchedChats?.length === 1 && currentUserProfile?.blocked_connections?.includes(searchedChats[0]) &&
                                <IonRow className="ion-padding ion-justify-content-center">
                                    <IonNote>Couldn't find anyone &nbsp;<FontAwesomeIcon icon={faFrown} /></IonNote>
                                </IonRow>
                            }
                        </IonList>
                        :
                        <>
                            {/* Hidden tab */}
                            {activeTab === 'hidden' &&
                                <>
                                    {hiddenChatsData && hiddenChats.length === 0 ? (
                                        <IonRow className="ion-justify-content-center ion-padding">
                                            <IonText color="medium">Chats you hide will appear here.</IonText>
                                        </IonRow>
                                    ) : (
                                    <IonList id="wl" lines="full">
                                        {hiddenChats.map((e: any) => (
                                            <li key={e.other_user_id}>
                                                {!currentUserProfile?.blocked_connections.includes(parseInt(e.other_user_id)) &&
                                                    <HiddenChatItem user={parseInt(e.other_user_id)} currentUserProfile={currentUserProfile} chat={e} />
                                                }
                                            </li>
                                        ))}
                                    </IonList>
                                    )}
                                    {hiddenHasNextPage &&
                                        <IonRow className="ion-justify-content-center">
                                            <IonButton size="small" fill="outline" color="navy" onClick={() => fetchHiddenNextPage()} disabled={hiddenIsFetchingNextPage}>
                                                {hiddenIsFetchingNextPage ? <IonSpinner name="dots" /> : 'Load more'}
                                            </IonButton>
                                        </IonRow>
                                    }
                                </>
                            }

                            {/* All tab */}
                            {activeTab === 'all' &&
                                <>
                                    <OngoingChats
                                        currentUserProfile={currentUserProfile}
                                        chatsList={chats}
                                        hasNextPage={chatsHasNextPage}
                                        isFetchingNextPage={chatsIsFetchingNextPage}
                                        onLoadMore={onLoadMoreChats}
                                    />
                                    <NewChats currentUserProfile={currentUserProfile} />
                                </>
                            }

                            {/* Local / custom list tabs: fetch on demand */}
                            {activeTab !== 'all' && activeTab !== 'hidden' &&
                                <>
                                    {filteredIsFetching && filteredChats.length === 0 ? (
                                        <IonRow className="ion-justify-content-center ion-padding">
                                            <IonSpinner name="dots" />
                                        </IonRow>
                                    ) : (
                                        <IonList id="wl" lines="full">
                                            {filteredChats.map((e: any) => (
                                                <li key={e.id}>
                                                    <ChatItem user={parseInt(e.other_user_id)} currentUserProfile={currentUserProfile} chat={e} />
                                                </li>
                                            ))}
                                        </IonList>
                                    )}
                                    <NewChats currentUserProfile={currentUserProfile} filterUserIds={filterIds!} />
                                </>
                            }
                        </>
                    }

                </>
                :
                <IonRow className="ion-justify-content-center ion-padding-top" style={{ padding: "30pt" }}>
                    <img alt="Flower gif" src="../static/img/refresh-icon@3x.png" style={{ width: "50%" }} />
                    <IonText style={{ textAlign: "center" }}>
                        <br /><br />
                        Connect with others in Discovery and Likes to start Chats!
                    </IonText>
                </IonRow>
            }
        </>
    );
};

export default ChatsSegment;
