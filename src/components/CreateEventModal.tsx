import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonRow,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonText,
  IonTitle,
  IonToolbar,
  useIonModal,
  IonCard,
} from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { apiClient } from '../hooks/api/api-client';
import CitySelectorModal from './CitySelectorModal';
import { eventUploadPhoto } from '../hooks/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/pro-solid-svg-icons/faImage';
import { faTrash } from '@fortawesome/pro-solid-svg-icons/faTrash';
import { useGetGlobalAppCurrentProfile } from '../hooks/api/profiles/global-app-current-profile';
import CreatePostModal from './CreatePostModal';

import './CreateEventModal.css';

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
  { value: 'air_purifiers', label: 'Air purifiers' },
];

type City = {
  name: string;
  lat: number;
  lng: number;
};

type CreateEventModalProps = {
  onDismiss: (data?: { submitted?: boolean }) => void;
};

const CreateEventModal: React.FC<CreateEventModalProps> = ({ onDismiss }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [location, setLocation] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [long, setLong] = useState<number | null>(null);
  const [eventType, setEventType] = useState('');
  const [showPostTip, setShowPostTip] = useState(false);
  const { data: globalProfile } = useGetGlobalAppCurrentProfile();
  const [presentPostModal, dismissPostModal] = useIonModal(CreatePostModal, {
    preferred_name: globalProfile?.preferred_name ?? '',
    username: globalProfile?.username ?? '',
    onDismiss: () => dismissPostModal(),
  });
  const [precautions, setPrecautions] = useState<string[]>([]);
  const [sensitive, setSensitive] = useState(false);
  const [sensitiveDescription, setSensitiveDescription] = useState('');
  const [includeProfile, setIncludeProfile] = useState(true);
  const [postingIdentity, setPostingIdentity] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [externalRegistrationRequired, setExternalRegistrationRequired] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageAlt, setImageAlt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openingCitySelectorRef = useRef(false);
  const [presentCitySelector, dismissCitySelector] = useIonModal(CitySelectorModal, {
    onDismiss: (selectedCity?: City) => handleCityDismiss(selectedCity),
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
    setIncludeProfile(postingIdentity !== 'anonymous');
  }, [postingIdentity]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result as string);
    };
    reader.readAsDataURL(file);
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

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim() || !eventType || !startDatetime || !endDatetime) {
      setError('Name, description, type, start, and end are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name,
        description,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        location: locationLabel || location,
        location_point_lat: lat,
        location_point_long: long,
        local_only: eventType !== 'virtual_only' ? 'true' : 'false',
        sensitive: sensitive ? 'true' : 'false',
        sensitive_description: sensitiveDescription,
        include_profile: includeProfile ? 'true' : 'false',
        anonymous: postingIdentity === 'anonymous' ? 'true' : 'false',
        event_type: eventType,
        in_person_precautions: precautions,
        external_link: externalLink || null,
        external_registration_required: externalRegistrationRequired ? 'true' : 'false',
      };

      const response = await apiClient.post('/api/event/', payload);
      const eventId = response.data?.event_id;
      if (!eventId) {
        throw new Error('Missing event id');
      }

      if (imageData) {
        await eventUploadPhoto({ image: imageData }, eventId);
      }

      onDismiss?.({ submitted: true });
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

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Add an event</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleCancel}>Cancel</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="create-event-modal">
        <IonCard className="post-tip-card">
          <IonItem>
            <IonLabel>Want this to create a post too?</IonLabel>
            <IonButton slot="end" fill="outline" onClick={() => setShowPostTip((prev) => !prev)}>
              {showPostTip ? 'Hide info' : 'Show info'}
            </IonButton>
          </IonItem>
          {showPostTip && (
            <>
              <IonItem lines="none">
                <IonLabel className="ion-text-wrap">
                  Use the Refreshments post form if you also want this event to appear in the feed; moderators can publish a post based on your event request. Clicking the button below will take you to that form.
                </IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonButton expand="block" onClick={() => presentPostModal()}>
                  Open the post form
                </IonButton>
              </IonItem>
            </>
          )}
        </IonCard>
        <IonList>
          <div className="create-event-section">
            <IonItem>
              <IonLabel position="stacked">
                Event name<span className="required-star">*</span>
              </IonLabel>
              <IonInput value={name} onIonChange={(event) => setName(event.detail.value ?? '')} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">
                Description<span className="required-star">*</span>
              </IonLabel>
            <IonTextarea
                value={description}
                onIonChange={(event) => setDescription(event.detail.value ?? '')}
                rows={4}
              />
            </IonItem>
          </div>
          <div className="create-event-section">
            <IonItem>
              <IonLabel position="stacked">
                Start<span className="required-star">*</span>
              </IonLabel>
              <IonInput
                type="datetime-local"
                value={startDatetime}
                onIonChange={(event) => setStartDatetime(event.detail.value ?? '')}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">
                End<span className="required-star">*</span>
              </IonLabel>
              <IonInput
                type="datetime-local"
                value={endDatetime}
                onIonChange={(event) => setEndDatetime(event.detail.value ?? '')}
              />
            </IonItem>
          </div>
          <div className="create-event-section">
            <IonItem>
              <IonLabel position="stacked">
                Event type<span className="required-star">*</span>
              </IonLabel>
              <IonSelect value={eventType} onIonChange={(event) => setEventType(event.detail.value ?? '')}>
                <IonSelectOption value="" disabled>
                  Pick an event type
                </IonSelectOption>
                {EVENT_TYPE_CHOICES.map((choice) => (
                  <IonSelectOption key={choice.value} value={choice.value}>
                    {choice.label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            {eventType && eventType !== 'virtual_only' && (
              <>
                <IonItem>
                  <IonLabel position="stacked">In-person precautions</IonLabel>
                  <IonSelect
                    value={precautions}
                    multiple
                    interface="popover"
                    onIonChange={(event) => setPrecautions(event.detail.value ?? [])}
                  >
                    {PRECAUTION_OPTIONS.map((option) => (
                      <IonSelectOption key={option.value} value={option.value}>
                        {option.label}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
                <IonItem color="white" lines="none">
                  <IonLabel position="stacked">Nearby City</IonLabel>
                  <IonInput
                    value={location}
                    placeholder="Click to select"
                    readonly
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openCitySelector();
                    }}
                  />
                </IonItem>
                <IonItem color="white" lines="none">
                  <IonLabel position="stacked" className="ion-text-wrap">
                    <p>Location label</p>
                    {location && (
                      <p style={{ color: 'var(--ion-color-medium)' }}>
                        Change this if you'd like the event to show something different than the city.
                      </p>
                    )}
                  </IonLabel>
                  <IonInput
                    value={locationLabel}
                    onIonInput={(e) => setLocationLabel(e.detail.value ?? '')}
                    type="text"
                    placeholder="What the event labels as the location"
                    autoCapitalize="words"
                    name="locationlabel"
                  />
                </IonItem>
              </>
            )}
          </div>
          <div className="create-event-section">
            <IonItem>
              <IonLabel position="stacked">Post as</IonLabel>
              <IonSelect
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
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel>Sensitive</IonLabel>
              <IonCheckbox slot="end" checked={sensitive} onIonChange={(event) => setSensitive(event.detail.checked)} />
            </IonItem>
            {sensitive ? (
              <IonItem>
                <IonLabel position="stacked">Sensitive description</IonLabel>
                <IonTextarea
                  value={sensitiveDescription}
                  onIonChange={(event) => setSensitiveDescription(event.detail.value ?? '')}
                  rows={2}
                />
              </IonItem>
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
            <IonItem>
              <IonLabel position="stacked">External link</IonLabel>
              <IonInput value={externalLink} onIonChange={(event) => setExternalLink(event.detail.value ?? '')} />
            </IonItem>
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
                accept="image/*"
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
            <IonItem color="white" lines="none">
              <IonLabel position="stacked">Image alt text (optional)</IonLabel>
              <IonInput value={imageAlt} onIonChange={(event) => setImageAlt(event.detail.value ?? '')} />
            </IonItem>
          ) : null}
          {error && (
            <IonItem>
              <IonText color="danger">{error}</IonText>
            </IonItem>
          )}
        </IonList>
        <IonRow className="create-event-actions">
          <IonButton expand="block" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit event'}
          </IonButton>
        </IonRow>
      </IonContent>
    </>
  );
};

export default CreateEventModal;
