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
  type?: 'text' | 'email' | 'password' | 'datetime-local';
  autocapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: 'on' | 'off';
  readonly?: boolean;
  disabled?: boolean;
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
  step,
  onClick,
  onIonFocus,
  onIonInput,
  onIonChange,
}) => (
  <IonItem className="boxed-stacked-input">
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
      step={step}
      onClick={onClick}
      onIonFocus={onIonFocus}
      onIonInput={onIonInput}
      onIonChange={onIonChange}
    />
  </IonItem>
);

export default BoxedStackedInput;
