import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonCol, IonGrid, IonInput, IonItem, IonLabel, IonList, IonNote, IonRow, IonSelect, IonSelectOption, IonText, useIonModal,
} from '@ionic/react';
import React, { useEffect, useState } from 'react'
import Resizer from "react-image-file-resizer";


import { getCurrentUserProfile, onImgError, updateCurrentUserProfile, uploadPhoto } from '../hooks/utilities';


import './CantAccessCard.css';
import './OnboardingCard.css';


// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import { useSwiper } from 'swiper/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/pro-regular-svg-icons/faPenToSquare';

import CroppedImageModal from './CroppedImageModal';
import CaptionsSelect from './CaptionsSelect';
import { Camera, CameraResultType } from '@capacitor/camera';
import { decode } from 'base64-arraybuffer';
import StayPausedModal from './StayPausedModal';
import { ONBOARDING_COPY } from '../constants/onboarding';



const OnboardingCardPictures: React.FC = () => {
  const copy = ONBOARDING_COPY.cards.pictures;

  const swiper = useSwiper();

  const [data, setData] = useState<any>(null);
  const [dataLen, setDataLen] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const [loading3, setLoading3] = useState(false);

  const [error, setError] = useState<null | string>(null);

  const [image, setImage] = useState<any>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [picDb, setPicDB] = useState<any>(null);





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
    setImageName(pic_db + ".png")
    cropPresent()

  }
  
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

  const delay = (ms: any) => new Promise(res => setTimeout(res, ms));

  const handleCropDismiss = async () => {
    if (picDb == "pic2") {
      setLoading2(true)
    }
    else if (picDb== "pic3") {
      setLoading3(true)
    }
    
    cropDismiss()
    console.log("Waiting 3 seconds to reload image ")
    await delay(3000);
    setData(await getCurrentUserProfile())
    setLoading(false)

    setLoading2(false)
    setLoading3(false)
  }


  const [cropPresent, cropDismiss] = useIonModal(CroppedImageModal, {
    image: image,
    picDb: picDb,
    imageName: imageName,
    onDismiss: handleCropDismiss
  });

  const [stayPausedOpen, stayPausedDismiss] = useIonModal(StayPausedModal, {
    onDismiss: () => stayPausedDismiss(),
  });


  return (
    <IonCard className="onboarding-v2__card onboarding-v2__card--shallow onboarding-slide">
      <IonCardContent>
        <IonCardTitle>{copy.title}</IonCardTitle>
        <IonText>{copy.body}</IonText>
        <IonItem className="no-bottom-line onboarding-photo-panel" style={{ overflow: "auto" }}>
          {data ? (
            <IonGrid className="pics onboarding-pictures-grid">
              <IonRow>
                <IonCol size="6" className="onboarding-pictures-grid__col">
                  <div className="onboarding-photo-upload-row onboarding-photo-upload-row--stacked">
                    {loading2 ? (
                      <img alt="loading" src={"../static/img/loading-refresh-faster.gif"} />
                    ) : data.pic2 !== null ? (
                      <img alt="Picture 2" src={data.pic2} onError={(e) => onImgError(e)} />
                    ) : (
                      <img alt="Picture 2 null" src={"../static/img/null.png"} />
                    )}
                    <IonButton className="onboarding-pic-upload" color="tertiary" onClick={() => updatePicture("pic2")}><FontAwesomeIcon icon={faPenToSquare}/> {copy.upload}</IonButton>
                    <CaptionsSelect onboarding={true} picture="pic2_caption" current_caption={data.pic2_caption ?? null} />
                  </div>
                </IonCol>
                <IonCol size="6" className="onboarding-pictures-grid__col">
                  <div className="onboarding-photo-upload-row onboarding-photo-upload-row--stacked">
                    {loading3 ? (
                      <img alt="loading" src={"../static/img/loading-refresh-faster.gif"} />
                    ) : data.pic3 !== null ? (
                      <img alt="Picture 3" src={data.pic3} onError={(e) => onImgError(e)} />
                    ) : (
                      <img alt="Picture 3 null" src={"../static/img/null.png"} />
                    )}
                    <IonButton className="onboarding-pic-upload" color="tertiary" onClick={() => updatePicture("pic3")}><FontAwesomeIcon icon={faPenToSquare}/> {copy.upload}</IonButton>
                    <CaptionsSelect onboarding={true} picture="pic3_caption" current_caption={data.pic3_caption ?? null} />
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>
          ) : (
            <div>loading</div>
          )}
        </IonItem>
      </IonCardContent>
      <div className="onboarding-v2__card-footer">
        <IonRow className="onboarding-v2__nav">
          <IonButton fill="outline" onClick={() => swiper.slidePrev()}>{ONBOARDING_COPY.common.back}</IonButton>
          <IonButton className="onboarding-v2__primary-action" onClick={() => swiper.slideNext()} disabled={!(data && data.pic2 !== null && data.pic3 !== null)}>{ONBOARDING_COPY.common.next}</IonButton>
        </IonRow>
        <IonRow className="onboarding-v2__nav">
          <IonButton fill="clear" size="small" onClick={() => stayPausedOpen()}>{copy.skip}</IonButton>
        </IonRow>
      </div>
    </IonCard>
  )
};
export default OnboardingCardPictures;
