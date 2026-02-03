import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "../hooks/api/api-client";
import { IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, IonInput, IonButton, IonItem, IonButtons, IonNote, IonAlert, IonPage, IonTextarea, IonSelect, IonSelectOption, useIonModal, IonCol, IonGrid, IonRow, IonText, IonCheckbox, IonCard, useIonRouter, IonIcon, IonList, IonPopover } from '@ionic/react';
import Cookies from 'js-cookie';
import moment from "moment";

import './CreatePostModal.css'
import { announcementUploadPhoto, containsGoogleDocLink, containsLinkShortener, containsPii, createAnnouncement, isCommunityPlus, isPro } from "../hooks/utilities";
import { Camera, CameraResultType } from "@capacitor/camera";
import { decode } from "base64-arraybuffer";
import CroppedPostImageModal from "./CroppedPostImageModal";
import Resizer from "react-image-file-resizer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/pro-solid-svg-icons/faImage";
import { faTrash } from "@fortawesome/pro-solid-svg-icons/faTrash";
import { useGetLimits } from "../hooks/api/profiles/current-limits";
import { useGetSiteSettings } from "../hooks/api/sitesettings";
import { faStar, faTimer } from "@fortawesome/pro-solid-svg-icons";
import { useGetGlobalAppCurrentProfile } from "../hooks/api/profiles/global-app-current-profile";
import CitySelectorModal from "./CitySelectorModal";
import { useGetCurrentStreak } from "../hooks/api/profiles/current-streak";
import { informationCircle } from "ionicons/icons";
import ContactDetailsPopover from "./ContactDetailsPopover";




type Props = {
    preferred_name: string,
    username: string,
    initialCategory?: string,
    onDismiss: () => void;
};

interface Post {
    title?: string,
    byline?: string | null,
    category?: string | null,
    content?: string | null,
    sensitive?: string | null;
    sensitive_description?: string | null;
    include_profile?: string | null,
    link?: string | null,
    coverPhoto?: any,
    coverPhoto_alt?: string | null,
    comment_instructions?: string | null,
    local_only?: string | null,
    location?: string | null,
    location_point_lat?: number | null,
    location_point_long?: number | null,

}

function isMoreThanTwoWeeksOld(registrationDate: string): boolean {
    const now = new Date();
    const registered = new Date(registrationDate);

    const diffInMs = now.getTime() - registered.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    return diffInDays > 14;
}

