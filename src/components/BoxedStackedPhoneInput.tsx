import React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

import './BoxedStackedInput.css';

type BoxedStackedPhoneInputProps = {
  label: string;
  value?: string;
  placeholder?: string;
  defaultCountry?: 'US';
  disabled?: boolean;
  onChange: (value?: string) => void;
};

const BoxedStackedPhoneInput: React.FC<BoxedStackedPhoneInputProps> = ({
  label,
  value,
  placeholder,
  defaultCountry = 'US',
  disabled = false,
  onChange,
}) => (
  <div className="boxed-stacked-input boxed-stacked-input--phone">
    <div className="boxed-stacked-input__label">{label}</div>
    <PhoneInput
      className="boxed-stacked-input__phone"
      placeholder={placeholder}
      defaultCountry={defaultCountry}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  </div>
);

export default BoxedStackedPhoneInput;
