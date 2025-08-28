import { IonButton, IonButtons, IonCard, IonCardTitle, IonCheckbox, IonCol, IonContent, IonDatetime, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonNote, IonPage, IonRow, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar, useIonModal } from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import CroppedImageModal from './CroppedImageModal';

import { getCurrentUserProfile, onImgError, updateCurrentUserProfile, uploadPhoto } from '../hooks/utilities';
import moment from 'moment';

import "./ProfileCreationModal.css"

import { chevronBackOutline } from 'ionicons/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/pro-solid-svg-icons/faPenToSquare';
import CaptionsSelect from './CaptionsSelect';


interface Hi {
    pronouns?: string,
    gender?: string,
    bio?: string,
    birth_date?: string,
    location?: string,
    job?: string,
    politics?: string,
    zip_code?: string,
    school?: string,
    sexualOrientation?: string,
    hometown?: string,
    height?: string,
    alcohol?: string,
    cigarettes?: string,
    created_profile?: boolean,
    looking_for?: string[],
    covid_precautions?: number[]
}

type Props = {
    onDismiss: () => void;
};

const ProfileCreationModal: React.FC<Props> = (props) => {

    const { onDismiss } = props;

    const [data, setData] = useState<any>(null);
    const [dataLen, setDataLen] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<null | string>(null);
    const [index, setIndex] = useState(0);

    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [image, setImage] = useState<any>(null);
    const [imageName, setImageName] = useState<string | null>(null);
    const [picDb, setPicDB] = useState<any>(null);

    const [lookingFor, setLookingFor] = useState<string[]>([]);
    const [covidPrecautions, setCovidPrecautions] = useState<number[]>([]);


    //   const [submitData, setSubmitData] = useState<hi | null>(null);

    const [bio, setBio] = useState("");
    const [birthday, setBirthday] = useState("");
    const [pronouns, setPronouns] = useState("");
    const [gender, setGender] = useState("");
    const [location, setLocation] = useState("");
    const [zipcode, setZipcode] = useState("");
    const [job, setJob] = useState("");
    const [politics, setPolitics] = useState("");
    const [school, setSchool] = useState("");
    const [sexualOrientation, setSexualOrientation] = useState("");
    const [hometown, setHometown] = useState("");
    const [height, setHeight] = useState("");
    const [heightFeet, setHeightFeet] = useState("");
    const [heightInches, setHeightInches] = useState("");
    const [alcohol, setAlcohol] = useState("");
    const [cigarettes, setCigarettes] = useState("");



    useEffect(() => {

        setLoading(true); // set loading to true

        const fetchData = async () => {
            setError(null);
            setLoading(true);
            try {
                setData(await getCurrentUserProfile());
                setLoading(false);
            } catch (error: any) {
                setError(error.message);
                setLoading(false)
                console.log("error", error)
            }

        }

        fetchData();
    }, []);


    function updateData() {
        let form_data: Hi = {};

        if (pronouns) {
            form_data.pronouns = pronouns
        }
        if (bio) {
            form_data.bio = bio
        }
        if (birthday) {
            form_data.birth_date = birthday
        }
        if (gender) {
            form_data.gender = gender
        }
        if (location) {
            form_data.location = location
        }
        if (zipcode) {
            form_data.zip_code = zipcode
        }
        if (job) {
            form_data.job = job
        }
        if (politics) {
            form_data.politics = politics
        }
        if (school) {
            form_data.school = school
        }
        if (sexualOrientation) {
            form_data.sexualOrientation = sexualOrientation
        }
        if (hometown) {
            form_data.hometown = hometown
        }
        if (heightFeet || heightInches) {
            form_data.height = heightFeet + "'" + heightInches
        }
        if (alcohol) {
            form_data.alcohol = alcohol
        }
        if (cigarettes) {
            form_data.cigarettes = cigarettes
        }
        if (lookingFor) {
            form_data.looking_for = lookingFor
        }
        if (covidPrecautions) {
            form_data.covid_precautions = covidPrecautions
        }

        form_data.created_profile = true

        return form_data;
    }


    const updatePhoto = async (ev: any, pic_db: string) => {

        const photo = ev.target.files[0];

        const photo2 = URL.createObjectURL(photo)

        setImage(photo2)
        setPicDB(pic_db)
        setImageName(photo.name)
        cropPresent();
    }

    const delay = (ms: any) => new Promise(res => setTimeout(res, ms));

    const updateProfile = async (e: any) => {

        e.preventDefault();

        // pass form data in here
        const response = await updateCurrentUserProfile(updateData())

        setData(await getCurrentUserProfile())

        await delay(3000);

        onDismiss()
    }

    //Adds the checkedbox to the array and check if you unchecked it
    const addCovidPrecautionsCheckbox = (event: any) => {
        if (event.detail.checked) {
            const newArray = [...covidPrecautions, event.detail.value]
            setCovidPrecautions(newArray)
        } else {
            setCovidPrecautions(covidPrecautions.filter(a => a != event.detail.value))
        }
    }


    //Adds the checkedbox to the array and check if you unchecked it
    const addLookingForCheckbox = (event: any) => {
        if (event.detail.checked) {
            const newArray = [...lookingFor, event.detail.value]
            setLookingFor(newArray)

        } else {
            setLookingFor(lookingFor.filter(a => a != event.detail.value))
        }
    }

    const eighteenYearsAtLeast = () => {
        var date = new Date();
        const year = date.getFullYear();
        date.setFullYear(year - 18);
        const stringDate: string = moment(date).format('YYYY-MM-DD')
        return stringDate

    }

    const handleCropDismiss = async () => {
        cropDismiss()
        console.log("Waiting 3 seconds to reload image ")
        await delay(3000);
        setData(await getCurrentUserProfile())
    }


    const [cropPresent, cropDismiss] = useIonModal(CroppedImageModal, {
        image: image,
        picDb: picDb,
        imageName: imageName,
        onDismiss: handleCropDismiss
    });

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="modal-title">
                    <IonButtons slot="start" onClick={onDismiss}>
                        <IonIcon slot="icon-only" color="primary" icon={chevronBackOutline}></IonIcon>
                    </IonButtons>
                    <IonTitle>Create your profile</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <form className="ion-padding" onSubmit={updateProfile}>
                    <IonNote>You will NOT be able to change these after you have created your profile. They will not be shown on your profile.</IonNote>
                    <IonList inset={true} className="prof-creation">
                        <IonItem>
                            <IonLabel position="stacked">Birthday</IonLabel>
                            <IonNote>Used to determine your age which will be shown.</IonNote>
                            <IonInput
                                value={birthday}
                                name="birthday"
                                placeholder=""
                                max={eighteenYearsAtLeast()}
                                onIonInput={e => setBirthday(e.detail.value!)}
                                type="date" />
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Gender</IonLabel>
                            <IonNote>Used for potential connections to filter based on preference.</IonNote>
                            <IonSelect onIonChange={e => setGender(e.detail.value!)}>
                                <IonSelectOption value="man">man</IonSelectOption>
                                <IonSelectOption value="woman">woman</IonSelectOption>
                                <IonSelectOption value="nonbinary">nonbinary</IonSelectOption>
                            </IonSelect>
                        </IonItem>
                        <IonItem >
                            <IonLabel position="stacked">Zipcode</IonLabel>
                            <IonNote>Used to filter based on location.</IonNote>
                            <IonInput value={zipcode}
                                name="zipcode"
                                required={true}
                                placeholder="#####"
                                maxlength={5}
                                inputmode="numeric"
                                pattern="\d{5}"
                                onIonInput={e => setZipcode(e.detail.value!)}
                                type="text" />
                            counter
                        </IonItem>
                    </IonList>

                    <IonNote>You will be able to change the following fields later. Fill them out now just to get your profile started.</IonNote>
                    <IonList inset={true} className="prof-creation ">
                        <IonItem >
                            <IonLabel position="stacked">Location</IonLabel>
                            <IonInput value={location}
                                name="location"
                                required={true}
                                onIonInput={e => setLocation(e.detail.value!)}
                                maxlength={30}
                                counter
                                type="text" />
                        </IonItem>
                        <IonItem >
                            <IonLabel position="stacked">Job</IonLabel>
                            <IonInput value={job}
                                name="job"
                                required={true}
                                onIonInput={e => setJob(e.detail.value!)}
                                placeholder=""
                                maxlength={30}
                                counter
                                type="text" />
                        </IonItem>
                        <IonItem >
                            <IonLabel position="stacked">Politics</IonLabel>
                            <IonInput value={politics}
                                name="politics"
                                onIonInput={e => setPolitics(e.detail.value!)}
                                placeholder=""
                                maxlength={30}
                                counter
                                type="text" />
                        </IonItem>
                        <IonItem >
                            <IonLabel position="stacked">School</IonLabel>
                            <IonInput value={school}
                                name="school"
                                onIonInput={e => setSchool(e.detail.value!)}
                                placeholder=""
                                maxlength={30}
                                counter
                                type="text" />
                        </IonItem>
                        {/* <IonItem>
                        <IonLabel position="floating">Sexual Orientation</IonLabel>
                        <IonInput value={sexualOrientation}
                            name="sexualOrientation"
                            onIonChange={e => setSexualOrientation(e.detail.value!)}
                            placeholder=""
                            type="text" />
                    </IonItem> */}
                        <IonItem >
                            <IonLabel position="stacked">Hometown</IonLabel>
                            <IonInput value={hometown}
                                name="hometown"
                                onIonInput={e => setHometown(e.detail.value!)}
                                placeholder=""
                                maxlength={30}
                                counter
                                type="text" />
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Height (Feet)</IonLabel>
                            <IonSelect onIonChange={e => setHeightFeet(e.detail.value!)}>
                                <IonSelectOption value="3">3</IonSelectOption>
                                <IonSelectOption value="4">4</IonSelectOption>
                                <IonSelectOption value="5">5</IonSelectOption>
                                <IonSelectOption value="6">6</IonSelectOption>
                                <IonSelectOption value="7">7</IonSelectOption>
                            </IonSelect>
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Height (Inches)</IonLabel>
                            <IonSelect onIonChange={e => setHeightInches(e.detail.value!)}>
                                <IonSelectOption value="0">0</IonSelectOption>
                                <IonSelectOption value="1">1</IonSelectOption>
                                <IonSelectOption value="2">2</IonSelectOption>
                                <IonSelectOption value="3">3</IonSelectOption>
                                <IonSelectOption value="4">4</IonSelectOption>
                                <IonSelectOption value="5">5</IonSelectOption>
                                <IonSelectOption value="6">6</IonSelectOption>
                                <IonSelectOption value="7">7</IonSelectOption>
                                <IonSelectOption value="8">8</IonSelectOption>
                                <IonSelectOption value="9">9</IonSelectOption>
                                <IonSelectOption value="10">10</IonSelectOption>
                                <IonSelectOption value="11">11</IonSelectOption>
                            </IonSelect>
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Looking For</IonLabel>
                            <IonList lines="none">
                                <IonItem>
                                    <IonCheckbox slot="start" value="friendship" onIonChange={e => addLookingForCheckbox(e)} />
                                    Friendships
                                </IonItem>
                                <IonItem>
                                    <IonCheckbox slot="start" value="romance" onIonChange={e => addLookingForCheckbox(e)} />
                                    Romance
                                </IonItem>
                                <IonItem>
                                    <IonCheckbox slot="start" value="virtual connection" onIonChange={e => addLookingForCheckbox(e)} />
                                    Virtual Connection
                                </IonItem>
                                <IonItem>
                                    <IonCheckbox slot="start" value="virtual only" onIonChange={e => addLookingForCheckbox(e)} />
                                    Virtual Connection Only
                                </IonItem>
                                <IonItem>
                                    <IonCheckbox slot="start" value="job" onIonChange={e => addLookingForCheckbox(e)} />
                                    Job
                                </IonItem>
                                <IonItem>
                                    <IonCheckbox slot="start" value="roommate" onIonChange={e => addLookingForCheckbox(e)} />
                                    Roommate
                                </IonItem>
                                <IonItem>
                                    <IonCheckbox slot="start" value="housing" onIonChange={e => addLookingForCheckbox(e)} />
                                    Housing
                                </IonItem>
                            </IonList>
                        </IonItem>
                        <IonItem>
                            <IonLabel position="stacked">Covid Precautions</IonLabel>
                            <IonList lines="none">
                                <IonItem>
                                    <IonCheckbox slot="start" value={1} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                    I work from home
                                </IonItem>
                                <IonItem>
                                    <IonCheckbox slot="start" value={2} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                    I eat outside at restaurants
                                </IonItem>
                                <IonItem>
                                    <IonCheckbox slot="start" value={3} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                    I have non-covid cautious roommates / live-in family members
                                </IonItem>
                                <IonItem>
                                    <IonCheckbox slot="start" value={4} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                    I'm immunocompromised
                                </IonItem>
                                <IonItem>
                                    <IonCheckbox slot="start" value={5} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                    I attend outdoor events, concerts, crowds, etc.
                                </IonItem>
                                <IonItem>
                                    <IonCheckbox slot="start" value={6} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                    I attend events, concerts, crowds, etc with a mask on
                                </IonItem>
                                <IonItem>
                                    <IonCheckbox slot="start" value={7} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                    I only leave home / outdoors for medically necessary reasons
                                </IonItem>
                                <IonItem>
                                    <IonCheckbox slot="start" value={8} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                    I live alone / with other people with shared levels of covid precaution
                                </IonItem>
                                <IonItem>
                                    <IonCheckbox slot="start" value={9} onIonChange={e => addCovidPrecautionsCheckbox(e)} />
                                    I go to work / school but I wear a quality mask the whole time
                                </IonItem>
                            </IonList>
                        </IonItem>
                        <IonItem >
                            <IonLabel position="stacked">Bio</IonLabel>
                            <IonTextarea value={bio}
                                name="bio"
                                onIonChange={e => setBio(e.detail.value!)}
                                placeholder=""
                                autoGrow={true}
                                maxlength={400}
                                counter
                            />
                        </IonItem>
                        <IonGrid className="picture-grid">
                            <IonRow>
                                <IonCol size="5">
                                    <div style={{ alignItems: "center", display: "flex" }}>
                                        {data && data.pic1_main !== null ?
                                            <img alt="Picture 1" src={data.pic1_main} onError={(e) => onImgError(e)} />
                                            : <img alt="Picture 1 null" src={"../static/img/null.png"} />
                                        }
                                        <label className="custom-file-upload">
                                            <input type="file" accept="image/*" onChange={(ev) => updatePhoto(ev, "pic1_main")} />
                                            <i className="fa fa-cloud-upload"></i>
                                            <FontAwesomeIcon icon={faPenToSquare} />
                                        </label>
                                    </div>
                                </IonCol>
                                <IonCol size="7" className="col-right-padding">
                                </IonCol>
                            </IonRow>
                            <IonRow>
                                <IonCol size="5">
                                    <div style={{ alignItems: "center", display: "flex" }}>
                                        {data && data.pic2 !== null ?
                                            <img alt="Picture 1" src={data.pic2} onError={(e) => onImgError(e)} />
                                            : <img alt="Picture 1 null" src={"../static/img/null.png"} />
                                        }
                                        <label className="custom-file-upload">
                                            <input type="file" accept="image/*" onChange={(ev) => updatePhoto(ev, "pic2")} />
                                            <i className="fa fa-cloud-upload"></i>
                                            <FontAwesomeIcon icon={faPenToSquare} />
                                        </label>
                                    </div>
                                </IonCol>
                                <IonCol size="7" className="col-right-padding">
                                    <CaptionsSelect picture="pic2_caption" current_caption={data && data.pic2_caption ? data.pic2_caption : null} />
                                </IonCol>
                            </IonRow>
                            <IonRow>
                                <IonCol size="5">
                                    <div style={{ alignItems: "center", display: "flex" }}>
                                        {data && data.pic3 !== null ?
                                            <img alt="Picture 1" src={data.pic3} onError={(e) => onImgError(e)} />
                                            : <img alt="Picture 1 null" src={"../static/img/null.png"} />
                                        }
                                        <label className="custom-file-upload">
                                            <input type="file" accept="image/*" onChange={(ev) => updatePhoto(ev, "pic3")} />
                                            <i className="fa fa-cloud-upload"></i>
                                            <FontAwesomeIcon icon={faPenToSquare} />
                                        </label>
                                    </div>
                                </IonCol>
                                <IonCol size="7" className="col-right-padding">
                                    <CaptionsSelect picture="pic3_caption" current_caption={data && data.pic3_caption ? data.pic3_caption : null} />
                                </IonCol>
                            </IonRow>
                        </IonGrid>
                    </IonList>
                    {/* <IonItem>
                <IonLabel position="floating">Alcohol</IonLabel>
                <IonSelect onIonChange={e => setAlcohol(e.detail.value!)}>
                    <IonSelectOption value="Yes">Yes</IonSelectOption>
                    <IonSelectOption value="Sometimes">Sometimes</IonSelectOption>
                    <IonSelectOption value="Rarely">Rarely</IonSelectOption>
                    <IonSelectOption value="Rarely">No</IonSelectOption>
                </IonSelect>
            </IonItem>
            <IonItem>
                <IonLabel position="floating">Cigarettes</IonLabel>
                <IonSelect onIonChange={e => setCigarettes(e.detail.value!)}>
                    <IonSelectOption value="Yes">Yes</IonSelectOption>
                    <IonSelectOption value="Sometimes">Sometimes</IonSelectOption>
                    <IonSelectOption value="Rarely">Rarely</IonSelectOption>
                    <IonSelectOption value="No">No</IonSelectOption>

                </IonSelect>
            </IonItem> */}
                    <IonButton type="submit" className="ion-margin-top profile-save-button" expand="block">
                        Save information and create your profile
                    </IonButton>
                </form>
            </IonContent>
        </IonPage>
    );

};

export default ProfileCreationModal;
