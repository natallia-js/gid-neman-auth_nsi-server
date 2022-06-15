import { TimePicker } from 'antd';
import { TimeFormat } from '../constants';


/**
 * Компонент таблицы с информацией о связанных элементах шаблонов раяпоряжений.
 */
const TimeOrTillNoticeComponent = () => {
  return (
    <div>
      <TimePicker format={TimeFormat} size="small" placeholder="" />
    </div>
  )
};


export default TimeOrTillNoticeComponent;
