import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';
import { DNCSECTOR_FIELDS } from '../../constants';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новом участке ДНЦ.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   handleAddNewDNCSectorOk,
 *   handleAddNewDNCSectorCancel,
 *   dncSectorFieldsErrs,
 *   clearAddDNCSectorMessages,
 *   recsBeingAdded,
 */
const NewDNCSectorModal = ({
  isModalVisible,
  handleAddNewDNCSectorOk,
  handleAddNewDNCSectorCancel,
  dncSectorFieldsErrs,
  clearAddDNCSectorMessages,
  recsBeingAdded,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();

  const [requiredNameErrMess, setRequiredNameErrMess] = useState(null);


  /**
   * Чистим поля ввода информации о новом участке.
   */
  const onReset = () => {
    form.resetFields();
  };


  const resetAll = () => {
    // Чистим все сообщения
    clearAddDNCSectorMessages();
    setRequiredNameErrMess(null);
  };



  /**
   * Обработка события подтверждения пользователем окончания ввода.
   *
   * @param {object} values
   */
  const onFinish = (values) => {
    resetAll();
    handleAddNewDNCSectorOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewDNCSectorCancel();
    // Чистим поля ввода
    onReset();
    resetAll();
  };


  return (
    <Modal
      title="Введите информацию о новом участке ДНЦ"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size='small'
        form={form}
        name="new-dncsector-form"
        onFinish={onFinish}
      >
        <Form.Item
          label="Наименование"
          name={DNCSECTOR_FIELDS.NAME}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredNameErrMess('Пожалуйста, введите наименование участка!');
                } else {
                  setRequiredNameErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(dncSectorFieldsErrs && dncSectorFieldsErrs[DNCSECTOR_FIELDS.NAME]) || requiredNameErrMess ? ERR_VALIDATE_STATUS : null}
          help={(dncSectorFieldsErrs && dncSectorFieldsErrs[DNCSECTOR_FIELDS.NAME]) || requiredNameErrMess}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
            placeholder="Введите наименование участка"
          />
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


export default NewDNCSectorModal;
