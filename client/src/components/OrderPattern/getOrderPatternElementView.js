import { Select, Input, DatePicker, TimePicker, Table, Tooltip } from 'antd';
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
const getOrderPatternElementView = (element, showPlaceholder = true) => {
  switch (element[ORDER_PATTERN_ELEMENT_FIELDS.TYPE]) {
    case OrderPatternElementType.TEXT:
      return <span>{element[ORDER_PATTERN_ELEMENT_FIELDS.VALUE]}</span>;
    case OrderPatternElementType.INPUT:
      return <Tooltip
        title={element[ORDER_PATTERN_ELEMENT_FIELDS.REF]}
      >
        <Input
          style={{ width: ElementSizesCorrespondence[element[ORDER_PATTERN_ELEMENT_FIELDS.SIZE]] }}
          size="small"
          placeholder={showPlaceholder ? element[ORDER_PATTERN_ELEMENT_FIELDS.REF] : null}
        />
      </Tooltip>;
    case OrderPatternElementType.SELECT:
      return <Tooltip
        title={element[ORDER_PATTERN_ELEMENT_FIELDS.REF]}
      >
        <Select
          style={{ width: ElementSizesCorrespondence[element[ORDER_PATTERN_ELEMENT_FIELDS.SIZE]] }}
          size="small"
          placeholder={showPlaceholder ? element[ORDER_PATTERN_ELEMENT_FIELDS.REF] : null}
        />
      </Tooltip>;
    case OrderPatternElementType.DATE:
      return <Tooltip
        title={element[ORDER_PATTERN_ELEMENT_FIELDS.REF]}
      >
        <DatePicker
          format={DateFormat}
          size="small"
          placeholder={showPlaceholder ? element[ORDER_PATTERN_ELEMENT_FIELDS.REF] : null}
        />
      </Tooltip>;
    case OrderPatternElementType.TIME:
      return <Tooltip
        title={element[ORDER_PATTERN_ELEMENT_FIELDS.REF]}
      >
        <TimePicker
          format={TimeFormat}
          size="small"
          placeholder={showPlaceholder ? element[ORDER_PATTERN_ELEMENT_FIELDS.REF] : null}
        />
      </Tooltip>;
    case OrderPatternElementType.DATETIME:
      return <Tooltip
        title={element[ORDER_PATTERN_ELEMENT_FIELDS.REF]}
      >
        <DatePicker
          showTime
          format={DateTimeFormat}
          size="small"
          placeholder={showPlaceholder ? element[ORDER_PATTERN_ELEMENT_FIELDS.REF] : null}
        />
      </Tooltip>;
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
