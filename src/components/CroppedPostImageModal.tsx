import { IonButton, IonCard, IonCardContent, IonCardHeader, IonContent, IonPage } from '@ionic/react';
import React, { useEffect, useRef, useState } from 'react'

import getCroppedImg from "../hooks/cropUtilities";
import Resizer from "react-image-file-resizer";
import { ANNOUNCEMENT_IMAGE_CONSTRAINTS, SubmissionImageConstraints } from '../constants/submissionImages';


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
  imageConstraints?: SubmissionImageConstraints
  onDismiss: (data: string | null) => void;
};

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ImageBounds = CropRect & {
  naturalWidth: number;
  naturalHeight: number;
};

type ResizeHandle = 'move' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const MIN_CROP_SIZE = 48;

const CroppedImageModal: React.FC<Props> = (props) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [imageBounds, setImageBounds] = useState<ImageBounds | null>(null);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);


  const { image, picDb, imageName, imageConstraints = ANNOUNCEMENT_IMAGE_CONSTRAINTS, onDismiss } = props;

  const onCancel = () => {
    onDismiss(null);
  }

  useEffect(() => {
    if (typeof image === 'string') {
      setImageSrc(image);
      return;
    }

    if (image instanceof Blob) {
      const objectUrl = URL.createObjectURL(image);
      setImageSrc(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);
    }

    setImageSrc(null);
  }, [image]);

  const clampCropRect = (rect: CropRect, bounds: ImageBounds): CropRect => {
    const width = Math.min(Math.max(rect.width, MIN_CROP_SIZE), bounds.width);
    const height = Math.min(Math.max(rect.height, MIN_CROP_SIZE), bounds.height);
    const x = Math.min(Math.max(rect.x, bounds.x), bounds.x + bounds.width - width);
    const y = Math.min(Math.max(rect.y, bounds.y), bounds.y + bounds.height - height);

    return { x, y, width, height };
  };

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !imageSrc) return;

    const handleResize = () => updateImageBounds();

    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      return () => resizeObserver.disconnect();
    }

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [imageSrc]);

  const updateImageBounds = () => {
    const element = imageRef.current;
    const container = containerRef.current;

    if (!element || !container || !element.naturalWidth || !element.naturalHeight) return;

    const containerRect = container.getBoundingClientRect();
    const imageAspect = element.naturalWidth / element.naturalHeight;
    const containerAspect = containerRect.width / containerRect.height;
    const displayWidth = containerAspect > imageAspect
      ? containerRect.height * imageAspect
      : containerRect.width;
    const displayHeight = containerAspect > imageAspect
      ? containerRect.height
      : containerRect.width / imageAspect;
    const nextBounds: ImageBounds = {
      x: (containerRect.width - displayWidth) / 2,
      y: (containerRect.height - displayHeight) / 2,
      width: displayWidth,
      height: displayHeight,
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
    };

    setImageBounds(nextBounds);
    setCropRect({
      x: nextBounds.x,
      y: nextBounds.y,
      width: nextBounds.width,
      height: nextBounds.height,
    });
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    imageRef.current = event.currentTarget;
    requestAnimationFrame(updateImageBounds);
  };

  const startCropInteraction = (handle: ResizeHandle, event: React.PointerEvent<HTMLDivElement>) => {
    if (!cropRect || !imageBounds) return;

    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const startRect = cropRect;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      let nextRect = { ...startRect };

      if (handle === 'move') {
        nextRect.x = startRect.x + deltaX;
        nextRect.y = startRect.y + deltaY;
      }

      if (handle.includes('left')) {
        const nextX = Math.min(startRect.x + deltaX, startRect.x + startRect.width - MIN_CROP_SIZE);
        nextRect.x = nextX;
        nextRect.width = startRect.x + startRect.width - nextX;
      }

      if (handle.includes('right')) {
        nextRect.width = startRect.width + deltaX;
      }

      if (handle.includes('top')) {
        const nextY = Math.min(startRect.y + deltaY, startRect.y + startRect.height - MIN_CROP_SIZE);
        nextRect.y = nextY;
        nextRect.height = startRect.y + startRect.height - nextY;
      }

      if (handle.includes('bottom')) {
        nextRect.height = startRect.height + deltaY;
      }

      setCropRect(clampCropRect(nextRect, imageBounds));
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Resize the cropped image
  const resizeImage = (blob) => {
    Resizer.imageFileResizer(
      blob,
      imageConstraints.outputMaxWidth, // target width
      imageConstraints.outputMaxHeight, // target height
      imageConstraints.outputFormat, // output format
      imageConstraints.outputQuality, // quality (from 0 to 100)
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
    if (!imageSrc || !cropRect || !imageBounds) return;

    const scaleX = imageBounds.naturalWidth / imageBounds.width;
    const scaleY = imageBounds.naturalHeight / imageBounds.height;
    const pixelCrop = {
      x: Math.round((cropRect.x - imageBounds.x) * scaleX),
      y: Math.round((cropRect.y - imageBounds.y) * scaleY),
      width: Math.round(cropRect.width * scaleX),
      height: Math.round(cropRect.height * scaleY),
    };

    const imageCropped = await getCroppedImg(imageSrc, pixelCrop);

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

const renderHandle = (handle: ResizeHandle) => (
  <div
    className={`submission-crop-handle submission-crop-handle-${handle}`}
    onPointerDown={(event) => startCropInteraction(handle, event)}
  />
);

return (
  <IonPage id='text-page'>
    <IonContent>
      <IonCard style={{ position: "relative", height: "350px" }}>
        <div className="submission-image-cropper" ref={containerRef}>
          {imageSrc ? (
            <img
              ref={imageRef}
              src={imageSrc}
              alt=""
              className="submission-image-cropper-image"
              onLoad={handleImageLoad}
            />
          ) : null}
          {cropRect ? (
            <div
              className="submission-crop-rect"
              style={{
                left: cropRect.x,
                top: cropRect.y,
                width: cropRect.width,
                height: cropRect.height,
              }}
              onPointerDown={(event) => startCropInteraction('move', event)}
            >
              {renderHandle('left')}
              {renderHandle('right')}
              {renderHandle('top')}
              {renderHandle('bottom')}
              {renderHandle('top-left')}
              {renderHandle('top-right')}
              {renderHandle('bottom-left')}
              {renderHandle('bottom-right')}
            </div>
          ) : null}
        </div>
      </IonCard>
      <IonCard style={{ boxShadow: "none" }}>
        <IonCardHeader >
          Crop your image to how you want it to appear.
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
