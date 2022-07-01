import React, { useState } from 'react';
import { Checkbox, TimePicker } from 'antd';
import { TimeFormat } from '../constants';


/**
 * Компонент определения времени либо значения "до уведомления".
 */
const TimeOrTillNoticeComponent = ({ format, size, placeholder }) => {
  const [time, setTime] = useState(null);
  const [checked, setChecked] = useState(false);
  const timeFormat = format || TimeFormat;
  const timePickerSize = size || "small";
  const timePickerPlaceholder = placeholder || "";

  const onTimeChange = (time) => {
    setTime(time);
    if (time)
      setChecked(false);
  };

  const onCheckedChange = (event) => {
    setChecked(event.target.checked);
    if (event.target.checked)
      setTime(null);
  };

  return (
    <div>
      <TimePicker
        format={timeFormat}
        size={timePickerSize}
        placeholder={timePickerPlaceholder}
        value={time}
        onChange={onTimeChange}
      />
      &#160; / &#160;
      <Checkbox checked={checked} onChange={onCheckedChange}>
        уведомления
      </Checkbox>
    </div>
  )
};


export default TimeOrTillNoticeComponent;
