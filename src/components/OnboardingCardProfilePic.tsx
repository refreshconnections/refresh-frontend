import {
  IonButton,
  IonCard, IonCardContent, IonCardTitle, IonInput, IonItem, IonLabel, IonList, IonNote, IonRow, IonSelect, IonSelectOption, IonText, useIonModal,
} from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react'
import useFetch from '../hooks/useFetch';
import Resizer from "react-image-file-resizer";


import { getCurrentUserProfile, onImgError, updateCurrentUserProfile, uploadPhoto } from '../hooks/utilities';


import './CantAccessCard.css';
import './OnboardingCard.css';


// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import moment from 'moment';
import { useSwiper } from 'swiper/react';
import SwiperButtonNext from './SwiperButtonNext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/pro-regular-svg-icons/faPenToSquare';
import CroppedImageModal from './CroppedImageModal';
import { Camera, CameraResultType } from '@capacitor/camera';
import { decode } from 'base64-arraybuffer';
import StayPausedModal from './StayPausedModal';



const OnboardingCardProfilePic: React.FC = () => {

  const swiper = useSwiper();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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
    setImageName("main.png")
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
    setLoading(true)
    cropDismiss()
    console.log("Waiting 3 seconds to reload image ")
    await delay(3000);
    setData(await getCurrentUserProfile())
    setLoading(false)
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
          <IonCardTitle>Upload a profile picture!</IonCardTitle>

          <IonText>Make a good first impression. This is the first thing that will show on your profile. We recommend it be of just you. Remember, your profile needs to include at least one photo that shows your face.</IonText>
          <IonItem className="no-bottom-line prof" style={{ overflow: "auto" }}>
            {data ?
              <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
                {loading ?
                  <img alt="loading" src={"../static/img/loading-refresh-faster.gif"}></img> :
                  data.pic1_main !== null ?
                    <img alt="Picture 1" src={data.pic1_main} onError={(e) => onImgError(e)} />
                    : <img alt="Picture 1 null" src={"../static/img/null.png"} />
                }
                <IonButton className="onboarding-pic-upload" color="tertiary" onClick={() => updatePicture("pic1_main")}><FontAwesomeIcon icon={faPenToSquare} />&nbsp; Upload</IonButton>
              </div>

              :
              <div>
                loading
              </div>
            }
          </IonItem>


        </IonCardContent>
        <IonRow className="onboarding-slide-buttons">
          <IonButton color="gray" onClick={() => swiper.slidePrev()}>Back</IonButton>
          <IonButton onClick={() => swiper.slideNext()} disabled={data && data.pic1_main == null ? true : false}>Next</IonButton>
        </IonRow>
      </IonCard>
      <IonRow className="notyet">
        <IonButton fill="clear" onClick={() => stayPausedOpen()}>Don't feel like adding pictures yet?</IonButton>
      </IonRow>
    </>
  )
};
export default OnboardingCardProfilePic;