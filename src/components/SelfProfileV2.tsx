import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonItem,
  IonLabel,
  IonTextarea,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonContent,
  IonList,
  IonCheckbox,
  IonToggle,
  IonAccordion,
  IonAccordionGroup,
  IonIcon,
  IonReorder,
  IonReorderGroup,
  IonThumbnail,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  useIonActionSheet,
  useIonModal,
  useIonAlert,
  useIonPopover,
} from '@ionic/react';
import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import './SelfProfileV2.css';

import { updateCurrentUserProfile, onImgError } from '../hooks/utilities';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { useGetCommunityProfile } from '../hooks/api/profiles/community-profile';
import ProfileModal from './ProfileModal';
import EditLocationModal from './EditLocationModal';
import CroppedImageModal from './CroppedImageModal';
import CommunityProfileSection from './CommunityProfileSection';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faFaceViewfinder, faInfoCircle } from '@fortawesome/pro-solid-svg-icons';
import { chevronDownOutline, ellipsisHorizontal } from 'ionicons/icons';
import { useQueryClient } from '@tanstack/react-query';
import Resizer from 'react-image-file-resizer';
import { Camera, CameraResultType } from '@capacitor/camera';
import { decode } from 'base64-arraybuffer';

type SimpleFormState = {
  pronouns: string;
  bio: string;
  location: string;
  job: string;
  politics: string;
  school: string;
  covid_precaution_info: string;
  looking_for: string[];
  covid_precautions: number[];
  together_idea: string;
  freetime: string;
  hobby: string;
  petpeeve: string;
  talent: string;
  fave_book: string;
  fave_movie: string;
  fave_tv: string;
  fave_topic: string;
  fave_musicalartist: string;
  fave_game: string;
  fave_album: string;
  fave_sport_watch: string;
  fave_sport_play: string;
  fixation_book: string;
  fixation_movie: string;
  fixation_tv: string;
  fixation_topic: string;
  fixation_musicalartist: string;
  fixation_game: string;
  fixation_album: string;
  gender_sexuality_choices: string[];
  settings_show_gender_sexuality: boolean;
  settings_show_long_covid: boolean;
  long_covid_choices: string[];
  lived_experiences: string[];
  settings_show_lived_experiences: boolean;
};

const initialForm: SimpleFormState = {
  pronouns: '',
  bio: '',
  location: '',
  job: '',
  politics: '',
  school: '',
  covid_precaution_info: '',
  looking_for: [],
  covid_precautions: [],
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
  gender_sexuality_choices: [],
  settings_show_gender_sexuality: false,
  settings_show_long_covid: false,
  long_covid_choices: [],
  lived_experiences: [],
  settings_show_lived_experiences: false,
};

