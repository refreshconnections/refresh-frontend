import React from 'react';
import {
  IonItem,
  IonLabel,
  IonSelect,
} from '@ionic/react';

import './BoxedStackedInput.css';

type BoxedStackedSelectProps = {
  label: React.ReactNode;
  value: any;
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  interface?: 'action-sheet' | 'alert' | 'popover' | 'modal';
  onIonChange: (event: CustomEvent<{ value: any }>) => void;
  children: React.ReactNode;
};

const BoxedStackedSelect: React.FC<BoxedStackedSelectProps> = ({
  label,
  value,
  placeholder,
  disabled = false,
  multiple = false,
  interface: selectInterface,
  onIonChange,
  children,
}) => (
  <IonItem className="boxed-stacked-input boxed-stacked-input--select">
    <IonLabel position="stacked">{label}</IonLabel>
    <IonSelect
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      multiple={multiple}
      interface={selectInterface}
      onIonChange={onIonChange}
    >
      {children}
    </IonSelect>
  </IonItem>
);

export default BoxedStackedSelect;
