import { IonButton, IonCol, IonRow, useIonAlert, useIonModal } from '@ionic/react';
import React, { useState } from 'react'


import { onImgError, updateCurrentUserProfile } from '../hooks/utilities';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Resizer from "react-image-file-resizer";



// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import { faPenToSquare } from '@fortawesome/pro-solid-svg-icons/faPenToSquare';
import { faTrash } from '@fortawesome/pro-solid-svg-icons/faTrash';

import CroppedImageModal from './CroppedImageModal';
import CaptionsSelect from './CaptionsSelect';
import { Camera, CameraResultType } from '@capacitor/camera';
import { decode } from 'base64-arraybuffer';
import { useQueryClient } from '@tanstack/react-query';


interface ContainerProps {
    userid: string;
    dataPic: string;
    dataPicCaption: string;
    picNumber: number;
    updateProfileFunc: any;
    delete_allowed: boolean;
    altText: string | null
}

interface AltObject {
    [key: string]: string;
 }

const EditPhotoGridRow: React.FC<ContainerProps> = ({userid, dataPic, dataPicCaption, picNumber, updateProfileFunc, delete_allowed, altText}) => {
    const queryClient = useQueryClient()

    const [image, setImage] = useState<any>(null);
    const [imageName, setImageName] = useState<string | null>(null);
    const [picDb, setPicDB] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [presentAltAlert] = useIonAlert();
    const [presentPauseAlert] = useIonAlert();

    const [altStatus, setAltStatus] = useState<boolean>(altText == null || altText == ''? false : true);
    const [currAltText, setCurrAltText] = useState(altText)

    const picName = picNumber == 1 ? "pic1_main" : "pic" + picNumber

    const delay = (ms: any) => new Promise(res => setTimeout(res, ms));

    const handleDismiss = async () => {
        setLoading(true)
        cropDismiss()
        await delay(3000)
        await updateProfileFunc()
        setLoading(false)
    }

    const actuallyDelete = async () => {
        setLoading(true)
        var DTO = Object();
        DTO[picName] = null
        await updateCurrentUserProfile(DTO)
        await updateProfileFunc()
        setLoading(false)
    }

    const deleteImage = async () => {
        if ([1,2,3].includes(picNumber)) {
            await deletePauseAlert()
        }
        else {
            await actuallyDelete()
        }
            
    }

    const [cropPresent, cropDismiss] = useIonModal(CroppedImageModal, {
        image: image,
        picDb: picDb,
        imageName: imageName,
        onDismiss: handleDismiss
    });

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
            90,
            0,
            (uri) => {
                setImage(uri)
            },
            "base64"
        );


        setPicDB(pic_db)
        setImageName("pic" + picNumber + ".png")
        cropPresent()

    }

    const addAltTextAlert = async () => {
        presentAltAlert({
            header: 'Add an image description for picture ' + picNumber,
            subHeader: 'This description is used as alt text for users who use screen readers, and shown to all users to better understand your picture.',
            buttons: [
                {
                    text: 'Nevermind',
                    role: 'cancel',

                },
                {
                    text: 'Yes!',
                    role: 'confirm',
                    handler: async (data: any) => {
                        const altField: string = "pic" + picNumber +"_alt"
                        let alt_update: AltObject = {}
                        if (data.description.length > 300) {
                            setCurrAltText(data.description.substring(0,300))
                            alt_update[altField] = data.description.substring(0,300)
                        }
                        else {
                            setCurrAltText(data.description)
                            alt_update[altField] = data.description
                        }
                        await updateCurrentUserProfile(alt_update)
                        setAltStatus(true)
                    },
                },
            ],
            inputs: [
                {
                  name: 'description',
                  type: 'text',
                  placeholder: 'Add alt text',
                  value: currAltText || '',
                },
                
              ],
        })
    }

    const deletePauseAlert = async () => {
        presentPauseAlert({
            header: 'Deleting one of your first 3 photos will pause your profile until you are able to replace it.',
            subHeader: 'You could also choose to replace it now.',
            buttons: [
                {
                    text: 'Nevermind',
                    role: 'cancel',

                },
                {
                    text: 'Replace instead',
                    role: 'confirm',
                    handler: async () => {
                        updatePicture(picName)
                    }
                },
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: async () => {
                        await actuallyDelete()
                        await updateCurrentUserProfile({"paused_profile": true})
                        queryClient.invalidateQueries({ queryKey: ['current'] })
                    },
                },
            ]
            
        })
    }

    return (
        <IonRow>
            <IonCol size="5">
                <div className="image-column" style={{display:"flex", alignItems:"center"}}>
                    {loading ? 
                                <img alt="loading" src={"../static/img/loading-refresh-faster.gif"}></img> :
                    dataPic !== null ?
                        <img alt={"Picture " + picNumber} src={dataPic} onError={(e) => onImgError(e)}/>
                        : <img alt={"Picture " + picNumber + " null"} src={"../static/img/null.png"} />
                    }
                    <div className="edit-image-buttons">
                    <IonButton fill="clear" onClick={()=>updatePicture(picName)}><FontAwesomeIcon icon={faPenToSquare} /></IonButton>
                    {dataPic !== null ? <IonButton fill="clear" onClick={deleteImage}><FontAwesomeIcon icon={faTrash} /></IonButton> : <></>}
                    </div>
                </div>
                
            </IonCol>
            <IonCol size="7" class="col-right-padding">
            {dataPicCaption !== "profile picture" &&  dataPic !== null?
            <CaptionsSelect picture={"pic"+ picNumber+"_caption"} current_caption={dataPicCaption} />
            : <></>}
            {dataPic !== null?
            <IonButton onClick={()=>addAltTextAlert()}>{altStatus == false ? "Add alt text" : "Edit alt text"}</IonButton>
            : <></>}
            </IonCol>
        </IonRow>
    )
};
export default EditPhotoGridRow;