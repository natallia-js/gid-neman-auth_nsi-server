import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления либо редактирования наименования категории распоряжения.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   orderCategoryName,
 *   handleOk,
 *   handleCancel,
 *   fieldsErrs,
 *   clearMessages,
 *   recsBeingProcessed,
 */
const NewOrEditOrderCategoryModal = ({
  isModalVisible,
  orderCategoryName,
  handleOk,
  handleCancel,
  fieldsErrs,
  clearMessages,
  recsBeingProcessed,
}) => {
  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();

  const [requiredNameErrMess, setRequiredNameErrMess] = useState(null);


  /**
   * Устанавливаем исходные значения полей ввода информации.
   */
  useEffect(() => {
    form.setFieldsValue({ name: orderCategoryName });
  }, [form, orderCategoryName]);


  /**
   * Чистим поля ввода информации.
   */
  const onReset = () => {
    form.resetFields();
  };


  const resetAll = () => {
    // Чистим все сообщения
    clearMessages();
    setRequiredNameErrMess(null);
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   *
   * @param {object} values
   */
  const onFinish = (values) => {
    resetAll();
    handleOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleCancel();
    // Чистим поля ввода
    onReset();
    resetAll();
  };


  return (
    <Modal
      title={
        !orderCategoryName ?
        'Введите информацию о новой категории распоряжений' :
        'Редактирование существующей категории распоряжений'
      }
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size='small'
        form={form}
        name="new-order-category-form"
        onFinish={onFinish}
      >
        <Form.Item
          label="Наименование категории распоряжений"
          name="name"
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredNameErrMess('Пожалуйста, введите наименование категории распоряжений!');
                } else {
                  setRequiredNameErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(fieldsErrs && fieldsErrs['name']) || requiredNameErrMess ? ERR_VALIDATE_STATUS : null}
          help={(fieldsErrs && fieldsErrs['name']) || requiredNameErrMess}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
            placeholder="Введите наименование категории распоряжений"
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

        { recsBeingProcessed > 0 && <Text type="warning">На сервер отправлено {recsBeingProcessed} запросов. Ожидаю ответ...</Text> }
      </Form>
    </Modal>
  );
};


export default NewOrEditOrderCategoryModal;
