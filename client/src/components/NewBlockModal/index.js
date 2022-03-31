import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography, Select } from 'antd';
import { BLOCK_FIELDS, STATION_FIELDS } from '../../constants';

const { Text } = Typography;
const { Option } = Select;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новом перегоне.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   handleAddNewBlockOk,
 *   handleAddNewBlockCancel,
 *   blockFieldsErrs,
 *   clearAddBlockMessages,
 *   stations,
 *   recsBeingAdded,
 */
const NewBlockModal = ({
  isModalVisible,
  handleAddNewBlockOk,
  handleAddNewBlockCancel,
  blockFieldsErrs,
  clearAddBlockMessages,
  stations,
  recsBeingAdded,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();

  const [requiredNameErrMess, setRequiredNameErrMess] = useState(null);
  const [requiredStation1ErrMess, setRequiredStation1ErrMess] = useState(null);
  const [requiredStation2ErrMess, setRequiredStation2ErrMess] = useState(null);


  /**
   * Чистим поля ввода информации о новом перегоне.
   */
  const onReset = () => {
    form.resetFields();
  };


  const resetAll = () => {
    // Чистим все сообщения
    clearAddBlockMessages();
    setRequiredNameErrMess(null);
    setRequiredStation1ErrMess(null);
    setRequiredStation2ErrMess(null);
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   *
   * @param {object} values
   */
  const onFinish = (values) => {
    resetAll();
    handleAddNewBlockOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewBlockCancel();
    // Чистим поля ввода
    onReset();
    resetAll();
  };


  /**
   * Позволяет автоматически формировать наименование перегона на основании информации о выбранных станциях.
   */
  const onValuesChange = (changedValues) => {
    if (changedValues[BLOCK_FIELDS.STATION1] || changedValues[BLOCK_FIELDS.STATION2]) {
      const station1 = stations.find((station) => station[STATION_FIELDS.KEY] === form.getFieldValue([BLOCK_FIELDS.STATION1]));
      const station2 = stations.find((station) => station[STATION_FIELDS.KEY] === form.getFieldValue([BLOCK_FIELDS.STATION2]));
      const newBlockName = `${(station1 && station1[STATION_FIELDS.NAME]) || ''} - ${(station2 && station2[STATION_FIELDS.NAME]) || ''}`;
      form.setFieldsValue({ [BLOCK_FIELDS.NAME]: newBlockName });
    }
  }


  return (
    <Modal
      title="Введите информацию о новом перегоне"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size="small"
        form={form}
        name="new-block-form"
        onFinish={onFinish}
        onValuesChange={onValuesChange}
      >
        <Form.Item
          label="Наименование"
          name={BLOCK_FIELDS.NAME}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredNameErrMess('Пожалуйста, введите наименование перегона!');
                } else {
                  setRequiredNameErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(blockFieldsErrs && blockFieldsErrs[BLOCK_FIELDS.NAME]) || requiredNameErrMess ? ERR_VALIDATE_STATUS : null}
          help={(blockFieldsErrs && blockFieldsErrs[BLOCK_FIELDS.NAME]) || requiredNameErrMess}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
            placeholder="Введите наименование перегона"
            allowClear
          />
        </Form.Item>

        <Form.Item
          label="Станция 1"
          name={BLOCK_FIELDS.STATION1}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredStation1ErrMess('Пожалуйста, выберите граничную станцию перегона!');
                } else {
                  setRequiredStation1ErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(blockFieldsErrs && blockFieldsErrs[BLOCK_FIELDS.STATION1]) || requiredStation1ErrMess ? ERR_VALIDATE_STATUS : null}
          help={(blockFieldsErrs && blockFieldsErrs[BLOCK_FIELDS.STATION1]) || requiredStation1ErrMess}
        >
          <Select
            showSearch
            placeholder="Выберите граничную станцию перегона"
            optionFilterProp="label"
            filterOption={(input, option) =>
              option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
          {
            stations &&
            stations.map(station =>
              <Option
                key={station[STATION_FIELDS.KEY]}
                value={station[STATION_FIELDS.KEY]}
                label={station[STATION_FIELDS.NAME_AND_CODE]}
              >
                {station[STATION_FIELDS.NAME_AND_CODE]}
              </Option>
            )
          }
          </Select>
        </Form.Item>

        <Form.Item
          label="Станция 2"
          name={BLOCK_FIELDS.STATION2}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredStation2ErrMess('Пожалуйста, выберите граничную станцию перегона!');
                } else {
                  setRequiredStation2ErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(blockFieldsErrs && blockFieldsErrs[BLOCK_FIELDS.STATION2]) || requiredStation2ErrMess ? ERR_VALIDATE_STATUS : null}
          help={(blockFieldsErrs && blockFieldsErrs[BLOCK_FIELDS.STATION2]) || requiredStation2ErrMess}
        >
          <Select
            showSearch
            placeholder="Выберите граничную станцию перегона"
            optionFilterProp="label"
            filterOption={(input, option) =>
              option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
          {
            stations &&
            stations.map(station =>
              <Option
                key={station[STATION_FIELDS.KEY]}
                value={station[STATION_FIELDS.KEY]}
                label={station[STATION_FIELDS.NAME_AND_CODE]}
              >
                {station[STATION_FIELDS.NAME_AND_CODE]}
              </Option>
            )
          }
          </Select>
        </Form.Item>

        <Form.Item>
          <div className="new-item-modal-btns-block">
            <Button htmlType="button" onClick={onReset} className="new-item-modal-btn" type="primary">
              Очистить поля
            </Button>
            <Button htmlType="submit" className="new-item-modal-btn" type="primary">
              Добавить запись
            </Button>
            <Button htmlType="button" onClick={onCancel} className="new-item-modal-btn" type="primary">
              Отмена
            </Button>
          </div>
        </Form.Item>

        { recsBeingAdded > 0 && <Text type="warning">На сервер отправлено {recsBeingAdded} новых записей. Ожидаю ответ...</Text> }
      </Form>
    </Modal>
  );
};


export default NewBlockModal;
