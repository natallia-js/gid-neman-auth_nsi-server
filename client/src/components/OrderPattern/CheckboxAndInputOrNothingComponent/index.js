import React, { useState } from 'react';
import { Checkbox, Input } from 'antd';


/**
 * Компонент определения значения только в случае установки "галочки" в checkbox.
 */
const CheckboxAndInputOrNothingComponent = ({ checkboxText, size }) => {
  const [checked, setChecked] = useState(false);

  const onCheckedChange = (event) => {
    setChecked(event.target.checked);
  };

  return (
    <div>
      <Checkbox checked={checked} onChange={onCheckedChange} />
      &#160; {checkboxText} &#160;
      {
        checked &&
        <Input
          style={{ width: '150px' }}
          size={size}
          allowClear
        />
      }
    </div>
  )
};


export default CheckboxAndInputOrNothingComponent;
