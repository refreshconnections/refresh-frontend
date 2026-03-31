import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonItem, IonLabel, IonInput, IonAvatar, IonToggle,
  IonSearchbar, IonNote, IonRow, IonSpinner,
  IonAccordion, IonAccordionGroup,
  useIonAlert, useIonModal,
} from '@ionic/react';
import { useChatGroups, useUpdateChatGroups, ChatGroupMember } from '../../hooks/api/chats/chat-groups';
import { useGetMutualConnectionsFiltered } from '../../hooks/api/profiles/mutual-connections-filtered';
import { useProfileDetails } from '../../hooks/api/profiles/details';
import { useGetCurrentProfile } from '../../hooks/api/profiles/current-profile';
import { isPro, isPersonalPlus, onImgError } from '../../hooks/utilities';
import PersonBadge from '../PersonBadge';
import TextModal from '../TextModal';

type RecentUser = { id: number; name: string; pic1_main: string | null };

type Props = {
  subscriptionLevel: string;
  recentUsers: RecentUser[];
  onDismiss: () => void;
};

const GROUP_KEYS = ['group1', 'group2', 'group3'] as const;
const NAME_KEYS = ['group1_name', 'group2_name', 'group3_name'] as const;
const HIDDEN_KEYS = ['group1_hidden', 'group2_hidden', 'group3_hidden'] as const;
const LIST_CAP = 30;
const PAGE_SIZE = 10;

function MemberRow({ member, onRemove }: { member: ChatGroupMember; onRemove?: () => void }) {
  const currentProfile = useGetCurrentProfile().data;

  const [present, dismiss] = useIonModal(TextModal, {
    textModalData: { other_user_id: String(member.id), unread_count: 0 },
    profileDetails: null,
    pro: isPersonalPlus(currentProfile?.subscription_level),
    settingsAlt: currentProfile?.settings_alt_text,
    from_name: currentProfile?.name,
    onDismiss: () => dismiss(),
  });

  return (
    <IonItem
      lines="none"
      button
      onClick={() => present()}
      style={{ '--background': 'var(--ion-color-white)' } as React.CSSProperties}
    >
      <IonAvatar slot="start">
        <img
          src={member.pic1_main ?? '../static/img/null.png'}
          onError={onImgError}
          alt={member.name}
        />
      </IonAvatar>
      <IonLabel>{member.name}</IonLabel>
      {onRemove && (
        <IonButton
          slot="end"
          fill="clear"
          color="danger"
          onClick={e => { e.stopPropagation(); onRemove(); }}
        >
          Remove
        </IonButton>
      )}
    </IonItem>
  );
}

type ListAccordionProps = {
  index: number;
  name: string | null;
  hidden: boolean;
  members: ChatGroupMember[];
  recentUsers: RecentUser[];
  canEdit: boolean;
  onRename: (name: string) => void;
  onToggleHidden: (hidden: boolean) => void;
  onAddMember: (userId: number) => void;
  onRemoveMember: (userId: number) => void;
  onDeleteList: () => void;
};

