import React from 'react';
import {
  IonItem,
  IonLabel,
  IonTextarea,
  type TextareaChangeEventDetail,
  type TextareaCustomEvent,
} from '@ionic/react';

import './BoxedStackedInput.css';

type BoxedStackedTextareaProps = {
  label: React.ReactNode;
  value: string;
  placeholder?: string;
  rows?: number;
  maxlength?: number;
  counter?: boolean;
  autoGrow?: boolean;
  onIonInput?: (event: TextareaCustomEvent<TextareaChangeEventDetail>) => void;
  onIonChange?: (event: TextareaCustomEvent<TextareaChangeEventDetail>) => void;
};

const BoxedStackedTextarea: React.FC<BoxedStackedTextareaProps> = ({
  label,
  value,
  placeholder,
  rows,
  maxlength,
  counter,
  autoGrow = false,
  onIonInput,
  onIonChange,
}) => (
  <IonItem className="boxed-stacked-input boxed-stacked-input--textarea" lines="none">
    <IonLabel position="stacked">{label}</IonLabel>
    <IonTextarea
      value={value}
      placeholder={placeholder}
      rows={rows}
      maxlength={maxlength}
      counter={counter}
      autocapitalize='sentences'
      autoGrow={autoGrow}
      onIonInput={onIonInput}
      onIonChange={onIonChange}
    />
  </IonItem>
);

export default BoxedStackedTextarea;
