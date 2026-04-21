import React, { useState } from "react";

import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem, IonLabel, IonButtons, IonPage, IonInput, IonNote, IonIcon, IonAccordion, IonAccordionGroup, IonRow, IonSpinner, IonList, useIonAlert, useIonModal } from '@ionic/react';
import { informationCircleOutline } from 'ionicons/icons';
import BlockTypesExplainedModal from './BlockTypesExplainedModal';

import { clearHiddenSomething, communityBlockMigration, removeFromHiddenDialogs, removeCommunityBlocked } from "../hooks/utilities";
import { useGetCurrentProfile } from "../hooks/api/profiles/current-profile";
import { useQueryClient } from "@tanstack/react-query";
import { userQueryKeys } from "../hooks/api/profiles/user-query-keys";
import { useGetHiddenChats } from "../hooks/api/chats/hidden-chats";
import { useProfileDetails } from "../hooks/api/profiles/details";
import { chatQueryKeys } from "../hooks/api/chats/chat-query-keys";
import { useSearchCommunityBlocked } from "../hooks/api/profiles/community-blocked-search";
import "../pages/Settings.css";


type Props = {
    onDismiss: () => void;
};

const HiddenChatRow: React.FC<{ chat: any; nameFilter: string; onUnhide: (userId: number) => void }> = ({ chat, nameFilter, onUnhide }) => {
    const userId = parseInt(chat.other_user_id);
    const profileDetails = useProfileDetails(userId).data;
    const name = profileDetails?.name || '';
    if (nameFilter && name && !name.toLowerCase().includes(nameFilter.toLowerCase())) return null;
    return (
        <IonItem lines="full" style={{ '--background': 'var(--ion-color-white)' } as React.CSSProperties}>
            <IonLabel>{name || '...'}</IonLabel>
            <IonButton slot="end" fill="clear" color="danger" onClick={() => onUnhide(userId)}>Unhide</IonButton>
        </IonItem>
    );
};


