import {
  IonButton
} from '@ionic/react';




import './CantAccessCard.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import { useSwiper } from 'swiper/react';




const SwiperButtonNext = ({ children }) => {
  const swiper = useSwiper();
  return <IonButton onClick={() => swiper.slideNext()}>{children}</IonButton>;
};

export default SwiperButtonNext;