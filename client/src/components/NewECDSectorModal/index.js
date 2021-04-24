import React from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';
import { ECDSECTOR_FIELDS } from '../../constants';

import 'antd/dist/antd.css';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новом участке ЭЦД.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   handleAddNewECDSectorOk,
 *   handleAddNewECDSectorCancel,
 *   commonAddErr,
 *   ecdSectorFieldsErrs,
 *   clearAddECDSectorMessages,
 *   successSaveMessage,
 */
const NewECDSectorModal = ({
  isModalVisible,
  handleAddNewECDSectorOk,
  handleAddNewECDSectorCancel,
  commonAddErr,
  ecdSectorFieldsErrs,
  clearAddECDSectorMessages,
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
    clearAddECDSectorMessages();
    handleAddNewECDSectorOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewECDSectorCancel();
    // Чистим поля ввода
    onReset();
    // Чистим все сообщения
    clearAddECDSectorMessages();
  };


  return (
    <Modal
      title="Введите информацию о новом участке ЭЦД"
      visible={isModalVisible}
      footer={[]}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size='small'
        form={form}
        name="new-ecdsector-form"
        onFinish={onFinish}
      >
        { successSaveMessage && <Text type="success">{successSaveMessage}</Text>}
        { commonAddErr && <Text type="danger">{commonAddErr}</Text> }

        <Form.Item
          label="Наименование"
          name={ECDSECTOR_FIELDS.NAME}
          validateStatus={ecdSectorFieldsErrs && ecdSectorFieldsErrs[ECDSECTOR_FIELDS.NAME] ? ERR_VALIDATE_STATUS : null}
          help={ecdSectorFieldsErrs ? ecdSectorFieldsErrs[ECDSECTOR_FIELDS.NAME] : null}
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


export default NewECDSectorModal;
