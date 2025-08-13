import React, { useRef, useState } from "react";
import { IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, IonInput, IonButton, IonItem, IonButtons, IonNote, IonAlert, IonPage, IonTextarea, IonSelect, IonSelectOption, useIonModal, IonCol, IonGrid, IonRow, IonText, IonCheckbox, IonCard } from '@ionic/react';
import Cookies from 'js-cookie';

import './CreatePostModal.css'
import { announcementUploadPhoto, createAnnouncement, isCommunityPlus } from "../hooks/utilities";
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


type Props = {
    preferred_name: string,
    username: string,
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

    const { preferred_name, username, onDismiss } = props;

    const modal = useRef<HTMLIonModalElement>(null);

    const limits = useGetLimits().data
    const siteSettings = useGetSiteSettings().data
    const currentStreak = useGetCurrentStreak().data;

    const { data: globalCurrentProfile, isLoading: globalIsLoading } = useGetGlobalAppCurrentProfile();


    console.log("limits", limits)

    const [title, setTitle] = useState("");
    const [byline, setByline] = useState<string | null>(null);
    const [bar, setBar] = useState<string | null>(null);

    const [link, setLink] = useState<string | null>(null);
    const [content, setContent] = useState<string | null>(null);
    const [coverPhotoAlt, setCoverPhotoAlt] = useState<string | null>(null);

    const [sensitiveContent, setSensitiveContent] = useState<boolean>(false);
    const [sensitiveDescription, setSensitiveDescription] = useState<string>("");

    const [includeProfile, setIncludeProfile] = useState<boolean>(false)
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

    // const [poll, setPoll] = useState<boolean>(false);





    const [image, setImage] = useState<any>(null);
    const [imageName, setImageName] = useState<string | null>(null);
    const [picDb, setPicDB] = useState<any>(null);

    const [croppedBlob, setCroppedBlob] = useState<any>(null);



    const [imageDataToUpload, setImageDataToUpload] = useState<any>(null);

    const [showAlert, setShowAlert] = useState(false)

    const [presentCitySelector, dismissCitySelector] = useIonModal(CitySelectorModal, {
        onDismiss: async (selectedCity?: {name: string, lat: number, lng: number}) => {
          if (selectedCity) {
            console.log('Selected city:', selectedCity);
            setLocation(selectedCity.name)
            setLocationLabel(selectedCity.name)
            setLat(selectedCity.lat)
            setLong(selectedCity.lng)
          }
          dismissCitySelector();
        }
      });

    function postSubmitSuccessful() {
        onDismiss();
    }

    function formData() {
        const form_data: Post = {}
        console.log("Sensitive", sensitiveContent)
        console.log("include prof", includeProfile)
        console.log("formdata", form_data)


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


    async function handlePostSubmit(e: any) {
        e.preventDefault();
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
                    subHeader="Make sure to check your email for possible questions."
                    buttons={['OK']}
                />
                {siteSettings?.allow_free_users_to_submit_posts &&
                    <IonCard className="ion-padding limited ion-text-center">
                        <IonText color="navy"><span style={{ fontWeight: "bold", fontSize: "15pt" }}>We're trying something out!</span></IonText>
                        <p style={{ fontWeight: "bold", fontSize: "20pt" }}><FontAwesomeIcon icon={faTimer} /></p>
                        <p>For a limited time, all users can submit up to 2 posts a month{!isMoreThanTwoWeeksOld(globalCurrentProfile?.registrationDate) ? " once your account is at least two weeks old" : ""}.</p>
                        <IonText color="medium"><FontAwesomeIcon icon={faStar} /> No limits for Community+ and Pro users. All post submissions are still subject to our <a href="https://www.refreshconnections.com/faqs#post">Refreshments post requirements</a>.</IonText>
                    </IonCard>}
                {isCommunityPlus(globalCurrentProfile?.subscription_level) || (currentStreak?.streak_count >= 5) || (limits?.posts_submitted < 2 && isMoreThanTwoWeeksOld(globalCurrentProfile?.registrationDate)) ?
                    <form onSubmit={handlePostSubmit}>

                        {/* Title */}
                        <IonCard>
                            <IonItem color="white" lines="none">
                                <IonLabel position="stacked">Title*</IonLabel>
                                <IonInput
                                    value={title}
                                    name="title"
                                    placeholder="Required"
                                    onIonChange={e => setTitle(e.detail.value!)}
                                    type="text"
                                    autoCapitalize='words'
                                />
                            </IonItem>
                            <IonItem color="white" lines="none">
                                <IonLabel position="stacked">Byline*</IonLabel>
                                <IonSelect value={byline} placeholder="(Who wrote the post)" onIonChange={(e) => setByline(e.detail.value)}>
                                    {username && <IonSelectOption value={username}>{username}</IonSelectOption>}
                                    <IonSelectOption value={preferred_name}>{preferred_name}</IonSelectOption>
                                    <IonSelectOption value="Anonymous">Anonymous</IonSelectOption>
                                </IonSelect>
                            </IonItem>
                        </IonCard>

                        {/* Local Post */}
                        <IonCard >
                            <IonItem color="white" lines="none">
                                <IonCheckbox slot="start" checked={local} onIonChange={e => setLocal(e.detail.checked)} />
                                <IonLabel className="ion-text-wrap">Local Post <p style={{ color: "var(--ion-color-medium)" }}>Check if your post is tied to a location.</p></IonLabel>
                            </IonItem>

                            {local && (
                                <>
                                <IonItem button color="white" lines="none" onClick={()=>presentCitySelector()}>
                                    <IonLabel position="stacked">Nearby City</IonLabel>
                                    <IonInput value={location} placeholder="Click to select"/>
                                </IonItem>
                                <IonItem color="white" lines="none">
                                    <IonLabel position="stacked" className="ion-text-wrap"><p>Location label</p>{location && <p style={{color: "var(--ion-color-medium"}}>Change this if you'd like the post to show something different than the city (like a post for a whole state or region)</p>}</IonLabel>
                                    <IonInput value={locationLabel} onIonChange={e => setLocationLabel(e.detail.value!)}
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
                                    <IonSelectOption value="housing" disabled={!local}>Housing</IonSelectOption>
                                    <IonSelectOption value="events" disabled={!local}>Event</IonSelectOption>
                                    <IonSelectOption value="recommendations" disabled={!local}>Local Recommendations</IonSelectOption>
                                </IonSelect>
                            </IonItem>
                        </IonCard>

                        {title && byline && bar &&
                            <>
                                {/* Post Content */}
                                <IonCard >
                                    <IonItem color="white" lines="none">
                                        <IonLabel position="stacked">Post Content*</IonLabel>
                                        <IonTextarea
                                            value={content}
                                            autoGrow
                                            maxlength={1000}
                                            style={{ minHeight: "120px" }}
                                            placeholder="Write your post here..."
                                            onIonChange={e => setContent(e.detail.value!)}
                                        />
                                    </IonItem>
                                </IonCard>

                                {/* Options */}
                                <IonCard >
                                    <IonItem color="white" lines="full">
                                        <IonCheckbox slot="start" checked={includeProfile} onIonChange={e => setIncludeProfile(e.detail.checked)} disabled={byline === "Anonymous"} />
                                        <IonLabel className="ion-text-wrap">Show Profile <p style={{ color: "var(--ion-color-medium)" }}>Visible only if Connect from Refreshments is enabled.</p></IonLabel>
                                    </IonItem>

                                    <IonItem color="white" lines="full">
                                        <IonCheckbox slot="start" checked={sensitiveContent} onIonChange={e => setSensitiveContent(e.detail.checked)} />
                                        <IonLabel className="ion-text-wrap">Sensitive Content <p style={{ color: "var(--ion-color-medium)" }}>Check if your post needs a content warning.</p></IonLabel>
                                    </IonItem>

                                    {sensitiveContent &&
                                        <IonItem color="white" lines="none">
                                        <IonLabel position="stacked">Sensitivity description (optional)</IonLabel>
                                        <IonTextarea
                                            value={sensitiveDescription}
                                            name="sensitive description"
                                            placeholder="Add suggested content warnings here."
                                            onIonChange={e => setSensitiveDescription(e.detail.value!)}
                                            rows={3}
                                        />
                                    </IonItem>
                                    }

                                    {(bar === "mingle" || bar === "families") && (
                                        <IonItem color="white">
                                            <IonCheckbox slot="start" checked={requestSupportive} onIonChange={e => setRequestSupportive(e.detail.checked)} />
                                            <IonLabel className="ion-text-wrap">Request Supportive Comments Only</IonLabel>
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
                                            onIonChange={e => setLink(e.detail.value!)}
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
                                                onIonChange={e => setCoverPhotoAlt(e.detail.value!)}
                                            />
                                        </IonItem>}
                                </IonCard>

                                {/* Errors */}
                                {errors && errors.length > 0 && (
                                    <IonCard color="danger" className="ion-padding">
                                        {errors.map((message, index) => (
                                            <IonText key={index}><p>{message}</p></IonText>
                                        ))}
                                    </IonCard>
                                )}

                                {/* Submit Button */}

                                {(!title || !content || !byline || !bar) &&
                                    <IonRow className="ion-padding ion-text-center">
                                        <IonNote className="ion-text-center">Please make sure all required sections have been filled out.</IonNote>
                                    </IonRow>
                                }

                                <IonButton expand="block" style={{marginBottom: "30pt"}} className="ion-margin-top" type="submit" disabled={afterSendWait || imageLoading || !title || !content || !byline || !bar}>
                                    Submit Post
                                </IonButton>
                            </>
                        }


                    </form>

                    :
                    !isMoreThanTwoWeeksOld(globalCurrentProfile?.registrationDate) ?
                        <IonCard color="white" className="ion-padding ion-text-center">
                            <IonText className="ion-text-center"><p>Your account needs to be at least 2 weeks old to submit a post. </p>
                                <p>Or become a Community+ or Pro member to submit a post now.</p>
                            </IonText>
                            <IonButton href="/store">Upgrade</IonButton>
                        </IonCard>
                        :
                        limits?.posts_submitted >= 2  ?
                            <IonCard color="white" className="ion-padding ion-text-center">
                                <IonText className="ion-text-center"><p>You've already submitted 2 posts this month.</p> <p>Increase your streak or get Community+ or Refresh Pro to submit more posts now.</p></IonText>
                                <IonButton href="/store">Upgrade</IonButton>
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



