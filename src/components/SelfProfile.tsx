import {
    IonLabel,
    IonItem,
    IonAccordion,
    IonAccordionGroup,
    IonRow, IonGrid, IonCol,
    IonCard, IonCardContent,
    IonButton,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
    IonList,
    IonNote,
    useIonModal,
    IonTextarea,
    IonText,
    IonToggle,
    useIonAlert
} from '@ionic/react';
import React, { useEffect, useMemo, useState } from 'react';
import './SelfProfile.css';

import { updateCurrentUserProfile } from '../hooks/utilities';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faFaceViewfinder, faX, faCheck, faEllipsis, faStar } from '@fortawesome/pro-solid-svg-icons';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';

import CroppedImageModal from './CroppedImageModal';
import ProfileModal from './ProfileModal';
import LoadingCard from './LoadingCard';
import EditPhotoGridRow from './EditPhotoGridRow';
import EditLocationModal from './EditLocationModal';
import EditUsernameModal from './EditUsernameModal';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useQueryClient } from '@tanstack/react-query';

// -------------------------
// Types
// -------------------------

type StringArray = string[];

type FormState = {
    // basics
    pronouns: string;
    pronounsSelector: string; // 'she/her' | 'he/him' | 'they/them' | 'custom'
    customPronouns: string;

    bio: string;
    location: string;
    job: string;
    politics: string;
    school: string;
    sexualOrientation: string;
    gender_and_sexuality_info: string;
    hometown: string;

    // height edited via feet/inches controls
    heightFeet: string; // '3'...'7'
    heightInches: string; // '0'...'11'

    alcohol: string;
    cigarettes: string;
    kids_info: string;

    looking_for: StringArray;
    gender_sexuality_choices: StringArray;
    long_covid_choices: StringArray;
    covid_precautions: number[];
    covid_precaution_info: string;

    // toggles
    settings_show_gender_sexuality: boolean;
    settings_show_long_covid: boolean;
    settings_profile_banner_bool: boolean;
    settings_profile_banner?: string;

    // "let's talk about"
    together_idea: string;
    freetime: string;
    hobby: string;
    petpeeve: string;
    talent: string;

    // faves
    fave_book: string;
    fave_movie: string;
    fave_tv: string;
    fave_topic: string;
    fave_musicalartist: string;
    fave_game: string;
    fave_album: string;
    fave_sport_watch: string;
    fave_sport_play: string;

    // current fixations
    fixation_book: string;
    fixation_movie: string;
    fixation_tv: string;
    fixation_topic: string;
    fixation_musicalartist: string;
    fixation_game: string;
    fixation_album: string;
};

type EditingMap = Record<string, boolean>;

const initialForm: FormState = {
    pronouns: '',
    pronounsSelector: '',
    customPronouns: '',

    bio: '',
    location: '',
    job: '',
    politics: '',
    school: '',
    sexualOrientation: '',
    gender_and_sexuality_info: '',
    hometown: '',

    heightFeet: '',
    heightInches: '',

    alcohol: '',
    cigarettes: '',
    kids_info: '',

    looking_for: [],
    gender_sexuality_choices: [],
    long_covid_choices: [],
    covid_precautions: [],
    covid_precaution_info: '',

    settings_show_gender_sexuality: false,
    settings_show_long_covid: false,
    settings_profile_banner_bool: false,
    settings_profile_banner: undefined,

    together_idea: '',
    freetime: '',
    hobby: '',
    petpeeve: '',
    talent: '',

    fave_book: '',
    fave_movie: '',
    fave_tv: '',
    fave_topic: '',
    fave_musicalartist: '',
    fave_game: '',
    fave_album: '',
    fave_sport_watch: '',
    fave_sport_play: '',

    fixation_book: '',
    fixation_movie: '',
    fixation_tv: '',
    fixation_topic: '',
    fixation_musicalartist: '',
    fixation_game: '',
    fixation_album: '',
};

const allEditableKeys: (keyof FormState)[] = [
    'pronouns',
    'bio',
    'location',
    'job',
    'politics',
    'school',
    'sexualOrientation',
    'gender_and_sexuality_info',
    'hometown',
    'alcohol',
    'cigarettes',
    'kids_info',
    'looking_for',
    'gender_sexuality_choices',
    'long_covid_choices',
    'covid_precautions',
    'covid_precaution_info',
    'together_idea',
    'freetime',
    'hobby',
    'petpeeve',
    'talent',
    'fave_book',
    'fave_movie',
    'fave_tv',
    'fave_topic',
    'fave_musicalartist',
    'fave_game',
    'fave_album',
    'fave_sport_watch',
    'fave_sport_play',
    'fixation_book',
    'fixation_movie',
    'fixation_tv',
    'fixation_topic',
    'fixation_musicalartist',
    'fixation_game',
    'fixation_album',
];

