import React, { useRef, useState } from "react";

import { IonToast } from '@ionic/react';

import './StatusToast.css'


type Props = {
    isToastOpen: boolean
    setIsToastOpen: React.Dispatch<React.SetStateAction<boolean>>
    header?: string,
    message?: string
    link?: string
};

const StatusToast: React.FC<Props> = (props) => {
    const {isToastOpen, setIsToastOpen, header, message} = props
    

    return (
       
        <IonToast
          isOpen={isToastOpen}
          header={header}
          message={message}
          onDidDismiss={() => setIsToastOpen(false)}
          duration={10000}
          buttons={[
            {
              text: 'x',
              role: 'cancel',
            },
          ]}
          cssClass={"status-toast "}
        ></IonToast>
      
    )
};

export default StatusToast;