const ListAccordion: React.FC<ListAccordionProps> = ({
  index, name, hidden, members, recentUsers, canEdit,
  onRename, onToggleHidden, onAddMember, onRemoveMember, onDeleteList,
}) => {
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [page, setPage] = useState(1);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(name ?? '');
  const [presentAlert] = useIonAlert();

  const memberIds = members.map(m => m.id);
  const searchResults = (useGetMutualConnectionsFiltered(search).data as number[] ?? [])
    .filter(id => !memberIds.includes(id));

  const quickAddCandidates = recentUsers
    .filter(u => !memberIds.includes(u.id))
    .slice(0, 3);

  const visibleMembers = members.slice(0, page * PAGE_SIZE);
  const hasMore = members.length > visibleMembers.length;
  const showQuickAdd = canEdit && members.length < 5 && quickAddCandidates.length > 0;
  const atCap = members.length >= LIST_CAP;

  const confirmDelete = () => {
    presentAlert({
      header: 'Remove this list?',
      message: 'This is permanent. Your chats will still be available in All. Type "delete" to confirm.',
      inputs: [{ type: 'text', placeholder: 'delete', name: 'confirm' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove permanently',
          cssClass: 'alert-button-danger',
          handler: (data: { confirm: string }) => {
            if (data.confirm?.toLowerCase().trim() === 'delete') {
              onDeleteList();
              return true;
            }
            return false;
          },
        },
      ],
    });
  };

  return (
    <IonAccordion value={`group${index + 1}`}>
      <IonItem slot="header" lines="full">
        <IonLabel>{name || 'Unnamed list'}</IonLabel>
      </IonItem>
      <div slot="content" style={{ background: 'var(--ion-color-white)' }}>
        {canEdit && (
          <IonItem lines="none" style={{ '--background': 'var(--ion-color-white)' } as React.CSSProperties}>
            {isEditingName ? (
              <>
                <IonInput
                  value={draftName}
                  placeholder="Name this list"
                  maxlength={10}
                  onIonInput={e => setDraftName(e.detail.value ?? '')}
                  autoFocus
                />
                <IonButton slot="end" size="small" fill="clear" color="medium" onClick={() => { setDraftName(name ?? ''); setIsEditingName(false); }}>
                  Cancel
                </IonButton>
                <IonButton slot="end" size="small" color="success" onClick={() => { onRename(draftName); setIsEditingName(false); }}>
                  Save
                </IonButton>
              </>
            ) : (
              <>
                <IonLabel color="medium">{name || 'Unnamed list'}</IonLabel>
                <IonButton slot="end" size="small" fill="outline" color="medium" onClick={() => { setDraftName(name ?? ''); setIsEditingName(true); }}>
                  Edit name
                </IonButton>
              </>
            )}
          </IonItem>
        )}

        {members.length === 0 ? (
          <IonItem lines="none" style={{ '--background': 'var(--ion-color-white)' } as React.CSSProperties}>
            <IonNote>No one added yet</IonNote>
          </IonItem>
        ) : (
          <>
            {visibleMembers.map(m => (
              <MemberRow
                key={m.id}
                member={m}
                onRemove={canEdit ? () => onRemoveMember(m.id) : undefined}
              />
            ))}
            {hasMore && (
              <IonRow className="ion-justify-content-center ion-padding">
                <IonButton size="small" fill="outline" color="medium" onClick={() => setPage(p => p + 1)}>
                  Load more
                </IonButton>
              </IonRow>
            )}
          </>
        )}

        {!canEdit && (
          <IonItem lines="none" style={{ '--background': 'var(--ion-color-white)' } as React.CSSProperties}>
            <IonNote className="ion-text-wrap">Upgrade to Pro to edit this list.</IonNote>
          </IonItem>
        )}

        {showQuickAdd && (
          <div style={{ padding: '12px 16px 4px' }}>
            <IonNote style={{ fontSize: '12px' }}>Quick add</IonNote>
            <div style={{ display: 'flex', gap: '16px', paddingTop: '8px', flexWrap: 'wrap' }}>
              {quickAddCandidates.map(u => (
                <PersonBadge key={u.id} userId={u.id} name={u.name} pic1_main={u.pic1_main} onTap={() => onAddMember(u.id)} />
              ))}
            </div>
          </div>
        )}

        {canEdit && (
          <div style={{ padding: '8px 16px 12px' }}>
            {atCap && (
              <IonNote style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                List is at the maximum of {LIST_CAP} people.
              </IonNote>
            )}
            {!atCap && (
              !showSearch ? (
                <IonButton fill="clear" size="small" color="primary" onClick={() => setShowSearch(true)}>
                  Search for more people to add
                </IonButton>
              ) : (
                <>
                  <IonSearchbar
                    value={search}
                    onIonInput={e => setSearch(e.detail.value ?? '')}
                    placeholder="Search by name…"
                    debounce={300}
                    style={{ '--background': 'var(--ion-color-light)' }}
                  />
                  {search.length > 0 && (
                    searchResults.length === 0
                      ? <IonItem lines="none" style={{ '--background': 'var(--ion-color-white)' } as React.CSSProperties}><IonNote>No matches</IonNote></IonItem>
                      : searchResults.slice(0, 8).map(id => (
                        <IonItem
                          key={id}
                          lines="full"
                          button
                          onClick={() => { onAddMember(id); setSearch(''); setShowSearch(false); }}
                          style={{ '--background': 'var(--ion-color-white)' } as React.CSSProperties}
                        >
                          <MemberName userId={id} />
                        </IonItem>
                      ))
                  )}
                </>
              )
            )}
            <IonItem lines="none" style={{ '--background': 'var(--ion-color-white)', marginTop: '4px' } as React.CSSProperties}>
              <IonLabel>Show in filter bar</IonLabel>
              <IonToggle
                slot="end"
                checked={!hidden}
                onIonChange={e => onToggleHidden(!e.detail.checked)}
              />
            </IonItem>
            <IonRow className="ion-justify-content-end" style={{ paddingTop: '4px' }}>
              <IonButton fill="clear" size="small" color="danger" onClick={confirmDelete}>
                Remove this list
              </IonButton>
            </IonRow>
          </div>
        )}
      </div>
    </IonAccordion>
  );
};

