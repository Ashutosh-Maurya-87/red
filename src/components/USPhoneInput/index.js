import React from 'react';
import MaskedInput from 'react-text-mask';
import { INPUT_MASKS } from '../../configs/app';

function USPhoneInput(props) {
  // eslint-disable-next-line react/prop-types
  const { inputRef, ...rest } = props;

  return (
    <MaskedInput
      {...rest}
      ref={ref => {
        inputRef(ref ? ref.inputElement : null);
      }}
      mask={INPUT_MASKS.US_PHONE}
      placeholderChar={'\u2000'}
      showMask={false}
    />
  );
}

export default USPhoneInput;