const CreatePostModal: React.FC<Props> = (props) => {

    const { preferred_name, username, initialCategory, onDismiss } = props;
    const router = useIonRouter();

    const modal = useRef<HTMLIonModalElement>(null);

    const limits = useGetLimits().data
    const siteSettings = useGetSiteSettings().data
    const currentStreak = useGetCurrentStreak().data;

    const { data: globalCurrentProfile, isLoading: globalIsLoading } = useGetGlobalAppCurrentProfile();


    const [title, setTitle] = useState("");
    const [byline, setByline] = useState<string | null>(globalCurrentProfile?.username ?? null);
    const [bar, setBar] = useState<string | null>(null);

    const [link, setLink] = useState<string | null>(null);
    const [content, setContent] = useState<string>("");
    const [coverPhotoAlt, setCoverPhotoAlt] = useState<string | null>(null);

    const [sensitiveContent, setSensitiveContent] = useState<boolean>(false);
    const [sensitiveDescription, setSensitiveDescription] = useState<string>("");

    const [includeProfile, setIncludeProfile] = useState<boolean>(true)
    const [errors, setErrors] = useState<string[]>([]);
    const [afterSendWait, setAfterSendWait] = useState(false)
    const [requestSupportive, setRequestSupportive] = useState(false)


    // const [data, setData] = useState<any>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [error, setError] = useState<null | string>(null);

    const [local, setLocal] = useState<boolean>(false);
    const [location, setLocation] = useState<string>("");
    const [locationLabel, setLocationLabel] = useState<string>("");
    const [lat, setLat] = useState<number | null>(null);
    const [long, setLong] = useState<number | null>(null);
    const [eventStart, setEventStart] = useState<string>("");
    const [eventEnd, setEventEnd] = useState<string>("");
    const [eventType, setEventType] = useState<string>("");
    const [eventWarning, setEventWarning] = useState<string[] | null>(null);
    const [recurrenceType, setRecurrenceType] = useState<'none' | 'weekly' | 'monthly' | 'daily' | 'custom'>('none');
    const [recurrenceCount, setRecurrenceCount] = useState(1);
    const [recurrenceCustomDates, setRecurrenceCustomDates] = useState<string[]>([]);
    const [recurrenceDescriptions, setRecurrenceDescriptions] = useState<string[]>([]);
    const [recurrenceEndDates, setRecurrenceEndDates] = useState<string[]>([]);
    const [expandedDescriptions, setExpandedDescriptions] = useState<Record<number, boolean>>({});
    const [recurrenceExternalLinks, setRecurrenceExternalLinks] = useState<string[]>([]);
    const [expandedExternalLinks, setExpandedExternalLinks] = useState<Record<number, boolean>>({});
    const [baseDescriptionExpanded, setBaseDescriptionExpanded] = useState(false);
    const [expandedDateEdits, setExpandedDateEdits] = useState<Record<number, boolean>>({});
    const [showRecurringUpgrade, setShowRecurringUpgrade] = useState(false);

    const [ackEmail, setAckEmail] = useState(false);



    // const [poll, setPoll] = useState<boolean>(false);





    const [image, setImage] = useState<any>(null);
    const [imageName, setImageName] = useState<string | null>(null);
    const [picDb, setPicDB] = useState<any>(null);

    const [croppedBlob, setCroppedBlob] = useState<any>(null);



    const [imageDataToUpload, setImageDataToUpload] = useState<any>(null);

    const [showAlert, setShowAlert] = useState(false)

    useEffect(() => {
        if (byline == "Anonymous") {
            setIncludeProfile(false)
        }
    }, [byline])

    useEffect(() => {
        if (initialCategory && !bar) {
            setBar(initialCategory);
        }
    }, [initialCategory, bar]);

    const defaultStartDatetime = useMemo(() => (
        moment().add(7, 'days').hour(20).minute(0).second(0).format('YYYY-MM-DDTHH:mm')
    ), []);

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
            return computeWeeklyOccurrences(eventStart, recurrenceCount);
        }
        if (recurrenceType === 'monthly') {
            return computeMonthlyOccurrences(eventStart, recurrenceCount);
        }
        if (recurrenceType === 'daily') {
            return computeDailyOccurrences(eventStart, recurrenceCount);
        }
        if (recurrenceType === 'custom') {
            return recurrenceCustomDates.filter((date) => date);
        }
        return [];
    }, [recurrenceType, recurrenceCount, eventStart, recurrenceCustomDates]);

    useEffect(() => {
        const targetLength = recurrenceType === 'custom' ? recurrenceCustomDates.length : summaryDates.length;
        setRecurrenceDescriptions((prev) => {
            if (prev.length === targetLength) return prev;
            const next = [...prev.slice(0, targetLength)];
            while (next.length < targetLength) {
                next.push(content || '');
            }
            return next;
        });
    }, [summaryDates, recurrenceCustomDates.length, recurrenceType, content]);

    useEffect(() => {
        const targetLength = recurrenceType === 'custom' ? recurrenceCustomDates.length : summaryDates.length;
        setRecurrenceExternalLinks((prev) => {
            if (prev.length === targetLength) return prev;
            const next = [...prev.slice(0, targetLength)];
            while (next.length < targetLength) {
                next.push(link || '');
            }
            return next;
        });
    }, [summaryDates, recurrenceCustomDates.length, recurrenceType, link]);

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
            if (eventStart) {
                return [eventStart, ...summaryDates];
            }
        }
        return summaryDates;
    }, [recurrenceType, eventStart, summaryDates]);

    const baseDurationMinutes = useMemo(() => {
        const start = moment(eventStart);
        const end = moment(eventEnd);
        if (!start.isValid() || !end.isValid()) return 0;
        return Math.max(end.diff(start, 'minutes'), 0);
    }, [eventStart, eventEnd]);

    const formatEndTime = (startValue: string) => {
        const start = moment(startValue);
        if (!start.isValid() || baseDurationMinutes <= 0) return '';
        return start.add(baseDurationMinutes, 'minutes').format('h:mm A');
    };

    useEffect(() => {
    }, [content])

    useEffect(() => {
        if (bar !== "events") {
            setRecurrenceType("none");
            setRecurrenceCount(1);
            setRecurrenceCustomDates([]);
            setRecurrenceDescriptions([]);
        }
    }, [bar]);



    type City = { name: string; lat: number; lng: number };

    const openingRef = useRef(false);
    const recurrenceTypeRef = useRef(recurrenceType);

    const userHandle = (username ?? "").trim();



    const [presentCitySelector, dismissCitySelector] = useIonModal(CitySelectorModal, {
        onDismiss: (selectedCity?: City) => handleCityDismiss(selectedCity),
    });

    const openCitySelector = () => {
        if (openingRef.current) return;        // guard against duplicate opens
        openingRef.current = true;

        presentCitySelector({
            // presentingElement is optional, but helps with iOS card style if desired:
            // presentingElement: document.querySelector('ion-router-outlet') as HTMLElement | undefined,
            onDidDismiss: () => {
                openingRef.current = false;        // release guard
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
        dismissCitySelector();                  // close exactly once
    };


    function postSubmitSuccessful() {
        onDismiss();
    }

    function formData() {
        const form_data: Post = {}


        form_data.title = title;
        form_data.byline = byline;
        form_data.category = bar;
        form_data.content = content;
        form_data.sensitive = sensitiveContent ? "true" : "false";
        form_data.sensitive_description = sensitiveDescription;
        form_data.include_profile = includeProfile ? "true" : "false";
        form_data.link = link;
        form_data.coverPhoto = croppedBlob;
        form_data.coverPhoto_alt = coverPhotoAlt;
        form_data.local_only = local ? "true" : "false";
        form_data.location = local ? (locationLabel ? locationLabel : location) : null;
        form_data.location_point_lat = local ? lat : null;
        form_data.location_point_long = local ? long : null;



        if (requestSupportive && (bar == "mingle" || bar == "family")) {
            form_data.comment_instructions = "Supportive comments only please!"
        }

        return form_data;
    }

    const updatePicture = async (pic_db: string) => {

        const photo = await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.Base64
        })

        const photoblob = new Blob([new Uint8Array(decode(photo.base64String!))], {
            type: `image/${photo.format}`,
        });

        Resizer.imageFileResizer(
            photoblob,
            1500,
            1500,
            "JPEG",
            100,
            0,
            (uri) => {
                setImage(uri)
            },
            "base64",
            800,
            800
        );

        setPicDB(pic_db)
        setImageName("main.png")
        cropPresent()

    }

    const delay = (ms: any) => new Promise(res => setTimeout(res, ms));

    const handleCropDismiss = async (base64string: string | null) => {
        setImageLoading(true)
        setImageDataToUpload(base64string)
        console.log("Dismissed cropper imagedatatoupload", base64string)
        cropDismiss()
        console.log("Waiting 3 seconds to reload image ")
        await delay(3000);
        console.log("Dismissed cropper imagedatatoupload 2", base64string)
        setImageLoading(false)
    }


    const [cropPresent, cropDismiss] = useIonModal(CroppedPostImageModal, {
        image: image,
        picDb: picDb,
        imageName: imageName,
        onDismiss: (data: string | null) => handleCropDismiss(data)
    });


    const createEventFromPost = async (announcementId: number) => {
        try {
            const locationValue = (locationLabel || location) || null;
            const subscriptionLevel = globalCurrentProfile?.subscription_level;
            const maxRecurringEvents = isPro(subscriptionLevel)
                ? 10
                : isCommunityPlus(subscriptionLevel)
                    ? 5
                    : 1;
            const trimmedCustomDates = recurrenceCustomDates
                .map((date) => (date ?? '').trim())
                .filter((date) => date);
            const baseStartDate = eventStart ? new Date(eventStart) : null;
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
            const eventPayload = {
                name: title,
                description: content,
                start_datetime: eventStart,
                end_datetime: eventEnd,
                location: local ? locationValue : locationValue,
                location_point_lat: local ? lat : null,
                location_point_long: local ? long : null,
                local_only: local ? 'true' : 'false',
                sensitive: sensitiveContent ? 'true' : 'false',
                sensitive_description: sensitiveDescription,
                include_profile: includeProfile ? 'true' : 'false',
                anonymous: byline === "Anonymous" ? 'true' : 'false',
                event_type: eventType || (local ? 'in_person_only' : 'virtual_only'),
                post: announcementId,
                external_link: link || null,
                recurrence_type: recurrenceType !== 'none' ? recurrenceType : null,
                recurrence_count: recurrenceType !== 'custom' ? Math.min(recurrenceCount, maxRecurringEvents) : null,
                recurrence_custom_datetimes: recurrenceType === 'custom' ? trimmedCustomDates : null,
                recurrence_month_day: recurrenceType === 'monthly' ? recurrenceMonthDay : null,
                recurrence_descriptions: recurrenceType !== 'none'
                    ? descriptionsForPayload
                    : null,
                recurrence_end_datetimes: recurrenceType !== 'none'
                    ? endsForPayload
                    : null,
                recurrence_external_links: recurrenceType !== 'none'
                    ? linksForPayload
                    : null,
            };

            await apiClient.post('/api/event/', eventPayload);
        } catch (error) {
            console.error("Event creation failed", error);
        }
    };

    async function handlePostSubmit(e?: any, skipWarning = false) {
        if (e) {
            e.preventDefault();
        }

        if (!skipWarning && bar === "events") {
            const missing: string[] = [];
            if (!eventType) missing.push("Event type");
            if (!eventStart) missing.push("Event start");
            if (!eventEnd) missing.push("Event end");
            if (missing.length) {
                setEventWarning(missing);
                return;
            }
        }

        if (bar === "events") {
            const startMoment = moment(eventStart);
            const endMoment = moment(eventEnd);
            if (!startMoment.isValid() || !endMoment.isValid()) {
                setErrors(["Start and end must be valid dates."]);
                return;
            }
            if (startMoment.isBefore(moment())) {
                setErrors(["Events can’t start in the past."]);
                return;
            }
            if (endMoment.isBefore(startMoment)) {
                setErrors(["End date can’t be before the start date."]);
                return;
            }
            if (!startMoment.isSame(endMoment, 'day')) {
                setErrors(["Start and end must be on the same day."]);
                return;
            }
        }

        if (bar === "events" && recurrenceType !== 'none') {
            const subscriptionLevel = globalCurrentProfile?.subscription_level;
            const maxRecurringEvents = isPro(subscriptionLevel)
                ? 10
                : isCommunityPlus(subscriptionLevel)
                    ? 5
                    : 1;
            const trimmedCustomDates = recurrenceCustomDates
                .map((date) => (date ?? '').trim())
                .filter((date) => date);
            const recurrenceErrors: string[] = [];
            if (maxRecurringEvents <= 1) {
                recurrenceErrors.push("Recurring events are available for Community+ and Pro members.");
            }
            if (recurrenceType !== 'custom' && recurrenceCount > maxRecurringEvents) {
                recurrenceErrors.push(`Recurring events are limited to ${maxRecurringEvents} total events.`);
            }
            if (recurrenceType === 'custom' && (trimmedCustomDates.length + 1) > maxRecurringEvents) {
                recurrenceErrors.push(`Recurring events are limited to ${maxRecurringEvents} total events.`);
            }
            if (recurrenceType === 'custom' && trimmedCustomDates.length === 0) {
                recurrenceErrors.push("Add at least one additional date.");
            }
            if (recurrenceType === 'custom') {
                const normalized = trimmedCustomDates.map((value) => normalizeDatetime(value));
                for (let i = 1; i < normalized.length; i += 1) {
                    if (moment(normalized[i]).isBefore(moment(normalized[i - 1]))) {
                        recurrenceErrors.push("Recurring dates must be in order (later dates after earlier ones).");
                        break;
                    }
                }
                const endNormalized = recurrenceEndDates.map((value, index) => value || normalizeDatetime(normalized[index] || ""));
                for (let i = 0; i < normalized.length; i += 1) {
                    const startValue = normalized[i];
                    const endValue = endNormalized[i];
                    if (!startValue || !endValue) {
                        recurrenceErrors.push("Each recurring date needs an end time.");
                        break;
                    }
                    const startTime = moment(startValue);
                    const endTime = moment(endValue);
                    if (!endTime.isSame(startTime, 'day')) {
                        recurrenceErrors.push("Recurring date end times must be on the same day.");
                        break;
                    }
                    if (endTime.isBefore(startTime)) {
                        recurrenceErrors.push("Recurring date end times can’t be before the start.");
                        break;
                    }
                }
            }
            if (recurrenceErrors.length) {
                setErrors(recurrenceErrors);
                return;
            }
        }

        setAfterSendWait(true)

        setErrors([])
        try {
            const ann_response = await createAnnouncement(formData())

            console.log("Announcement response ", ann_response)
            console.log("Announcement response ", ann_response.data['announcement_id'])

            let uploadData = new FormData();
            if (imageDataToUpload) {
                console.log("64", imageDataToUpload)
                uploadData.append("coverPhoto", imageDataToUpload);
                await announcementUploadPhoto(uploadData, ann_response.data['announcement_id'])
            }
            if (bar === "events" && eventStart && eventEnd && eventType) {
                await createEventFromPost(ann_response.data['announcement_id']);
            }
            setEventStart("");
            setEventEnd("");
            setEventType("");
            setRecurrenceType("none");
            setRecurrenceCount(1);
            setRecurrenceCustomDates([]);
            setRecurrenceDescriptions([]);
            setShowAlert(true)
        }
        catch (error: any) {
            console.log(error.response.data)
            const errorsList: string[] = []
            if (error.response.data["title"]?.length > 0) {
                error.response.data["title"].forEach((element: any) => {
                    errorsList.push("Title: " + element["message"])
                })
            }
            if (error.response.data["category"]?.length > 0) {
                error.response.data["category"].forEach((element: any) => {
                    errorsList.push("Category: " + element["message"])
                })
            }
            if (error.response.data["content"]?.length > 0) {
                error.response.data["content"].forEach((element: any) => {
                    errorsList.push("Content: " + element["message"])
                })
            }
            if (error.response.data["link"]?.length > 0) {
                error.response.data["link"].forEach((element: any) => {
                    errorsList.push("Link: " + element["message"])
                })
            }
            else {
                if (errorsList.length == 0) {
                    errorsList.push("Something went wrong.")
                }
            }
            setErrors(errorsList)
        }

        setAfterSendWait(false)

    }

    const needsProfileSettingsNote =
        includeProfile && siteSettings?.settings_community_profile === false;

    const confirmationMessage = needsProfileSettingsNote
        ? 'Note: You chose “Show Profile,” but your post won\'t show until you turn on Connect from Refreshments in your Me tab > Settings.'
        : undefined;

    const hasPii: boolean = useMemo(() => containsPii(content), [content]);
    const linkFieldText = useMemo(
        () => [link, ...recurrenceExternalLinks].filter(Boolean).join(" "),
        [link, recurrenceExternalLinks]
    );
    const hasShortenedLinkInContent: boolean = useMemo(
        () => containsLinkShortener(content),
        [content]
    );
    const hasShortenedLinkInLinkField: boolean = useMemo(
        () => containsLinkShortener(linkFieldText),
        [linkFieldText]
    );
    const hasGoogleDocLinkInContent: boolean = useMemo(
        () => containsGoogleDocLink(content),
        [content]
    );
    const hasGoogleDocLinkInLinkField: boolean = useMemo(
        () => containsGoogleDocLink(linkFieldText),
        [linkFieldText]
    );
    const hasBlockedLinks = hasShortenedLinkInContent || hasShortenedLinkInLinkField || hasGoogleDocLinkInContent || hasGoogleDocLinkInLinkField;
    const mentionsPaymentHandle: boolean = useMemo(() => {
        if (!content) return false;
        return /(venmo|paypal|cashapp)/i.test(content);
    }, [content]);
    const mentionsOneToOne: boolean = useMemo(() => {
        if (!content) return false;
        return /(looking to connect|message me|let['’]s connect|to meet)/i.test(content);
    }, [content]);



    const requiredMissing = {
        title: !title?.trim(),
        byline: !byline,
        bar: !bar,
        content: !content?.trim(),
    } as const;

    const labelMap: Record<keyof typeof requiredMissing, string> = {
        title: 'Title',
        byline: 'Byline',
        bar: 'Category',
        content: 'Post Content',
    };

    const missingFields = (Object.entries(requiredMissing) as [keyof typeof requiredMissing, boolean][])
        .filter(([, v]) => v)
        .map(([k]) => labelMap[k]);

    // Housing-specific rule
    const housingRuleActive = bar === 'housing';
    const housingViolations = housingRuleActive
        ? {
            noAnonymousByline: byline === 'Anonymous',
            mustIncludeProfile: !includeProfile,
        }
        : { noAnonymousByline: false, mustIncludeProfile: false };

    const formInvalid =
        missingFields.length > 0 ||
        housingViolations.noAnonymousByline ||
        housingViolations.mustIncludeProfile;

    // Build messages to show user
    const issues: string[] = [];
    if (missingFields.length > 0) issues.push(`Missing: ${missingFields.join(', ')}.`);
    if (housingRuleActive) {
        if (housingViolations.noAnonymousByline)
            issues.push('For Housing posts, Byline cannot be "Anonymous" and "Show Profile" must be enabled.');
        else if (housingViolations.mustIncludeProfile)
            issues.push('For Housing posts, "Show Profile" must be enabled.');
    }

    const dateErrorMessages = new Set([
        'Start and end must be valid dates.',
        'Events can’t start in the past.',
        'End date can’t be before the start date.',
        'Start and end must be on the same day.',
    ]);
    const recurrenceErrorMessages = new Set([
        'Add at least one additional date.',
        'Recurring dates must be in order (later dates after earlier ones).',
        'Each recurring date needs an end time.',
        'Recurring date end times must be on the same day.',
        'Recurring date end times can’t be before the start.',
    ]);
    const dateErrors = errors.filter((msg) => dateErrorMessages.has(msg));
    const recurrenceErrors = errors.filter((msg) => recurrenceErrorMessages.has(msg));
    const nonInlineErrors = errors.filter(
        (msg) => !dateErrorMessages.has(msg) && !recurrenceErrorMessages.has(msg)
    );

    const subscriptionLevel = globalCurrentProfile?.subscription_level;
    const maxRecurringEvents = isPro(subscriptionLevel)
        ? 10
        : isCommunityPlus(subscriptionLevel)
            ? 5
            : 1;
    const canUseRecurring = maxRecurringEvents > 1;
    const maxCustomDates = Math.max(maxRecurringEvents - 1, 0);

    const handleRecurrenceChange = (value: string) => {
        if (!canUseRecurring && value !== "none") {
            setShowRecurringUpgrade(true);
            setRecurrenceType("none");
            return;
        }
        setRecurrenceType(value as 'none' | 'weekly' | 'monthly' | 'daily' | 'custom');
    };

    useEffect(() => {
        if (!canUseRecurring) return;
        if (recurrenceType === 'none') {
            setRecurrenceCount(1);
            setRecurrenceCustomDates([]);
            setRecurrenceDescriptions([]);
            setExpandedDateEdits({});
            setRecurrenceEndDates([]);
            setRecurrenceExternalLinks([]);
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
        <IonPage>
            <IonHeader>
                <IonToolbar className="modal-title">
                    <IonTitle>Create Post</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onDismiss}>Cancel</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="create-post">
                <IonAlert
                    isOpen={showAlert}
                    onDidDismiss={postSubmitSuccessful}
                    header="Your post has been submitted and is now pending approval!"
                    subHeader="Check on your post submissions in your Me tab > Activity."
                    message={confirmationMessage}
                    buttons={['OK']}
                />
                <IonRow className="ion-justify-content-center ion-padding">
                    <IonButton color="navy" onClick={() => router.push('/community/submitted')}>
                        Submissions
                    </IonButton>
                </IonRow>
                {siteSettings?.allow_free_users_to_submit_posts &&
                    <IonCard className="ion-padding limited ion-text-center">
                        <p>All users can submit 2 posts a month{!isMoreThanTwoWeeksOld(globalCurrentProfile?.registrationDate) ? " once your account is at least two weeks old" : ""}.</p>
                        <IonText color="medium"><FontAwesomeIcon icon={faStar} /> No limits for Community+ and Pro users. All post submissions are still subject to our <a href="https://www.refreshconnections.com/faqs#post">Refreshments post requirements</a>.</IonText>
                    </IonCard>}
                {isCommunityPlus(globalCurrentProfile?.subscription_level) || (currentStreak?.streak_count >= 5) || (limits?.posts_submitted < 2 && isMoreThanTwoWeeksOld(globalCurrentProfile?.registrationDate)) ? (
                    <>
                        <form onSubmit={(e) => handlePostSubmit(e)}>

                        {/* Title */}
                        <IonCard>
                            <IonItem color="white" lines="none">
                                <IonLabel position="stacked">Title*</IonLabel>
                                <IonInput
                                    value={title}
                                    name="title"
                                    placeholder="Required"
                                    onIonInput={e => setTitle(e.detail.value!)}
                                    type="text"
                                    autoCapitalize='words'
                                />
                            </IonItem>
                            <IonItem color="white" lines="none">
                                <IonLabel position="stacked">Byline*</IonLabel>
                                <IonSelect value={byline} placeholder="(Who wrote the post)" onIonChange={(e) => setByline(e.detail.value)}>
                                    {/* Only show the plain username option if username exists */}
                                    {userHandle && (
                                        <IonSelectOption value={userHandle}>{userHandle}</IonSelectOption>
                                    )}
                                    <IonSelectOption value="Anonymous">Anonymous</IonSelectOption>
                                </IonSelect>
                            </IonItem>
                        </IonCard>

                        {/* Local Post */}
                        <IonCard >
                            <IonItem color="white" lines="none">
                                <IonCheckbox
                                    className="createpostcheckbox"
                                    checked={local}
                                    onIonChange={(e) => setLocal(e.detail.checked)}
                                    labelPlacement="end"
                                    justify="space-between"
                                    helperText="Check if your post is tied to a location. Leave unchecked to show the whole community."
                                >
                                    Local Post
                                </IonCheckbox>
                            </IonItem>


                            {local && (
                                <>
                                    <IonItem color="white" lines="none" button={false} detail={false}>
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
                                        <IonLabel position="stacked" className="ion-text-wrap"><p>Location label</p>{location && <p style={{ color: "var(--ion-color-medium" }}>Change this if you'd like the post to show something different than the city (like a post for a whole state or region)</p>}</IonLabel>
                                        <IonInput value={locationLabel} onIonInput={e => setLocationLabel(e.detail.value!)}
                                            type="text"
                                            placeholder="What the post labels as the location"
                                            autoCapitalize='words'
                                            name='locationlabel' />
                                    </IonItem>
                                </>
                            )}

                        </IonCard>

                        {/* Category */}
                        <IonCard >
                            <IonItem color="white" lines="none">
                                <IonLabel position="stacked">Category*</IonLabel>
                                <IonSelect value={bar} placeholder="Select category" onIonChange={(e) => setBar(e.detail.value)}>
                                    <IonSelectOption value="mingle">Mingle</IonSelectOption>
                                    <IonSelectOption value="change">Change</IonSelectOption>
                                    <IonSelectOption value="longcovid">Long Covid</IonSelectOption>
                                    <IonSelectOption value="families">Family</IonSelectOption>
                                    <IonSelectOption value="science">STEAM</IonSelectOption>
                                    <IonSelectOption value="pop">Pop</IonSelectOption>
                                    <IonSelectOption value="events">Event</IonSelectOption>
                                    <IonSelectOption value="housing" disabled={!local}>Housing</IonSelectOption>
                                    <IonSelectOption value="recommendations" disabled={!local}>Local Recommendations</IonSelectOption>
                                </IonSelect>
                            </IonItem>
                        </IonCard>

                        {bar === "events" && (
                            <IonCard>
                                <IonItem color="white" lines="none">
                                    <IonLabel position="stacked">
                                        Event type<span className="required-star">*</span>
                                    </IonLabel>
                                    <IonSelect value={eventType} placeholder="Select event type" onIonChange={(e) => setEventType(e.detail.value ?? "")}>
                                        <IonSelectOption value="virtual_only">Virtual only</IonSelectOption>
                                        <IonSelectOption value="in_person_only">In-person only</IonSelectOption>
                                        <IonSelectOption value="in_person_with_virtual_option">In-person + virtual</IonSelectOption>
                                    </IonSelect>
                                </IonItem>
                                <IonItem color="white" lines="none">
                                    <IonLabel position="stacked">
                                        Event start<span className="required-star">*</span>
                                    </IonLabel>
                                <IonInput
                                    type="datetime-local"
                                    step="900"
                                    value={eventStart}
                                    onIonInput={(e) => setEventStart(normalizeDatetime(e.detail.value ?? ""))}
                                    onIonFocus={() => {
                                        if (!eventStart) {
                                            setEventStart(defaultStartDatetime);
                                        }
                                    }}
                                />
                            </IonItem>
                            <IonItem color="white" lines="none">
                                <IonLabel position="stacked">
                                    Event end<span className="required-star">*</span>
                                </IonLabel>
                                <IonInput
                                    type="datetime-local"
                                    step="900"
                                    value={eventEnd}
                                    onIonInput={(e) => setEventEnd(normalizeDatetime(e.detail.value ?? ""))}
                                    onIonFocus={() => {
                                        if (eventEnd) return;
                                        if (eventStart) {
                                            const next = moment(eventStart).add(1, 'hour').minute(0).second(0).format('YYYY-MM-DDTHH:mm');
                                            setEventEnd(next);
                                        } else {
                                            const next = moment(defaultStartDatetime).add(1, 'hour').format('YYYY-MM-DDTHH:mm');
                                            setEventEnd(next);
                                        }
                                    }}
                                />
                            </IonItem>
                            {dateErrors.length > 0 && (
                                <IonItem color="white" lines="none">
                                    <IonText color="danger">{dateErrors[0]}</IonText>
                                </IonItem>
                            )}
                                </IonCard>
                        )}

                        {title && byline && bar &&
                            <>
                                {/* Post Content */}
                                <IonCard >
                                    <IonItem color="white" lines="none">
                                        <IonLabel position="stacked">Post Content*</IonLabel>
                                        <IonTextarea
                                            value={content}
                                            autoGrow
                                            maxlength={2000}
                                            style={{ minHeight: "120px" }}
                                            placeholder="Write your post here..."
                                            onIonInput={(e) => setContent(e.detail.value ?? "")}
                                            counter={true}
                                        />
                                    </IonItem>
                                </IonCard>

                                {/* Options */}
                                <IonCard >
                                    <IonItem color="white" lines="full">
                                        <IonCheckbox
                                            className="createpostcheckbox"
                                            checked={includeProfile}
                                            onIonChange={(e) => setIncludeProfile(e.detail.checked)}
                                            disabled={byline === "Anonymous"}
                                            labelPlacement="end"
                                            helperText="Visible only if Connect from Refreshments is enabled."
                                        >
                                            Show Profile
                                        </IonCheckbox>
                                    </IonItem>

                                    <IonItem color="white" lines="full">
                                        <IonCheckbox
                                            className="createpostcheckbox"
                                            checked={sensitiveContent}
                                            onIonChange={(e) => setSensitiveContent(e.detail.checked)}
                                            labelPlacement="end"
                                            helperText="Check if your post needs a content warning."
                                        >
                                            Sensitive Content
                                        </IonCheckbox>
                                    </IonItem>


                                    {sensitiveContent &&
                                        <IonItem color="white" lines="none">
                                            <IonLabel position="stacked">Sensitivity description (optional)</IonLabel>
                                            <IonTextarea
                                                value={sensitiveDescription}
                                                name="sensitive description"
                                                placeholder="Add suggested content warnings here."
                                                onIonInput={e => setSensitiveDescription(e.detail.value!)}
                                                rows={3}
                                            />
                                        </IonItem>
                                    }

                                    {(bar === "mingle" || bar === "families") && (
                                        <IonItem color="white">
                                            <IonCheckbox
                                                className="createpostcheckbox"
                                                checked={requestSupportive}
                                                onIonChange={(e) => setRequestSupportive(e.detail.checked)}
                                                labelPlacement="end"
                                            >
                                                Request Supportive Comments Only
                                            </IonCheckbox>
                                        </IonItem>
                                    )}
                                </IonCard>

                                {/* Link and Photo */}
                                <IonCard>
                                    <IonItem color="white" lines="full">
                                        <IonLabel position="stacked">Link (optional)</IonLabel>
                                        <IonInput
                                            value={link}
                                            name="link"
                                            placeholder="Add a related link (optional)"
                                            onIonInput={e => setLink(e.detail.value!)}
                                        />
                                    </IonItem>

                                    <IonItem color="white">
                                        <IonLabel>Photo (optional)</IonLabel>
                                        {imageDataToUpload ? (
                                            <>
                                                <IonLabel><IonText>Photo attached</IonText></IonLabel>
                                                <IonButton slot="end" color="danger" onClick={() => setImageDataToUpload(null)}>
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </IonButton>
                                            </>
                                        ) : (
                                            <IonButton size="small" color="tertiary" onClick={() => updatePicture("coverPhoto")}>
                                                <FontAwesomeIcon icon={faImage} /> &nbsp; Attach Photo
                                            </IonButton>
                                        )}
                                    </IonItem>

                                    {imageDataToUpload &&
                                        <IonItem color="white" lines="none">
                                            <IonLabel position="stacked">Image alt text (optional)</IonLabel>
                                            <IonInput
                                                value={coverPhotoAlt}
                                                name="coverphotoalt"
                                                placeholder="Add a description to your image"
                                                onIonInput={e => setCoverPhotoAlt(e.detail.value!)}
                                            />
                                        </IonItem>}
                                </IonCard>

                                {bar === "events" && (
                                    <IonCard>
                                        <IonItem color="white" lines="none">
                                            <IonLabel position="stacked">
                                                Repeat
                                                <FontAwesomeIcon style={{ marginLeft: "6px" }} color="var(--ion-color-medium)" icon={faStar} />
                                            </IonLabel>
                                            <IonSelect
                                                value={recurrenceType}
                                                onIonChange={(e) => handleRecurrenceChange(e.detail.value ?? "none")}
                                            >
                                                <IonSelectOption value="none">Does not repeat</IonSelectOption>
                                                <IonSelectOption value="daily">Daily</IonSelectOption>
                                                <IonSelectOption value="weekly">Weekly</IonSelectOption>
                                                <IonSelectOption value="monthly">Monthly</IonSelectOption>
                                                <IonSelectOption value="custom">Custom dates</IonSelectOption>
                                            </IonSelect>
                                        </IonItem>
                                        {!canUseRecurring && (
                                            <IonItem color="white" lines="none">
                                                <IonText color="medium">Recurring events are available for Community+ and Pro members.</IonText>
                                            </IonItem>
                                        )}
                                        {canUseRecurring && recurrenceType !== "none" && recurrenceType !== "custom" && (
                                            <IonItem color="white" lines="none">
                                                <IonLabel position="stacked">How many recurring dates?</IonLabel>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
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
                                        {canUseRecurring && recurrenceType !== "none" && recurrenceType !== "custom" && displayDates.length > 0 && (
                                            <>
                                                <IonItem color="white" lines="none">
                                                    <IonText color="medium">Dates (auto-generated) • Your time zone</IonText>
                                                </IonItem>
                                                {displayDates.map((dateValue, index) => {
                                                    const isBaseDate = (recurrenceType === 'weekly' || recurrenceType === 'monthly' || recurrenceType === 'daily') && index === 0;
                                                    const descriptionIndex = isBaseDate ? -1 : index - 1;
                                                    return (
                                                    <IonItem color="white" lines="none" key={`recurrence-date-${dateValue}-${index}`}>
                                                        <div style={{ width: "100%" }}>
                                                    <div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: "16px", fontWeight: 600 }}>
                                                                {moment(dateValue).format('ddd, MMM D')}
                                                            </div>
                                                            <div style={{ fontSize: "14px" }}>
                                                                        {moment(dateValue).format('h:mm A')}
                                                                        {baseDurationMinutes > 0 && (
                                                                            <> – {recurrenceEndDates[descriptionIndex]
                                                                                ? moment(recurrenceEndDates[descriptionIndex]).format('h:mm A')
                                                                                : formatEndTime(dateValue)}</>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                                                                    {!isBaseDate && (
                                                                    <IonButton
                                                                        fill="clear"
                                                                        onClick={() =>
                                                                            setExpandedDateEdits((prev) => ({ ...prev, [index]: !prev[index] }))
                                                                        }
                                                                    >
                                                                        {expandedDateEdits[index] ? "Hide date edit" : "Edit date"}
                                                                    </IonButton>
                                                                    )}
                                                                    <IonButton
                                                                        fill="clear"
                                                                        onClick={() => {
                                                                            if (isBaseDate) {
                                                                                setBaseDescriptionExpanded((prev) => !prev);
                                                                            } else {
                                                                                const hasCustom = (recurrenceDescriptions[descriptionIndex] ?? "") !== (content ?? "");
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
                                                                            ? (baseDescriptionExpanded ? "Hide edit" : "Edit description")
                                                                            : (expandedDescriptions[descriptionIndex] ? "Hide edit" : "Edit description")}
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
                                                                            {expandedExternalLinks[descriptionIndex] ? "Hide link" : "Edit link"}
                                                                        </IonButton>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {!isBaseDate && expandedDateEdits[index] && (
                                                                <div style={{ marginTop: "8px" }}>
                                                                    <IonInput
                                                                        type="datetime-local"
                                                                        step="900"
                                                                        value={dateValue}
                                                                        onIonChange={(event) => {
                                                                            const updated = [...displayDates];
                                                                            updated[index] = normalizeDatetime(event.detail.value ?? "");
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
                                                                                    next.push(link || "");
                                                                                }
                                                                                return next;
                                                                            });
                                                                            setRecurrenceType("custom");
                                                                        }}
                                                                    />
                                                                    {(() => {
                                                                        const fallbackEnd = dateValue
                                                                            ? (baseDurationMinutes > 0
                                                                                ? moment(dateValue).add(baseDurationMinutes, 'minutes').format('YYYY-MM-DDTHH:mm')
                                                                                : dateValue)
                                                                            : "";
                                                                        return (
                                                                            <IonInput
                                                                                type="datetime-local"
                                                                                step="900"
                                                                                value={recurrenceEndDates[descriptionIndex] || fallbackEnd}
                                                                                onIonChange={(event) => {
                                                                                    const nextEnds = [...recurrenceEndDates];
                                                                                    nextEnds[descriptionIndex] = normalizeDatetime(event.detail.value ?? "");
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
                                                                    {dateValue && (
                                                                        <IonText color="medium" style={{ marginTop: "6px" }}>
                                                                            Ends at {recurrenceEndDates[descriptionIndex]
                                                                                ? moment(recurrenceEndDates[descriptionIndex]).format('h:mm A')
                                                                                : formatEndTime(dateValue)}
                                                                        </IonText>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {isBaseDate && !baseDescriptionExpanded && content && (
                                                                <IonText color="medium">
                                                                    <p style={{ marginTop: "8px" }}>{content}</p>
                                                                </IonText>
                                                            )}
                                                            {isBaseDate && baseDescriptionExpanded && (
                                                                <div style={{ marginTop: "8px" }}>
                                                                    <IonTextarea
                                                                        value={content ?? ""}
                                                                        placeholder="Defaults to the main description unless you change it"
                                                                        autoGrow
                                                                        onIonChange={(event) => {
                                                                            setContent(event.detail.value ?? "");
                                                                        }}
                                                                    />
                                                                    <IonButton
                                                                        fill="clear"
                                                                        onClick={() => setContent("")}
                                                                    >
                                                                        Clear
                                                                    </IonButton>
                                                                </div>
                                                            )}
                                                            {!isBaseDate && expandedDescriptions[descriptionIndex] && (
                                                                <div style={{ marginTop: "8px" }}>
                                                                    <IonTextarea
                                                                        value={recurrenceDescriptions[descriptionIndex] ?? ""}
                                                                        placeholder="Defaults to the main description unless you change it"
                                                                        autoGrow
                                                                        onIonChange={(event) => {
                                                                            const nextDescriptions = [...recurrenceDescriptions];
                                                                            nextDescriptions[descriptionIndex] = event.detail.value ?? "";
                                                                            setRecurrenceDescriptions(nextDescriptions);
                                                                        }}
                                                                    />
                                                                    <IonButton
                                                                        fill="clear"
                                                                        onClick={() => {
                                                                            const nextDescriptions = [...recurrenceDescriptions];
                                                                            nextDescriptions[descriptionIndex] = "";
                                                                            setRecurrenceDescriptions(nextDescriptions);
                                                                        }}
                                                                    >
                                                                        Clear
                                                                    </IonButton>
                                                                </div>
                                                            )}
                                                            {!isBaseDate && expandedExternalLinks[descriptionIndex] && (
                                                                <div style={{ marginTop: "8px" }}>
                                                                    <IonInput
                                                                        value={recurrenceExternalLinks[descriptionIndex] ?? link ?? ""}
                                                                        placeholder="Add a link for this date (optional)"
                                                                        onIonChange={(event) => {
                                                                            const nextLinks = [...recurrenceExternalLinks];
                                                                            nextLinks[descriptionIndex] = event.detail.value ?? "";
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
                                        {canUseRecurring && recurrenceType === "custom" && (
                                            <>
                                                {recurrenceCustomDates.map((dateValue, index) => (
                                                    <IonItem color="white" lines="none" key={`custom-date-${index}`}>
                                                        <IonLabel position="stacked">Extra date {index + 1}</IonLabel>
                                                    <IonInput
                                                        type="datetime-local"
                                                        step="900"
                                                        value={dateValue}
                                                        onIonInput={(e) => {
                                                            const nextDates = [...recurrenceCustomDates];
                                                            nextDates[index] = normalizeDatetime(e.detail.value ?? "");
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
                                                            : "";
                                                        return (
                                                            <IonInput
                                                                type="datetime-local"
                                                                step="900"
                                                                value={recurrenceEndDates[index] || fallbackEnd}
                                                                onIonInput={(e) => {
                                                                    const nextEnds = [...recurrenceEndDates];
                                                                    nextEnds[index] = normalizeDatetime(e.detail.value ?? "");
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
                                                    {baseDurationMinutes > 0 && dateValue && (
                                                        <IonText color="medium" style={{ marginTop: "6px" }}>
                                                            Ends at {recurrenceEndDates[index]
                                                                ? moment(recurrenceEndDates[index]).format('h:mm A')
                                                                : formatEndTime(dateValue)}
                                                        </IonText>
                                                    )}
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <IonButton
                                                            fill="clear"
                                                            onClick={() =>
                                                                setExpandedDescriptions((prev) => ({ ...prev, [index]: !prev[index] }))
                                                            }
                                                        >
                                                            {expandedDescriptions[index] ? "Hide edit" : "Edit description"}
                                                        </IonButton>
                                                        <IonButton
                                                            fill="clear"
                                                            onClick={() =>
                                                                setExpandedExternalLinks((prev) => ({ ...prev, [index]: !prev[index] }))
                                                            }
                                                        >
                                                            {expandedExternalLinks[index] ? "Hide link" : "Edit link"}
                                                        </IonButton>
                                                        <IonButton
                                                            fill="clear"
                                                            onClick={() => {
                                                                const nextDescriptions = [...recurrenceDescriptions];
                                                                nextDescriptions[index] = "";
                                                                setRecurrenceDescriptions(nextDescriptions);
                                                            }}
                                                        >
                                                            Clear
                                                        </IonButton>
                                                    </div>
                                                    {expandedDescriptions[index] && (
                                                        <IonTextarea
                                                            value={recurrenceDescriptions[index] ?? ""}
                                                            placeholder="Defaults to the main description unless you change it"
                                                            autoGrow
                                                            onIonChange={(event) => {
                                                                const nextDescriptions = [...recurrenceDescriptions];
                                                                nextDescriptions[index] = event.detail.value ?? "";
                                                                setRecurrenceDescriptions(nextDescriptions);
                                                            }}
                                                        />
                                                    )}
                                                    {expandedExternalLinks[index] && (
                                                        <IonInput
                                                            value={recurrenceExternalLinks[index] ?? link ?? ""}
                                                            placeholder="Add a link for this date (optional)"
                                                            onIonChange={(event) => {
                                                                const nextLinks = [...recurrenceExternalLinks];
                                                                nextLinks[index] = event.detail.value ?? "";
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
                                                <IonItem color="white" lines="none">
                                                    <IonButton
                                                        fill="outline"
                                                        onClick={() => {
                                                            if (recurrenceCustomDates.length < maxCustomDates) {
                                                                setRecurrenceCustomDates([...recurrenceCustomDates, ""]);
                                                            }
                                                        }}
                                                        disabled={recurrenceCustomDates.length >= maxCustomDates}
                                                    >
                                                        Add another date
                                                    </IonButton>
                                                    <IonText color="medium" style={{ marginLeft: "12px" }}>
                                                        {recurrenceCustomDates.length}/{maxCustomDates} extra dates
                                                    </IonText>
                                                </IonItem>
                                            </>
                                        )}
                                        {recurrenceErrors.length > 0 && (
                                            <IonItem color="white" lines="none">
                                                <IonText color="danger">{recurrenceErrors[0]}</IonText>
                                            </IonItem>
                                        )}
                                    </IonCard>
                                )}

                                {/* Submit Button */}

                                <IonItem color="white">
                                    <IonLabel class="ion-text-wrap">
                                        Moderators may make small edits (spelling, capitalization) for clarity and accessibility. If further edits are necessary to meet guidelines or if there are questions, moderators will provide an explanation or edit for you to approve in your Submissions (Me tab &gt; Activity).
                                    </IonLabel>
                                </IonItem>
                                <IonItem color="white">
                                    <IonCheckbox
                                        checked={ackEmail}
                                        onIonChange={(e) => setAckEmail(e.detail.checked)}
                                        labelPlacement="end"
                                        className="createpostcheckbox"
                                    > <IonLabel>I understand.</IonLabel>
                                    </IonCheckbox>
                                </IonItem>

                                {(issues.length > 0 || hasPii || mentionsPaymentHandle || hasBlockedLinks || mentionsOneToOne) && (
                                    <IonRow className="ion-padding ion-text-center">
                                        <IonText color="danger">
                                            {issues.map((msg, i) => (
                                                <p key={i} style={{ margin: 0 }}>{msg}</p>
                                            ))}
                                        </IonText>
                                        {hasPii && (
                                            <p className="ion-text-center" style={{ color: "var(--ion-color-danger" }}>
                                                Posts cannot contain private personal contact information. Please remove details like phone numbers or emails before submitting.
                                                <ContactDetailsPopover />
                                            </p>
                                        )}
                                        {mentionsPaymentHandle && (
                                            <p className="ion-text-center" style={{ color: "var(--ion-color-danger" }}>
                                                Reminder: Requests for payment are only allowed for COVID conscientious events or verified charities on official platforms that provide receipts (personal Venmos, CashApp, etc. cannot be approved).
                                            </p>
                                        )}
                                        {hasShortenedLinkInContent || hasShortenedLinkInLinkField ? (
                                            <p className="ion-text-center" style={{ color: "var(--ion-color-danger" }}>
                                                Link shorteners aren't allowed. Please use the full link so members can see where they're clicking.
                                            </p>
                                        ) : null}
                                        {hasGoogleDocLinkInContent || hasGoogleDocLinkInLinkField ? (
                                            <p className="ion-text-center" style={{ color: "var(--ion-color-danger" }}>
                                                This link isn’t allowed. It may expose or track viewers or collect data in without a clear privacy policy.
                                            </p>
                                        ) : null}
                                        {mentionsOneToOne ? (
                                            <p className="ion-text-center" style={{ color: "var(--ion-color-medium" }}>
                                                Reminder: The Refreshments Bar is for open discussion. If you're looking for 1:1 connections, use Picks and filters!
                                            </p>
                                        ) : null}
                                    </IonRow>
                                )}



                                {/* Errors */}
                                {nonInlineErrors && nonInlineErrors.length > 0 && (
                                    <IonCard color="danger" className="ion-padding">
                                        {nonInlineErrors.map((message, index) => (
                                            <IonText key={index}><p>{message}</p></IonText>
                                        ))}
                                    </IonCard>
                                )}


                                <IonButton expand="block" style={{ marginBottom: "30pt" }} className="ion-margin-top" type="submit" disabled={afterSendWait || imageLoading || formInvalid || hasPii || hasBlockedLinks || !ackEmail}>
                                    Submit Post
                                </IonButton>
                            </>
                        }


                        </form>
                        <IonAlert
                            isOpen={!!eventWarning}
                            header="Incomplete event details"
                            message={`You chose "Event" but did not fill all required event fields (${eventWarning?.join(', ')}). The post will still be submitted, but we won't create a calendar entry until moderators review it.`}
                            buttons={[
                            {
                                text: 'Cancel',
                                role: 'cancel',
                                handler: () => setEventWarning(null)
                            },
                            {
                                text: 'Submit post anyway',
                                handler: () => {
                                    setEventWarning(null);
                                    handlePostSubmit(undefined, true);
                                }
                            }
                        ]}
                        />
                        <IonAlert
                            isOpen={showRecurringUpgrade}
                            header="Recurring events"
                            message="Join Community+ or Pro to post recurring events."
                            buttons={[
                                {
                                    text: "OK",
                                    handler: () => setShowRecurringUpgrade(false)
                                }
                            ]}
                            onDidDismiss={() => setShowRecurringUpgrade(false)}
                        />
                    </>
                ) :
                    !isMoreThanTwoWeeksOld(globalCurrentProfile?.registrationDate) ?
                        <IonCard color="white" className="ion-padding ion-text-center">
                            <IonText className="ion-text-center"><p>Your account needs to be at least 2 weeks old to submit a post. </p>
                                <p>Or become a Community+ or Pro member to submit a post now.</p>
                            </IonText>
                            <IonButton onClick={() => router.push("/store")}>Upgrade</IonButton>
                        </IonCard>
                        :
                        limits?.posts_submitted >= 2 ?
                            <IonCard color="white" className="ion-padding ion-text-center">
                                <IonText className="ion-text-center"><p>You've already submitted 2 posts this month.</p> <p>Increase your streak or get Community+ or Refresh Pro to submit more posts now.</p></IonText>
                                <IonButton onClick={() => router.push("/store")}>Upgrade</IonButton>
                            </IonCard>
                            :
                            <IonCard color="white" className="ion-padding ion-text-center">
                                <IonText className="ion-text-center">Something went wrong and you can't submit a post right now.</IonText>
                            </IonCard>
                }
            </IonContent>

        </IonPage>
    )
};

export default CreatePostModal;
