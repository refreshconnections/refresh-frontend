import { IonButton, IonActionSheet, useIonActionSheet, IonCard, IonCardSubtitle, IonCardTitle, IonContent, IonPage, IonRow, IonText, useIonModal, useIonAlert, IonNote, IonCardContent, IonFooter } from '@ionic/react';
import { useEffect, useState } from 'react';

import "./Page.css"
import "./Onboarding.css"
import '../components/OnboardingCard.css';

import LoadingCard from '../components/LoadingCard';

// Import Swiper React components
import { Swiper, SwiperSlide, useSwiper } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination, Scrollbar } from 'swiper';
import OnboardingCardBirthday from '../components/OnboardingCardBirthday';
import OnboardingCardGenderIdentity from '../components/OnboardingCardGenderIdentity';
import OnboardingCardDone from '../components/OnboardingCardDone';
import OnboardingCardCoords from '../components/OnboardingCardCoords';
import OnboardingCardLocation from '../components/OnboardingCardLocation';
import OnboardingCardLookingFor from '../components/OnboardingCardLookingFor';
import OnboardingCardCovid from '../components/OnboardingCardCovid';
import OnboardingCardProfilePic from '../components/OnboardingCardProfilePic';
import OnboardingCardPictures from '../components/OnboardingCardPictures';
import OnboardingCardName from '../components/OnboardingCardName';
import OnboardingCardBio from '../components/OnboardingCardBio';
import OnboardingCardPhone from '../components/OnboardingCardPhone';
import OnboardingCardConversation from '../components/OnboardingCardConversation';
import { handleLogoutCommon, setFontSizePref, setTextZoom, setThemePref } from '../hooks/utilities';
import StayPausedModal from '../components/StayPausedModal';

const Onboarding: React.FC = () => {



  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmLogout] = useIonAlert();
  



  const SwiperButtonPrev = ({ children }) => {
    const swiper = useSwiper();
    return <IonButton color="gray" onClick={() => swiper.slidePrev()}>{children}</IonButton>;
  };
  const SwiperButtonNext = ({ children }) => {
    const swiper = useSwiper();
    return <IonButton onClick={() => swiper.slideNext()}>{children}</IonButton>;
  };



  useEffect(() => {

    const setThemeandFont = async () => {
      await setThemePref('light');
      await setFontSizePref('default');
      await setTextZoom()
    }

    setThemeandFont();

  }, []);

  const [stayPausedOpen, stayPausedDismiss] = useIonModal(StayPausedModal, {
    onDismiss: () => stayPausedDismiss(),
  });

    const confirmLogoutAlert = async () => {
          confirmLogout({
            header: `Are you sure you want to return to login?`,
            subHeader: 'You will be logged out.',
            buttons: [
              {
                  text: 'Nevermind',
                  role: 'destructive'
              },
              {
                text: 'Yes',
                handler: async () => {
                  await handleLogoutCommon()
                }
              },
            ],
          })
        }


  if (loading) {
    return (
      <IonPage>
        <IonContent>
          <IonRow className="page-title">
            <IonText className="bold">
              <h1>Hi!</h1>
            </IonText>
          </IonRow>
          <LoadingCard />
        </IonContent>
      </IonPage>
    )
  }
  else {
    return (
      <IonPage>
        <IonContent className="ignore-keyboard ">
          <Swiper
            modules={[Navigation, Pagination, Scrollbar]}
            pagination={{ type: "progressbar" }}
            scrollbar={{ draggable: true }}
            centeredSlides
            allowTouchMove={false}
            className="onboarding "
          >
            <SwiperSlide>
              <IonCard className="onboarding-slide" style={{ overflow: "scroll", position: 'relative', height: '95vh' }}>
                <IonCardContent style={{ padding: "20px" }}>
                  <IonCardTitle style={{ fontSize: "26px" }}>
                    Welcome to Refresh Connections!
                  </IonCardTitle>
                  <img src="../static/img/flower-mask.png" style={{ width: "50%", alignSelf: "center", margin: "30pt" }}></img>
                  <IonText style={{ textAlign: "center" }}>
                    <h2>
                      Create your profile in just a few easy steps—it’ll take about a minute!
                    </h2>
                  </IonText>
                </IonCardContent>
                <IonRow className="onboarding-slide-buttons">
                  <SwiperButtonNext>
                    Ok!
                  </SwiperButtonNext>
                </IonRow>
                <IonButton
                  size="small"
                  fill="clear"
                  style={{
                    position: 'absolute',
                    bottom: '20px',        // distance from bottom edge
                    left: '50%',
                    transform: 'translateX(-50%)', // center horizontally
                    width: '90%',          // matches card padding nicely; tweak as you like
                  }}
                  onClick={confirmLogoutAlert}
                >
                  Or return to login
                </IonButton>
              </IonCard>

            </SwiperSlide>
            <SwiperSlide>
              <OnboardingCardName />
            </SwiperSlide>
            <SwiperSlide>
              <OnboardingCardPhone />
            </SwiperSlide>
            <SwiperSlide>
              <OnboardingCardBirthday />
            </SwiperSlide>
            <SwiperSlide>
              <OnboardingCardGenderIdentity />
            </SwiperSlide>
            <SwiperSlide>
              <OnboardingCardCoords />
            </SwiperSlide>
            <SwiperSlide>
              <OnboardingCardLocation />
            </SwiperSlide>
            <SwiperSlide>
              <IonCard className="onboarding-slide" style={{ overflow: "scroll" }}>
                <IonCardContent style={{ padding: "30px" }}>
                  <IonCardTitle>
                    Now it's picture time.
                  </IonCardTitle>
                  <IonText style={{ fontsize: "12pt" }}>
                    The next screen will ask if you want to upload photos and create an active profile so you can start making one-on-one connections.
                  </IonText>
                  <IonText style={{ fontsize: "12pt" }}>
                    Alternatively, you can choose to join without uploading photos and still participate fully in the community forum. You can always upload photos and start making one-on-one connections later.
                  </IonText>
                  <IonText style={{ fontsize: "12pt" }}>
                    Please make sure your photos are in line with our <a href="https://www.refreshconnections.com/communitysafety">Community Guidelines</a> and <a href="https://www.refreshconnections.com/Principles">Member Principles</a> as you agreed to in our <a href="https://www.refreshconnections.com/terms">Terms and Conditions of Use</a>.
                  </IonText>
                </IonCardContent>
                <IonRow className="onboarding-slide-buttons">
                  <SwiperButtonPrev>
                    Back
                  </SwiperButtonPrev>
                  <SwiperButtonNext>
                    Next
                  </SwiperButtonNext>
                </IonRow>
                <IonRow>
                  <IonButton fill="clear" onClick={() => stayPausedOpen()}>Don't feel like adding pictures yet?</IonButton>
                </IonRow>
              </IonCard>
            </SwiperSlide>
            <SwiperSlide>
              <OnboardingCardProfilePic />
            </SwiperSlide>
            <SwiperSlide>
              <OnboardingCardPictures />
            </SwiperSlide>
            <SwiperSlide>
              <OnboardingCardLookingFor />
            </SwiperSlide>
            <SwiperSlide>
              <OnboardingCardCovid />
            </SwiperSlide>
            <SwiperSlide>
              <OnboardingCardBio />
            </SwiperSlide>
            <SwiperSlide>
              <OnboardingCardConversation />
            </SwiperSlide>
            <SwiperSlide>
              <OnboardingCardDone />
            </SwiperSlide>
          </Swiper>
        </IonContent>
      </IonPage>
    );
  };
}

export default Onboarding;
