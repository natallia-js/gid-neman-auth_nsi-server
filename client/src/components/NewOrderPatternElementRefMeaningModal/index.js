import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новом значении, которое может принимать элемент
 * шаблона распоряжения, имеющий заданное смысловое значение.
 */
const NewOrderPatternElementRefMeaningModal = ({
  isModalVisible,
  handleAddNewRecOk,
  handleAddNewRecCancel,
  recFieldsErrs,
  clearAddRecMessages,
  recsBeingAdded,
}) => {
  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();

  const [requiredRefMeaningNameErrMess, setRequiredRefMeaningNameErrMess] = useState(null);


  /**
   * Чистим поля ввода информации о новом значении.
   */
  const onReset = () => {
    form.resetFields();
  };


  const resetAll = () => {
    // Чистим все сообщения
    clearAddRecMessages();
    setRequiredRefMeaningNameErrMess(null);
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   *
   * @param {object} values
   */
  const onFinish = (values) => {
    if (requiredRefMeaningNameErrMess)
      return;
    resetAll();
    handleAddNewRecOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewRecCancel();
    // Чистим поля ввода
    onReset();
    resetAll();
  };


  return (
    <Modal
      title="Укажите новое допустимое значение элемента"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size='small'
        form={form}
        name="new-order-pattern-ref-meaning-form"
        onFinish={onFinish}
      >
        <Form.Item
          label="Значение"
          name="Meaning"
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredRefMeaningNameErrMess('Пожалуйста, введите допустимое значение элемента!');
                } else {
                  setRequiredRefMeaningNameErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(recFieldsErrs && recFieldsErrs.refMeaning) || requiredRefMeaningNameErrMess ? ERR_VALIDATE_STATUS : null}
          help={(recFieldsErrs && recFieldsErrs.refMeaning) || requiredRefMeaningNameErrMess}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
            placeholder="Введите допустимое значение"
            allowClear
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


export default NewOrderPatternElementRefMeaningModal;
