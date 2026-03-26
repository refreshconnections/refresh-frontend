import React, { useState } from "react";

import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonItem, IonLabel, IonButtons, IonPage, IonInput, IonNote, IonIcon, IonAccordion, IonAccordionGroup, IonRow, IonSpinner, useIonAlert, useIonModal } from '@ionic/react';
import { informationCircleOutline } from 'ionicons/icons';
import BlockTypesExplainedModal from './BlockTypesExplainedModal';

import { clearHiddenSomething, communityBlockMigration, removeFromHiddenDialogs, removeCommunityBlocked } from "../hooks/utilities";
import { useGetCurrentProfile } from "../hooks/api/profiles/current-profile";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../hooks/api/api-client";
import { userQueryKeys } from "../hooks/api/profiles/user-query-keys";
import { useGetHiddenChats } from "../hooks/api/chats/hidden-chats";
import { useProfileDetails } from "../hooks/api/profiles/details";
import { chatQueryKeys } from "../hooks/api/chats/chat-query-keys";
import "../pages/Settings.css";


type Props = {
    onDismiss: () => void;
};

type CommunityBlockedResult = {
    user_id: number;
    username: string | null;
    name: string;
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
    const [communityResults, setCommunityResults] = useState<CommunityBlockedResult[]>([]);
    const [communitySearching, setCommunitySearching] = useState(false);

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

    const handleCommunitySearch = async (q: string) => {
        setCommunitySearch(q);
        if (q.trim().length === 0) {
            setCommunityResults([]);
            return;
        }
        setCommunitySearching(true);
        try {
            const res = await apiClient.get(`/api/profiles/community_blocked/search/`, { params: { q: q.trim() } });
            setCommunityResults(res.data);
        } finally {
            setCommunitySearching(false);
        }
    };

    const handleRemoveCommunityBlock = async (userId: number) => {
        await removeCommunityBlocked(userId);
        queryClient.invalidateQueries({ queryKey: userQueryKeys.current });
        setCommunityResults(prev => prev.filter(r => r.user_id !== userId));
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="modal-title">
                    <IonTitle>Hidden Content</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onDismiss}>Done</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonAccordionGroup onIonChange={e => setChatsOpen(!!e.detail.value)}>
                    <IonAccordion value="chats">
                        <IonItem slot="header" lines="full">
                            <IonLabel className="ion-text-wrap">Hidden chats ({data?.hidden_dialogs?.length ?? 0})</IonLabel>
                        </IonItem>
                        <div slot="content">
                            <div style={{ margin: 8, background: 'var(--ion-color-white)', borderRadius: 10 }}>
                            {hasNextPage && (
                                <IonItem lines="none" style={{ '--background': 'var(--ion-color-white)' } as React.CSSProperties}>
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
                        </div>
                    </IonAccordion>
                </IonAccordionGroup>

                <IonItem lines="full">
                    <IonLabel className="ion-text-wrap">Hidden posts ({data?.hidden_announcements?.length ?? 0})</IonLabel>
                    {(data?.hidden_announcements?.length ?? 0) > 0 && (
                        <IonButton slot="end" fill="clear" onClick={() => confirmClear("posts")}>Unhide all</IonButton>
                    )}
                </IonItem>

                {(data?.blocked_connections?.length ?? 0) > 0 && (
                    <IonItem lines="full">
                        <IonLabel className="ion-text-wrap">
                            Upgrade personal blocks
                            <p>Make sure all personal blocks are blocked in the community too</p>
                        </IonLabel>
                        <IonButton slot="end" fill="clear" onClick={handleUpgradePersonalBlocks}>Upgrade all</IonButton>
                    </IonItem>
                )}

                {(data?.community_blocked?.length ?? 0) > 0 && (
                    <>
                        <IonAccordionGroup>
                            <IonAccordion value="community">
                                <IonItem slot="header" lines="full">
                                    <IonLabel className="ion-text-wrap">Remove a community block</IonLabel>
                                </IonItem>
                                <div slot="content">
                                    <IonItem lines="none">
                                        <IonInput
                                            className="whitebox"
                                            placeholder="Search by username"
                                            value={communitySearch}
                                            onIonInput={e => handleCommunitySearch(e.detail.value ?? '')}
                                            clearInput
                                        />
                                    </IonItem>
                                    {communitySearch.trim().length > 0 && communitySearch.trim().length < 4 && (
                                        <IonItem lines="none"><IonNote>Enter at least 4 characters, or an exact match</IonNote></IonItem>
                                    )}
                                    {communitySearching && (
                                        <IonItem lines="none"><IonNote>Searching…</IonNote></IonItem>
                                    )}
                                    {!communitySearching && communitySearch.trim().length > 0 && communityResults.length === 0 && (
                                        <IonItem lines="none"><IonNote>No results match that search</IonNote></IonItem>
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
                        <IonItem lines="none" style={{ marginTop: 8 }}>
                            <IonButton fill="clear" color="primary" onClick={() => blockTypesPresent()}>
                                <IonIcon slot="start" icon={informationCircleOutline} />
                                What is the difference between community and personal blocks?
                            </IonButton>
                        </IonItem>
                    </>
                )}
            </IonContent>
        </IonPage>
    );
};

export default EditHiddenContentModal;