function MemberName({ userId }: { userId: number }) {
  const profile = useProfileDetails(userId).data;
  return <IonLabel>{profile?.name ?? '…'}</IonLabel>;
}

const OrganizeChatsModal: React.FC<Props> = ({ subscriptionLevel, recentUsers, onDismiss }) => {
  const { data: groupsData } = useChatGroups();
  const { mutate: updateGroups } = useUpdateChatGroups();
  const pro = isPro(subscriptionLevel);

  if (!groupsData) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar className="modal-title">
            <IonTitle>Organize your chats</IonTitle>
            <IonButtons slot="end"><IonButton onClick={onDismiss}>Done</IonButton></IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonRow className="ion-justify-content-center ion-padding">
            <IonSpinner name="dots" />
          </IonRow>
        </IonContent>
      </IonPage>
    );
  }

  const patch = (data: object) => updateGroups(data as any);

  const handleRename = (index: number, name: string) => {
    patch({ [NAME_KEYS[index]]: name || null });
  };

  const handleAddMember = (index: number, userId: number) => {
    const current = groupsData[GROUP_KEYS[index]] ?? [];
    if (current.length >= LIST_CAP) return;
    patch({ [GROUP_KEYS[index]]: [...current.map(m => m.id), userId] });
  };

  const handleRemoveMember = (index: number, userId: number) => {
    const current = groupsData[GROUP_KEYS[index]] ?? [];
    patch({ [GROUP_KEYS[index]]: current.filter(m => m.id !== userId).map(m => m.id) });
  };

  const handleToggleHidden = (index: number, hidden: boolean) => {
    patch({ [HIDDEN_KEYS[index]]: hidden });
  };

  const handleDeleteList = (index: number) => {
    patch({ [NAME_KEYS[index]]: null, [GROUP_KEYS[index]]: [] });
  };

  const maxSlots = pro ? 3 : 1;

  const configuredSlots = [0, 1, 2].filter(i => {
    const hasData = (groupsData[GROUP_KEYS[i]]?.length ?? 0) > 0 || !!groupsData[NAME_KEYS[i]];
    return hasData || i === 0; // slot 0 always visible so personalplus users can create their first list
  });

  const nextEmptySlot = [0, 1, 2].find(
    i => i < maxSlots
      && (groupsData[GROUP_KEYS[i]]?.length ?? 0) === 0
      && !groupsData[NAME_KEYS[i]]
  );
  const showAddButton = nextEmptySlot !== undefined;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="modal-title">
          <IonTitle>Organize your chats</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>Done</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonAccordionGroup>
          {configuredSlots.map(i => (
            <ListAccordion
              key={i}
              index={i}
              name={groupsData[NAME_KEYS[i]]}
              hidden={groupsData[HIDDEN_KEYS[i]]}
              members={groupsData[GROUP_KEYS[i]] ?? []}
              recentUsers={recentUsers}
              canEdit={i === 0 || pro}
              onRename={name => handleRename(i, name)}
              onToggleHidden={hidden => handleToggleHidden(i, hidden)}
              onAddMember={userId => handleAddMember(i, userId)}
              onRemoveMember={userId => handleRemoveMember(i, userId)}
              onDeleteList={() => handleDeleteList(i)}
            />
          ))}
        </IonAccordionGroup>

        {showAddButton && (
          <IonRow className="ion-justify-content-center ion-padding">
            <IonButton size="small" fill="outline" color="navy" onClick={() => patch({ [NAME_KEYS[nextEmptySlot!]]: 'New list' })}>
              Add a list
            </IonButton>
          </IonRow>
        )}
      </IonContent>
    </IonPage>
  );
};

export default OrganizeChatsModal;