const EditHiddenContentModal: React.FC<Props> = (props) => {

    const { onDismiss } = props;
    const data = useGetCurrentProfile().data;

    const [confirmClearHiddenAlert] = useIonAlert();
    const [upgradeAlert] = useIonAlert();
    const [blockTypesPresent, blockTypesDismiss] = useIonModal(BlockTypesExplainedModal, {
        onDismiss: () => blockTypesDismiss(),
    });
    const queryClient = useQueryClient();

    const [chatSearch, setChatSearch] = useState('');
    const [chatsOpen, setChatsOpen] = useState(false);
    const { data: hiddenChatsData, isLoading: hiddenChatsLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useGetHiddenChats(
        chatsOpen && (data?.hidden_dialogs?.length ?? 0) > 0,
    );
    const hiddenChats = hiddenChatsData?.pages.flatMap((page: any) => page?.results ?? []) ?? [];

    const [communitySearch, setCommunitySearch] = useState('');
    const trimmedCommunitySearch = communitySearch.trim();
    const communityBlockedSearch = useSearchCommunityBlocked(communitySearch, Boolean(data?.community_blocked?.length));
    const communityResults = communityBlockedSearch.data ?? [];
    const communitySearching = communityBlockedSearch.isLoading || communityBlockedSearch.isFetching;

    const confirmClear = async (something: string) => {
        confirmClearHiddenAlert({
            header: `Are you sure you want to clear all the ${something} you've hidden?`,
            buttons: [
                { text: 'Nevermind', role: 'destructive' },
                {
                    text: 'Yes',
                    handler: async () => {
                        await clearHiddenSomething(something);
                        queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
                    }
                },
            ],
        });
    };

    const handleUpgradePersonalBlocks = () => {
        const communityIds: number[] = data?.community_blocked ?? [];
        const toUpgrade = (data?.blocked_connections ?? [] as number[]).filter(
            (id: number) => !communityIds.includes(id)
        ).length;
        upgradeAlert({
            header: 'Upgrade personal blocks',
            message: toUpgrade === 0
                ? 'All your personal blocks are already community blocks.'
                : `${toUpgrade} personal block${toUpgrade === 1 ? '' : 's'} will be upgraded to community blocks.`,
            buttons: toUpgrade === 0
                ? [{ text: 'OK', role: 'cancel' }]
                : [
                    { text: 'Cancel', role: 'cancel' },
                    {
                        text: 'Upgrade all',
                        handler: async () => {
                            await communityBlockMigration();
                            queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
                        }
                    },
                ],
        });
    };

    const handleUnhideChat = async (userId: number) => {
        await removeFromHiddenDialogs(userId);
        queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
        queryClient.invalidateQueries({ queryKey: chatQueryKeys.hidden });
    };

    const handleRemoveCommunityBlock = async (userId: number) => {
        await removeCommunityBlocked(userId);
        queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
        queryClient.invalidateQueries({ queryKey: userQueryKeys.community_blocked_search(trimmedCommunitySearch) });
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="modal-title">
                    <IonTitle>Hidden Content and Blocks</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onDismiss}>Done</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="settings settings__modal-content">
                <IonList className="settings__modal-list">
                    <IonNote className="ion-text-wrap">Hidden</IonNote>
                    <IonAccordionGroup onIonChange={e => setChatsOpen(!!e.detail.value)}>
                        <IonAccordion value="chats" disabled={(data?.hidden_dialogs?.length ?? 0) === 0}>
                            <IonItem slot="header" lines="full">
                                <IonLabel className="ion-text-wrap">
                                    <span className="settings__label-heading">Hidden Chats ({data?.hidden_dialogs?.length ?? 0})</span>
                                    <p>Chats you’ve hidden from your list. You can unhide them anytime.</p>
                                </IonLabel>
                            </IonItem>
                            <div slot="content" className="settings__modal-accordion-content">
                                {hasNextPage && (
                                    <IonItem lines="none" className="settings__modal-subitem">
                                        <IonInput
                                            className="whitebox"
                                            placeholder="Search by name"
                                            value={chatSearch}
                                            onIonInput={e => setChatSearch(e.detail.value ?? '')}
                                            clearInput
                                        />
                                    </IonItem>
                                )}
                                {hiddenChatsLoading ? (
                                    <IonRow className="ion-justify-content-center ion-padding">
                                        <IonSpinner name="dots" />
                                    </IonRow>
                                ) : (
                                    <>
                                        {hiddenChats.map((chat: any) => (
                                            <HiddenChatRow
                                                key={chat.id}
                                                chat={chat}
                                                nameFilter={chatSearch}
                                                onUnhide={handleUnhideChat}
                                            />
                                        ))}
                                        {hasNextPage && (
                                            <IonRow className="ion-justify-content-center ion-padding">
                                                <IonButton size="small" fill="outline" color="medium" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                                                    {isFetchingNextPage ? <IonSpinner name="dots" /> : 'Load more'}
                                                </IonButton>
                                            </IonRow>
                                        )}
                                    </>
                                )}
                            </div>
                        </IonAccordion>
                    </IonAccordionGroup>

                    <IonItem lines="full">
                        <IonLabel className="ion-text-wrap">
                            <span className="settings__label-heading">Hidden Posts ({data?.hidden_announcements?.length ?? 0})</span>
                            <p>Posts you chose not to see again. You can restore them anytime.</p>
                        </IonLabel>
                        {(data?.hidden_announcements?.length ?? 0) > 0 && (
                            <IonButton slot="end" fill="clear" onClick={() => confirmClear("posts")}>Unhide all</IonButton>
                        )}
                    </IonItem>

                    <IonItem lines="full">
                        <IonLabel className="ion-text-wrap">
                            <span className="settings__label-heading">Hidden Authors ({data?.hidden_authors?.length ?? 0})</span>
                            <p>Authors whose posts you’ve hidden from your view. You can restore them anytime.</p>
                        </IonLabel>
                        {(data?.hidden_authors?.length ?? 0) > 0 && (
                            <IonButton slot="end" fill="clear" onClick={() => confirmClear("authors")}>Unhide all</IonButton>
                        )}
                    </IonItem>

                    <IonNote className="ion-text-wrap">Blocks</IonNote>
                    <IonItem lines="full">
                        <IonLabel className="ion-text-wrap">
                            <span className="settings__label-heading">Personal Blocks ({data?.blocked_connections?.length ?? 0})</span>
                            <p>Permanent one-to-one blocks.</p>
                        </IonLabel>
                    </IonItem>

                    {(data?.blocked_connections?.length ?? 0) > 0 && (
                        <IonItem lines="full">
                            <IonLabel className="ion-text-wrap">
                                <span className="settings__label-heading">Upgrade Personal Blocks</span>
                                <p>Upgrade your existing personal blocks into full community blocks too.</p>
                            </IonLabel>
                            <IonButton slot="end" fill="clear" onClick={handleUpgradePersonalBlocks}>Upgrade all</IonButton>
                        </IonItem>
                    )}

                    {(data?.community_blocked?.length ?? 0) > 0 ? (
                        <>
                            <IonAccordionGroup>
                                <IonAccordion value="community">
                                    <IonItem slot="header" lines="full">
                                        <IonLabel className="ion-text-wrap">
                                            <span className="settings__label-heading">Full Community Blocks ({data?.community_blocked?.length ?? 0})</span>
                                            <p>Blocks on the community side, including posts and comments, in addition to the Personal Block.</p>
                                        </IonLabel>
                                    </IonItem>
                                    <div slot="content" className="settings__modal-accordion-content">
                                        <IonItem lines="none" className="settings__modal-subitem">
                                            <IonInput
                                                className="whitebox"
                                                placeholder="Search by username"
                                                value={communitySearch}
                                                onIonInput={e => setCommunitySearch(e.detail.value ?? '')}
                                                clearInput
                                            />
                                        </IonItem>
                                        {trimmedCommunitySearch.length > 0 && trimmedCommunitySearch.length < 4 && (
                                            <IonItem lines="none" className="settings__modal-subitem"><IonNote className="settings__inline-note">Enter at least 4 characters, or an exact match</IonNote></IonItem>
                                        )}
                                        {communitySearching && (
                                            <IonItem lines="none" className="settings__modal-subitem"><IonNote className="settings__inline-note">Searching…</IonNote></IonItem>
                                        )}
                                        {!communitySearching && trimmedCommunitySearch.length > 0 && communityResults.length === 0 && (
                                            <IonItem lines="none" className="settings__modal-subitem"><IonNote className="settings__inline-note">No results match that search</IonNote></IonItem>
                                        )}
                                        {communityResults.filter(r => r.username).map(result => (
                                            <IonItem key={result.user_id} lines="full">
                                                <IonLabel>@{result.username}</IonLabel>
                                                <IonButton slot="end" fill="clear" color="danger" onClick={() => handleRemoveCommunityBlock(result.user_id)}>
                                                    Remove
                                                </IonButton>
                                            </IonItem>
                                        ))}
                                    </div>
                                </IonAccordion>
                            </IonAccordionGroup>
                            <IonItem lines="none" className="settings__modal-info-row">
                                <IonButton fill="clear" color="primary" onClick={() => blockTypesPresent()}>
                                    <IonIcon slot="start" icon={informationCircleOutline} />
                                    What is the difference between Personal Blocks and Full Community Blocks?
                                </IonButton>
                            </IonItem>
                        </>
                    ) : (
                        <>
                            <IonItem lines="full">
                                <IonLabel className="ion-text-wrap">
                                    <span className="settings__label-heading">Full Community Blocks ({data?.community_blocked?.length ?? 0})</span>
                                    <p>Blocks on the community side, including posts and comments, in addition to the Personal Block.</p>
                                </IonLabel>
                            </IonItem>
                            <IonItem lines="none" className="settings__modal-info-row">
                                <IonButton fill="clear" color="primary" onClick={() => blockTypesPresent()}>
                                    <IonIcon slot="start" icon={informationCircleOutline} />
                                    What is the difference between Personal Blocks and Full Community Blocks?
                                </IonButton>
                            </IonItem>
                        </>
                    )}
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default EditHiddenContentModal;
