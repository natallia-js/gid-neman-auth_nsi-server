import React, { useState } from 'react';
import { Checkbox, TimePicker } from 'antd';
import { TimeFormat } from '../constants';


/**
 * Компонент таблицы с информацией о связанных элементах шаблонов раяпоряжений.
 */
const TimeOrTillNoticeComponent = ({ format, size, placeholder }) => {
  const [time, setTime] = useState(null);
  const [checked, setChecked] = useState(false);
  const timeFormat = format || TimeFormat;
  const timePicketSize = size || "small";
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
        size={timePicketSize}
        placeholder={timePickerPlaceholder}
        value={time}
        onChange={onTimeChange}
      />
      &#160; / &#160;
      <Checkbox checked={checked} onChange={onCheckedChange}>
        до уведомления
      </Checkbox>
    </div>
  )
};


export default TimeOrTillNoticeComponent;