const SelfProfile: React.FC = () => {
    const currentUserProfile: any = useGetCurrentProfile().data;
    const queryClient = useQueryClient();

    const [form, setForm] = useState<FormState>(initialForm);
    const [editing, setEditing] = useState<EditingMap>({});

    const [image, setImage] = useState<any>(null);
    const [imageName, setImageName] = useState<string | null>(null);
    const [picDb, setPicDB] = useState<any>(null);
    const [profileCardData, setProfileCardData] = useState<any>(null);

    const [presentShowContactSupportAlert] = useIonAlert();

    // ---------------
    // Load -> Form
    // ---------------
    useEffect(() => {
        if (!currentUserProfile) return;

        setForm(prev => ({
            ...prev,
            // basics
            pronouns: currentUserProfile?.pronouns ?? '',
            bio: currentUserProfile?.bio ?? '',
            location: currentUserProfile?.location ?? '',
            job: currentUserProfile?.job ?? '',
            politics: currentUserProfile?.politics ?? '',
            school: currentUserProfile?.school ?? '',
            sexualOrientation: currentUserProfile?.sexualOrientation ?? '',
            gender_and_sexuality_info: currentUserProfile?.gender_and_sexuality_info ?? '',
            hometown: currentUserProfile?.hometown ?? '',

            // height is displayed from profile; inputs are separate and optional
            heightFeet: '',
            heightInches: '',

            alcohol: currentUserProfile?.alcohol ?? '',
            cigarettes: currentUserProfile?.cigarettes ?? '',
            kids_info: currentUserProfile?.kids_info ?? '',

            looking_for: currentUserProfile?.looking_for ?? [],
            gender_sexuality_choices: currentUserProfile?.gender_sexuality_choices ?? [],
            long_covid_choices: currentUserProfile?.long_covid_choices ?? [],
            covid_precautions: currentUserProfile?.covid_precautions ?? [],
            covid_precaution_info: currentUserProfile?.covid_precaution_info ?? '',

            settings_show_gender_sexuality: !!currentUserProfile?.settings_show_gender_sexuality,
            settings_show_long_covid: !!currentUserProfile?.settings_show_long_covid,
            settings_profile_banner_bool: !!currentUserProfile?.settings_profile_banner_bool,
            settings_profile_banner: currentUserProfile?.settings_profile_banner,

            together_idea: currentUserProfile?.together_idea ?? '',
            freetime: currentUserProfile?.freetime ?? '',
            hobby: currentUserProfile?.hobby ?? '',
            petpeeve: currentUserProfile?.petpeeve ?? '',
            talent: currentUserProfile?.talent ?? '',

            fave_book: currentUserProfile?.fave_book ?? '',
            fave_movie: currentUserProfile?.fave_movie ?? '',
            fave_tv: currentUserProfile?.fave_tv ?? '',
            fave_topic: currentUserProfile?.fave_topic ?? '',
            fave_musicalartist: currentUserProfile?.fave_musicalartist ?? '',
            fave_game: currentUserProfile?.fave_game ?? '',
            fave_album: currentUserProfile?.fave_album ?? '',
            fave_sport_watch: currentUserProfile?.fave_sport_watch ?? '',
            fave_sport_play: currentUserProfile?.fave_sport_play ?? '',

            fixation_book: currentUserProfile?.fixation_book ?? '',
            fixation_movie: currentUserProfile?.fixation_movie ?? '',
            fixation_tv: currentUserProfile?.fixation_tv ?? '',
            fixation_topic: currentUserProfile?.fixation_topic ?? '',
            fixation_musicalartist: currentUserProfile?.fixation_musicalartist ?? '',
            fixation_game: currentUserProfile?.fixation_game ?? '',
            fixation_album: currentUserProfile?.fixation_album ?? '',
        }));

        // clear editing flags on load
        setEditing({});
    }, [currentUserProfile]);

    // -------------------------
    // Helpers
    // -------------------------
    const setEdit = (key: keyof EditingMap, val: boolean) => setEditing(prev => ({ ...prev, [key]: val }));

    const onText = (key: keyof FormState) => (e: any) => {
        const value = e?.detail?.value ?? '';
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const onSelect = (key: keyof FormState) => (e: any) => {
        const value = e?.detail?.value;
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const toggleArrayString = (key: keyof FormState, value: string, checked: boolean) => {
        setForm(prev => {
            const arr = (prev[key] as StringArray) ?? [];
            const next = checked
                ? (arr.includes(value) ? arr : [...arr, value])
                : arr.filter(v => v !== value);

            return { ...prev, [key]: next } as FormState;
        });
    };

    const toggleArrayNumber = (key: keyof FormState, valueRaw: any, checked: boolean) => {
        const value = Number(valueRaw);
        setForm(prev => {
            const arr = (prev[key] as number[]) ?? [];
            const next = checked
                ? (arr.includes(value) ? arr : [...arr, value])
                : arr.filter(v => v !== value);

            return { ...prev, [key]: next } as FormState;
        });
    };

    const anyEdits = useMemo(() => Object.values(editing).some(Boolean), [editing]);

    const showContactSupport = async (field: string, field2: string) => {
        presentShowContactSupportAlert({
            header: `To keep our community authentic, we require you to contact support if you need to update your ${field}.`,
            subHeader: `Please use our Help feature and include what you would like your ${field2} updated to.`,
            buttons: [
                { text: 'Nevermind', role: 'cancel' },
                { text: 'Get Help', handler: () => { window.location.href = '/help'; } },
            ],
        });
    };

    // Build payload for a set of field keys
    const buildPayload = (keys: (keyof FormState)[]): any => {
        const payload: any = {};
        keys.forEach((key) => {
            if (key === 'pronouns') {
                const resolved = form.pronounsSelector === 'custom' && form.customPronouns
                    ? form.customPronouns
                    : (form.pronounsSelector || form.pronouns);
                if (resolved !== undefined) payload.pronouns = resolved ?? '';
                return;
            }
            if (key === 'looking_for' || key === 'gender_sexuality_choices' || key === 'long_covid_choices') {
                payload[key] = form[key] ?? [];
                return;
            }
            if (key === 'covid_precautions') {
                payload[key] = form[key] ?? [];
                return;
            }
            if (key === 'location' || key === 'job' || key === 'politics' || key === 'school' || key === 'kids_info' || key === 'bio' || key === 'gender_and_sexuality_info' || key === 'hometown' || key === 'covid_precaution_info' || key === 'freetime' || key === 'together_idea' || key === 'hobby' || key === 'petpeeve' || key === 'talent' || key === 'fave_book' || key === 'fave_movie' || key === 'fave_tv' || key === 'fave_topic' || key === 'fave_musicalartist' || key === 'fave_game' || key === 'fave_album' || key === 'fave_sport_watch' || key === 'fave_sport_play' || key === 'fixation_book' || key === 'fixation_movie' || key === 'fixation_tv' || key === 'fixation_topic' || key === 'fixation_musicalartist' || key === 'fixation_game' || key === 'fixation_album') {
                payload[key] = (form as any)[key] ?? '';
                return;
            }
            // NOTE: height is not part of FormState keys list above; we handle it explicitly via editing['height']
        });
        // handle height save when editing.height is true
        if (editing['height']) {
            if (form.heightFeet) {
                payload['height'] = `${form.heightFeet}'${form.heightInches || '0'}`;
            } else {
                payload['height'] = '';
            }
        }
        return payload;
    };

    const save = async (keys: (keyof FormState)[] = []) => {
        const payload = buildPayload(keys);
        if (Object.keys(payload).length === 0) return;
        await updateCurrentUserProfile(payload);
        // turn off editing flags for those keys
        setEditing(prev => {
            const next = { ...prev };
            keys.forEach(k => { next[String(k)] = false; });
            if (prev['height']) next['height'] = false;
            return next;
        });
        await queryClient.invalidateQueries({ queryKey: ['current'] });
    };

    const saveAll = async () => {
        const keys = allEditableKeys.filter(k => editing[String(k)]);
        await save(keys);
    };

    const saveSingle = async (key: keyof FormState | 'height') => {
        if (key === 'height') {
            await save([]); // buildPayload reads editing.height flag
            return;
        }
        await save([key as keyof FormState]);
    };

    // ---------- Modals ----------
    const [profilePresent, profileDismiss] = useIonModal(ProfileModal, {
        cardData: currentUserProfile,
        pro: true,
        settingsAlt: true,
        profiletype: 'self',
        yourName: currentUserProfile?.name || '',
        onDismiss: (data: string, role: string) => profileDismiss(data, role),
    });

    const openModal = (item: any) => {
        saveAll();
        setProfileCardData(item);
        profilePresent();
    };

    const [cropPresent, cropDismiss] = useIonModal(CroppedImageModal, {
        image: image,
        picDb: picDb,
        imageName: imageName,
        onDismiss: async () => {
            cropDismiss();
            await saveAll();
        },
    });

    const [locationPresent, locationDismiss] = useIonModal(EditLocationModal, {
        onDismiss: () => locationDismiss(),
    });

    const [usernamePresent, usernameDismiss] = useIonModal(EditUsernameModal, {
        onDismiss: () => usernameDismiss(),
    });

    // ---------- Render ----------
    if (!currentUserProfile) return <LoadingCard />;

    return (
        <div>
            <IonCard className="margins">
                <IonRow className="ion-justify-content-center">
                    <IonButton onClick={() => openModal(currentUserProfile)} className="ion-text-wrap">
                        <FontAwesomeIcon icon={faFaceViewfinder as IconProp} />
                        &nbsp; See how others see your profile
                    </IonButton>
                </IonRow>
                <IonCardContent className="no-gutter">
                    <IonGrid className="editgrid">
                        <IonAccordionGroup>
                            <IonAccordion value="first" className="not-the-bottom">
                                <IonItem slot="header" lines="none">
                                    <IonLabel>The Basics</IonLabel>
                                </IonItem>
                                <IonCardContent className="no-padding-cc " slot="content">
                                    <IonItem>
                                        <IonLabel><p>Name:</p> <h2>{currentUserProfile.name}</h2> </IonLabel>
                                        <IonButton fill="outline" color="primary" onClick={() => showContactSupport('name', 'name')} slot="end">
                                            <FontAwesomeIcon icon={faEllipsis as IconProp} />
                                        </IonButton>
                                    </IonItem>
                                    <IonItem>
                                        <IonLabel>
                                            <p>Age:</p> <h2>{currentUserProfile.age}</h2>
                                        </IonLabel>
                                        <IonButton fill="outline" color="primary" onClick={() => showContactSupport('age', 'birthdate')} slot="end">
                                            <FontAwesomeIcon icon={faEllipsis as IconProp} />
                                        </IonButton>
                                    </IonItem>

                                    <IonItem>
                                        <IonLabel><p>Location:</p> <h2>{currentUserProfile.location}</h2> </IonLabel>
                                        <IonButton color="primary" onClick={() => locationPresent()} slot="end">Edit</IonButton>
                                    </IonItem>

                                    <IonItem>
                                        <IonLabel><p>Refreshments username:</p> <h2>{currentUserProfile.username}</h2> </IonLabel>
                                        <IonButton color="primary" onClick={() => usernamePresent()} slot="end">Edit</IonButton>
                                    </IonItem>

                                    {/* Pronouns */}
                                    <IonItem color={editing['pronouns'] ? 'lightyellow' : ''}>
                                        <IonLabel> <p>Pronouns:</p> <h2>{currentUserProfile.pronouns}</h2> </IonLabel>
                                        {editing['pronouns'] ? (
                                            <>
                                                <IonButton color="danger" onClick={() => setEdit('pronouns', false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                <IonButton color="success" onClick={() => saveSingle('pronouns')} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </>
                                        ) : (
                                            <IonButton onClick={() => setEdit('pronouns', true)} slot="end">Edit</IonButton>
                                        )}
                                    </IonItem>
                                    {editing['pronouns'] && (
                                        <IonItem className="pronoun-select" color="lightyellow">
                                            <IonItem color="lightyellow">
                                                <IonSelect placeholder="Select" onIonChange={onSelect('pronounsSelector')}>
                                                    <IonSelectOption value="she/her">she/her</IonSelectOption>
                                                    <IonSelectOption value="he/him">he/him</IonSelectOption>
                                                    <IonSelectOption value="they/them">they/them</IonSelectOption>
                                                    <IonSelectOption value="custom">custom</IonSelectOption>
                                                </IonSelect>
                                            </IonItem>
                                            {form.pronounsSelector === 'custom' && (
                                                <IonItem color="lightyellow">
                                                    <IonInput
                                                        value={form.customPronouns}
                                                        onIonInput={onText('customPronouns')}
                                                        placeholder="Update here"
                                                        maxlength={16}
                                                        type="text"
                                                    />
                                                </IonItem>
                                            )}
                                        </IonItem>
                                    )}

                                    {/* Looking for */}
                                    <IonItem>
                                        <IonList
                                            lines="none"
                                            className={editing['looking_for'] ? 'looking-for-list lightyellowitems' : 'looking-for-list'}
                                            style={{ width: '100%' }}
                                        >
                                            <IonItem className="looking-for-list-title">
                                                <IonLabel><p>Looking for:</p></IonLabel>
                                                {editing['looking_for'] ? (
                                                    <>
                                                        <IonButton color="danger" onClick={() => setEdit('looking_for', false)} slot="end">
                                                            <FontAwesomeIcon icon={faX} />
                                                        </IonButton>
                                                        <IonButton color="success" onClick={() => saveSingle('looking_for')} slot="end">
                                                            <FontAwesomeIcon icon={faCheck} />
                                                        </IonButton>
                                                    </>
                                                ) : (
                                                    <IonButton onClick={() => setEdit('looking_for', true)} slot="end">Edit</IonButton>
                                                )}
                                            </IonItem>

                                            {['friendship', 'romance', 'virtual connection', 'virtual only', 'job', 'housing', 'families'].map((val) => (
                                                <IonItem key={val}>
                                                    <IonCheckbox
                                                        slot="start"
                                                        value={val}
                                                        checked={form.looking_for.includes(val)}
                                                        onIonChange={e => toggleArrayString('looking_for', e.detail.value, e.detail.checked)}
                                                        disabled={!editing['looking_for']}
                                                    />
                                                    {val === 'virtual connection' ? 'Virtual Connection' : val === 'virtual only' ? 'Virtual Connection Only' : val.charAt(0).toUpperCase() + val.slice(1)}
                                                </IonItem>
                                            ))}
                                        </IonList>
                                    </IonItem>

                                    {/* Bio */}
                                    <IonItem color={editing['bio'] ? 'lightyellow' : ''}>
                                        <IonLabel className="ion-text-wrap">
                                            <p>Bio:</p> <h2 className="css-fix">{currentUserProfile.bio}</h2>
                                        </IonLabel>
                                        {editing['bio'] ? (
                                            <IonButton color="danger" onClick={() => setEdit('bio', false)} slot="end">
                                                <FontAwesomeIcon icon={faX} />
                                            </IonButton>
                                        ) : (
                                            <IonButton onClick={() => setEdit('bio', true)} slot="end">Edit</IonButton>
                                        )}
                                    </IonItem>
                                    {editing['bio'] && (
                                        <IonItem color="lightyellow">
                                            <IonTextarea
                                                value={form.bio}
                                                onIonInput={onText('bio')}
                                                placeholder="Update here"
                                                maxlength={1000}
                                                autoCapitalize="sentences"
                                                autoGrow={true}
                                                counter
                                            />
                                            <IonButton color="success" onClick={() => saveSingle('bio')} slot="end">
                                                <FontAwesomeIcon icon={faCheck} />
                                            </IonButton>
                                        </IonItem>
                                    )}

                                    {/* Height */}
                                    <IonItem color={editing['height'] ? 'lightyellow' : ''}>
                                        <IonLabel> <p>Height:</p> <h2>{currentUserProfile.height}</h2> </IonLabel>
                                        {editing['height'] ? (
                                            <>
                                                <IonButton
                                                    color="danger"
                                                    onClick={async () => { await updateCurrentUserProfile({ height: '' }); setEdit('height', false); queryClient.invalidateQueries({ queryKey: ['current'] }); }}
                                                    slot="end"
                                                >
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                <IonButton color="success" onClick={() => saveSingle('height')} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </>
                                        ) : (
                                            <IonButton onClick={() => setEdit('height', true)} slot="end">Edit</IonButton>
                                        )}
                                    </IonItem>
                                    {editing['height'] && (
                                        <IonItem className="height-select" color="lightyellow">
                                            <IonItem color="lightyellow">
                                                <IonLabel position="floating">Feet</IonLabel>
                                                <IonSelect onIonChange={onSelect('heightFeet')}>
                                                    {['3', '4', '5', '6', '7'].map(n => (
                                                        <IonSelectOption key={n} value={n}>{n}</IonSelectOption>
                                                    ))}
                                                </IonSelect>
                                            </IonItem>
                                            <IonItem color="lightyellow">
                                                <IonLabel position="floating">Inches</IonLabel>
                                                <IonSelect onIonChange={onSelect('heightInches')}>
                                                    {Array.from({ length: 12 }, (_, i) => String(i)).map(n => (
                                                        <IonSelectOption key={n} value={n}>{n}</IonSelectOption>
                                                    ))}
                                                </IonSelect>
                                            </IonItem>
                                        </IonItem>
                                    )}

                                    {/* Job */}
                                    <IonItem color={editing['job'] ? 'lightyellow' : ''}>
                                        <IonLabel> <p>Job:</p> <h2>{currentUserProfile.job}</h2> </IonLabel>
                                        {editing['job'] ? (
                                            <IonButton color="danger" onClick={() => setEdit('job', false)} slot="end">
                                                <FontAwesomeIcon icon={faX} />
                                            </IonButton>
                                        ) : (
                                            <IonButton onClick={() => setEdit('job', true)} slot="end">Edit</IonButton>
                                        )}
                                    </IonItem>
                                    {editing['job'] && (
                                        <IonItem color="lightyellow">
                                            <IonInput
                                                value={form.job}
                                                onIonInput={onText('job')}
                                                placeholder="Update here"
                                                maxlength={80}
                                                autoCapitalize="words"
                                                clearInput={true}
                                                counter
                                                type="text"
                                            />
                                            <IonButton color="success" onClick={() => saveSingle('job')} slot="end">
                                                <FontAwesomeIcon icon={faCheck} />
                                            </IonButton>
                                        </IonItem>
                                    )}

                                    {/* School */}
                                    <IonItem color={editing['school'] ? 'lightyellow' : ''}>
                                        <IonLabel> <p>School:</p> <h2>{currentUserProfile.school}</h2> </IonLabel>
                                        {editing['school'] ? (
                                            <IonButton color="danger" onClick={() => setEdit('school', false)} slot="end">
                                                <FontAwesomeIcon icon={faX} />
                                            </IonButton>
                                        ) : (
                                            <IonButton onClick={() => setEdit('school', true)} slot="end">Edit</IonButton>
                                        )}
                                    </IonItem>
                                    {editing['school'] && (
                                        <IonItem color="lightyellow">
                                            <IonInput
                                                value={form.school}
                                                onIonInput={onText('school')}
                                                placeholder="Update here"
                                                autoCapitalize="words"
                                                maxlength={80}
                                                clearInput={true}
                                                counter
                                                type="text"
                                            />
                                            <IonButton color="success" onClick={() => saveSingle('school')} slot="end">
                                                <FontAwesomeIcon icon={faCheck} />
                                            </IonButton>
                                        </IonItem>
                                    )}

                                    {/* Kids info */}
                                    <IonItem color={editing['kids_info'] ? 'lightyellow' : ''}>
                                        <IonLabel> <p>Kids info:</p> <h2>{currentUserProfile?.kids_info}</h2> </IonLabel>
                                        {editing['kids_info'] ? (
                                            <>
                                                <IonButton color="danger" onClick={() => setEdit('kids_info', false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                <IonButton color="success" onClick={() => saveSingle('kids_info')} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </>
                                        ) : (
                                            <IonButton onClick={() => setEdit('kids_info', true)} slot="end">Edit</IonButton>
                                        )}
                                    </IonItem>
                                    {editing['kids_info'] && (
                                        <IonItem className="kids-select" color="lightyellow">
                                            <IonItem color="lightyellow">
                                                <IonSelect placeholder="Select" onIonChange={onSelect('kids_info')}>
                                                    <IonSelectOption value="I'm a parent">I'm a parent</IonSelectOption>
                                                    <IonSelectOption value="I'm a parent and am open to having more children">I'm a parent and am open to having more children</IonSelectOption>
                                                    <IonSelectOption value="I'm open to having children">I'm open to having children</IonSelectOption>
                                                    <IonSelectOption value="I definitely want children">I definitely want children</IonSelectOption>
                                                    <IonSelectOption value="I don't want children">I don't want children</IonSelectOption>
                                                    <IonSelectOption value="">(leave this part blank)</IonSelectOption>
                                                </IonSelect>
                                            </IonItem>
                                        </IonItem>
                                    )}

                                    {/* Hometown */}
                                    <IonItem color={editing['hometown'] ? 'lightyellow' : ''}>
                                        <IonLabel> <p>Hometown:</p> <h2>{currentUserProfile.hometown}</h2> </IonLabel>
                                        {editing['hometown'] ? (
                                            <IonButton color="danger" onClick={() => setEdit('hometown', false)} slot="end">
                                                <FontAwesomeIcon icon={faX} />
                                            </IonButton>
                                        ) : (
                                            <IonButton onClick={() => setEdit('hometown', true)} slot="end">Edit</IonButton>
                                        )}
                                    </IonItem>
                                    {editing['hometown'] && (
                                        <IonItem color="lightyellow">
                                            <IonInput
                                                value={form.hometown}
                                                onIonInput={onText('hometown')}
                                                placeholder="Update here"
                                                autoCapitalize="words"
                                                maxlength={80}
                                                clearInput={true}
                                                counter
                                                type="text"
                                            />
                                            <IonButton color="success" onClick={() => saveSingle('hometown')} slot="end">
                                                <FontAwesomeIcon icon={faCheck} />
                                            </IonButton>
                                        </IonItem>
                                    )}

                                    {/* Politics */}
                                    <IonItem color={editing['politics'] ? 'lightyellow' : ''}>
                                        <IonLabel> <p>Politics:</p> <h2>{currentUserProfile.politics}</h2> </IonLabel>
                                        {editing['politics'] ? (
                                            <IonButton color="danger" onClick={() => setEdit('politics', false)} slot="end">
                                                <FontAwesomeIcon icon={faX} />
                                            </IonButton>
                                        ) : (
                                            <IonButton onClick={() => setEdit('politics', true)} slot="end">Edit</IonButton>
                                        )}
                                    </IonItem>
                                    {editing['politics'] && (
                                        <IonItem color="lightyellow">
                                            <IonInput
                                                value={form.politics}
                                                onIonInput={onText('politics')}
                                                placeholder="Update here"
                                                maxlength={80}
                                                autoCapitalize="sentences"
                                                clearInput={true}
                                                type="text"
                                                counter
                                            />
                                            <IonButton color="success" onClick={() => saveSingle('politics')} slot="end">
                                                <FontAwesomeIcon icon={faCheck} />
                                            </IonButton>
                                        </IonItem>
                                    )}

                                    {/* Gender/Sexuality choices accordion */}
                                    <IonAccordionGroup className="in-list">
                                        <IonAccordion>
                                            <IonItem slot="header">
                                                <IonLabel>
                                                    <p>Gender and Sexuality:</p>
                                                    <h2>{form.gender_sexuality_choices.length} selected</h2>
                                                </IonLabel>
                                            </IonItem>

                                            <IonGrid className="filter-grid" slot="content">
                                                <IonRow>
                                                    <IonRow style={{ paddingLeft: '15pt' }}>
                                                        <IonText className="ion-text-wrap">
                                                            <p> These choices are used when other members filter their Picks. You can choose whether or not to show them on your profile.</p>
                                                        </IonText>
                                                        <IonItem lines="none">
                                                            <IonLabel color="black"><p>Show on profile? {form.settings_show_gender_sexuality ? 'Yes' : 'No'}</p></IonLabel>
                                                            <IonToggle
                                                                slot="end"
                                                                onIonChange={async e => {
                                                                    const val = e.detail.checked;
                                                                    setForm(prev => ({ ...prev, settings_show_gender_sexuality: val }));
                                                                    await updateCurrentUserProfile({ settings_show_gender_sexuality: val });
                                                                }}
                                                                checked={form.settings_show_gender_sexuality}
                                                            />
                                                        </IonItem>

                                                        <IonItem lines="none" style={{ width: '90%' }}>
                                                            <IonLabel color="black"><p>I am:</p></IonLabel>
                                                            {editing['gender_sexuality_choices'] ? (
                                                                <>
                                                                    <IonButton color="danger" onClick={() => setEdit('gender_sexuality_choices', false)} slot="end">
                                                                        <FontAwesomeIcon icon={faX} />
                                                                    </IonButton>
                                                                    <IonButton color="success" onClick={() => saveSingle('gender_sexuality_choices')} slot="end">
                                                                        <FontAwesomeIcon icon={faCheck} />
                                                                    </IonButton>
                                                                </>
                                                            ) : (
                                                                <IonButton onClick={() => setEdit('gender_sexuality_choices', true)} slot="end">Edit</IonButton>
                                                            )}
                                                        </IonItem>
                                                    </IonRow>

                                                    <IonGrid>
                                                        <IonRow>
                                                            <IonCol>
                                                                <IonList className={editing['gender_sexuality_choices'] ? 'lightyellowitems' : ''}>
                                                                    {[
                                                                        ['straight', 'Straight/heterosexual'],
                                                                        ['gay', 'Gay/homosexual'],
                                                                        ['lesbian', 'Lesbian'],
                                                                        ['bi', 'Bi'],
                                                                        ['pan', 'Pan'],
                                                                        ['gray ace', 'Gray ace'],
                                                                        ['ace', 'Ace'],
                                                                        ['demi', 'Demisexual'],
                                                                        ['queer', 'Queer'],
                                                                    ].map(([val, label]) => (
                                                                        <IonItem key={val} lines="none">
                                                                            <IonCheckbox
                                                                                slot="start"
                                                                                value={val}
                                                                                checked={form.gender_sexuality_choices.includes(val)}
                                                                                onIonChange={e => toggleArrayString('gender_sexuality_choices', e.detail.value, e.detail.checked)}
                                                                                disabled={!editing['gender_sexuality_choices']}
                                                                            />
                                                                            {label}
                                                                        </IonItem>
                                                                    ))}
                                                                </IonList>
                                                            </IonCol>
                                                            <IonCol>
                                                                <IonList className={editing['gender_sexuality_choices'] ? 'lightyellowitems' : ''}>
                                                                    {[
                                                                        ['man', 'Man'],
                                                                        ['woman', 'Woman'],
                                                                        ['nb', 'Nonbinary/gender noncomforming'],
                                                                        ['genderfluid', 'Gender Fluid'],
                                                                        ['cis', 'Cis'],
                                                                        ['trans', 'Trans'],
                                                                        ['intersex', 'Intersex'],
                                                                        ['mono', 'Monogamous'],
                                                                        ['poly', 'Polyamorous'],
                                                                    ].map(([val, label]) => (
                                                                        <IonItem key={val} lines="none">
                                                                            <IonCheckbox
                                                                                slot="start"
                                                                                value={val}
                                                                                checked={form.gender_sexuality_choices.includes(val)}
                                                                                onIonChange={e => toggleArrayString('gender_sexuality_choices', e.detail.value, e.detail.checked)}
                                                                                disabled={!editing['gender_sexuality_choices']}
                                                                            />
                                                                            {label}
                                                                        </IonItem>
                                                                    ))}
                                                                </IonList>
                                                            </IonCol>
                                                        </IonRow>
                                                    </IonGrid>
                                                </IonRow>
                                            </IonGrid>
                                        </IonAccordion>
                                    </IonAccordionGroup>

                                    {/* Gender/Sexuality info blurb */}
                                    <IonItem color={editing['gender_and_sexuality_info'] ? 'lightyellow' : ''}>
                                        <IonLabel className="ion-text-wrap">
                                            <p>More gender and sexuality info:</p> <h2 className="css-fix">{currentUserProfile.gender_and_sexuality_info}</h2>
                                        </IonLabel>
                                        {editing['gender_and_sexuality_info'] ? (
                                            <IonButton color="danger" onClick={() => setEdit('gender_and_sexuality_info', false)} slot="end">
                                                <FontAwesomeIcon icon={faX} />
                                            </IonButton>
                                        ) : (
                                            <IonButton onClick={() => setEdit('gender_and_sexuality_info', true)} slot="end">Edit</IonButton>
                                        )}
                                    </IonItem>
                                    {editing['gender_and_sexuality_info'] && (
                                        <IonItem color="lightyellow">
                                            <IonTextarea
                                                value={form.gender_and_sexuality_info}
                                                onIonInput={onText('gender_and_sexuality_info')}
                                                placeholder="Update me or leave me blank!"
                                                maxlength={200}
                                                autoCapitalize="sentences"
                                                counter
                                                autoGrow
                                            />
                                            <IonButton color="success" onClick={() => saveSingle('gender_and_sexuality_info')} slot="end">
                                                <FontAwesomeIcon icon={faCheck} />
                                            </IonButton>
                                        </IonItem>
                                    )}

                                    {/* Pro Banner */}
                                    {currentUserProfile.subscription_level !== 'none' && (
                                        <>
                                            <IonItem lines="none">
                                                <IonLabel><p>Banner: &nbsp;<FontAwesomeIcon color="var(--ion-color-medium)" icon={faStar} /></p></IonLabel>
                                            </IonItem>
                                            <IonItem lines="none">
                                                <IonLabel color="black"><p>Show banner on profile? {form.settings_profile_banner_bool ? 'Yes' : 'No'}</p></IonLabel>
                                                <IonToggle
                                                    slot="end"
                                                    onIonChange={async e => {
                                                        const val = e.detail.checked;
                                                        setForm(prev => ({ ...prev, settings_profile_banner_bool: val }));
                                                        await updateCurrentUserProfile({ settings_profile_banner_bool: val });
                                                    }}
                                                    checked={form.settings_profile_banner_bool}
                                                />
                                            </IonItem>
                                            <IonItem>
                                                <IonSelect
                                                    disabled={!form.settings_profile_banner_bool}
                                                    placeholder="Select"
                                                    value={form.settings_profile_banner}
                                                    onIonChange={async (e) => {
                                                        const val = e.detail.value;
                                                        setForm(prev => ({ ...prev, settings_profile_banner: val }));
                                                        await updateCurrentUserProfile({ settings_profile_banner: val });
                                                        queryClient.invalidateQueries({ queryKey: ['current'] });
                                                    }}
                                                >
                                                    <IonSelectOption value="putting-money">putting my money where my mask is</IonSelectOption>
                                                    <IonSelectOption value="salting-the-vibes">Salting the Vibes</IonSelectOption>
                                                    <IonSelectOption value="lc-aware">Long Covid Awareness</IonSelectOption>
                                                    <IonSelectOption value="conscientious-sexy">conscientious is the new sexy</IonSelectOption>
                                                    <IonSelectOption value="happy-pride">happy pride!</IonSelectOption>
                                                    <IonSelectOption value="fresh-air">I heart fresh air</IonSelectOption>
                                                    <IonSelectOption value="dream-big">Mask up, dream big</IonSelectOption>
                                                    <IonSelectOption value="disability-pride">Disability Pride</IonSelectOption>
                                                    <IonSelectOption value="ready-connect">Ready to connect</IonSelectOption>
                                                    <IonSelectOption value="freshies">(freshies)</IonSelectOption>
                                                </IonSelect>
                                            </IonItem>
                                        </>
                                    )}

                                </IonCardContent>
                            </IonAccordion>
                        </IonAccordionGroup>

                        {/* Covid Behaviors */}
                        <IonAccordionGroup>
                            <IonAccordion value="second" className="not-the-bottom">
                                <IonItem slot="header" lines="none">
                                    <IonLabel>Covid Behaviors</IonLabel>
                                </IonItem>
                                <IonCardContent className="no-padding-cc ion-padding" slot="content">
                                    <IonItem>
                                        <IonLabel><p>Check all that apply:</p></IonLabel>
                                        {editing['covid_precautions'] ? (
                                            <>
                                                <IonButton color="danger" onClick={() => setEdit('covid_precautions', false)} slot="end">
                                                    <FontAwesomeIcon icon={faX} />
                                                </IonButton>
                                                <IonButton color="success" onClick={() => saveSingle('covid_precautions')} slot="end">
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </IonButton>
                                            </>
                                        ) : (
                                            <IonButton onClick={() => setEdit('covid_precautions', true)} slot="end">Edit</IonButton>
                                        )}
                                    </IonItem>

                                    <IonList lines="none" className={editing['covid_precautions'] ? 'lightyellowitems' : ''}>
                                        <IonItem lines="none"><IonLabel>Home:</IonLabel></IonItem>

                                        {[
                                            [18, 'I have no routine daily exposures'],
                                            [3, 'I live with non-Covid cautious people'],
                                            [8, 'I live alone/with others that share my level of Covid caution'],
                                        ].map(([val, label]) => (
                                            <IonItem key={val as number} lines="none">
                                                <IonCheckbox
                                                    slot="start"
                                                    value={val}
                                                    checked={form.covid_precautions.includes(val as number)}
                                                    onIonChange={e => toggleArrayNumber('covid_precautions', e.detail.value, e.detail.checked)}
                                                    disabled={!editing['covid_precautions']}
                                                />
                                                {label}
                                            </IonItem>
                                        ))}

                                        <IonItem lines="none"><IonLabel>Work:</IonLabel></IonItem>
                                        {[
                                            [1, 'I work from home'],
                                            [9, 'I go to work/school but always in a high quality mask'],
                                            [16, 'My work requires poor/no masking'],
                                        ].map(([val, label]) => (
                                            <IonItem key={val as number} lines="none">
                                                <IonCheckbox
                                                    slot="start"
                                                    value={val}
                                                    checked={form.covid_precautions.includes(val as number)}
                                                    onIonChange={e => toggleArrayNumber('covid_precautions', e.detail.value, e.detail.checked)}
                                                    disabled={!editing['covid_precautions']}
                                                />
                                                {label}
                                            </IonItem>
                                        ))}

                                        <IonItem lines="none"><IonLabel>Play:</IonLabel></IonItem>
                                        {[
                                            [2, 'I eat outside at restaurants with good airflow and spacing'],
                                            [15, 'I do takeout from restaurants'],
                                            [5, 'I attend outdoor events'],
                                            [12, 'I attend outdoor events with a mask on'],
                                            [6, 'I attend indoor events with a mask on'],
                                        ].map(([val, label]) => (
                                            <IonItem key={val as number} lines="none">
                                                <IonCheckbox
                                                    slot="start"
                                                    value={val}
                                                    checked={form.covid_precautions.includes(val as number)}
                                                    onIonChange={e => toggleArrayNumber('covid_precautions', e.detail.value, e.detail.checked)}
                                                    disabled={!editing['covid_precautions']}
                                                />
                                                {label}
                                            </IonItem>
                                        ))}

                                        <IonItem lines="none"><IonLabel>Other:</IonLabel></IonItem>
                                        {[
                                            [4, "I'm immunocompromised/have a high-risk health condition"],
                                            [17, 'I am a caregiver'],
                                            [7, 'I only leave home/outdoors for medically necessary reasons'],
                                            [10, 'I am living with Long Covid'],
                                            [11, 'I use air purifiers and use HEPA filters'],
                                            [13, 'I ask for testing before all meetups'],
                                            [14, 'I ask for testing before indoor meetups'],
                                        ].map(([val, label]) => (
                                            <IonItem key={val as number} lines="none">
                                                <IonCheckbox
                                                    slot="start"
                                                    value={val}
                                                    checked={form.covid_precautions.includes(val as number)}
                                                    onIonChange={e => toggleArrayNumber('covid_precautions', e.detail.value, e.detail.checked)}
                                                    disabled={!editing['covid_precautions']}
                                                />
                                                {label}
                                            </IonItem>
                                        ))}
                                    </IonList>

                                    <IonNote>
                                        <h2 style={{ paddingTop: '20px' }}>Add anything else about your Covid behaviors that you think people you interact with might want to know!</h2>
                                    </IonNote>

                                    <IonItem color={editing['covid_precaution_info'] ? 'lightyellow' : ''}>
                                        <IonLabel className="ion-text-wrap"> <p>More about Covid:</p> <h2>{currentUserProfile.covid_precaution_info}</h2> </IonLabel>
                                        {editing['covid_precaution_info'] ? (
                                            <IonButton color="danger" onClick={() => setEdit('covid_precaution_info', false)} slot="end">
                                                <FontAwesomeIcon icon={faX} />
                                            </IonButton>
                                        ) : (
                                            <IonButton onClick={() => setEdit('covid_precaution_info', true)} slot="end">Edit</IonButton>
                                        )}
                                    </IonItem>
                                    {editing['covid_precaution_info'] && (
                                        <IonItem color="lightyellow">
                                            <IonTextarea
                                                value={form.covid_precaution_info}
                                                onIonInput={onText('covid_precaution_info')}
                                                placeholder="Update here"
                                                maxlength={100}
                                                autoCapitalize="sentences"
                                                autoGrow
                                            />
                                            <IonButton color="success" onClick={() => saveSingle('covid_precaution_info')} slot="end">
                                                <FontAwesomeIcon icon={faCheck} />
                                            </IonButton>
                                        </IonItem>
                                    )}
                                </IonCardContent>
                            </IonAccordion>
                        </IonAccordionGroup>

                        {/* Long Covid Support */}
                        <IonAccordionGroup>
                            <IonAccordion value="second-half" className="not-the-bottom">
                                <IonItem slot="header" lines="none">
                                    <IonLabel>Long Covid Support</IonLabel>
                                </IonItem>
                                <IonCardContent className="no-padding-cc ion-padding" slot="content">
                                    <IonItem>
                                        <IonText className="ion-text-wrap">
                                            <p> Choose as many as describe you. These choices are used when other members filter their Picks. You can choose whether or not to show them on your profile.</p>
                                        </IonText>
                                    </IonItem>

                                    <IonItem lines="none">
                                        <IonLabel color="black"><p>Show on profile? {form.settings_show_long_covid ? 'Yes' : 'No'}</p></IonLabel>
                                        <IonToggle
                                            slot="end"
                                            onIonChange={async e => {
                                                const val = e.detail.checked;
                                                setForm(prev => ({ ...prev, settings_show_long_covid: val }));
                                                await updateCurrentUserProfile({ settings_show_long_covid: val });
                                            }}
                                            checked={form.settings_show_long_covid}
                                        />
                                    </IonItem>

                                    <IonList lines="none" className={editing['long_covid_choices'] ? 'lightyellowitems' : ''}>
                                        <IonItem lines="none">
                                            <IonLabel color="black"><p>I am:</p></IonLabel>
                                            {editing['long_covid_choices'] ? (
                                                <>
                                                    <IonButton color="danger" onClick={() => setEdit('long_covid_choices', false)} slot="end">
                                                        <FontAwesomeIcon icon={faX} />
                                                    </IonButton>
                                                    <IonButton color="success" onClick={() => saveSingle('long_covid_choices')} slot="end">
                                                        <FontAwesomeIcon icon={faCheck} />
                                                    </IonButton>
                                                </>
                                            ) : (
                                                <IonButton onClick={() => setEdit('long_covid_choices', true)} slot="end">Edit</IonButton>
                                            )}
                                        </IonItem>

                                        {[
                                            ['I have LC', 'living with Long Covid'],
                                            ['LC caretaker', 'caring for someone with Long Covid'],
                                            ['I need help remote', 'needing remote support'],
                                            ['I need help local', 'needing local support'],
                                            ['I could help remote', 'offering remote support'],
                                            ['I could help local', 'offering local support'],
                                        ].map(([val, label]) => (
                                            <IonItem key={val} lines="none">
                                                <IonCheckbox
                                                    slot="start"
                                                    value={val}
                                                    checked={form.long_covid_choices.includes(val)}
                                                    onIonChange={e => toggleArrayString('long_covid_choices', e.detail.value, e.detail.checked)}
                                                    disabled={!editing['long_covid_choices']}
                                                />
                                                {label}
                                            </IonItem>
                                        ))}
                                    </IonList>
                                </IonCardContent>
                            </IonAccordion>
                        </IonAccordionGroup>

                        {/* Let's Talk About */}
                        <IonAccordionGroup>
                            <IonAccordion value="third">
                                <IonItem slot="header" lines="none">
                                    <IonLabel>Let's Talk About</IonLabel>
                                </IonItem>
                                <IonCardContent className="no-padding-cc" slot="content">
                                    <IonNote><h2>Fill out as many or as few as you'd like. Anything you leave blank will not be included on your profile.</h2></IonNote>

                                    {[['freetime', 'Freetime'], ['together_idea', 'Together idea'], ['hobby', 'Hobby'], ['petpeeve', 'Pet Peeve'], ['talent', 'Talents']].map(([key, label]) => (
                                        <React.Fragment key={key}>
                                            <IonItem color={editing[key] ? 'lightyellow' : ''}>
                                                <IonLabel>
                                                    <p>{label}:</p> {currentUserProfile[key]}
                                                </IonLabel>
                                                {editing[key] ? (
                                                    <IonButton color="danger" onClick={() => setEdit(key, false)} slot="end">
                                                        <FontAwesomeIcon icon={faX} />
                                                    </IonButton>
                                                ) : (
                                                    <IonButton onClick={() => setEdit(key, true)} slot="end">Edit</IonButton>
                                                )}
                                            </IonItem>
                                            {editing[key] && (
                                                <IonItem color="lightyellow">
                                                    <IonInput
                                                        value={form[key as keyof FormState] as string}
                                                        onIonInput={onText(key as keyof FormState)}
                                                        placeholder="Update here"
                                                        maxlength={80}
                                                        autoCapitalize="sentences"
                                                        clearInput
                                                        counter
                                                        type="text"
                                                    />
                                                    <IonButton color="success" onClick={() => saveSingle(key as keyof FormState)} slot="end">
                                                        <FontAwesomeIcon icon={faCheck} />
                                                    </IonButton>
                                                </IonItem>
                                            )}
                                        </React.Fragment>
                                    ))}

                                    {/* Favorites */}
                                    {[
                                        ['fave_book', 'Fave Book', 'words'],
                                        ['fave_movie', 'Fave Movie', 'words'],
                                        ['fave_topic', 'Fave Topic', 'sentences'],
                                        ['fave_tv', 'Fave TV Show', 'words'],
                                        ['fave_album', 'Fave Album', 'sentences'],
                                        ['fave_musicalartist', 'Fave Musical Artist', 'words'],
                                        ['fave_game', 'Fave Game', 'words'],
                                        ['fave_sport_watch', 'Fave Sport to Watch', 'sentences'],
                                        ['fave_sport_play', 'Fave Sport to Play', 'sentences'],
                                    ].map(([key, label, autoCap]) => (
                                        <React.Fragment key={key}>
                                            <IonItem color={editing[key] ? 'lightyellow' : ''}>
                                                <IonLabel> <p>{label}:</p> <h2>{currentUserProfile[key]}</h2> </IonLabel>
                                                {editing[key] ? (
                                                    <IonButton color="danger" onClick={() => setEdit(key, false)} slot="end">
                                                        <FontAwesomeIcon icon={faX} />
                                                    </IonButton>
                                                ) : (
                                                    <IonButton onClick={() => setEdit(key, true)} slot="end">Edit</IonButton>
                                                )}
                                            </IonItem>
                                            {editing[key] && (
                                                <IonItem color="lightyellow">
                                                    <IonInput
                                                        value={form[key as keyof FormState] as string}
                                                        onIonInput={onText(key as keyof FormState)}
                                                        placeholder="Update here"
                                                        maxlength={80}
                                                        autoCapitalize={autoCap as any}
                                                        clearInput
                                                        counter
                                                        type="text"
                                                    />
                                                    <IonButton color="success" onClick={() => saveSingle(key as keyof FormState)} slot="end">
                                                        <FontAwesomeIcon icon={faCheck} />
                                                    </IonButton>
                                                </IonItem>
                                            )}
                                        </React.Fragment>
                                    ))}

                                    {/* Current fixations */}
                                    {[
                                        ['fixation_book', 'Current Book', 'words'],
                                        ['fixation_movie', 'Current Movie', 'words'],
                                        ['fixation_topic', 'Current Topic', 'sentences'],
                                        ['fixation_tv', 'Current TV Show', 'words'],
                                        ['fixation_album', 'Current Album', 'words'],
                                        ['fixation_musicalartist', 'Current Musical Artist', 'words'],
                                        ['fixation_game', 'Current Game', 'words'],
                                    ].map(([key, label, autoCap]) => (
                                        <React.Fragment key={key}>
                                            <IonItem color={editing[key] ? 'lightyellow' : ''}>
                                                <IonLabel> <p>{label}:</p> <h2>{currentUserProfile[key]}</h2> </IonLabel>
                                                {editing[key] ? (
                                                    <IonButton color="danger" onClick={() => setEdit(key, false)} slot="end">
                                                        <FontAwesomeIcon icon={faX} />
                                                    </IonButton>
                                                ) : (
                                                    <IonButton onClick={() => setEdit(key, true)} slot="end">Edit</IonButton>
                                                )}
                                            </IonItem>
                                            {editing[key] && (
                                                <IonItem color="lightyellow">
                                                    <IonInput
                                                        value={form[key as keyof FormState] as string}
                                                        onIonInput={onText(key as keyof FormState)}
                                                        placeholder="Update here"
                                                        maxlength={80}
                                                        autoCapitalize={autoCap as any}
                                                        clearInput
                                                        counter
                                                        type="text"
                                                    />
                                                    <IonButton color="success" onClick={() => saveSingle(key as keyof FormState)} slot="end">
                                                        <FontAwesomeIcon icon={faCheck} />
                                                    </IonButton>
                                                </IonItem>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </IonCardContent>
                            </IonAccordion>
                        </IonAccordionGroup>

                        {anyEdits && (
                            <IonRow className="ion-justify-content-center">
                                <IonButton onClick={saveAll}>Make these changes to my profile</IonButton>
                            </IonRow>
                        )}
                    </IonGrid>
                </IonCardContent>
            </IonCard>

            {/* Photos */}
            <IonGrid className="picture-grid">
                <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic1_main} dataPicCaption={"profile picture"} picNumber={1} updateProfileFunc={saveAll} delete_allowed={false} altText={currentUserProfile?.pic1_alt} />
                <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic2} dataPicCaption={currentUserProfile.pic2_caption} picNumber={2} updateProfileFunc={saveAll} delete_allowed={false} altText={currentUserProfile?.pic2_alt} />
                <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic3} dataPicCaption={currentUserProfile.pic3_caption} picNumber={3} updateProfileFunc={saveAll} delete_allowed={false} altText={currentUserProfile?.pic3_alt} />
                <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic4} dataPicCaption={currentUserProfile.pic4_caption} picNumber={4} updateProfileFunc={saveAll} delete_allowed={true} altText={currentUserProfile?.pic4_alt} />
                <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic5} dataPicCaption={currentUserProfile.pic5_caption} picNumber={5} updateProfileFunc={saveAll} delete_allowed={true} altText={currentUserProfile?.pic5_alt} />
                <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic6} dataPicCaption={currentUserProfile.pic6_caption} picNumber={6} updateProfileFunc={saveAll} delete_allowed={true} altText={currentUserProfile?.pic6_alt} />
                <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic7} dataPicCaption={currentUserProfile.pic7_caption} picNumber={7} updateProfileFunc={saveAll} delete_allowed={true} altText={currentUserProfile?.pic7_alt} />
                <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic8} dataPicCaption={currentUserProfile.pic8_caption} picNumber={8} updateProfileFunc={saveAll} delete_allowed={true} altText={currentUserProfile?.pic8_alt} />
                <EditPhotoGridRow userid={currentUserProfile.user} dataPic={currentUserProfile.pic9} dataPicCaption={currentUserProfile.pic9_caption} picNumber={9} updateProfileFunc={saveAll} delete_allowed={true} altText={currentUserProfile?.pic9_alt} />
            </IonGrid>
        </div>
    );
};

export default SelfProfile;
