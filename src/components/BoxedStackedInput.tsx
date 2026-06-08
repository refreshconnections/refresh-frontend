import React from 'react';
import {
  IonInput,
  IonItem,
  IonLabel,
  type InputCustomEvent,
  type InputChangeEventDetail,
} from '@ionic/react';

import './BoxedStackedInput.css';

type BoxedStackedInputProps = {
  label: React.ReactNode;
  value: string;
  name: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'datetime-local' | 'url';
  autocapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: 'on' | 'off';
  readonly?: boolean;
  disabled?: boolean;
  maxlength?: number;
  counter?: boolean;
  step?: string;
  onClick?: React.MouseEventHandler<HTMLIonInputElement>;
  onIonFocus?: () => void;
  onIonInput?: (event: InputCustomEvent<InputChangeEventDetail>) => void;
  onIonChange?: (event: InputCustomEvent<InputChangeEventDetail>) => void;
};

const BoxedStackedInput: React.FC<BoxedStackedInputProps> = ({
  label,
  value,
  name,
  placeholder,
  type = 'text',
  autocapitalize,
  autoCorrect='on',
  readonly = false,
  disabled = false,
  maxlength,
  counter,
  step,
  onClick,
  onIonFocus,
  onIonInput,
  onIonChange,
}) => (
  <IonItem className="boxed-stacked-input" lines="none">
    <IonLabel position="stacked">{label}</IonLabel>
    <IonInput
      value={value}
      name={name}
      placeholder={placeholder}
      type={type}
      autocapitalize={autocapitalize}
      autoCorrect={autoCorrect}
      readonly={readonly}
      disabled={disabled}
      maxlength={maxlength}
      counter={counter}
      step={step}
      onClick={onClick}
      onIonFocus={onIonFocus}
      onIonInput={onIonInput}
      onIonChange={onIonChange}
    />
  </IonItem>
);

export default BoxedStackedInput;
