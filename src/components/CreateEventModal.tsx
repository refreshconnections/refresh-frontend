import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonAlert,
  IonLabel,
  IonList,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonText,
  IonTitle,
  IonToolbar,
  IonIcon,
  useIonPopover,
  useIonModal,
  useIonRouter,
  IonCard,
  IonToggle,
} from '@ionic/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import { apiClient } from '../hooks/api/api-client';
import CitySelectorModal from './CitySelectorModal';
import { containsGoogleDocLink, containsLinkShortener, containsLinktreeLink, containsPii, eventUploadPhoto, increaseStreak, isCommunityPlus, isPro } from '../hooks/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/pro-solid-svg-icons/faImage';
import { faCirclePlus } from '@fortawesome/pro-solid-svg-icons/faCirclePlus';
import { faTrash } from '@fortawesome/pro-solid-svg-icons/faTrash';
import { faCalendarCirclePlus } from '@fortawesome/pro-solid-svg-icons/faCalendarCirclePlus';
import { useGetGlobalAppCurrentProfile } from '../hooks/api/profiles/global-app-current-profile';
import { useGetLimits } from '../hooks/api/profiles/current-limits';
import { useGetCurrentModeration } from '../hooks/api/profiles/current-moderation';
import SubmissionAgeGateCard from './SubmissionAgeGateCard';
import CreatePostModal from './CreatePostModal';
import CroppedPostImageModal from './CroppedPostImageModal';
import { informationCircleOutline } from 'ionicons/icons';
import BoxedStackedInput from './BoxedStackedInput';
import BoxedStackedSelect from './BoxedStackedSelect';
import BoxedStackedTextarea from './BoxedStackedTextarea';
import { EVENT_IMAGE_CONSTRAINTS } from '../constants/submissionImages';
import { EVENT_FIELD_LIMITS } from '../constants/fieldLimits';

import { useGetSiteSettings } from '../hooks/api/sitesettings';
import './CreateEventModal.css';


function toUTC(localStr: string, tzName: string): string {
  if (!localStr) return localStr;
  const [datePart, timePart] = localStr.split('T');
  if (!datePart || !timePart) return localStr;
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi] = timePart.split(':').map(Number);
  if ([y, mo, d, h, mi].some(isNaN)) return localStr;

  const refMs = Date.UTC(y, mo - 1, d, h, mi, 0);
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tzName,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', hour12: false,
    }).formatToParts(new Date(refMs));
    const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0');
    const tzMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), 0);
    return moment(new Date(refMs + (refMs - tzMs))).utc().format('YYYY-MM-DDTHH:mm');
  } catch {
    return localStr;
  }
}

const EVENT_TYPE_CHOICES = [
  { value: 'in_person_with_virtual_option', label: 'In person with virtual option' },
  { value: 'in_person_only', label: 'In person only' },
  { value: 'virtual_only', label: 'Virtual only' },
];

const PRECAUTION_OPTIONS = [
  { value: 'masks_encouraged', label: 'Masks encouraged' },
  { value: 'masks_required', label: 'Masks required' },
  { value: 'tests_required', label: 'Tests required' },
  { value: 'outdoors', label: 'Outdoors' },
  { value: 'partially_outdoors', label: 'Partially outdoors' },
  { value: 'air_purifiers', label: 'Air purifiers' },
];

const ATTENDEE_PRECAUTION_OPTIONS = [
  { value: 'not_specified', label: 'Not specified' },
  { value: 'precautions_only', label: 'Covid conscientious only' },
  { value: 'precautions_preferred', label: 'Covid conscientious preferred' },
  { value: 'open', label: 'Open to everyone' },
];

type City = {
  name: string;
  lat: number;
  lng: number;
};

type EventSubmissionFlow = 'quick' | 'details';

type CreateEventModalProps = {
  onDismiss: (data?: { submitted?: boolean; closeCalendar?: boolean }) => void | Promise<unknown>;
  selectedDate?: Date;
};

type EventFlowChooserProps = {
  onSelect: (flow: EventSubmissionFlow) => void;
};

const EventFlowChooser: React.FC<EventFlowChooserProps> = ({ onSelect }) => (
  <div className="create-event-flow-choices">
    <IonItem className="create-event-flow-choice-primary" button detail lines="none" onClick={() => onSelect('details')}>
      <IonLabel className="ion-text-wrap">
        <strong className="create-event-flow-title-with-icon">
          <FontAwesomeIcon icon={faCalendarCirclePlus} />
          <span>Fill out the event</span>
        </strong>
        <p>Best for organizers and those who know the details.</p>
      </IonLabel>
    </IonItem>
    <div className="create-event-flow-or">or</div>
    <IonItem className="create-event-flow-choice-quick" button detail lines="none" onClick={() => onSelect('quick')}>
      <IonLabel className="ion-text-wrap">
        <strong>Quick share</strong>
        <p>Just share a public link to a Covid Conscientious event you found and we'll fill in the rest!</p>
      </IonLabel>
    </IonItem>
  </div>
);

type QuickEventShareFormProps = {
  link: string;
  notes: string;
  error: string | null;
  onLinkChange: (value: string) => void;
  onNotesChange: (value: string) => void;
};

const getEventLinkErrorMessage = (err: any) => {
  const data = err?.response?.data;
  if (!data) return 'Unable to send this right now.';
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;

  const firstFieldError = Object.values(data).find((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return typeof value === 'string' && value.trim();
  });

  if (Array.isArray(firstFieldError)) {
    return String(firstFieldError[0]);
  }
  if (typeof firstFieldError === 'string') {
    return firstFieldError;
  }
  return 'Unable to send this right now.';
};

const QuickEventShareForm: React.FC<QuickEventShareFormProps> = ({
  link,
  notes,
  error,
  onLinkChange,
  onNotesChange,
}) => (
  <div className="create-event-section create-event-quick-share">
    <IonText color="dark">
      <strong>Don't know all the details but found a cool Covid Conscientious event you think might be a good fit for the calendar?</strong>
    </IonText>
    <IonText color="medium">
      <p>
        Send the public event or flyer link and we'll try to fill in the rest. If added to the calendar, it will be posted anonymously and won't be connected to your profile.
      </p>
      
    </IonText>
    <BoxedStackedTextarea
      label="Public event link"
      value={link}
      placeholder="Add your link here"
      rows={2}
      autoGrow
      onIonInput={(event) => onLinkChange(event.detail.value ?? '')}
    />
    <BoxedStackedTextarea
      label="Notes (optional)"
      value={notes}
      placeholder="Anything else we should know?"
      rows={3}
      maxlength={500}
      counter
      onIonInput={(event) => onNotesChange(event.detail.value ?? '')}
    />
    <IonText color="navy" className="create-event-quick-share-aside">
      <p>
        Quick Share helps us share more Covid Conscientious events. If you have the details on hand or you are an organizer of the event we'd love for you to use the full event form whenever possible!
      </p>
    </IonText>
    {error ? (
      <IonText color="danger">
        <p>{error}</p>
      </IonText>
    ) : null}
  </div>
);

