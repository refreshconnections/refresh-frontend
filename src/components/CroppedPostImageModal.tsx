import { IonButton, IonCard, IonCardContent, IonCardHeader, IonContent, IonLabel, IonPage, IonSegment, IonSegmentButton } from '@ionic/react';
import React, { useEffect, useState, useCallback, useRef } from 'react'
import PropTypes from 'prop-types';

import Cropper from 'react-easy-crop'

import getCroppedImg from "../hooks/cropUtilities";
import Resizer from "react-image-file-resizer";


import "./CroppedImageModal.css"


// interface OpenCropModalInterface {
//   setCropModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
//   image: any,
//   picDb: string,
//   imageName: string | null
// }

type Props = {
  image: any,
  picDb: string,
  imageName: string | null
  vertical: boolean
  onDismiss: (data: string | null) => void;
};


const CroppedImageModal: React.FC<Props> = (props) => {
  const [crop, onCropChange] = React.useState({ x: 0, y: 0 })
  const [zoom, onZoomChange] = React.useState(1)
  const [cropBoxSize, setCropBoxSize] = useState({ width: 200, height: 200 });

  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)


  const { image, picDb, imageName, onDismiss } = props;

  const [size, setSize] = useState<"portrait" | "landscape" | "square">("landscape");


  const onCancel = () => {
    onDismiss(null);
  }

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Resize the cropped image
  const resizeImage = (blob) => {
    Resizer.imageFileResizer(
      blob,
      450, // target width
      450, // target height
      'JPEG', // output format
      90, // quality (from 0 to 100)
      0, // rotation angle (default is 0)
      async (uri) => {
        // uri is the resized image as a base64-encoded string
        console.log(uri); // Use it as needed
        await convertThenUploadResized(uri)
      },
      'base64' // output type (can be 'base64', 'blob', or 'file')
    );
  };

  const onDownload = async () => {
    const imageCropped = await getCroppedImg(image, croppedAreaPixels);

    imageCropped.toBlob(
      (blob) => {
        if (blob) {
          // Now pass the Blob directly to resizeImage
          resizeImage(blob); // Resize after cropping
        } else {
          console.error("Failed to convert canvas to Blob");
        }
      }, 'image/jpeg');
  }

  const convertThenUploadResized = async (uri) => {
    onDismiss(uri)
};

const getPhotoSize = () => {

  if (size === "square") {
    return 1
  }
  else if (size === "portrait") {
    return 3 / 4
  }
  else {
    return 4 / 3
  }

}


return (
  <IonPage id='text-page'>
    <IonContent>
      <IonCard style={{ position: "relative", height: "350px" }}>
        <div className="profile-photos-cropper">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={getPhotoSize()}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropComplete}
            objectFit="cover"
          />
        </div>
      </IonCard>
      <IonCard style={{ boxShadow: "none" }}>
        <IonSegment color="secondary" value={size}>
          <IonSegmentButton value="landscape" onClick={() => setSize("landscape")}>
            <IonLabel>Landscape</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="portrait" onClick={() => setSize("portrait")}>
            <IonLabel>Portrait</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="square" onClick={() => setSize("square")}>
            <IonLabel>Square</IonLabel>
          </IonSegmentButton>
        </IonSegment>
        <IonCardHeader >
          Crop your image to how you want it to appear on your post.
        </IonCardHeader>
        <IonCardContent style={{ justifyContent: "space-evenly", display: "flex" }}>
          <IonButton onClick={() => onCancel()} color="secondary">Cancel</IonButton>
          <IonButton onClick={() => onDownload()}>Upload</IonButton>
        </IonCardContent>
      </IonCard>
    </IonContent>
  </IonPage>
)
  }

export default CroppedImageModal;