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
import TimeOrTillNoticeComponent from './TimeOrTillNoticeComponent';
import CheckboxAndInputOrNothingComponent from './CheckboxAndInputOrNothingComponent';

const { TextArea } = Input;

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
        placement="bottom"
      >
        <Input
          style={{ width: ElementSizesCorrespondence[element[ORDER_PATTERN_ELEMENT_FIELDS.SIZE]] }}
          size="small"
          placeholder={showPlaceholder ? element[ORDER_PATTERN_ELEMENT_FIELDS.REF] : null}
        />
      </Tooltip>;
    case OrderPatternElementType.TEXT_AREA:
      return <Tooltip
        title={element[ORDER_PATTERN_ELEMENT_FIELDS.REF]}
        placement="bottom"
      >
        <TextArea
          autoSize
          placeholder={showPlaceholder ? element[ORDER_PATTERN_ELEMENT_FIELDS.REF] : null}
        />
      </Tooltip>;
    case OrderPatternElementType.SELECT:
      return <Tooltip
        title={element[ORDER_PATTERN_ELEMENT_FIELDS.REF]}
        placement="bottom"
      >
        <Select
          style={{ width: ElementSizesCorrespondence[element[ORDER_PATTERN_ELEMENT_FIELDS.SIZE]] }}
          size="small"
          placeholder={showPlaceholder ? element[ORDER_PATTERN_ELEMENT_FIELDS.REF] : null}
          open={false}
        />
      </Tooltip>;
    case OrderPatternElementType.MULTIPLE_SELECT:
      return <Tooltip
        title={element[ORDER_PATTERN_ELEMENT_FIELDS.REF]}
        placement="bottom"
      >
        <Select
          mode="multiple"
          size="small"
          style={{ width: ElementSizesCorrespondence[element[ORDER_PATTERN_ELEMENT_FIELDS.SIZE]] }}
          showArrow
          placeholder={showPlaceholder ? element[ORDER_PATTERN_ELEMENT_FIELDS.REF] : null}
          open={false}
        />
      </Tooltip>;
    case OrderPatternElementType.DATE:
      return <Tooltip
        title={element[ORDER_PATTERN_ELEMENT_FIELDS.REF]}
        placement="bottom"
      >
        <DatePicker
          format={DateFormat}
          size="small"
          placeholder={showPlaceholder ? element[ORDER_PATTERN_ELEMENT_FIELDS.REF] : null}
          open={false}
        />
      </Tooltip>;
    case OrderPatternElementType.TIME:
      return <Tooltip
        title={element[ORDER_PATTERN_ELEMENT_FIELDS.REF]}
        placement="bottom"
      >
        <TimePicker
          format={TimeFormat}
          size="small"
          placeholder={showPlaceholder ? element[ORDER_PATTERN_ELEMENT_FIELDS.REF] : null}
          open={false}
        />
      </Tooltip>;
    case OrderPatternElementType.TIME_OR_TILL_NOTICE:
      return <Tooltip
        title={element[ORDER_PATTERN_ELEMENT_FIELDS.REF]}
        placement="bottom"
      >
        <TimeOrTillNoticeComponent
          format={TimeFormat}
          size="small"
          placeholder={showPlaceholder ? element[ORDER_PATTERN_ELEMENT_FIELDS.REF] : null}
        />
      </Tooltip>;
    case OrderPatternElementType.CHECKBOX_AND_INPUT_OR_NOTHING:
      return <Tooltip
        title={element[ORDER_PATTERN_ELEMENT_FIELDS.REF]}
        placement="bottom"
      >
        <CheckboxAndInputOrNothingComponent
          size="small"
          checkboxText="Выдано запрещение ДСП"
        />
      </Tooltip>
    case OrderPatternElementType.DATETIME:
      return <Tooltip
        title={element[ORDER_PATTERN_ELEMENT_FIELDS.REF]}
        placement="bottom"
      >
        <DatePicker
          showTime
          format={DateTimeFormat}
          size="small"
          placeholder={showPlaceholder ? element[ORDER_PATTERN_ELEMENT_FIELDS.REF] : null}
          open={false}
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
