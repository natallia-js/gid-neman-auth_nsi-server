import React from 'react';
import { Checkbox, Form, Input, InputNumber, Select } from 'antd';

const { Option } = Select;
const ERR_VALIDATE_STATUS = 'error';


const EditableTableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  required,
  stations,
  data,
  errMessage,
  ...restProps
}) => {
  let inputNode;

  switch (inputType) {
    case 'number':
      inputNode = <InputNumber />
      break;
    case 'stationsSelect':
      inputNode =
        <Select>
          {
            stations &&
            stations.map(station =>
              <Option key={station.id} value={station.id}>
                {station.name}
              </Option>)
          }
        </Select>
      break;
    case 'boolean':
      inputNode = <Checkbox defaultChecked={data} />
      break;
    default:
      inputNode = <Input autoComplete="off" />;
  }

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          valuePropName={inputType !== 'boolean' ? 'value' : 'checked'}
          style={{
            margin: 0,
          }}
          rules={[
            !required ? {} :
            {
              required: true,
              message: `Пожалуйста, введите ${title}!`,
            },
          ]}
          validateStatus={errMessage ? ERR_VALIDATE_STATUS : null}
          help={errMessage ? errMessage : null}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};


export default EditableTableCell;
