import React, { useState } from 'react';
import { Checkbox, Input } from 'antd';


/**
 * Компонент для установки "галочки" в checkbox.
 */
const CheckboxComponent = ({ checkboxText, size }) => {
  const [checked, setChecked] = useState(false);

  const onCheckedChange = (event) => {
    setChecked(event.target.checked);
  };

  return (
    <div>
      <Checkbox checked={checked} onChange={onCheckedChange} />
      &#160; {checkboxText}
    </div>
  )
};


export default CheckboxComponent;
