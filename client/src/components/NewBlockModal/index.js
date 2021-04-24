import React from 'react';
import { Modal, Form, Input, Button, Typography, Select } from 'antd';
import { BLOCK_FIELDS } from '../../constants';

import 'antd/dist/antd.css';

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
 *   commonAddErr,
 *   blockFieldsErrs,
 *   clearAddBlockMessages,
 *   successSaveMessage,
 *   stations,
 */
const NewBlockModal = ({
  isModalVisible,
  handleAddNewBlockOk,
  handleAddNewBlockCancel,
  commonAddErr,
  blockFieldsErrs,
  clearAddBlockMessages,
  successSaveMessage,
  stations,
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
      footer={[]}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size='small'
        form={form}
        name="new-block-form"
        onFinish={onFinish}
      >
        { successSaveMessage && <Text type="success">{successSaveMessage}</Text>}
        { commonAddErr && <Text type="danger">{commonAddErr}</Text> }

        <Form.Item
          label="Наименование"
          name={BLOCK_FIELDS.NAME}
          validateStatus={blockFieldsErrs && blockFieldsErrs[BLOCK_FIELDS.NAME] ? ERR_VALIDATE_STATUS : null}
          help={blockFieldsErrs ? blockFieldsErrs[BLOCK_FIELDS.NAME] : null}
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
        >
          <Select>
          {
            stations &&
            stations.map(station => <Option key={station.id} value={station.id}>{station.name}</Option>)
          }
          </Select>
        </Form.Item>

        <Form.Item
          label="Станция 2"
          name={BLOCK_FIELDS.STATION2}
          validateStatus={blockFieldsErrs && blockFieldsErrs[BLOCK_FIELDS.STATION2] ? ERR_VALIDATE_STATUS : null}
          help={blockFieldsErrs ? blockFieldsErrs[BLOCK_FIELDS.STATION2] : null}
        >
          <Select>
          {
            stations &&
            stations.map(station => <Option key={station.id} value={station.id}>{station.name}</Option>)
          }
          </Select>
        </Form.Item>

        <Form.Item>
          <Button htmlType="button" onClick={onReset}>
            Очистить поля
          </Button>
          <Button htmlType="submit">
            Добавить запись
          </Button>
          <Button htmlType="button" onClick={onCancel}>
            Отмена
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};


export default NewBlockModal;
