import React from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';
import { DNCSECTOR_FIELDS } from '../../constants';

import 'antd/dist/antd.css';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новом участке ДНЦ.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   handleAddNewDNCSectorOk,
 *   handleAddNewDNCSectorCancel,
 *   commonAddErr,
 *   dncSectorFieldsErrs,
 *   clearAddDNCSectorMessages,
 *   successSaveMessage,
 */
const NewDNCSectorModal = ({
  isModalVisible,
  handleAddNewDNCSectorOk,
  handleAddNewDNCSectorCancel,
  commonAddErr,
  dncSectorFieldsErrs,
  clearAddDNCSectorMessages,
  successSaveMessage,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();


  /**
   * Чистим поля ввода информации о новом участке.
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
    clearAddDNCSectorMessages();
    handleAddNewDNCSectorOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewDNCSectorCancel();
    // Чистим поля ввода
    onReset();
    // Чистим все сообщения
    clearAddDNCSectorMessages();
  };


  return (
    <Modal
      title="Введите информацию о новом участке ДНЦ"
      visible={isModalVisible}
      footer={[]}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size='small'
        form={form}
        name="new-dncsector-form"
        onFinish={onFinish}
      >
        { successSaveMessage && <Text type="success">{successSaveMessage}</Text>}
        { commonAddErr && <Text type="danger">{commonAddErr}</Text> }

        <Form.Item
          label="Наименование"
          name={DNCSECTOR_FIELDS.NAME}
          validateStatus={dncSectorFieldsErrs && dncSectorFieldsErrs[DNCSECTOR_FIELDS.NAME] ? ERR_VALIDATE_STATUS : null}
          help={dncSectorFieldsErrs ? dncSectorFieldsErrs[DNCSECTOR_FIELDS.NAME] : null}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
          />
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


export default NewDNCSectorModal;
