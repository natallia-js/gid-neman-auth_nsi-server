import React from 'react';
import { Form, Input, InputNumber, Select } from 'antd';

import 'antd/dist/antd.css';

const { Option } = Select;


const EditableTableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  stations,
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
            stations.map(station => <Option key={station.id} value={station.id}>{station.name}</Option>)
          }
        </Select>
      break;
    default:
      inputNode = <Input autoComplete="off" />;
  }

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{
            margin: 0,
          }}
          rules={[
            {
              required: true,
              message: `Пожалуйста, введите ${title}!`,
            },
          ]}
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
