import React, { useState } from 'react';
import { Checkbox, Form, Input, InputNumber, Select } from 'antd';
import { STATION_FIELDS, SERVICE_FIELDS, POST_FIELDS } from '../../constants';

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
  services,
  posts,
  stations,
  data,
  errMessage,
  ...restProps
}) => {
  let inputNode;
  const [requiredErrMess, setRequiredErrMess] = useState(null);

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
              <Option key={station[STATION_FIELDS.KEY]} value={JSON.stringify(station)}>
                {station[STATION_FIELDS.NAME_AND_CODE]}
              </Option>)
          }
        </Select>
      break;
    case 'servicesSelect':
      inputNode =
        <Select>
          {
            services &&
            services.map(service =>
              <Option key={service[SERVICE_FIELDS.ABBREV]} value={service[SERVICE_FIELDS.ABBREV]}>
                {service[SERVICE_FIELDS.ABBREV]}
              </Option>)
          }
        </Select>
      break;
    case 'postsSelect':
      inputNode =
        <Select>
          {
            posts &&
            posts.map(post =>
              <Option key={post[POST_FIELDS.ABBREV]} value={post[POST_FIELDS.ABBREV]}>
                {post[POST_FIELDS.ABBREV]}
              </Option>)
          }
        </Select>
      break;
    case 'boolean':
      inputNode = <Checkbox defaultChecked={data} />
      break;
    default:
      inputNode = <Input autoComplete="off" />;
      break;
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
              validator: async (_, value) => {
                if (typeof value !== 'boolean' && (!value || value.length < 1)) {
                  setRequiredErrMess(`Не задано значение поля "${title}"!`);
                } else {
                  setRequiredErrMess(null);
                }
              },
            },
          ]}
          validateStatus={errMessage || requiredErrMess ? ERR_VALIDATE_STATUS : null}
          help={errMessage || requiredErrMess}
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
