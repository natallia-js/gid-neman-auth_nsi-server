import { Select, Input, DatePicker, TimePicker, Table } from 'antd';
import {
  OrderPatternElementType,
  DateFormat,
  TimeFormat,
  DateTimeFormat,
  ElementSizesCorrespondence,
} from './constants';
import { EnterOutlined } from '@ant-design/icons';
import { ORDER_PATTERN_ELEMENT_FIELDS } from '../../constants';
import drTrainTableColumns from './drTrainTableColumns';

/**
 * Возвращает внешний вид элемента шаблона распоряжения, опираясь на его тип.
 */
const getOrderPatternElementView = (element) => {
  switch (element[ORDER_PATTERN_ELEMENT_FIELDS.TYPE]) {
    case OrderPatternElementType.TEXT:
      return <span>{element[ORDER_PATTERN_ELEMENT_FIELDS.VALUE]}</span>;
    case OrderPatternElementType.INPUT:
      return <Input style={{ width: ElementSizesCorrespondence[element[ORDER_PATTERN_ELEMENT_FIELDS.SIZE]] }} size="small" />;
    case OrderPatternElementType.SELECT:
      return <Select style={{ width: ElementSizesCorrespondence[element[ORDER_PATTERN_ELEMENT_FIELDS.SIZE]] }} size="small" />;
    case OrderPatternElementType.DATE:
      return <DatePicker format={DateFormat} size="small" placeholder="" />;
    case OrderPatternElementType.TIME:
      return <TimePicker format={TimeFormat} size="small" placeholder="" />;
    case OrderPatternElementType.DATETIME:
      return <DatePicker showTime format={DateTimeFormat} size="small" placeholder="" />;
    case OrderPatternElementType.DR_TRAIN_TABLE:
      return <Table
        bordered
        dataSource={[]}
        columns={drTrainTableColumns()}
        sticky={true}
      />;
    case OrderPatternElementType.LINEBREAK:
      return <EnterOutlined />;
    default:
      return null;
  }
};

export default getOrderPatternElementView;
