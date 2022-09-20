import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';
import { SERVICE_FIELDS } from '../../constants';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новой службе.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   handleAddNewServiceOk,
 *   handleAddNewServiceCancel,
 *   serviceFieldsErrs,
 *   clearAddServiceMessages,
 *   recsBeingAdded,
 */
const NewServiceModal = ({
  isModalVisible,
  handleAddNewServiceOk,
  handleAddNewServiceCancel,
  serviceFieldsErrs,
  clearAddServiceMessages,
  recsBeingAdded,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();

  const [requiredAbbrevErrMess, setRequiredAbbrevErrMess] = useState(null);
  const [requiredTitleErrMess, setRequiredTitleErrMess] = useState(null);


  /**
   * Чистим поля ввода информации о новой службе.
   */
  const onReset = () => {
    form.resetFields();
  };


  const resetAll = () => {
    // Чистим все сообщения
    clearAddServiceMessages();
    setRequiredAbbrevErrMess(null);
    setRequiredTitleErrMess(null);
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   *
   * @param {object} values
   */
  const onFinish = (values) => {
    if (requiredAbbrevErrMess || requiredTitleErrMess)
      return;
    resetAll();
    handleAddNewServiceOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewServiceCancel();
    // Чистим поля ввода
    onReset();
    resetAll();
  };


  return (
    <Modal
      title="Введите информацию о новой службе"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size='small'
        form={form}
        name="new-service-form"
        onFinish={onFinish}
      >
        <Form.Item
          label="Аббревиатура"
          name={SERVICE_FIELDS.ABBREV}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredAbbrevErrMess('Пожалуйста, введите аббревиатуру службы!');
                } else {
                  setRequiredAbbrevErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(serviceFieldsErrs && serviceFieldsErrs[SERVICE_FIELDS.ABBREV]) || requiredAbbrevErrMess ? ERR_VALIDATE_STATUS : null}
          help={(serviceFieldsErrs && serviceFieldsErrs[SERVICE_FIELDS.ABBREV]) || requiredAbbrevErrMess}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
            placeholder="Введите аббревиатуру"
            allowClear
          />
        </Form.Item>

        <Form.Item
          label="Наименование"
          name={SERVICE_FIELDS.TITLE}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredTitleErrMess('Пожалуйста, введите наименование службы!');
                } else {
                  setRequiredTitleErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(serviceFieldsErrs && serviceFieldsErrs[SERVICE_FIELDS.TITLE]) || requiredTitleErrMess ? ERR_VALIDATE_STATUS : null}
          help={(serviceFieldsErrs && serviceFieldsErrs[SERVICE_FIELDS.TITLE]) || requiredTitleErrMess}
        >
          <Input
            autoComplete="off"
            placeholder="Введите наименование службы"
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


export default NewServiceModal;