function isMoreThanTwoWeeksOld(registrationDate?: string | null): boolean {
  if (!registrationDate) return false;
  const now = new Date();
  const registered = new Date(registrationDate);
  const diffInMs = now.getTime() - registered.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  return diffInDays > 14;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ onDismiss, selectedDate }) => {
  const router = useIonRouter();
  const navigateTo = async (path: string) => {
    if (typeof window === 'undefined') return;
    await onDismiss?.({ closeCalendar: true });
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [long, setLong] = useState<number | null>(null);
  const [eventType, setEventType] = useState('');
  const [showPostTip, setShowPostTip] = useState(false);
  const { data: globalProfile } = useGetGlobalAppCurrentProfile();
  const limits = useGetLimits().data;
  const siteSettings = useGetSiteSettings().data;
  const moderation = useGetCurrentModeration().data;
  const isOldEnoughForEvents = isMoreThanTwoWeeksOld(globalProfile?.registrationDate)
    || isPro(globalProfile?.subscription_level)
    || isCommunityPlus(globalProfile?.subscription_level);
  const moderatorDeactivated = Boolean(moderation?.moderator_deactivated);
  const commentingPausedUntil = moderation?.commenting_paused_until;
  const commentingPauseActive = Boolean(
    commentingPausedUntil &&
    moment(commentingPausedUntil).isValid() &&
    moment(commentingPausedUntil).isAfter(moment())
  );
  const commentingPausedLabel = commentingPauseActive
    ? moment(commentingPausedUntil).format('MMM D [at] h:mm A')
    : null;
  const moderationSubmissionBlocked = Boolean(
    moderatorDeactivated ||
    globalProfile?.deactivated_profile ||
    commentingPauseActive ||
    (moderation?.paused_on_creation && globalProfile?.paused_profile)
  );
  const moderationSubmissionMessage = moderatorDeactivated
    ? 'Your account is currently suspended from posting.'
    : globalProfile?.deactivated_profile
      ? 'You need an active account to submit an event.'
      : commentingPauseActive
        ? `Your posting is temporarily paused until ${commentingPausedLabel}.`
        : (moderation?.paused_on_creation && globalProfile?.paused_profile)
          ? 'Your account needs to be reviewed before you can submit an event.'
          : null;
  const [presentPostModal, dismissPostModal] = useIonModal(CreatePostModal, {
    preferred_name: globalProfile?.preferred_name ?? '',
    username: globalProfile?.username ?? '',
    initialCategory: 'events',
    onGoToSubmissions: () => router.push('/community/submitted'),
    onDismiss: () => dismissPostModal(),
  });
  const [precautions, setPrecautions] = useState<string[]>([]);
  const [attendeePrecautionPreference, setAttendeePrecautionPreference] = useState<string | null>(null);
  const [sensitive, setSensitive] = useState(false);
  const [sensitiveDescription, setSensitiveDescription] = useState('');
  const [allowedAsPostInFeed, setAllowedAsPostInFeed] = useState<boolean | null>(null);
  const [allowedAsPostInFeedTouched, setAllowedAsPostInFeedTouched] = useState(false);
  const [canAnswerQuestions, setCanAnswerQuestions] = useState<boolean | null>(null);
  const [canAnswerQuestionsTouched, setCanAnswerQuestionsTouched] = useState(false);
  const [postingIdentity, setPostingIdentity] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [externalRegistrationRequired, setExternalRegistrationRequired] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [imageAlt, setImageAlt] = useState('');
  const [submissionFlow, setSubmissionFlow] = useState<EventSubmissionFlow | null>(null);
  const [quickLink, setQuickLink] = useState('');
  const [quickNotes, setQuickNotes] = useState('');
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [showQuickSuccessAlert, setShowQuickSuccessAlert] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showDefaultDateConfirm, setShowDefaultDateConfirm] = useState(false);
  const [showLinkShortenerWarning, setShowLinkShortenerWarning] = useState(false);
  const [showQuickLinkShortenerWarning, setShowQuickLinkShortenerWarning] = useState(false);
  const [showRecurringUpgrade, setShowRecurringUpgrade] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'weekly' | 'monthly' | 'daily' | 'custom'>('none');
  const [recurrenceCount, setRecurrenceCount] = useState(1);
  const [recurrenceCustomDates, setRecurrenceCustomDates] = useState<string[]>([]);
  const [recurrenceDescriptions, setRecurrenceDescriptions] = useState<string[]>([]);
  const [recurrenceEndDates, setRecurrenceEndDates] = useState<string[]>([]);
  const [recurrenceExternalLinks, setRecurrenceExternalLinks] = useState<string[]>([]);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<number, boolean>>({});
  const [expandedExternalLinks, setExpandedExternalLinks] = useState<Record<number, boolean>>({});
  const [baseDescriptionExpanded, setBaseDescriptionExpanded] = useState(false);
  const [expandedDateEdits, setExpandedDateEdits] = useState<Record<number, boolean>>({});

  const openingCitySelectorRef = useRef(false);
  const recurrenceTypeRef = useRef(recurrenceType);
  const [presentCitySelector, dismissCitySelector] = useIonModal(CitySelectorModal, {
    onDismiss: (selectedCity?: City) => handleCityDismiss(selectedCity),
  });
  const [presentCropModal, dismissCropModal] = useIonModal(CroppedPostImageModal, {
    image: rawImage,
    picDb: '',
    imageName: 'event.png',
    vertical: false,
    imageConstraints: EVENT_IMAGE_CONSTRAINTS,
    onDismiss: (cropped: string | null) => {
      if (cropped) setImageData(cropped);
      setRawImage(null);
      dismissCropModal();
    },
  });
  const feedHighlightPopoverText = 'If you say yes, we may share this event in the Refreshments Bar as a post or as part of a curated event post with the details you submitted.';
  const FeedHighlightPopover = () => (
    <IonContent className="ion-padding">{feedHighlightPopoverText}</IonContent>
  );
  const [presentFeedHighlightPopover, dismissFeedHighlightPopover] = useIonPopover(FeedHighlightPopover, {
    onDismiss: () => dismissFeedHighlightPopover(),
  });

  const openCitySelector = () => {
    if (openingCitySelectorRef.current) return;
    openingCitySelectorRef.current = true;

    presentCitySelector({
      onDidDismiss: () => {
        openingCitySelectorRef.current = false;
      },
    });
  };

  const handleCityDismiss = (selectedCity?: City) => {
      if (selectedCity) {
        setLocation(selectedCity.name);
        setLocationLabel(selectedCity.name);
        setLat(selectedCity.lat);
        setLong(selectedCity.lng);
      }
    dismissCitySelector();
  };

  useEffect(() => {
    if (!postingIdentity) {
      setPostingIdentity(globalProfile?.username ?? 'anonymous');
    }
  }, [globalProfile, postingIdentity]);

  useEffect(() => {
    if (postingIdentity === 'anonymous') {
      setCanAnswerQuestions(false);
      setCanAnswerQuestionsTouched(false);
      setAllowedAsPostInFeed(false);
      setAllowedAsPostInFeedTouched(false);
    }
  }, [postingIdentity]);

  useEffect(() => {
    if (postingIdentity !== 'anonymous' && !allowedAsPostInFeedTouched) {
      setAllowedAsPostInFeed(null);
    }
  }, [postingIdentity, allowedAsPostInFeedTouched]);

  useEffect(() => {
    if (postingIdentity !== 'anonymous' && !canAnswerQuestionsTouched) {
      setCanAnswerQuestions(null);
    }
  }, [postingIdentity, canAnswerQuestionsTouched]);

  const defaultStartDatetime = useMemo(() => {
    const base = selectedDate && moment(selectedDate).isAfter(moment(), 'day')
      ? moment(selectedDate).hour(20).minute(0).second(0)
      : moment().add(7, 'days').hour(20).minute(0).second(0);
    return base.format('YYYY-MM-DDTHH:mm');
  }, [selectedDate]);
  const defaultEndDatetime = useMemo(
    () => moment(defaultStartDatetime).add(2, 'hours').format('YYYY-MM-DDTHH:mm'),
    [defaultStartDatetime]
  );
  const [startDatetime, setStartDatetime] = useState(defaultStartDatetime);
  const [endDatetime, setEndDatetime] = useState(defaultEndDatetime);
  const [startDateTouched, setStartDateTouched] = useState(false);
  const [endDateTouched, setEndDateTouched] = useState(false);
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

  const normalizeDatetime = (value: string) => {
    if (!value) return value;
    const parsed = moment(value);
    if (!parsed.isValid()) return value;
    const minutes = parsed.minutes();
    let rounded = Math.round(minutes / 15) * 15;
    if (rounded === 60) {
      parsed.add(1, 'hour');
      rounded = 0;
    }
    parsed.minutes(rounded).seconds(0);
    return parsed.format('YYYY-MM-DDTHH:mm');
  };

  const computeWeeklyOccurrences = (base: string, total: number) => {
    const baseMoment = moment(base);
    if (!baseMoment.isValid() || total <= 1) {
      return [];
    }
    const results: string[] = [];
    let cursor = baseMoment.clone().add(1, 'day');
    let guard = 0;
    while (results.length < total - 1 && guard < 730) {
      if (cursor.day() === baseMoment.day()) {
        results.push(cursor.clone().hour(baseMoment.hour()).minute(baseMoment.minute()).format('YYYY-MM-DDTHH:mm'));
      }
      cursor = cursor.add(1, 'day');
      guard += 1;
    }
    return results;
  };

  const computeMonthlyOccurrences = (base: string, total: number) => {
    const baseMoment = moment(base);
    if (!baseMoment.isValid() || total <= 1) {
      return [];
    }
    const day = baseMoment.date();
    const results: string[] = [];
    for (let i = 1; i < total; i += 1) {
      const next = baseMoment.clone().add(i, 'month');
      const daysInMonth = next.daysInMonth();
      next.date(Math.min(day, daysInMonth));
      results.push(next.format('YYYY-MM-DDTHH:mm'));
    }
    return results;
  };

  const computeDailyOccurrences = (base: string, total: number) => {
    const baseMoment = moment(base);
    if (!baseMoment.isValid() || total <= 1) {
      return [];
    }
    const results: string[] = [];
    for (let i = 1; i < total; i += 1) {
      results.push(baseMoment.clone().add(i, 'day').format('YYYY-MM-DDTHH:mm'));
    }
    return results;
  };

  const summaryDates = useMemo(() => {
    if (recurrenceType === 'weekly') {
      return computeWeeklyOccurrences(startDatetime, recurrenceCount);
    }
    if (recurrenceType === 'monthly') {
      return computeMonthlyOccurrences(startDatetime, recurrenceCount);
    }
    if (recurrenceType === 'daily') {
      return computeDailyOccurrences(startDatetime, recurrenceCount);
    }
    if (recurrenceType === 'custom') {
      return recurrenceCustomDates.filter((date) => date);
    }
    return [];
  }, [recurrenceType, recurrenceCount, startDatetime, recurrenceCustomDates]);

  useEffect(() => {
    const targetLength = recurrenceType === 'custom' ? recurrenceCustomDates.length : summaryDates.length;
    setRecurrenceDescriptions((prev) => {
      if (prev.length === targetLength) return prev;
      const next = [...prev.slice(0, targetLength)];
      while (next.length < targetLength) {
        next.push(description || '');
      }
      return next;
    });
  }, [summaryDates, recurrenceCustomDates.length, recurrenceType, description]);

  useEffect(() => {
    const targetLength = recurrenceType === 'custom' ? recurrenceCustomDates.length : summaryDates.length;
    setRecurrenceExternalLinks((prev) => {
      if (prev.length === targetLength) return prev;
      const next = [...prev.slice(0, targetLength)];
      while (next.length < targetLength) {
        next.push(externalLink || '');
      }
      return next;
    });
  }, [summaryDates, recurrenceCustomDates.length, recurrenceType, externalLink]);

  useEffect(() => {
    if (recurrenceType !== 'custom') return;
    setRecurrenceEndDates((prev) => {
      const next = [...prev.slice(0, recurrenceCustomDates.length)];
      while (next.length < recurrenceCustomDates.length) {
        next.push('');
      }
      return next;
    });
  }, [recurrenceCustomDates.length, recurrenceType]);

  useEffect(() => {
    const targetLength = recurrenceType === 'custom' ? recurrenceCustomDates.length : summaryDates.length;
    setExpandedDescriptions((prev) => {
      const next: Record<number, boolean> = {};
      for (let i = 0; i < targetLength; i += 1) {
        if (prev[i]) next[i] = true;
      }
      return next;
    });
  }, [summaryDates, recurrenceCustomDates.length, recurrenceType]);

  useEffect(() => {
    const targetLength = recurrenceType === 'custom' ? recurrenceCustomDates.length : summaryDates.length;
    setExpandedExternalLinks((prev) => {
      const next: Record<number, boolean> = {};
      for (let i = 0; i < targetLength; i += 1) {
        if (prev[i]) next[i] = true;
      }
      return next;
    });
  }, [summaryDates, recurrenceCustomDates.length, recurrenceType]);

  useEffect(() => {
    const targetLength = recurrenceType === 'custom' ? recurrenceCustomDates.length : summaryDates.length;
    setExpandedDateEdits((prev) => {
      const next: Record<number, boolean> = {};
      for (let i = 0; i < targetLength + 1; i += 1) {
        if (prev[i]) next[i] = true;
      }
      return next;
    });
  }, [summaryDates, recurrenceCustomDates.length, recurrenceType]);

  const displayDates = useMemo(() => {
    if (recurrenceType === 'weekly' || recurrenceType === 'monthly' || recurrenceType === 'daily') {
      if (startDatetime) {
        return [startDatetime, ...summaryDates];
      }
    }
    return summaryDates;
  }, [recurrenceType, startDatetime, summaryDates]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawImage(reader.result as string);
      presentCropModal();
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAttachPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    setImageData(null);
    setImageAlt('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const combinedEventText = useMemo(
    () => [name, description, ...recurrenceDescriptions].filter(Boolean).join(' '),
    [name, description, recurrenceDescriptions]
  );
  const eventLinkText = useMemo(
    () => [externalLink, ...recurrenceExternalLinks].filter(Boolean).join(' '),
    [externalLink, recurrenceExternalLinks]
  );
  const combinedEventTextWithLinks = useMemo(
    () => [combinedEventText, eventLinkText].filter(Boolean).join(' '),
    [combinedEventText, eventLinkText]
  );
  const hasPii = useMemo(() => containsPii(combinedEventTextWithLinks), [combinedEventTextWithLinks]);
  const hasShortenedLinkInContent = useMemo(
    () => containsLinkShortener(combinedEventText),
    [combinedEventText]
  );
  const hasShortenedLinkInLinkField = useMemo(
    () => containsLinkShortener(eventLinkText),
    [eventLinkText]
  );
  const hasGoogleDocLinkInContent = useMemo(
    () => containsGoogleDocLink(combinedEventText),
    [combinedEventText]
  );
  const hasGoogleDocLinkInLinkField = useMemo(
    () => containsGoogleDocLink(eventLinkText),
    [eventLinkText]
  );
  const hasBlockedLinks = hasGoogleDocLinkInContent || hasGoogleDocLinkInLinkField;
  const hasPreSubmitIssues = hasPii || hasBlockedLinks;
  const accountAgeError = isOldEnoughForEvents ? null : 'Events can be submitted once your account is at least two weeks old.';

  const handleSubmit = async (skipDefaultDateConfirm = false, skipLinkShortenerWarning = false) => {
    if (!isOldEnoughForEvents) {
      setError('Events can be submitted once your account is at least two weeks old.');
      return;
    }
    if (!name.trim() || !description.trim() || !eventType || !startDatetime || !endDatetime) {
      setError('Name, description, type, start, and end are required.');
      return;
    }
    if (eventType !== 'virtual_only' && !(locationLabel || location).trim()) {
      setError('In-person events need a location.');
      return;
    }
    const startMoment = moment(startDatetime);
    const endMoment = moment(endDatetime);
    if (!startMoment.isValid() || !endMoment.isValid()) {
      setError('Start and end must be valid dates.');
      return;
    }
    if (startMoment.isBefore(moment())) {
      setError("Events can't start in the past.");
      return;
    }
    if (endMoment.isBefore(startMoment)) {
      setError("End date can't be before the start date.");
      return;
    }
    if (endMoment.diff(startMoment, 'minutes') >= 24 * 60) {
      setError("Events can't be longer than 24 hours.");
      return;
    }
    if (hasPii) {
      setError('Events cannot contain private personal contact information. Please remove phone numbers or emails.');
      return;
    }
    if (!skipLinkShortenerWarning && (hasShortenedLinkInContent || hasShortenedLinkInLinkField)) {
      setShowLinkShortenerWarning(true);
      return;
    }
    if (hasGoogleDocLinkInContent || hasGoogleDocLinkInLinkField) {
      setError('This link isn’t allowed due to guidelines.');
      return;
    }
    if (!skipDefaultDateConfirm && !startDateTouched && !endDateTouched) {
      setShowDefaultDateConfirm(true);
      return;
    }
    if (postingIdentity !== 'anonymous' && canAnswerQuestions === null) {
      setError('Please choose whether you can answer questions about this event.');
      return;
    }
    if (postingIdentity !== 'anonymous' && allowedAsPostInFeed === null) {
      setError('Please choose whether this event can be highlighted in the Refreshments feed.');
      return;
    }

    const trimmedCustomDates = recurrenceCustomDates
      .map((date) => (date ?? '').trim())
      .filter((date) => date);

    if (recurrenceType !== 'none') {
      if (recurrenceType === 'custom' && trimmedCustomDates.length === 0) {
        setError('Add at least one additional date.');
        return;
      }
      if (recurrenceType === 'custom') {
        const normalized = trimmedCustomDates.map((value) => normalizeDatetime(value));
        for (let i = 1; i < normalized.length; i += 1) {
          if (moment(normalized[i]).isBefore(moment(normalized[i - 1]))) {
            setError('Recurring dates must be in order (later dates after earlier ones).');
            return;
          }
        }
        const endNormalized = recurrenceEndDates.map((value, index) => value || normalizeDatetime(normalized[index] || ''));
        for (let i = 0; i < normalized.length; i += 1) {
          const startValue = normalized[i];
          const endValue = endNormalized[i];
          if (!startValue || !endValue) {
            setError('Each recurring date needs an end time.');
            return;
          }
          const startTime = moment(startValue);
          const endTime = moment(endValue);
          if (endTime.diff(startTime, 'minutes') >= 24 * 60) {
            setError("Recurring date end times can't be longer than 24 hours.");
            return;
          }
          if (endTime.isBefore(startTime)) {
            setError("Recurring date end times can't be before the start.");
            return;
          }
        }
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const baseStartDate = startDatetime ? new Date(startDatetime) : null;
      const recurrenceMonthDay = baseStartDate ? baseStartDate.getDate() : null;
      const descriptionsForPayload = recurrenceType === 'custom'
        ? trimmedCustomDates.map((_, index) => recurrenceDescriptions[index] ?? '')
        : summaryDates.map((_, index) => recurrenceDescriptions[index] ?? '');
      const endsForPayload = recurrenceType === 'custom'
        ? trimmedCustomDates.map((value, index) => recurrenceEndDates[index] || normalizeDatetime(value))
        : summaryDates.map((value, index) => {
          const fallbackEnd = baseDurationMinutes > 0
            ? moment(value).add(baseDurationMinutes, 'minutes').format('YYYY-MM-DDTHH:mm')
            : value;
          return recurrenceEndDates[index] || normalizeDatetime(fallbackEnd);
        });
      const linksForPayload = recurrenceType === 'custom'
        ? trimmedCustomDates.map((_, index) => recurrenceExternalLinks[index] ?? '')
        : summaryDates.map((_, index) => recurrenceExternalLinks[index] ?? '');
      const toUTCStr = (s: string) => toUTC(s, timezone);
      const payload = {
        name,
        description,
        start_datetime: toUTCStr(startDatetime),
        end_datetime: toUTCStr(endDatetime),
        location: locationLabel || location,
        location_point_lat: lat,
        location_point_long: long,
        local_only: eventType !== 'virtual_only' ? 'true' : 'false',
        sensitive: sensitive ? 'true' : 'false',
        sensitive_description: sensitiveDescription,
        allowed_as_post_in_feed: allowedAsPostInFeed ? 'true' : 'false',
        can_answer_questions: canAnswerQuestions ? 'true' : 'false',
        anonymous: postingIdentity === 'anonymous' ? 'true' : 'false',
        event_type: eventType,
        in_person_precautions: precautions,
        attendee_precaution_preference: attendeePrecautionPreference || null,
        external_link: externalLink || null,
        external_registration_required: externalRegistrationRequired ? 'true' : 'false',
        image_alt: imageData ? imageAlt.trim() : '',
        recurrence_type: recurrenceType !== 'none' ? recurrenceType : null,
        recurrence_count: recurrenceType !== 'custom' ? recurrenceCount : null,
        recurrence_custom_datetimes: recurrenceType === 'custom' ? trimmedCustomDates.map(toUTCStr) : null,
        recurrence_month_day: recurrenceType === 'monthly' ? recurrenceMonthDay : null,
        recurrence_descriptions: recurrenceType !== 'none'
          ? descriptionsForPayload
          : null,
        recurrence_end_datetimes: recurrenceType !== 'none' ? endsForPayload.map(toUTCStr) : null,
        recurrence_external_links: recurrenceType !== 'none' ? linksForPayload : null,
      };

      const response = await apiClient.post('/api/event/', payload);
      const eventId = response.data?.event_id;
      if (!eventId) {
        throw new Error('Missing event id');
      }

      if (imageData) {
        await eventUploadPhoto({ image: imageData }, eventId);
      }

      await increaseStreak();
      setShowSuccessAlert(true);
    } catch (err) {
      console.error('Unable to create event', err);
      setError('Unable to submit event right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    onDismiss?.();
  };

  const handleQuickSubmit = async (skipLinkShortenerWarning = false) => {
    const trimmedLink = quickLink.trim();
    const trimmedNotes = quickNotes.trim();
    if (!trimmedLink) {
      setQuickError('Add a public event link.');
      return;
    }
    if (!skipLinkShortenerWarning && containsLinkShortener(trimmedLink)) {
      setShowQuickLinkShortenerWarning(true);
      return;
    }

    setQuickSubmitting(true);
    setQuickError(null);

    try {
      console.log('Submitting quick event link', {
        hasLink: Boolean(trimmedLink),
        linkLength: trimmedLink.length,
        hasNotes: Boolean(trimmedNotes),
        notesLength: trimmedNotes.length,
      });
      const response = await apiClient.post('/api/event/link_submission/', {
        link: trimmedLink,
        notes: trimmedNotes,
      });
      console.log('Quick event link submitted successfully', {
        status: response.status,
        data: response.data,
      });
      setQuickLink('');
      setQuickNotes('');
      setShowQuickSuccessAlert(true);
    } catch (err) {
      console.error('Unable to submit event link', {
        status: (err as any)?.response?.status,
        data: (err as any)?.response?.data,
        message: (err as any)?.message,
        error: err,
      });
      setQuickError(getEventLinkErrorMessage(err));
    } finally {
      setQuickSubmitting(false);
    }
  };

  const handleSuccessAlertDismiss = () => {
    setShowSuccessAlert(false);
    onDismiss?.({ submitted: true });
  };

  const handleQuickSuccessAlertDismiss = () => {
    setShowQuickSuccessAlert(false);
    onDismiss?.({ submitted: true });
  };

  const handlePrecautionsChange = (event: CustomEvent) => {
    let next: string[] = event.detail.value ?? [];
    const prev = precautions;
    const added = next.find(v => !prev.includes(v));

    if (added) {
      const exclusions: [string, string][] = [
        ['masks_encouraged', 'masks_required'],
        ['outdoors', 'partially_outdoors'],
      ];
      for (const [a, b] of exclusions) {
        if (added === a && next.includes(b)) next = next.filter(v => v !== b);
        else if (added === b && next.includes(a)) next = next.filter(v => v !== a);
      }
    }

    setPrecautions(next);

    requestAnimationFrame(() => {
      const popover = document.querySelector('ion-select-popover');
      if (popover) {
        const opts = (popover as any).options;
        if (opts) {
          (popover as any).options = opts.map((opt: any) => ({
            ...opt,
            checked: next.includes(opt.value),
          }));
        }
      }
    });
  };

  const subscriptionLevel = globalProfile?.subscription_level;
  const maxRecurringEvents = isPro(subscriptionLevel)
    ? 10
    : isCommunityPlus(subscriptionLevel)
      ? 5
      : 1;

  const canUseRecurring = maxRecurringEvents > 1;
  const maxCustomDates = Math.max(maxRecurringEvents - 1, 0);
  const hasUnlimitedEventSubmissions = isPro(subscriptionLevel) || isCommunityPlus(subscriptionLevel);
  const eventsSubmitted = limits?.events_submitted ?? 0;
  const canSubmitEventThisMonth = hasUnlimitedEventSubmissions || eventsSubmitted < 5;
  const canUseQuickShare = siteSettings?.allow_event_link_only_submissions;
  const activeSubmissionFlow = canUseQuickShare ? submissionFlow : 'details';
  const showFlowChooser = canUseQuickShare && !submissionFlow;
  const showQuickShareForm = activeSubmissionFlow === 'quick';
  const showDetailsForm = activeSubmissionFlow === 'details';

  useEffect(() => {
    if (!canUseQuickShare && submissionFlow === 'quick') {
      setSubmissionFlow(null);
    }
  }, [canUseQuickShare, submissionFlow]);

  const handleRecurrenceChange = (value: string) => {
    if (!canUseRecurring && value !== 'none') {
      setShowRecurringUpgrade(true);
      setRecurrenceType('none');
      return;
    }
    setRecurrenceType(value as 'none' | 'weekly' | 'monthly' | 'daily' | 'custom');
  };

  const dateErrorMessages = new Set([
    'Start and end must be valid dates.',
    "Events can't start in the past.",
    "End date can't be before the start date.",
    "Events can't be longer than 24 hours.",
  ]);
  const recurrenceErrorMessages = new Set([
    'Add at least one additional date.',
    'Recurring dates must be in order (later dates after earlier ones).',
    'Each recurring date needs an end time.',
    "Recurring date end times can't be longer than 24 hours.",
    "Recurring date end times can't be before the start.",
  ]);
  const dateError = error && dateErrorMessages.has(error) ? error : null;
  const recurrenceError = error && recurrenceErrorMessages.has(error) ? error : null;
  const showGlobalError = error && !dateError && !recurrenceError;
  const baseDurationMinutes = useMemo(() => {
    const start = moment(startDatetime);
    const end = moment(endDatetime);
    if (!start.isValid() || !end.isValid()) return 0;
    return Math.max(end.diff(start, 'minutes'), 0);
  }, [startDatetime, endDatetime]);

  const formatEndTime = (startValue: string) => {
    const start = moment(startValue);
    if (!start.isValid() || baseDurationMinutes <= 0) return '';
    return start.add(baseDurationMinutes, 'minutes').format('h:mm A');
  };

  useEffect(() => {
    if (!canUseRecurring) return;
    if (recurrenceType === 'none') {
      setRecurrenceCount(1);
      setRecurrenceCustomDates([]);
      setRecurrenceDescriptions([]);
      setRecurrenceEndDates([]);
      setRecurrenceExternalLinks([]);
      setExpandedDateEdits({});
      setExpandedExternalLinks({});
      recurrenceTypeRef.current = recurrenceType;
      return;
    }
    if (recurrenceType === 'weekly' || recurrenceType === 'monthly' || recurrenceType === 'daily') {
      const defaultCount = Math.min(3, maxRecurringEvents);
      setRecurrenceCount((prev) => {
        if (recurrenceTypeRef.current !== recurrenceType) {
          return defaultCount;
        }
        return prev < 2 ? defaultCount : Math.min(prev, maxRecurringEvents);
      });
    } else if (recurrenceCount < 2) {
      setRecurrenceCount(2);
    }
    recurrenceTypeRef.current = recurrenceType;
  }, [canUseRecurring, maxRecurringEvents, recurrenceCount, recurrenceType]);

  return (
    <>
      <IonHeader>
        <IonToolbar className="modal-title">
          {activeSubmissionFlow ? (
            <IonButtons slot="start">
              <IonButton onClick={() => setSubmissionFlow(null)}>Back</IonButton>
            </IonButtons>
          ) : null}
          <IonTitle>Add an event</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleCancel}>Cancel</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="create-event-modal">
        {siteSettings?.allow_post_submissions === false ? (
          <IonCard className="ion-padding ion-text-center">
            <IonText>
              <p>Submitting events has been temporarily paused.</p>
            </IonText>
          </IonCard>
        ) : !isOldEnoughForEvents ? (
          <SubmissionAgeGateCard noun="event" onUpgrade={() => navigateTo("/store")} />
        ) : moderationSubmissionBlocked ? (
          <IonCard className="ion-padding ion-text-center">
            <IonText>
              <p>{moderationSubmissionMessage}</p>
              <p>Check your Activity for moderation details and our guidelines.</p>
            </IonText>
            <IonButton onClick={() => router.push('/activity')}>View Activity</IonButton>
          </IonCard>
        ) : !canSubmitEventThisMonth ? (
          <IonCard className="ion-padding ion-text-center">
            <IonText>
              <p>You've already submitted 5 events this month.</p>
              <p>Get Community+ or Refresh Pro to submit more events now.</p>
            </IonText>
            <IonButton onClick={() => navigateTo("/store")}>Upgrade</IonButton>
          </IonCard>
        ) : (
          <>
        <IonList>
          {showFlowChooser ? (
            <EventFlowChooser onSelect={setSubmissionFlow} />
          ) : null}
          {showQuickShareForm ? (
            <QuickEventShareForm
              link={quickLink}
              notes={quickNotes}
              error={quickError}
              onLinkChange={setQuickLink}
              onNotesChange={setQuickNotes}
            />
          ) : null}
          {showDetailsForm ? (
            <>
          <div className="create-event-section">
            <BoxedStackedInput
              label={
                <>
                Event name<span className="required-star">*</span>
                </>
              }
              value={name}
              name="event_name"
              maxlength={EVENT_FIELD_LIMITS.name}
              onIonInput={(event) => setName(event.detail.value ?? '')}
            />
            <BoxedStackedTextarea
              label={
                <>
                Description<span className="required-star">*</span>
                </>
              }
              value={description}
              autoGrow
              maxlength={EVENT_FIELD_LIMITS.description}
              counter
              onIonInput={(event) => setDescription(event.detail.value ?? '')}
            />
          </div>
          <div className="create-event-section">
            <BoxedStackedInput
              label={
                <>
                Start<span className="required-star">*</span>
                </>
              }
              type="datetime-local"
              step="900"
              value={startDatetime}
              name="start_datetime"
              onIonChange={(event) => {
                const normalized = normalizeDatetime(event.detail.value ?? '');
                setStartDateTouched(true);
                setStartDatetime(normalized);
                if (normalized && !endDateTouched) {
                  setEndDatetime(moment(normalized).add(2, 'hours').format('YYYY-MM-DDTHH:mm'));
                }
              }}
            />
            <BoxedStackedInput
              label={
                <>
                End<span className="required-star">*</span>
                </>
              }
              type="datetime-local"
              step="900"
              value={endDatetime}
              name="end_datetime"
              onIonChange={(event) => {
                setEndDateTouched(true);
                setEndDatetime(normalizeDatetime(event.detail.value ?? ''));
              }}
            />
            <BoxedStackedSelect
              label="Time zone"
              value={timezone}
              onIonChange={(e) => setTimezone(e.detail.value ?? timezone)}
            >
              <IonSelectOption value="America/New_York">Eastern (ET)</IonSelectOption>
              <IonSelectOption value="America/Chicago">Central (CT)</IonSelectOption>
              <IonSelectOption value="America/Denver">Mountain (MT)</IonSelectOption>
              <IonSelectOption value="America/Los_Angeles">Pacific (PT)</IonSelectOption>
              <IonSelectOption value="Pacific/Honolulu">Hawaii (HT)</IonSelectOption>
              <IonSelectOption value="Europe/London">London (GMT/BST)</IonSelectOption>
              <IonSelectOption value="Australia/Sydney">Sydney (AEST)</IonSelectOption>
              <IonSelectOption value="UTC">UTC</IonSelectOption>
            </BoxedStackedSelect>
            <IonText color="navy" className="event-timezone-note">
              Event times are shown in each member's local time zone.
            </IonText>
          </div>
          <div className="create-event-section">
            <BoxedStackedSelect
              label={
                <>
                Event type<span className="required-star">*</span>
                </>
              }
              value={eventType}
              onIonChange={(event) => setEventType(event.detail.value ?? '')}
            >
              <IonSelectOption value="" disabled>
                Pick an event type
              </IonSelectOption>
              {EVENT_TYPE_CHOICES.map((choice) => (
                <IonSelectOption key={choice.value} value={choice.value}>
                  {choice.label}
                </IonSelectOption>
              ))}
            </BoxedStackedSelect>
            {eventType && (
              <BoxedStackedSelect
                label="Who is this event for?"
                value={attendeePrecautionPreference ?? ''}
                placeholder="Optional"
                onIonChange={(e) => setAttendeePrecautionPreference(e.detail.value || null)}
              >
                {ATTENDEE_PRECAUTION_OPTIONS.map((option) => (
                  <IonSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </IonSelectOption>
                ))}
              </BoxedStackedSelect>
            )}
            {eventType && eventType !== 'virtual_only' && (
              <>
                <BoxedStackedSelect
                  label="In-person precautions"
                  value={precautions}
                  multiple
                  interface="popover"
                  onIonChange={handlePrecautionsChange}
                >
                  {PRECAUTION_OPTIONS.map((option) => (
                    <IonSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </IonSelectOption>
                  ))}
                </BoxedStackedSelect>
                <BoxedStackedInput
                  label="Nearby City"
                  value={location}
                  name="nearby_city"
                  placeholder="Click to select"
                  maxlength={EVENT_FIELD_LIMITS.location}
                  readonly
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openCitySelector();
                  }}
                />
                <BoxedStackedInput
                  label={location
                    ? (
                      <>
                        <span>Location label</span>
                        <IonText color="medium" className="boxed-field-helper">
                          Change this if you'd like the event to show something different than the city.
                        </IonText>
                      </>
                    )
                    : 'Location label'}
                  value={locationLabel}
                  onIonInput={(e) => setLocationLabel(e.detail.value ?? '')}
                  type="text"
                  placeholder="What the event labels as the location"
                  autocapitalize="words"
                  name="locationlabel"
                  maxlength={EVENT_FIELD_LIMITS.location}
                  counter
                />
              </>
            )}
          </div>
          <div className="create-event-section">
            <BoxedStackedSelect
              label="Post as"
              value={postingIdentity}
              onIonChange={(event) => setPostingIdentity(event.detail.value ?? 'anonymous')}
            >
              {globalProfile?.username && (
                <IonSelectOption value={globalProfile.username}>
                  {globalProfile.preferred_name
                    ? `${globalProfile.preferred_name} (${globalProfile.username})`
                    : globalProfile.username}
                </IonSelectOption>
              )}
              <IonSelectOption value="anonymous">Anonymous</IonSelectOption>
            </BoxedStackedSelect>
            <BoxedStackedSelect
              label="Are you the host or do you know the host, and can you answer questions about this event?"
              value={canAnswerQuestions === null ? undefined : canAnswerQuestions ? 'yes' : 'no'}
              placeholder="Select yes or no"
              disabled={postingIdentity === 'anonymous'}
              onIonChange={(event) => {
                setCanAnswerQuestionsTouched(true);
                setCanAnswerQuestions(event.detail.value === 'yes');
              }}
            >
              <IonSelectOption value="yes">Yes</IonSelectOption>
              <IonSelectOption value="no">No</IonSelectOption>
            </BoxedStackedSelect>
            {postingIdentity !== 'anonymous' && (
              <BoxedStackedSelect
                label={
                  <>
                  Is it okay to highlight this event in the Refreshments Bar feed (posts or curated event lists)?
                  <IonButton
                    fill="clear"
                    size="small"
                    style={{ marginLeft: '4px', height: '18px' }}
                    onClick={(event) => presentFeedHighlightPopover({ event: event.nativeEvent as Event })}
                  >
                    <IonIcon icon={informationCircleOutline} />
                  </IonButton>
                  </>
                }
                value={allowedAsPostInFeed === null ? undefined : allowedAsPostInFeed ? 'yes' : 'no'}
                placeholder="Select yes or no"
                onIonChange={(event) => {
                  setAllowedAsPostInFeedTouched(true);
                  setAllowedAsPostInFeed(event.detail.value === 'yes');
                }}
              >
                <IonSelectOption value="yes">Yes</IonSelectOption>
                <IonSelectOption value="no">No</IonSelectOption>
              </BoxedStackedSelect>
            )}
            <IonItem>
              <IonLabel>Sensitive</IonLabel>
              <IonCheckbox slot="end" checked={sensitive} onIonChange={(event) => setSensitive(event.detail.checked)} />
            </IonItem>
            {sensitive ? (
              <BoxedStackedTextarea
                label="Sensitive description"
                value={sensitiveDescription}
                rows={2}
                maxlength={EVENT_FIELD_LIMITS.sensitiveDescription}
                counter
                onIonChange={(event) => setSensitiveDescription(event.detail.value ?? '')}
              />
            ) : null}
            <IonItem>
              <IonLabel>External registration required</IonLabel>
              <IonCheckbox
                slot="end"
                checked={externalRegistrationRequired}
                onIonChange={(event) => setExternalRegistrationRequired(event.detail.checked)}
              />
            </IonItem>
          </div>
          <div className="create-event-section">
            <BoxedStackedTextarea
              label="External link"
              value={externalLink}
              rows={2}
              autoGrow
              maxlength={EVENT_FIELD_LIMITS.externalLink}
              onIonInput={(event) => setExternalLink(event.detail.value ?? '')}
            />
            {containsLinktreeLink(externalLink) ? (
              <IonText color="danger">
                Choosing one link from Linktree is preferred.
              </IonText>
            ) : null}
            <IonItem color="white" lines="none">
              <IonLabel>Photo (optional)</IonLabel>
              {imageData ? (
                <>
                  <IonLabel>
                    <IonText>Photo attached</IonText>
                  </IonLabel>
                  <IonButton slot="end" color="danger" onClick={() => handleRemovePhoto()}>
                    <FontAwesomeIcon icon={faTrash} />
                  </IonButton>
                </>
              ) : (
                <IonButton slot="end" color="tertiary" onClick={handleAttachPhotoClick}>
                  <FontAwesomeIcon icon={faImage} /> &nbsp; Attach Photo
                </IonButton>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={EVENT_IMAGE_CONSTRAINTS.accept}
                onChange={handleImageChange}
                hidden
              />
            </IonItem>
          </div>
          {imageData ? (
            <IonItem className="image-preview-item">
              <img src={imageData} alt={imageAlt || 'Event preview'} />
            </IonItem>
          ) : null}
          {imageData ? (
            <BoxedStackedInput
              label="Image alt text (optional)"
              value={imageAlt}
              name="image_alt"
              maxlength={EVENT_FIELD_LIMITS.imageAlt}
              counter
              onIonChange={(event) => setImageAlt(event.detail.value ?? '')}
            />
          ) : null}
          <div className="create-event-section">
            <IonItem lines="none">
              <IonLabel>
                Is this a recurring event?
                {!canUseRecurring && (
                  <FontAwesomeIcon style={{ marginLeft: '6px' }} color="var(--ion-color-medium)" icon={faCirclePlus} />
                )}
              </IonLabel>
              <IonToggle
                slot="end"
                disabled={!canUseRecurring}
                checked={recurrenceType !== 'none'}
                onIonChange={(e) => handleRecurrenceChange(e.detail.checked ? 'weekly' : 'none')}
              />
            </IonItem>
            {!canUseRecurring && (
              <IonText color="medium" className="recurring-note">
                Recurring events are available for Community+ and Pro members.
              </IonText>
            )}
            {canUseRecurring && recurrenceType !== 'none' && (
              <BoxedStackedSelect
                label="Repeat"
                value={recurrenceType}
                onIonChange={(event) => handleRecurrenceChange(event.detail.value ?? 'weekly')}
              >
                <IonSelectOption value="daily">Daily</IonSelectOption>
                <IonSelectOption value="weekly">Weekly</IonSelectOption>
                <IonSelectOption value="monthly">Monthly</IonSelectOption>
                <IonSelectOption value="custom">Custom dates</IonSelectOption>
              </BoxedStackedSelect>
            )}
            {canUseRecurring && recurrenceType !== 'none' && recurrenceType !== 'custom' && (
              <IonItem>
                <IonLabel position="stacked">How many recurring dates?</IonLabel>
                <div className="recurrence-count-controls">
                  <IonButton
                    fill="outline"
                    onClick={() => setRecurrenceCount((prev) => Math.max(prev - 1, 2))}
                    disabled={recurrenceCount <= 2}
                  >
                    -
                  </IonButton>
                  <IonText>{recurrenceCount}</IonText>
                  <IonButton
                    fill="outline"
                    onClick={() => setRecurrenceCount((prev) => Math.min(prev + 1, maxRecurringEvents))}
                    disabled={recurrenceCount >= maxRecurringEvents}
                  >
                    +
                  </IonButton>
                </div>
              </IonItem>
            )}
            {canUseRecurring && recurrenceType !== 'none' && recurrenceType !== 'custom' && displayDates.length > 0 && (
              <><IonText color="navy" className="event-timezone-note">
                Dates (auto-generated) • Your time zone
                </IonText>
                
                {displayDates.map((dateValue, index) => {
                  const isBaseDate = (recurrenceType === 'weekly' || recurrenceType === 'monthly' || recurrenceType === 'daily') && index === 0;
                  const descriptionIndex = isBaseDate ? -1 : index - 1;
                  return (
                  <IonItem key={`recurrence-date-${dateValue}-${index}`} lines="none" className="recurrence-date-item">
                    <div className="recurrence-date-card recurrence-date-card--narrow">
                      <div className="recurrence-date-header">
                        <div className="recurrence-date-copy">
                          <IonText color="medium" className="recurrence-date-kicker">
                            {isBaseDate ? 'Original date' : `Extra date ${index}`}
                          </IonText>
                          <div className="recurrence-date-title">
                            {moment(dateValue).format('ddd, MMM D')}
                          </div>
                          <div className="recurrence-date-time">
                            {moment(dateValue).format('h:mm A')}
                            {baseDurationMinutes > 0 && (
                              <> – {recurrenceEndDates[descriptionIndex]
                                ? moment(recurrenceEndDates[descriptionIndex]).format('h:mm A')
                                : formatEndTime(dateValue)}</>
                            )}
                          </div>
                        </div>
                        <div className="recurrence-action-row">
                          {!isBaseDate && (
                            <IonButton
                              fill="clear"
                              onClick={() =>
                                setExpandedDateEdits((prev) => ({ ...prev, [index]: !prev[index] }))
                              }
                            >
                              {expandedDateEdits[index] ? 'Hide date edit' : 'Edit date'}
                            </IonButton>
                          )}
                          <IonButton
                            fill="clear"
                            onClick={() => {
                              if (isBaseDate) {
                                setBaseDescriptionExpanded((prev) => !prev);
                              } else {
                                const hasCustom = (recurrenceDescriptions[descriptionIndex] ?? '') !== (description ?? '');
                                setExpandedDescriptions((prev) => {
                                  if (hasCustom && prev[descriptionIndex]) return prev;
                                  return {
                                    ...prev,
                                    [descriptionIndex]: !prev[descriptionIndex],
                                  };
                                });
                              }
                            }}
                          >
                            {isBaseDate
                              ? (baseDescriptionExpanded ? 'Hide edit' : 'Edit description')
                              : (expandedDescriptions[descriptionIndex] ? 'Hide edit' : 'Edit description')}
                          </IonButton>
                          {!isBaseDate && (
                            <IonButton
                              fill="clear"
                              onClick={() =>
                                setExpandedExternalLinks((prev) => ({
                                  ...prev,
                                  [descriptionIndex]: !prev[descriptionIndex],
                                }))
                              }
                            >
                              {expandedExternalLinks[descriptionIndex] ? 'Hide link' : 'Edit link'}
                            </IonButton>
                          )}
                        </div>
                      </div>
                      {!isBaseDate && expandedDateEdits[index] && (
                        <div className="recurrence-editor">
                          <IonInput
                            type="datetime-local"
                            step="900"
                            value={dateValue}
                            onIonChange={(event) => {
                              const updated = [...displayDates];
                              updated[index] = normalizeDatetime(event.detail.value ?? '');
                              const newCustomDates = updated.slice(1);
                              const newDescriptions = recurrenceDescriptions.slice(0, newCustomDates.length);
                              setRecurrenceCustomDates(newCustomDates);
                              setRecurrenceDescriptions(newDescriptions);
                              setRecurrenceEndDates((prev) => {
                                const next = [...prev.slice(0, newCustomDates.length)];
                                while (next.length < newCustomDates.length) {
                                  const defaultEnd = baseDurationMinutes > 0
                                    ? moment(newCustomDates[next.length]).add(baseDurationMinutes, 'minutes').format('YYYY-MM-DDTHH:mm')
                                    : newCustomDates[next.length];
                                  next.push(defaultEnd);
                                }
                                return next;
                              });
                              setRecurrenceExternalLinks((prev) => {
                                const next = [...prev.slice(0, newCustomDates.length)];
                                while (next.length < newCustomDates.length) {
                                  next.push(externalLink || '');
                                }
                                return next;
                              });
                              setRecurrenceType('custom');
                            }}
                          />
                          {(() => {
                            const fallbackEnd = dateValue
                              ? (baseDurationMinutes > 0
                                ? moment(dateValue).add(baseDurationMinutes, 'minutes').format('YYYY-MM-DDTHH:mm')
                                : dateValue)
                              : '';
                            return (
                              <IonInput
                                type="datetime-local"
                                step="900"
                                value={recurrenceEndDates[descriptionIndex] || fallbackEnd}
                                onIonChange={(event) => {
                                  const nextEnds = [...recurrenceEndDates];
                                  nextEnds[descriptionIndex] = normalizeDatetime(event.detail.value ?? '');
                                  setRecurrenceEndDates(nextEnds);
                                }}
                                onIonFocus={() => {
                                  if (recurrenceEndDates[descriptionIndex] || !fallbackEnd) return;
                                  const nextEnds = [...recurrenceEndDates];
                                  nextEnds[descriptionIndex] = fallbackEnd;
                                  setRecurrenceEndDates(nextEnds);
                                }}
                              />
                            );
                          })()}
                        </div>
                      )}
                      {isBaseDate && !baseDescriptionExpanded && description && (
                        <IonText color="medium" className="recurrence-description-preview">
                          <p>{description}</p>
                        </IonText>
                      )}
                      {isBaseDate && baseDescriptionExpanded && (
                        <div className="recurrence-editor recurrence-description-editor">
                          <div className="recurrence-field-header">
                            <IonText color="medium" className="recurrence-field-label">Description</IonText>
                            {description && (
                              <IonButton fill="clear" size="small" onClick={() => setDescription('')}>
                                Clear
                              </IonButton>
                            )}
                          </div>
                          <IonTextarea
                            value={description ?? ''}
                            placeholder="Defaults to the main description unless you change it"
                            autoGrow
                            maxlength={EVENT_FIELD_LIMITS.description}
                            counter
                            onIonChange={(event) => {
                              setDescription(event.detail.value ?? '');
                            }}
                          />
                        </div>
                      )}
                      {!isBaseDate && expandedDescriptions[descriptionIndex] && (
                        <div className="recurrence-editor recurrence-description-editor">
                          <div className="recurrence-field-header">
                            <IonText color="medium" className="recurrence-field-label">Description</IonText>
                            {(recurrenceDescriptions[descriptionIndex] ?? '') !== '' && (
                              <IonButton
                                fill="clear"
                                size="small"
                                onClick={() => {
                                  const nextDescriptions = [...recurrenceDescriptions];
                                  nextDescriptions[descriptionIndex] = '';
                                  setRecurrenceDescriptions(nextDescriptions);
                                }}
                              >
                                Clear
                              </IonButton>
                            )}
                          </div>
                          <IonTextarea
                            value={recurrenceDescriptions[descriptionIndex] ?? ''}
                            placeholder="Defaults to the main description unless you change it"
                            autoGrow
                            maxlength={EVENT_FIELD_LIMITS.description}
                            counter
                            onIonChange={(event) => {
                              const nextDescriptions = [...recurrenceDescriptions];
                              nextDescriptions[descriptionIndex] = event.detail.value ?? '';
                              setRecurrenceDescriptions(nextDescriptions);
                            }}
                          />
                        </div>
                      )}
                      {!isBaseDate && expandedExternalLinks[descriptionIndex] && (
                        <div className="recurrence-editor recurrence-link-editor">
                          <IonText color="medium" className="recurrence-field-label">Link</IonText>
                          <IonInput
                            value={recurrenceExternalLinks[descriptionIndex] ?? externalLink}
                            placeholder="Add a link for this date (optional)"
                            maxlength={EVENT_FIELD_LIMITS.externalLink}
                            counter
                            onIonChange={(event) => {
                              const nextLinks = [...recurrenceExternalLinks];
                              nextLinks[descriptionIndex] = event.detail.value ?? '';
                              setRecurrenceExternalLinks(nextLinks);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </IonItem>
                  );
                })}
              </>
            )}
            {canUseRecurring && recurrenceType === 'custom' && (
              <>
                {recurrenceCustomDates.map((dateValue, index) => (
                  <IonItem key={`custom-date-${index}`} className="recurrence-custom-item">
                    <IonLabel position="stacked">Extra date {index + 1}</IonLabel>
                    <IonInput
                      type="datetime-local"
                      step="900"
                      value={dateValue}
                      onIonChange={(event) => {
                        const nextDates = [...recurrenceCustomDates];
                        nextDates[index] = normalizeDatetime(event.detail.value ?? '');
                        setRecurrenceCustomDates(nextDates);
                      }}
                      onIonFocus={() => {
                        if (dateValue) return;
                        const nextDates = [...recurrenceCustomDates];
                        nextDates[index] = defaultStartDatetime;
                        setRecurrenceCustomDates(nextDates);
                        if (!recurrenceEndDates[index]) {
                          const nextEnds = [...recurrenceEndDates];
                          nextEnds[index] = baseDurationMinutes > 0
                            ? moment(defaultStartDatetime).add(baseDurationMinutes, 'minutes').format('YYYY-MM-DDTHH:mm')
                            : defaultStartDatetime;
                          setRecurrenceEndDates(nextEnds);
                        }
                      }}
                    />
                    {(() => {
                      const fallbackEnd = dateValue
                        ? (baseDurationMinutes > 0
                          ? moment(dateValue).add(baseDurationMinutes, 'minutes').format('YYYY-MM-DDTHH:mm')
                          : dateValue)
                        : '';
                      return (
                        <IonInput
                          type="datetime-local"
                          step="900"
                          value={recurrenceEndDates[index] || fallbackEnd}
                          onIonChange={(event) => {
                            const nextEnds = [...recurrenceEndDates];
                            nextEnds[index] = normalizeDatetime(event.detail.value ?? '');
                            setRecurrenceEndDates(nextEnds);
                          }}
                          onIonFocus={() => {
                            if (recurrenceEndDates[index] || !fallbackEnd) return;
                            const nextEnds = [...recurrenceEndDates];
                            nextEnds[index] = fallbackEnd;
                            setRecurrenceEndDates(nextEnds);
                          }}
                        />
                      );
                    })()}
                    <div className="recurrence-action-row">
                      <IonButton
                        fill="clear"
                        onClick={() =>
                          setExpandedDescriptions((prev) => ({ ...prev, [index]: !prev[index] }))
                        }
                      >
                        {expandedDescriptions[index] ? 'Hide edit' : 'Edit description'}
                      </IonButton>
                      <IonButton
                        fill="clear"
                        onClick={() =>
                          setExpandedExternalLinks((prev) => ({ ...prev, [index]: !prev[index] }))
                        }
                      >
                        {expandedExternalLinks[index] ? 'Hide link' : 'Edit link'}
                      </IonButton>
                      <IonButton
                        fill="clear"
                        onClick={() => {
                          const nextDescriptions = [...recurrenceDescriptions];
                          nextDescriptions[index] = '';
                          setRecurrenceDescriptions(nextDescriptions);
                        }}
                      >
                        Clear
                      </IonButton>
                    </div>
                    {expandedDescriptions[index] && (
                      <IonTextarea
                        value={recurrenceDescriptions[index] ?? ''}
                        placeholder="Defaults to the main description unless you change it"
                        autoGrow
                        maxlength={EVENT_FIELD_LIMITS.description}
                        counter
                        onIonChange={(event) => {
                          const nextDescriptions = [...recurrenceDescriptions];
                          nextDescriptions[index] = event.detail.value ?? '';
                          setRecurrenceDescriptions(nextDescriptions);
                        }}
                      />
                    )}
                    {expandedExternalLinks[index] && (
                      <IonInput
                        value={recurrenceExternalLinks[index] ?? externalLink}
                        placeholder="Add a link for this date (optional)"
                        maxlength={EVENT_FIELD_LIMITS.externalLink}
                        counter
                        onIonChange={(event) => {
                          const nextLinks = [...recurrenceExternalLinks];
                          nextLinks[index] = event.detail.value ?? '';
                          setRecurrenceExternalLinks(nextLinks);
                        }}
                      />
                    )}
                    <IonButton
                      slot="end"
                      fill="clear"
                      onClick={() => {
                        const nextDates = recurrenceCustomDates.filter((_, i) => i !== index);
                        setRecurrenceCustomDates(nextDates);
                        setRecurrenceDescriptions((prev) => prev.filter((_, i) => i !== index));
                        setRecurrenceEndDates((prev) => prev.filter((_, i) => i !== index));
                        setRecurrenceExternalLinks((prev) => prev.filter((_, i) => i !== index));
                      }}
                    >
                      Remove
                    </IonButton>
                  </IonItem>
                ))}
                <IonItem lines="none">
                  <IonButton
                    fill="outline"
                    onClick={() => {
                      if (recurrenceCustomDates.length < maxCustomDates) {
                        setRecurrenceCustomDates([...recurrenceCustomDates, '']);
                      }
                    }}
                    disabled={recurrenceCustomDates.length >= maxCustomDates}
                  >
                    Add another date
                  </IonButton>
                  <IonText color="medium" style={{ marginLeft: '12px' }}>
                    {recurrenceCustomDates.length}/{maxCustomDates} extra dates
                  </IonText>
                </IonItem>
              </>
            )}
          </div>
          <IonAlert
            isOpen={showSuccessAlert}
            header="Your event has been submitted and is now pending approval!"
            subHeader="Check on your event submissions in your Me tab > Activity."
            buttons={['OK']}
            onDidDismiss={handleSuccessAlertDismiss}
          />
          <IonAlert
            isOpen={showDefaultDateConfirm}
            header="Use the default event date?"
            message="Your event is still set to the default start and end time. Please make sure this is when the event is happening before submitting."
            buttons={[
              {
                text: 'Go back',
                role: 'cancel',
                handler: () => setShowDefaultDateConfirm(false),
              },
              {
                text: 'Submit anyway',
                handler: async () => {
                  setShowDefaultDateConfirm(false);
                  await handleSubmit(true, true);
                },
              },
            ]}
            onDidDismiss={() => setShowDefaultDateConfirm(false)}
          />
          <IonAlert
            isOpen={showRecurringUpgrade}
            header="Recurring events"
            message="Join Community+ or Pro to post recurring events."
            buttons={[
              {
                text: 'OK',
                handler: () => setShowRecurringUpgrade(false),
              },
            ]}
            onDidDismiss={() => setShowRecurringUpgrade(false)}
          />
          <IonAlert
            isOpen={showLinkShortenerWarning}
            header="Use the full URL?"
            message="Submitting the whole URL instead of a link shortener is preferred so members know what they are clicking."
            buttons={[
              {
                text: 'Edit link',
                role: 'cancel',
                handler: () => setShowLinkShortenerWarning(false),
              },
              {
                text: 'Submit anyway',
                handler: () => {
                  setShowLinkShortenerWarning(false);
                  handleSubmit(true, true);
                },
              },
            ]}
            onDidDismiss={() => setShowLinkShortenerWarning(false)}
          />
            </>
          ) : null}
        </IonList>
        <IonAlert
          isOpen={showQuickSuccessAlert}
          header="Your link has been sent!"
          subHeader="We'll review it and fill in the details if it is a fit for the calendar."
          buttons={['OK']}
          onDidDismiss={handleQuickSuccessAlertDismiss}
        />
        <IonAlert
          isOpen={showQuickLinkShortenerWarning}
          header="Use the full URL?"
          message="Submitting the whole URL instead of a link shortener is preferred so members know what they are clicking."
          buttons={[
            {
              text: 'Edit link',
              role: 'cancel',
              handler: () => setShowQuickLinkShortenerWarning(false),
            },
            {
              text: 'Submit anyway',
              handler: () => {
                setShowQuickLinkShortenerWarning(false);
                handleQuickSubmit(true);
              },
            },
          ]}
          onDidDismiss={() => setShowQuickLinkShortenerWarning(false)}
        />
        {showDetailsForm && (dateError || recurrenceError || showGlobalError || hasPreSubmitIssues || accountAgeError || hasShortenedLinkInContent || hasShortenedLinkInLinkField) && (
          <div className="create-event-validations">
            {accountAgeError && (
              <IonText color="danger">{accountAgeError}</IonText>
            )}
            {dateError && (
              <IonText color="danger">{dateError}</IonText>
            )}
            {recurrenceError && (
              <IonText color="danger">{recurrenceError}</IonText>
            )}
            {showGlobalError && (
              <IonText color="danger">{error}</IonText>
            )}
            {hasPii && (
              <IonText color="danger">
                Events cannot contain private personal contact information. Please remove phone numbers or emails.
              </IonText>
            )}
            {hasShortenedLinkInContent || hasShortenedLinkInLinkField ? (
              <IonText color="danger">
                Submitting the whole URL instead of a link shortener is preferred so members know what they are clicking.
              </IonText>
            ) : null}
            {hasGoogleDocLinkInContent || hasGoogleDocLinkInLinkField ? (
              <IonText color="danger">
                This link isn’t allowed due to guidelines.
              </IonText>
            ) : null}
          </div>
        )}
        {activeSubmissionFlow ? (
          <IonRow className="create-event-actions">
            <IonButton
              className="create-event-submit"
              expand="block"
              onClick={() => (activeSubmissionFlow === 'quick' ? handleQuickSubmit() : handleSubmit())}
              disabled={
                activeSubmissionFlow === 'quick'
                  ? quickSubmitting
                  : submitting || hasPreSubmitIssues || !isOldEnoughForEvents
              }
            >
              {activeSubmissionFlow === 'quick'
                ? (quickSubmitting ? 'Sending...' : 'Send link')
                : (submitting ? 'Submitting...' : 'Submit event')}
            </IonButton>
          </IonRow>
        ) : null}
          </>
        )}
      </IonContent>
    </>
  );
};

export default CreateEventModal;
