import React, { useState } from 'react';
import { Checkbox, Form, Input, InputNumber, Select } from 'antd';
import { STATION_FIELDS, SERVICE_FIELDS, POST_FIELDS } from '../../constants';
import SpecifyWorkPoligon from '../SpecifyWorkPoligon';

const { Option } = Select;
const ERR_VALIDATE_STATUS = 'error';


const EditableTableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  dataType,
  record,
  index,
  children,
  required,
  services,
  posts,
  stations,
  dncSectors,
  ecdSectors,
  data,
  errMessage,
  handleError,
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
    case 'workPoligonSelect':
      inputNode =
        <SpecifyWorkPoligon
          onError={handleError}
          availableStationWorkPoligons={stations || []}
          availableDNCSectorWorkPoligons={dncSectors || []}
          availableECDSectorWorkPoligons={ecdSectors || []}
        />
      break;
    default:
      inputNode = <Input autoComplete="off" />;
      break;
  }

  const getValuePropName = () => {
    switch (inputType) {
      case 'boolean':
        return 'checked';
      default:
        return 'value';
    }
  };

  const getFieldRules = () => {
    if (!required) {
      return [{
        type: dataType,
      }];
    }
    return [{
      type: dataType,
      required: true,
      validator: async (_, value) => {
        if (typeof value !== 'boolean' && (!value || value.length < 1)) {
          setRequiredErrMess(`Не задано значение поля "${title}"!`);
        } else {
          setRequiredErrMess(null);
        }
      },
    }];
  };

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          valuePropName={getValuePropName()}
          style={{
            margin: 0,
          }}
          rules={getFieldRules()}
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
