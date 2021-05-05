import React from 'react';
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


  /**
   * Чистим поля ввода информации о новом перегоне.
   */
  const onReset = () => {
    form.resetFields();
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   *
   * @param {object} values
   */
  const onFinish = (values) => {
    // Чистим все сообщения
    clearAddBlockMessages();
    handleAddNewBlockOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewBlockCancel();
    // Чистим поля ввода
    onReset();
    // Чистим все сообщения
    clearAddBlockMessages();
  };


  return (
    <Modal
      title="Введите информацию о новом перегоне"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size='small'
        form={form}
        name="new-block-form"
        onFinish={onFinish}
      >
        <Form.Item
          label="Наименование"
          name={BLOCK_FIELDS.NAME}
          validateStatus={blockFieldsErrs && blockFieldsErrs[BLOCK_FIELDS.NAME] ? ERR_VALIDATE_STATUS : null}
          help={blockFieldsErrs ? blockFieldsErrs[BLOCK_FIELDS.NAME] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, введите наименование перегона!',
            },
          ]}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          label="Станция 1"
          name={BLOCK_FIELDS.STATION1}
          validateStatus={blockFieldsErrs && blockFieldsErrs[BLOCK_FIELDS.STATION1] ? ERR_VALIDATE_STATUS : null}
          help={blockFieldsErrs ? blockFieldsErrs[BLOCK_FIELDS.STATION1] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, выберите граничную станцию перегона!',
            },
          ]}
        >
          <Select>
          {
            stations &&
            stations.map(station =>
              <Option
                key={station[STATION_FIELDS.KEY]}
                value={station[STATION_FIELDS.KEY]}
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
          validateStatus={blockFieldsErrs && blockFieldsErrs[BLOCK_FIELDS.STATION2] ? ERR_VALIDATE_STATUS : null}
          help={blockFieldsErrs ? blockFieldsErrs[BLOCK_FIELDS.STATION2] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, выберите граничную станцию перегона!',
            },
          ]}
        >
          <Select>
          {
            stations &&
            stations.map(station =>
              <Option
                key={station[STATION_FIELDS.KEY]}
                value={station[STATION_FIELDS.KEY]}
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
