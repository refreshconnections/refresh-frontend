import {
    IonCard, IonCardContent,
} from '@ionic/react';
import React from 'react'


import './CantAccessCard.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';



interface ContainerProps {
    tabName: string;
}

const CantAccessCard: React.FC<ContainerProps> = ({ tabName }) => {

    return (
        <IonCard className="margins error-img  ">
            <img src="../static/img/refresh-icon@3x.png"></img>

            <IonCardContent>
                You need to have an active profile to see your {tabName}. 
                <br></br>
                Go to Settings in the "Me" tab.
            </IonCardContent>
        </IonCard>
    )
};
export default CantAccessCard;