const SelfProfileV2: React.FC = () => {
  const history = useHistory();
  const currentUserProfile: any = useGetCurrentProfile().data;
  const { data: communityProfile } = useGetCommunityProfile();
  const [form, setForm] = useState<SimpleFormState>(initialForm);
  const [originalForm, setOriginalForm] = useState<SimpleFormState>(initialForm);
  const [photoOrder, setPhotoOrder] = useState<string[]>([]);
  const [photoOrderDraft, setPhotoOrderDraft] = useState<string[]>([]);
  const [editingPhotoOrder, setEditingPhotoOrder] = useState(false);
  const [photoEditImage, setPhotoEditImage] = useState<any>(null);
  const [photoEditName, setPhotoEditName] = useState<string | null>(null);
  const [photoEditField, setPhotoEditField] = useState<string | null>(null);
  const [photoTextEditor, setPhotoTextEditor] = useState<{ photoKey: string; mode: 'caption' | 'alt' } | null>(null);
  const [photoTextValue, setPhotoTextValue] = useState('');
  const [expandedPhotoMeta, setExpandedPhotoMeta] = useState<Record<string, boolean>>({});

  const [editing, setEditing] = useState<Record<keyof SimpleFormState, boolean>>({
    pronouns: false,
    bio: false,
    location: false,
    job: false,
    politics: false,
    school: false,
    covid_precaution_info: false,
    looking_for: false,
    covid_precautions: false,
    together_idea: false,
    freetime: false,
    hobby: false,
    petpeeve: false,
    talent: false,
    fave_book: false,
    fave_movie: false,
    fave_tv: false,
    fave_topic: false,
    fave_musicalartist: false,
    fave_game: false,
    fave_album: false,
    fave_sport_watch: false,
    fave_sport_play: false,
    fixation_book: false,
    fixation_movie: false,
    fixation_tv: false,
    fixation_topic: false,
    fixation_musicalartist: false,
    fixation_game: false,
    fixation_album: false,
    long_covid_choices: false,
    gender_sexuality_choices: false,
    settings_show_gender_sexuality: false,
    settings_show_long_covid: false,
    lived_experiences: false,
    settings_show_lived_experiences: false,
  });

  const queryClient = useQueryClient();
  const refreshProfile = () => queryClient.invalidateQueries({ queryKey: ['current'] });

  const [presentShowContactSupportAlert] = useIonAlert();
  const [presentPhotoAlert] = useIonAlert();
  const [presentUnsavedAlert] = useIonAlert();
  const pendingLocationRef = useRef<string | null>(null);
  const unblockRef = useRef<(() => void) | null>(null);
  const [presentPhotoActionSheet] = useIonActionSheet();
  const [photosAccordionValue, setPhotosAccordionValue] = useState<string | undefined>(undefined);

  const previewProfile = React.useMemo(() => {
    if (!currentUserProfile) return null;
    return {
      ...currentUserProfile,
      ...form, // latest local saved values
      photo_order: photoOrder, // include latest saved photo order (not draft)
    };
  }, [currentUserProfile, form, photoOrder]);

  useEffect(() => {
    if (!currentUserProfile) return;
    const nextForm = {
      pronouns: currentUserProfile.pronouns ?? '',
      bio: currentUserProfile.bio ?? '',
      location: currentUserProfile.location ?? '',
      job: currentUserProfile.job ?? '',
      politics: currentUserProfile.politics ?? '',
      school: currentUserProfile.school ?? '',
      covid_precaution_info: currentUserProfile.covid_precaution_info ?? '',
      looking_for: currentUserProfile.looking_for ?? [],
      covid_precautions: currentUserProfile.covid_precautions ?? [],
      together_idea: currentUserProfile.together_idea ?? '',
      freetime: currentUserProfile.freetime ?? '',
      hobby: currentUserProfile.hobby ?? '',
      petpeeve: currentUserProfile.petpeeve ?? '',
      talent: currentUserProfile.talent ?? '',
      fave_book: currentUserProfile.fave_book ?? '',
      fave_movie: currentUserProfile.fave_movie ?? '',
      fave_tv: currentUserProfile.fave_tv ?? '',
      fave_topic: currentUserProfile.fave_topic ?? '',
      fave_musicalartist: currentUserProfile.fave_musicalartist ?? '',
      fave_game: currentUserProfile.fave_game ?? '',
      fave_album: currentUserProfile.fave_album ?? '',
      fave_sport_watch: currentUserProfile.fave_sport_watch ?? '',
      fave_sport_play: currentUserProfile.fave_sport_play ?? '',
      fixation_book: currentUserProfile.fixation_book ?? '',
      fixation_movie: currentUserProfile.fixation_movie ?? '',
      fixation_tv: currentUserProfile.fixation_tv ?? '',
      fixation_topic: currentUserProfile.fixation_topic ?? '',
      fixation_musicalartist: currentUserProfile.fixation_musicalartist ?? '',
      fixation_game: currentUserProfile.fixation_game ?? '',
      fixation_album: currentUserProfile.fixation_album ?? '',
      settings_show_long_covid: currentUserProfile.settings_show_long_covid ?? false,
      long_covid_choices: currentUserProfile.long_covid_choices ?? [],
      gender_sexuality_choices: currentUserProfile.gender_sexuality_choices ?? [],
      settings_show_gender_sexuality: currentUserProfile.settings_show_gender_sexuality ?? false,
      lived_experiences: currentUserProfile.lived_experiences ?? [],
      settings_show_lived_experiences: currentUserProfile.settings_show_lived_experiences ?? false,
    };
    setForm(nextForm);
    setOriginalForm(nextForm);

    const photoKeysLocal = ['pic1_main', 'pic2', 'pic3', 'pic4', 'pic5', 'pic6', 'pic7', 'pic8', 'pic9'];
    const preferredOrder =
      Array.isArray(currentUserProfile.photo_order) && currentUserProfile.photo_order.length > 0
        ? currentUserProfile.photo_order
        : photoKeysLocal;

    const existingPhotos = photoKeysLocal.filter(key => currentUserProfile[key]);
    const mergedOrder = [
      ...preferredOrder.filter((key: string) => existingPhotos.includes(key)),
      ...existingPhotos.filter(key => !preferredOrder.includes(key)),
    ];

    setPhotoOrder(mergedOrder);
    setPhotoOrderDraft(mergedOrder);

    setEditing({
      pronouns: false,
      bio: false,
      location: false,
      job: false,
      politics: false,
      school: false,
      covid_precaution_info: false,
      looking_for: false,
      covid_precautions: false,
      together_idea: false,
      freetime: false,
      hobby: false,
      petpeeve: false,
      talent: false,
      fave_book: false,
      fave_movie: false,
      fave_tv: false,
      fave_topic: false,
      fave_musicalartist: false,
      fave_game: false,
      fave_album: false,
      fave_sport_watch: false,
      fave_sport_play: false,
      fixation_book: false,
      fixation_movie: false,
      fixation_tv: false,
      fixation_topic: false,
      fixation_musicalartist: false,
      fixation_game: false,
      fixation_album: false,
      gender_sexuality_choices: false,
      settings_show_gender_sexuality: false,
      settings_show_long_covid: false,
      long_covid_choices: false,
      lived_experiences: false,
      settings_show_lived_experiences: false,
    });
  }, [currentUserProfile]);

  const hasUnsavedChanges = Object.values(editing).some(Boolean) || editingPhotoOrder;

  useEffect(() => {
    if (!hasUnsavedChanges) {
      unblockRef.current?.();
      unblockRef.current = null;
      return;
    }

    unblockRef.current = history.block((location) => {
      pendingLocationRef.current = location.pathname;
      presentUnsavedAlert({
        header: 'Unsaved changes',
        message: 'You have unsaved changes. Leave anyway?',
        buttons: [
          {
            text: 'Leave',
            role: 'destructive',
            handler: () => {
              unblockRef.current?.();
              unblockRef.current = null;
              history.push(pendingLocationRef.current!);
            },
          },
          { text: 'Keep editing', role: 'cancel' },
        ],
      });
      return false;
    });

    return () => {
      unblockRef.current?.();
      unblockRef.current = null;
    };
  }, [hasUnsavedChanges]);

  const isFieldEmpty = (key: keyof SimpleFormState) => {
    const value = form[key];
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return typeof value === 'string' ? value.trim() === '' : false;
  };

  const handleLookingForToggle = async (value: string, checked: boolean) => {
    setForm(prev => {
      const next = checked ? [...prev.looking_for, value] : prev.looking_for.filter(v => v !== value);
      updateCurrentUserProfile({ looking_for: next });
      return { ...prev, looking_for: next };
    });
  };

  const showContactSupport = async (field: string, field2: string) => {
    presentShowContactSupportAlert({
      header: `We require you to contact support if you need to update your ${field}.`,
      subHeader: `Please use our Help feature and include what you would like your ${field2} updated to.`,
      buttons: [
        { text: 'Nevermind', role: 'cancel' },
        { text: 'Get Help', handler: () => { history.push(`/help?prefill=${field}`); } },
      ],
    });
  };

  // ✅ useIonModal version: feed from profileModalData state
  const [profilePresent, profileDismiss] = useIonModal(ProfileModal, {
    cardData: previewProfile,
    pro: true,
    settingsAlt: true,
    profiletype: 'self',
    yourName: previewProfile?.name || '',
    onDismiss: (data: any, role: any) => {
      refreshProfile();
      profileDismiss(data, role);
    },
  });

  const [locationPresent, locationDismiss] = useIonModal(EditLocationModal, {
    onDismiss: () => {
      refreshProfile();
      locationDismiss();
    },
  });

  const [photoCropPresent, photoCropDismiss] = useIonModal(CroppedImageModal, {
    image: photoEditImage,
    picDb: photoEditField,
    imageName: photoEditName,
    onDismiss: async () => {
      photoCropDismiss();
      refreshProfile();
    },
  });

  const startEdit = (key: keyof SimpleFormState) => {
    setEditing(prev => ({ ...prev, [key]: true }));
  };

  const stopEdit = (key: keyof SimpleFormState) => setEditing(prev => ({ ...prev, [key]: false }));

  const cancelEdit = (key: keyof SimpleFormState) => {
    setForm(prev => ({ ...prev, [key]: originalForm[key] }));
    stopEdit(key);
  };

  const saveField = async (key: keyof SimpleFormState, value?: string) => {
    const nextValue = value ?? (form[key] as string);
    await updateCurrentUserProfile({ [key]: nextValue });
    setForm(prev => ({ ...prev, [key]: nextValue }));
    setOriginalForm(prev => ({ ...prev, [key]: nextValue }));
    stopEdit(key);
  };

  const handleCovidToggle = async (value: number, checked: boolean) => {
    setForm(prev => {
      const next = checked
        ? (prev.covid_precautions.includes(value) ? prev.covid_precautions : [...prev.covid_precautions, value])
        : prev.covid_precautions.filter(v => v !== value);
      updateCurrentUserProfile({ covid_precautions: next });
      return { ...prev, covid_precautions: next };
    });
  };

  const handleGenderSexualityToggle = async (value: string, checked: boolean) => {
    setForm(prev => {
      const next = checked
        ? (prev.gender_sexuality_choices.includes(value) ? prev.gender_sexuality_choices : [...prev.gender_sexuality_choices, value])
        : prev.gender_sexuality_choices.filter(v => v !== value);
      updateCurrentUserProfile({ gender_sexuality_choices: next });
      setOriginalForm(prevOrg => ({ ...prevOrg, gender_sexuality_choices: next }));
      return { ...prev, gender_sexuality_choices: next };
    });
  };

  const toggleGenderSexualityShow = async (checked: boolean) => {
    setForm(prev => ({ ...prev, settings_show_gender_sexuality: checked }));
    await updateCurrentUserProfile({ settings_show_gender_sexuality: checked });
    setOriginalForm(prevOrg => ({ ...prevOrg, settings_show_gender_sexuality: checked }));
  };

  const handleLivedExperienceToggle = async (value: string, checked: boolean) => {
    setForm(prev => {
      const next = checked
        ? (prev.lived_experiences.includes(value) ? prev.lived_experiences : [...prev.lived_experiences, value])
        : prev.lived_experiences.filter(v => v !== value);
      updateCurrentUserProfile({ lived_experiences: next });
      setOriginalForm(prevOrg => ({ ...prevOrg, lived_experiences: next }));
      return { ...prev, lived_experiences: next };
    });
  };

  const toggleLivedExperiencesShow = async (checked: boolean) => {
    setForm(prev => ({ ...prev, settings_show_lived_experiences: checked }));
    await updateCurrentUserProfile({ settings_show_lived_experiences: checked });
    setOriginalForm(prevOrg => ({ ...prevOrg, settings_show_lived_experiences: checked }));
  };

  const summaryKeys = ['pronouns', 'job', 'politics', 'school'] as const;
  const aboutKeys = ['bio'] as const;

  const covidGroups: Record<string, [number, string][]> = {
    Home: [
      [18, 'I have no routine daily exposures'],
      [3, 'I live with non-Covid cautious people'],
      [8, 'I live alone/with others that share my level of Covid caution'],
    ],
    Work: [
      [1, 'I work from home'],
      [9, 'I go to work/school but always in a high quality mask'],
      [16, 'My work requires poor/no masking'],
    ],
    Play: [
      [2, 'I eat outside at restaurants with good airflow and spacing'],
      [15, 'I do takeout from restaurants'],
      [5, 'I attend outdoor events'],
      [12, 'I attend outdoor events with a mask on'],
      [6, 'I attend indoor events with a mask on'],
    ],
    Other: [
      [4, "I'm immunocompromised/have a high-risk health condition"],
      [17, 'I am a caregiver'],
      [7, 'I only leave home/outdoors for medically necessary reasons'],
      [10, 'I am living with Long Covid'],
      [11, 'I use air purifiers and use HEPA filters'],
      [13, 'I ask for testing before all meetups'],
      [14, 'I ask for testing before indoor meetups'],
    ],
  };

  const getCovidLabel = (value: number) => Object.values(covidGroups).flat().find(item => item[0] === value)?.[1];

  const genderSexualityOptions: [string, string][][] = [
    [
      ['straight', 'Straight/heterosexual'],
      ['gay', 'Gay/homosexual'],
      ['lesbian', 'Lesbian'],
      ['bi', 'Bi'],
      ['pan', 'Pan'],
      ['gray ace', 'Gray ace'],
      ['ace', 'Ace'],
      ['demi', 'Demisexual'],
      ['queer', 'Queer'],
    ],
    [
      ['man', 'Man'],
      ['woman', 'Woman'],
      ['nb', 'Nonbinary/gender nonconforming'],
      ['genderfluid', 'Gender Fluid'],
      ['cis', 'Cis'],
      ['trans', 'Trans'],
      ['intersex', 'Intersex'],
      ['mono', 'Monogamous'],
      ['poly', 'Polyamorous'],
    ],
  ];

  const getGenderSexualityLabel = (value: string) => genderSexualityOptions.flat().find(([val]) => val === value)?.[1];

  const genderSexualitySummary = form.gender_sexuality_choices
    .map(value => getGenderSexualityLabel(value))
    .filter(Boolean) as string[];

  const livedExperienceOptions: [string, string][] = [
    ['poc', 'POC'],
    ['spiritual', 'Spiritual'],
    ['neurodivergent', 'Neurodivergent'],
    ['sober', 'Sober'],
  ];

  const livedExperiencePopoverText =
    "We’re adding future filters. Filtering will unlock once enough members opt in to ensure meaningful results.";

  const showOnProfileInfoText =
    "These choices are used when other members filter Discovery. You can also choose whether or not to show them on your profile.";

  const ShowOnProfilePopover = () => (
    <IonContent className="ion-padding no-scroll">{showOnProfileInfoText}</IonContent>
  );

  const [presentShowOnProfilePopover, dismissShowOnProfilePopover] = useIonPopover(
    ShowOnProfilePopover,
    { onDismiss: () => dismissShowOnProfilePopover() }
  );

  const getLivedExperienceLabel = (value: string) => livedExperienceOptions.find(([val]) => val === value)?.[1];

  const livedExperienceSummary = form.lived_experiences
    .map(value => getLivedExperienceLabel(value))
    .filter(Boolean) as string[];

  const pronounOptions = ['she/her', 'he/him', 'they/them'] as const;
  const photoKeys = ['pic1_main', 'pic2', 'pic3', 'pic4', 'pic5', 'pic6', 'pic7', 'pic8', 'pic9'];

  const photoLabels: Record<string, string> = {
    pic1_main: 'Profile photo',
  };

  const captionOptions = [
    'Me in my best mask',
    'Salting the vibes',
    'A favorite from the-before-times',
    'The fam',
    'A selfie',
    'My bestie',
    'Me at work',
    'My happy place',
    'A random picture I love',
    'I just liked this outfit',
    'Could use a buddy for this!',
    "It's not home without...",
    'Living life',
    "Cheesin'",
    'Recognize this place?',
    '',
  ];

  if (!currentUserProfile) {
    return null;
  }

  const covidSummary = form.covid_precautions.map(value => getCovidLabel(value)).filter(Boolean) as string[];

  const talkAboutKeys = ['together_idea', 'freetime', 'hobby', 'petpeeve', 'talent'] as const;
  const favoriteKeys = [
    'fave_book',
    'fave_movie',
    'fave_tv',
    'fave_topic',
    'fave_musicalartist',
    'fave_game',
    'fave_album',
    'fave_sport_watch',
    'fave_sport_play',
  ] as const;
  const fixationKeys = [
    'fixation_book',
    'fixation_movie',
    'fixation_tv',
    'fixation_topic',
    'fixation_musicalartist',
    'fixation_game',
    'fixation_album',
  ] as const;

  const fieldLabels: Record<keyof SimpleFormState, { label: string; description: string }> = {
    location: { label: 'Location', description: 'Where you spend most of your time.' },
    pronouns: { label: 'Pronouns', description: 'How others can refer to you.' },
    job: { label: 'Job', description: 'Current profession or focus.' },
    politics: { label: 'Politics', description: 'Share how you lean on issues.' },
    school: { label: 'School', description: 'Education you are currently attending or attended.' },
    bio: { label: 'Bio', description: 'A quick snapshot for people meeting you.' },
    covid_precaution_info: { label: 'Covid behaviors', description: 'Let people know how you approach safety.' },
    looking_for: { label: 'Looking for', description: 'What types of connections you are open to.' },
    covid_precautions: { label: 'Covid precautions', description: 'Detailed precautions that describe your boundaries.' },
    together_idea: { label: 'What we could do together', description: 'What they can ask you about.' },
    freetime: { label: 'Freetime', description: 'What you do with your free time.' },
    hobby: { label: 'Hobby', description: 'Your favorite hobbies.' },
    petpeeve: { label: 'Pet peeve', description: 'Things that bother you.' },
    talent: { label: 'Talent', description: 'Skills you bring to connect.' },
    fave_book: { label: 'Favorite book', description: 'Books you currently love.' },
    fave_movie: { label: 'Favorite movie', description: 'Movies you keep rewatching.' },
    fave_tv: { label: 'Favorite TV show', description: 'Series that hooked you.' },
    fave_topic: { label: 'Favorite topic', description: 'Conversations you love.' },
    fave_musicalartist: { label: 'Favorite musical artist', description: 'The artist you jam to.' },
    fave_game: { label: 'Favorite game', description: 'Games you like to play.' },
    fave_album: { label: 'Favorite album', description: 'Albums on repeat.' },
    fave_sport_watch: { label: 'Favorite sport to watch', description: 'Sports you enjoy watching.' },
    fave_sport_play: { label: 'Favorite sport to play', description: 'Activities you like to play.' },
    fixation_book: { label: 'Current book', description: 'Book you can’t stop reading.' },
    fixation_movie: { label: 'Current movie', description: 'Movie you keep thinking about.' },
    fixation_tv: { label: 'Current TV show', description: 'TV you keep up with.' },
    fixation_topic: { label: 'Current topic', description: 'Topic you’re curious about.' },
    fixation_musicalartist: { label: 'Current musical artist', description: 'Artist you have on repeat.' },
    fixation_game: { label: 'Current game', description: 'Game you’re playing.' },
    fixation_album: { label: 'Current album', description: 'Album you’re listening to.' },
    gender_sexuality_choices: { label: 'Gender & sexuality choices', description: 'Filters other members see.' },
    settings_show_gender_sexuality: { label: 'Show gender/sexuality filters', description: 'Toggle visibility on your profile.' },
    settings_show_long_covid: { label: 'Show Long Covid info', description: 'Display these choices on your profile.' },
    long_covid_choices: { label: 'Long Covid choices', description: 'Support availability for Long Covid.' },
    settings_show_lived_experiences: { label: 'Show lived experiences', description: 'Display these choices on your profile.' },
    lived_experiences: { label: 'Lived experiences', description: 'Self-selected lived experience tags.' },
  };

  const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <div className="talk-section-header">
      <h3>{title}</h3>
      {subtitle && <IonText color="medium">{subtitle}</IonText>}
    </div>
  );

  const EditableField: React.FC<{ fieldKey: keyof SimpleFormState; multiline?: boolean }> = ({ fieldKey, multiline }) => {
    const value = form[fieldKey];
    const [editorValue, setEditorValue] = useState((value as string) ?? '');

    useEffect(() => {
      if (!editing[fieldKey]) return;
      setEditorValue((form[fieldKey] as string) ?? '');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing[fieldKey]]);

    return (
      <IonItem className={`card-field ${editing[fieldKey] ? 'editing' : ''}`}>
        <div className="editing-section">
          <div className="field-header">
            <p>{fieldLabels[fieldKey].label}</p>
            {!editing[fieldKey] && (
              <div className="field-actions">
                <IonButton
                  size="small"
                  fill="outline"
                  color="primary"
                  className={`edit-button ${isFieldEmpty(fieldKey) ? 'blank-edit' : ''}`}
                  onClick={() => startEdit(fieldKey)}
                >
                  Edit
                </IonButton>
              </div>
            )}
          </div>

          {editing[fieldKey] ? (
            multiline ? (
              <IonTextarea
                value={editorValue}
                onIonInput={e => setEditorValue(e.detail.value ?? '')}
                placeholder={`Update your ${fieldLabels[fieldKey].label}`}
                autoGrow
                rows={4}
                autocapitalize='sentences'
                autoCorrect='on'
              />
            ) : (
              <IonInput value={editorValue} onIonInput={e => setEditorValue(e.detail.value ?? '')} placeholder={`Update your ${fieldLabels[fieldKey].label}`} debounce={250} />
            )
          ) : (
            <h2 className={`multi-line ${multiline ? 'multi-line' : ''}`}>{(value as string) || <span>-</span>}</h2>
          )}

          {editing[fieldKey] && (
            <div className="field-actions editing-actions">
              {!!editorValue && (
                <IonButton className="clear-button" size="small" fill="clear" color="danger" onClick={() => setEditorValue('')} type="button">
                  Clear
                </IonButton>
              )}
              <IonButton className="cancel-button" size="small" fill="clear" color="medium" onClick={() => cancelEdit(fieldKey)} type="button">
                Cancel
              </IonButton>
              <IonButton className="save-button" size="small" color="success" onClick={() => saveField(fieldKey, editorValue)}>
                Save
              </IonButton>
            </div>
          )}
        </div>
      </IonItem>
    );
  };

  const EditablePronouns: React.FC = () => {
    const value = form.pronouns;
    const [editorValue, setEditorValue] = useState(value ?? '');
    const [editorChoice, setEditorChoice] = useState<string>(
      pronounOptions.includes(value as (typeof pronounOptions)[number]) ? (value as string) : 'custom',
    );

    useEffect(() => {
      if (!editing.pronouns) return;
      const nextValue = form.pronouns ?? '';
      setEditorValue(nextValue);
      setEditorChoice(pronounOptions.includes(nextValue as (typeof pronounOptions)[number]) ? nextValue : 'custom');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing.pronouns]);

    return (
      <IonItem className={`card-field ${editing.pronouns ? 'editing' : ''}`}>
        <div className="editing-section">
          <div className="field-header">
            <p>{fieldLabels.pronouns.label}</p>
            {!editing.pronouns && (
              <div className="field-actions">
                <IonButton size="small" fill="outline" color="primary" className={`edit-button ${isFieldEmpty('pronouns') ? 'blank-edit' : ''}`} onClick={() => startEdit('pronouns')}>
                  Edit
                </IonButton>
              </div>
            )}
          </div>

          {editing.pronouns ? (
            <>
              <IonSelect
                value={editorChoice}
                placeholder="Select pronouns"
                onIonChange={e => {
                  const nextChoice = e.detail.value as string;
                  setEditorChoice(nextChoice);
                  if (nextChoice !== 'custom') {
                    setEditorValue(nextChoice);
                  }
                }}
              >
                {pronounOptions.map(option => (
                  <IonSelectOption key={option} value={option}>
                    {option}
                  </IonSelectOption>
                ))}
                <IonSelectOption value="custom">Custom</IonSelectOption>
              </IonSelect>

              {editorChoice === 'custom' && (
                <IonInput value={editorValue} onIonInput={e => setEditorValue(e.detail.value ?? '')} placeholder="Enter your pronouns" debounce={250} />
              )}
            </>
          ) : (
            <h2 className="multi-line">{value || '-'}</h2>
          )}

          {editing.pronouns && (
            <div className="field-actions editing-actions">
              {!!editorValue && (
                <IonButton
                  className="clear-button"
                  size="small"
                  fill="clear"
                  color="danger"
                  onClick={() => {
                    setEditorChoice('custom');
                    setEditorValue('');
                  }}
                  type="button"
                >
                  Clear
                </IonButton>
              )}
              <IonButton className="cancel-button" size="small" fill="clear" color="medium" onClick={() => cancelEdit('pronouns')} type="button">
                Cancel
              </IonButton>
              <IonButton className="save-button" size="small" color="success" onClick={() => saveField('pronouns', editorValue)}>
                Save
              </IonButton>
            </div>
          )}
        </div>
      </IonItem>
    );
  };

  const handlePhotoReorder = (event: CustomEvent) => {
    const from = event.detail.from as number;
    const to = event.detail.to as number;

    if (!editingPhotoOrder) {
      event.detail.complete();
      return;
    }
    if (from === to) {
      event.detail.complete();
      return;
    }

    setPhotoOrderDraft(prev => {
      const next = [...prev];
      next.splice(to, 0, ...next.splice(from, 1));
      return next;
    });

    event.detail.complete();
  };

  const getPhotoCount = () => photoKeys.filter(key => currentUserProfile?.[key]).length;
  const getNextEmptyPhotoKey = () => photoKeys.find(key => !currentUserProfile?.[key]);

  const getPhotoCaption = (key: string) => {
    const value = currentUserProfile?.[`${key}_caption`];
    if (!value || value === 'profile picture') return '';
    return value;
  };

  const getPhotoAltText = (key: string) => currentUserProfile?.[`${key}_alt`] || '';

  const isPhotoMetaLong = (photoKey: string) => {
    const caption = getPhotoCaption(photoKey);
    const alt = getPhotoAltText(photoKey);
    return caption.length > 36 || alt.length > 120;
  };

  const openPhotoTextEditor = (photoKey: string, mode: 'caption' | 'alt') => {
    setPhotoTextEditor({ photoKey, mode });
    setPhotoTextValue(
      mode === 'caption'
        ? currentUserProfile?.[`${photoKey}_caption`] || ''
        : currentUserProfile?.[`${photoKey}_alt`] || ''
    );
  };

  const closePhotoTextEditor = () => {
    setPhotoTextEditor(null);
    setPhotoTextValue('');
  };

  const savePhotoTextEditor = async () => {
    if (!photoTextEditor) return;
    const { photoKey, mode } = photoTextEditor;
    const fieldName = `${photoKey}_${mode === 'caption' ? 'caption' : 'alt'}`;
    const maxLength = mode === 'caption' ? 32 : 300;
    await updateCurrentUserProfile({ [fieldName]: photoTextValue.slice(0, maxLength) });
    refreshProfile();
    closePhotoTextEditor();
  };

  const replacePhoto = async (photoKey: string, photoLabel: string) => {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
    });

    const photoBlob = new Blob([new Uint8Array(decode(photo.base64String!))], {
      type: `image/${photo.format}`,
    });

    Resizer.imageFileResizer(
      photoBlob,
      1500,
      1500,
      'JPEG',
      90,
      0,
      uri => {
        setPhotoEditImage(uri);
        setPhotoEditField(photoKey);
        setPhotoEditName(photoLabel);
        photoCropPresent();
      },
      'base64',
    );
  };

  const openPhotoActions = (photoKey: string) => {
    const canEditCaption = photoKey !== 'pic1_main';
    const totalPhotos = getPhotoCount();

    presentPhotoActionSheet({
      header: photoLabels[photoKey] || 'Photo',
      buttons: [
        {
          text: 'Replace photo',
          handler: () => replacePhoto(photoKey, photoLabels[photoKey] || photoKey),
        },
        ...(canEditCaption
          ? [
              {
                text: 'Edit caption',
                handler: () => openPhotoTextEditor(photoKey, 'caption'),
              },
            ]
          : []),
        {
          text: 'Edit alt text',
          handler: () => openPhotoTextEditor(photoKey, 'alt'),
        },
        {
          text: 'Delete photo',
          role: 'destructive',
          handler: async () => {
            if (totalPhotos <= 3) {
              presentPhotoAlert({
                header: 'Deleting this photo will pause your profile until you have at least 3 photos.',
                subHeader: 'You can replace it now or delete it and pause your profile.',
                message: '',
                buttons: [
                  { text: 'Nevermind', role: 'cancel' },
                  { text: 'Replace instead', handler: () => replacePhoto(photoKey, photoLabels[photoKey] || photoKey) },
                  {
                    text: 'Delete',
                    role: 'destructive',
                    handler: async () => {
                      await updateCurrentUserProfile({ [photoKey]: null, paused_profile: true });
                      refreshProfile();
                    },
                  },
                ],
              } as any);
              return;
            }
            await updateCurrentUserProfile({ [photoKey]: null });
            refreshProfile();
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });
  };

  return (
    <div className="self-profile-v2">
      <IonModal isOpen={Boolean(photoTextEditor)} onDidDismiss={closePhotoTextEditor}>
        <IonHeader>
          <IonToolbar className="modal-title">
            <IonTitle>{photoTextEditor?.mode === 'caption' ? 'Edit caption' : 'Edit alt text'}</IonTitle>
            <IonButtons slot="start">
              <IonButton onClick={closePhotoTextEditor}>Cancel</IonButton>
            </IonButtons>
            <IonButtons slot="end">
              <IonButton onClick={savePhotoTextEditor}>Save</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {photoTextEditor?.mode === 'caption' ? (
            <>
              <IonText color="medium">
                <p>Pick one of ours or write your own.</p>
              </IonText>
              <div className="photo-caption-presets">
                <IonButton
                  size="small"
                  fill={!captionOptions.filter(option => option !== '').includes(photoTextValue) ? 'solid' : 'outline'}
                  onClick={() => setPhotoTextValue('')}
                >
                  (None or write your own)
                </IonButton>
                {captionOptions
                  .filter(option => option !== '')
                  .map(option => (
                    <IonButton
                      key={option}
                      size="small"
                      fill={photoTextValue === option ? 'solid' : 'outline'}
                      onClick={() => setPhotoTextValue(option)}
                    >
                      {option}
                    </IonButton>
                  ))}
              </div>
              <IonItem lines="none" className="photo-text-editor-field">
                <IonTextarea
                  value={photoTextValue}
                  autoGrow
                  maxlength={32}
                  counter
                  placeholder="Add a custom caption"
                  onIonInput={e => setPhotoTextValue((e.detail.value ?? '').slice(0, 32))}
                />
              </IonItem>
            </>
          ) : (
            <>
              <IonText color="medium">
                <p>This description is used by screen readers and shown to help others understand your photo.</p>
              </IonText>
              <IonItem lines="none" className="photo-text-editor-field">
                <IonTextarea
                  value={photoTextValue}
                  autoGrow
                  maxlength={300}
                  counter
                  placeholder="Add alt text"
                  onIonInput={e => setPhotoTextValue((e.detail.value ?? '').slice(0, 300))}
                />
              </IonItem>
            </>
          )}
          <div className="photo-text-editor-actions">
            <IonButton
              fill="clear"
              color="medium"
              onClick={() => setPhotoTextValue('')}
            >
              Clear
            </IonButton>
          </div>
        </IonContent>
      </IonModal>
      <IonGrid>
        <IonRow className="preview-row">
          <IonCol className="ion-text-center">
            <IonButton
              color="primary"
              onClick={() => {
                profilePresent();
              }}
            >
              <FontAwesomeIcon icon={faFaceViewfinder as IconProp} />
              &nbsp; See how others see your profile
            </IonButton>
          </IonCol>
        </IonRow>

        <IonAccordionGroup className="profile-accordion-group">
          <IonAccordion value="basics">
            <IonItem slot="header" lines="none" className="accordion-header">
              <IonLabel>
                <h2>The Basics</h2>
              </IonLabel>
            </IonItem>
            <IonCardContent slot="content" className="accordion-body">
              <div className="info-section">
                <IonItem lines="none">
                  <IonLabel>
                    <p>Name:</p>
                    <h2>{currentUserProfile.name}</h2>
                  </IonLabel>
                  <IonButton size="small" color="primary" fill="outline" className="tiny-edit" onClick={() => showContactSupport('name', 'name')}>
                    <FontAwesomeIcon icon={faInfoCircle as IconProp} />
                  </IonButton>
                </IonItem>
                <IonItem lines="none">
                  <IonLabel>
                    <p>Age:</p>
                    <h2>{currentUserProfile.age}</h2>
                  </IonLabel>
                  <IonButton size="small" color="primary" fill="outline" className="tiny-edit" onClick={() => showContactSupport('age', 'birthdate')}>
                    <FontAwesomeIcon icon={faInfoCircle as IconProp} />
                  </IonButton>
                </IonItem>
                <IonItem lines="none">
                  <IonLabel>
                    <p>Location:</p>
                    <h2>{currentUserProfile.location}</h2>
                  </IonLabel>
                  <IonButton size="small" color="primary" fill="outline" className="edit-button" onClick={() => locationPresent()}>
                    Edit
                  </IonButton>
                </IonItem>
              </div>

              {summaryKeys.map(key => (key === 'pronouns' ? <EditablePronouns key="pronouns" /> : <EditableField key={key} fieldKey={key} />))}

              <div style={{ marginTop: '12px' }}>
                {aboutKeys.map(key => (
                  <EditableField key={key} fieldKey={key} multiline />
                ))}
              </div>
            </IonCardContent>
          </IonAccordion>
        </IonAccordionGroup>

        <IonAccordionGroup className="profile-accordion-group" value={photosAccordionValue} onIonChange={ev => setPhotosAccordionValue(ev.detail.value as string | undefined)}>
          <IonAccordion value="photos">
            <IonItem slot="header" lines="none" className="accordion-header">
              <IonLabel>
                <h2>Photos</h2>
              </IonLabel>
            </IonItem>
            <IonCardContent slot="content" className="accordion-body">
              <div className="field-header">
                {editingPhotoOrder && (
                  <IonText color="medium">
                    <p>Drag the three lines to reorder.</p>
                  </IonText>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                  {editingPhotoOrder && (
                    <IonButton
                      size="small"
                      fill="clear"
                      color="medium"
                      onClick={() => {
                        setPhotoOrderDraft(photoOrder);
                        setEditingPhotoOrder(false);
                      }}
                    >
                      Cancel
                    </IonButton>
                  )}
                  <IonButton
                    size="small"
                    fill={editingPhotoOrder ? 'solid' : 'outline'}
                    color={editingPhotoOrder ? 'success' : 'primary'}
                    onClick={async () => {
                      if (!editingPhotoOrder) {
                        setEditingPhotoOrder(true);
                        setPhotoOrderDraft(photoOrder);
                        return;
                      }
                      await updateCurrentUserProfile({ photo_order: photoOrderDraft });
                      setPhotoOrder(photoOrderDraft);
                      setEditingPhotoOrder(false);
                    }}
                  >
                    {editingPhotoOrder ? 'Save order' : 'Edit order'}
                  </IonButton>
                </div>
              </div>

              {photoOrder.length > 0 ? (
                <IonReorderGroup disabled={!editingPhotoOrder} onIonItemReorder={handlePhotoReorder}>
                  {photoOrderDraft.map(key => (
                    <IonItem key={key} button onClick={() => openPhotoActions(key)} detailIcon={ellipsisHorizontal}>
                      <IonThumbnail slot="start" style={{ width: '96px', height: '96px' }}>
                        <img alt={photoLabels[key] || 'Profile photo'} src={currentUserProfile?.[key]} onError={onImgError} />
                      </IonThumbnail>
                      <IonLabel className="photo-meta-label">
                        <div className={`photo-meta-preview${expandedPhotoMeta[key] ? ' expanded' : ''}`}>
                          {getPhotoCaption(key) ? (
                            <IonText color="dark">
                              <p className="photo-meta-caption">{getPhotoCaption(key)}</p>
                            </IonText>
                          ) : null}
                          {getPhotoAltText(key) ? <p className="photo-meta-alt">Alt: {getPhotoAltText(key)}</p> : null}
                        </div>
                        {!getPhotoCaption(key) && !getPhotoAltText(key) ? <p className="placeholder">Add a caption or alt text</p> : null}
                        {isPhotoMetaLong(key) ? (
                          <IonButton
                            fill="clear"
                            size="small"
                            className="photo-meta-toggle"
                            onClick={event => {
                              event.stopPropagation();
                              setExpandedPhotoMeta(prev => ({ ...prev, [key]: !prev[key] }));
                            }}
                          >
                            {expandedPhotoMeta[key] ? 'Show less' : 'Show more'}
                          </IonButton>
                        ) : null}
                      </IonLabel>
                      <IonReorder slot="end" />
                    </IonItem>
                  ))}
                </IonReorderGroup>
              ) : (
                <p className="placeholder">Add photos to reorder them.</p>
              )}

              {getPhotoCount() < 9 && (
                <IonRow className="ion-justify-content-center ion-padding">
                  <IonButton
                    size="small"
                    fill="outline"
                    onClick={() => {
                      const nextKey = getNextEmptyPhotoKey();
                      if (!nextKey) return;
                      replacePhoto(nextKey, photoLabels[nextKey] || nextKey);
                    }}
                  >
                    Add photo
                  </IonButton>
                </IonRow>
              )}

              {['pic1_main', 'pic2', 'pic3', 'pic4', 'pic5', 'pic6', 'pic7', 'pic8', 'pic9'].filter(key => currentUserProfile?.[key]).length < 3 && (
                <IonText color="danger">
                  <p>Heads up: you need at least 3 photos to keep your profile active.</p>
                </IonText>
              )}
            </IonCardContent>
          </IonAccordion>
        </IonAccordionGroup>

        <IonAccordionGroup className="profile-accordion-group">
          <IonAccordion value="lookingFor">
            <IonItem slot="header" lines="none" className="accordion-header">
              <IonLabel>
                <h2>Looking for</h2>
              </IonLabel>
            </IonItem>

            <IonCardContent slot="content" className="card-grid accordion-body">
              <div className="field-header">
                <p>Looking for</p>
                <IonButton size="small" fill="outline" color="primary" onClick={() => setEditing(prev => ({ ...prev, looking_for: !prev.looking_for }))}>
                  {editing.looking_for ? 'Done' : 'Edit'}
                </IonButton>
              </div>

              {form.looking_for.length > 0 ? (
                <ul className="choice-summary">
                  {form.looking_for.map(val => (
                    <li key={val}>{val === 'virtual connection' ? 'Virtual connection' : val.charAt(0).toUpperCase() + val.slice(1)}</li>
                  ))}
                </ul>
              ) : (
                <p className="placeholder">Nothing selected yet.</p>
              )}

              {editing.looking_for && (
                <div className="choice-editor">
                  <IonList lines="none">
                    {['friendship', 'romance', 'virtual connection', 'virtual only', 'job', 'housing', 'families'].map(val => (
                      <IonItem key={val} lines="none">
                        <IonCheckbox slot="start" value={val} checked={form.looking_for.includes(val)} onIonChange={e => handleLookingForToggle(val, e.detail.checked)} />
                        {val === 'virtual connection' ? 'Virtual connection' : val.charAt(0).toUpperCase() + val.slice(1)}
                      </IonItem>
                    ))}
                  </IonList>
                </div>
              )}
            </IonCardContent>
          </IonAccordion>
        </IonAccordionGroup>

        <IonAccordionGroup className="profile-accordion-group">
          <IonAccordion value="genderSexuality">
            <IonItem slot="header" lines="none" className="accordion-header">
              <IonLabel>
                <h2>Gender &amp; Sexuality</h2>
              </IonLabel>
            </IonItem>
            <IonCardContent slot="content" className="no-padding-cc accordion-body">
              <IonRow>
                <IonCol size="12">
                  <IonCard className="accordion-card">
                    <IonCardContent className="card-grid">
                      <div className="field-header">
                        <div className="selfprofile-info-row">
                          <p>Show on profile?</p>
                          <IonButton
                            fill="clear"
                            size="small"
                            className="selfprofile-info-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              presentShowOnProfilePopover({ event: event.nativeEvent as Event });
                            }}
                          >
                            <FontAwesomeIcon icon={faInfoCircle as IconProp} />
                          </IonButton>
                        </div>
                        <IonToggle slot="end" checked={form.settings_show_gender_sexuality} onIonChange={e => toggleGenderSexualityShow(e.detail.checked)} />
                      </div>

                      <div className="field-header">
                        <p>Choices</p>
                        <IonButton size="small" fill="outline" color="primary" onClick={() => setEditing(prev => ({ ...prev, gender_sexuality_choices: !prev.gender_sexuality_choices }))}>
                          {editing.gender_sexuality_choices ? 'Done' : 'Edit'}
                        </IonButton>
                      </div>

                      {genderSexualitySummary.length > 0 ? (
                        <ul className="choice-summary">
                          {genderSexualitySummary.map(label => (
                            <li key={label}>{label}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="placeholder">Not specified yet.</p>
                      )}

                      {editing.gender_sexuality_choices && (
                        <div className="choice-editor gender-choices">
                          {genderSexualityOptions.map(group => (
                            <div key={group[0][0]} className="choice-group">
                              <IonList lines="none">
                                {group.map(([value, label]) => (
                                  <IonItem key={value} lines="none">
                                    <IonCheckbox slot="start" checked={form.gender_sexuality_choices.includes(value)} onIonChange={e => handleGenderSexualityToggle(value, e.detail.checked)} />
                                    {label}
                                  </IonItem>
                                ))}
                              </IonList>
                            </div>
                          ))}
                        </div>
                      )}
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonCardContent>
          </IonAccordion>
        </IonAccordionGroup>

        <IonAccordionGroup className="profile-accordion-group">
          <IonAccordion value="livedExperiences">
            <IonItem slot="header" lines="none" className="accordion-header">
              <IonLabel>
                <h2 className="selfprofile-title-row">
                  <span>Lived Experiences</span>
                </h2>
              </IonLabel>
            </IonItem>
            <IonCardContent slot="content" className="no-padding-cc accordion-body">
              <IonRow>
                <IonCol size="12">
                  <IonCard className="accordion-card">
                    <IonCardContent className="card-grid">
                      <div className="field-header">
                        <div className="selfprofile-info-row">
                          <p>Show on profile?</p>
                          <IonButton
                            fill="clear"
                            size="small"
                            className="selfprofile-info-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              presentShowOnProfilePopover({ event: event.nativeEvent as Event });
                            }}
                          >
                            <FontAwesomeIcon icon={faInfoCircle as IconProp} />
                          </IonButton>
                        </div>
                        <IonToggle slot="end" checked={form.settings_show_lived_experiences} onIonChange={e => toggleLivedExperiencesShow(e.detail.checked)} />
                      </div>

                      <div className="field-header">
                        <p>Choices</p>
                        <IonButton size="small" fill="outline" color="primary" onClick={() => setEditing(prev => ({ ...prev, lived_experiences: !prev.lived_experiences }))}>
                          {editing.lived_experiences ? 'Done' : 'Edit'}
                        </IonButton>
                      </div>

                      {livedExperienceSummary.length > 0 ? (
                        <ul className="choice-summary">
                          {livedExperienceSummary.map(label => (
                            <li key={label}>{label}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="placeholder">Not specified yet.</p>
                      )}

                      {editing.lived_experiences && (
                        <div className="choice-editor">
                          <IonList lines="none">
                            {livedExperienceOptions.map(([value, label]) => (
                              <IonItem key={value} lines="none">
                                <IonCheckbox slot="start" checked={form.lived_experiences.includes(value)} onIonChange={e => handleLivedExperienceToggle(value, e.detail.checked)} />
                                {label}
                              </IonItem>
                            ))}
                          </IonList>
                        </div>
                      )}
                      <div className="selfprofile-footnote lived-footnote">
                        <span className="selfprofile-footnote-star">*</span>
                        <span>{livedExperiencePopoverText}</span>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonCardContent>
          </IonAccordion>
        </IonAccordionGroup>

        <IonAccordionGroup className="profile-accordion-group">
          <IonAccordion value="covidBehaviors">
            <IonItem slot="header" lines="none" className="accordion-header">
              <IonLabel>
                <h2>Covid Behaviors</h2>
              </IonLabel>
            </IonItem>
            <IonCardContent slot="content" className="no-padding-cc accordion-body">
              <IonRow>
                <IonCol size="12">
                  <IonCard className="accordion-card">
                    <IonCardContent className="card-grid">
                      <div className="field-header">
                        <p>Precautions</p>
                        <IonButton size="small" fill="outline" color="primary" onClick={() => setEditing(prev => ({ ...prev, covid_precautions: !prev.covid_precautions }))}>
                          {editing.covid_precautions ? 'Done' : 'Edit'}
                        </IonButton>
                      </div>

                      {covidSummary.length > 0 ? (
                        <ul className="choice-summary">
                          {covidSummary.map(label => (
                            <li key={label}>{label}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="placeholder">No choices yet.</p>
                      )}

                      {editing.covid_precautions && (
                        <div className="choice-editor">
                          {Object.entries(covidGroups).map(([section, items]) => (
                            <div key={section}>
                              <IonText color="medium">
                                <strong>{section}</strong>
                              </IonText>
                              <IonList lines="none">
                                {items.map(([value, label]) => (
                                  <IonItem key={value}>
                                    <IonCheckbox slot="start" checked={form.covid_precautions.includes(value)} onIonChange={e => handleCovidToggle(value, e.detail.checked)} />
                                    {label}
                                  </IonItem>
                                ))}
                              </IonList>
                            </div>
                          ))}
                        </div>
                      )}

                      <EditableField fieldKey="covid_precaution_info" multiline />
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonCardContent>
          </IonAccordion>
        </IonAccordionGroup>

        <IonAccordionGroup className="profile-accordion-group">
          <IonAccordion value="talk">
            <IonItem slot="header" lines="none" className="accordion-header">
              <IonLabel>
                <h2>Let's Talk About</h2>
              </IonLabel>
            </IonItem>
            <IonCardContent slot="content" className="no-padding-cc accordion-body">
              <IonRow>
                <IonCol size="12">
                  <IonCard className="accordion-card">
                    <IonCardContent className="card-grid">
                      {talkAboutKeys.map(key => (
                        <EditableField key={key} fieldKey={key} multiline />
                      ))}
                      <SectionHeader title="Favorites" />
                      {favoriteKeys.map(key => (
                        <EditableField key={key} fieldKey={key} />
                      ))}
                      <SectionHeader title="Current Interests" />
                      {fixationKeys.map(key => (
                        <EditableField key={key} fieldKey={key} />
                      ))}
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonCardContent>
          </IonAccordion>
        </IonAccordionGroup>

        {(currentUserProfile?.username ?? communityProfile?.username) ? <CommunityProfileSection /> : null}
      </IonGrid>
    </div>
  );
};

export default SelfProfileV2;
