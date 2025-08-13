import { IonButton, IonCard, IonCardContent, IonCardHeader, IonContent, IonPage } from '@ionic/react';
import React, { useEffect, useState, useCallback, useRef } from 'react'
import PropTypes from 'prop-types';

import Cropper from 'react-easy-crop'

import getCroppedImg from "../hooks/cropUtilities";
import { uploadPhoto } from '../hooks/utilities';

import "./CroppedImageModal.css"

import Resizer from "react-image-file-resizer";

type Props = {
  image: any,
  picDb: string,
  imageName: string | null
  onDismiss: () => void;
};


const CroppedImageModal: React.FC<Props> =  (props) => {
    const [crop, onCropChange] = React.useState({ x: 0, y: 0 })
    const [zoom, onZoomChange] = React.useState(1)


    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    const [croppedImage, setCroppedImage] = useState<any>(null)

    const { image, picDb, imageName, onDismiss } = props;

    const onCancel = () => {
      onDismiss();
    }

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels!);
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
        console.log("hi", uri); // Use it as needed
        await convertThenUploadResized(uri)
        onDismiss()
      }, 
      'base64' // output type (can be 'base64', 'blob', or 'file')
    );
  };

  const convertThenUploadResized = async (uri) => {
    // const base64Canvas = uri.toDataURL("image/jpeg")
      let data = new FormData();
      data.append(picDb, uri);
      const size = (uri.length * 3 / 4) - (uri.indexOf('base64,') > -1 ? 8 : 0);
      console.log("Base64 size in bytes:", size);
      const response = await uploadPhoto(data)
      console.log("response", response)
  };

    const onDownload = async () => {
      const imageCropped =  await getCroppedImg(image, croppedAreaPixels);
      console.log("image copy cropped", imageCropped)

      imageCropped.toBlob(
        (blob) => {
          if (blob) {
            // Now pass the Blob directly to resizeImage
            resizeImage(blob); // Resize after cropping
          } else {
            console.error("Failed to convert canvas to Blob");
          }
        }, 'image/jpeg'); 

    };

    return (
      <IonPage id='text-page'>
      <IonContent>
      <IonCard style={{position: "relative", height: "350px"}}>
      <div className="profile-photos-cropper">
      <Cropper
        image={image}
        crop={crop}
        zoom={zoom}
        aspect={1}
        onCropChange={onCropChange}
        onZoomChange={onZoomChange}
        onCropComplete={onCropComplete}
        objectFit="cover"
      />
      </div>
      </IonCard>
      <IonCard style={{boxShadow: "none"}}>
        <IonCardHeader >
          Crop your image to how you want it to appear on your profile.
        </IonCardHeader>
        <IonCardContent style={{justifyContent: "space-evenly", display: "flex"}}>
        <IonButton onClick={()=>onCancel()} color="secondary">Cancel</IonButton>
        <IonButton onClick={()=>onDownload()}>Upload</IonButton>
        </IonCardContent>
      </IonCard>
      </IonContent>
      </IonPage>
    )
  }

  export default CroppedImageModal;