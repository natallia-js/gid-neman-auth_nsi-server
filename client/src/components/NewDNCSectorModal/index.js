import React, { useRef } from 'react';
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

  // Ref для кнопки подтверждения ввода
  const submitBtnRef = useRef(null);

  // Для полей ввода формы
  const layout = {
    labelCol: {
      span: 8,
    },
    wrapperCol: {
      span: 16,
    },
  };


  /**
   * Чистим поля ввода информации о новом участке.
   */
  const onReset = () => {
    form.resetFields();
  };


  /**
   * При нажатии кнопки Enter на текстовом поле ввода происходит подтверждение
   * пользователем окончания ввода.
   *
   * @param {object} event
   */
  const handleDNCSectorDataFieldClick = (event) => {
    if (event.key === 'Enter') {
      submitBtnRef.current.click();
    }
  }


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
        {...layout}
        layout="horizontal"
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
            onClick={handleDNCSectorDataFieldClick}
          />
        </Form.Item>

        <Form.Item>
          <Button htmlType="button" onClick={onReset}>
            Очистить поля
          </Button>
          <Button htmlType="submit" ref={submitBtnRef}>
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
