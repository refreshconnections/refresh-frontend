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



const OnboardingCardPictures: React.FC = () => {

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
  <>
    <IonCard className="onboarding-slide">
      <IonCardContent>
        <IonCardTitle>Now add a couple more pictures!</IonCardTitle>

        <IonText>You can add a bunch more later. Add two, and a caption for each, now!</IonText>
        <IonItem className="no-bottom-line" style={{ overflow: "auto" }}>
          {data ?
            <IonGrid className="pics">
              <IonRow>
                <IonCol size="12">
                  <div style={{ alignItems: "center", display: "flex" }}>
                  {loading2 ? 
                    <img alt="loading" src={"../static/img/loading-refresh-faster.gif"}></img> :
                    data && data.pic2 !== null ?
                      <img alt="Picture 2" src={data.pic2} onError={(e) => onImgError(e)} />
                      : <img alt="Picture 2 null" src={"../static/img/null.png"} />
                    }
                    <IonButton className="onboarding-pic-upload" color="tertiary" onClick={() => updatePicture("pic2")}><FontAwesomeIcon icon={faPenToSquare}/>&nbsp; Upload</IonButton>
                  </div>
                </IonCol>
                <IonCol size="12" className="col-right-padding">
                  <CaptionsSelect onboarding={true} picture="pic2_caption" current_caption={data && data.pic2_caption ? data.pic2_caption : null} />
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol size="12">
                  <div style={{ alignItems: "center", display: "flex" }}>
                  {loading3 ? 
                    <img alt="loading" src={"../static/img/loading-refresh-faster.gif"}></img> :
                    data && data.pic3 !== null ?
                      <img alt="Picture 3" src={data.pic3} onError={(e) => onImgError(e)} />
                      : <img alt="Picture 3 null" src={"../static/img/null.png"} />
                    }
                    <IonButton className="onboarding-pic-upload" color="tertiary" onClick={() => updatePicture("pic3")}><FontAwesomeIcon icon={faPenToSquare}/>&nbsp; Upload</IonButton>
                  </div>
                </IonCol>
                <IonCol size="12" className="col-right-padding">
                  <CaptionsSelect onboarding={true} picture="pic3_caption" current_caption={data && data.pic3_caption ? data.pic3_caption : null} />
                </IonCol>
              </IonRow>
            </IonGrid>

            :
            <div>
              loading
            </div>
          }
        </IonItem>


      </IonCardContent>
      <IonRow className="onboarding-slide-buttons">
        <IonButton color="gray" onClick={() => swiper.slidePrev()}>Back</IonButton>
        <IonButton onClick={() => swiper.slideNext()} disabled={data && data.pic2 !== null && data.pic3 !== null ? false : true}>Next</IonButton>
      </IonRow>
    </IonCard>
    <IonRow className="notyet">
    <IonButton fill="clear" onClick={() => stayPausedOpen()}>Don't feel like adding pictures yet?</IonButton>
  </IonRow>
  </>
  )
};
export default OnboardingCardPictures;