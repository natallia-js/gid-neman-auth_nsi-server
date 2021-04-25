import React from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';
import { APP_FIELDS } from '../../constants';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новом приложении.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   handleAddNewAppOk,
 *   handleAddNewAppCancel,
 *   commonAddErr,
 *   appFieldsErrs,
 *   clearAddAppMessages,
 *   successSaveMessage,
 */
const NewAppModal = ({
  isModalVisible,
  handleAddNewAppOk,
  handleAddNewAppCancel,
  commonAddErr,
  appFieldsErrs,
  clearAddAppMessages,
  successSaveMessage,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();


  /**
   * Чистим поля ввода информации о новом приложении.
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
    clearAddAppMessages();
    handleAddNewAppOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewAppCancel();
    // Чистим поля ввода
    onReset();
    // Чистим все сообщения
    clearAddAppMessages();
  };


  return (
    <Modal
      title="Введите информацию о новом приложении"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size='small'
        form={form}
        name="new-app-form"
        onFinish={onFinish}
      >
        { successSaveMessage && <Text type="success">{successSaveMessage}</Text>}
        { commonAddErr && <Text type="danger">{commonAddErr}</Text> }

        <Form.Item
          label="Аббревиатура"
          name={APP_FIELDS.SHORT_TITLE}
          validateStatus={appFieldsErrs && appFieldsErrs[APP_FIELDS.SHORT_TITLE] ? ERR_VALIDATE_STATUS : null}
          help={appFieldsErrs ? appFieldsErrs[APP_FIELDS.SHORT_TITLE] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, введите аббревиатуру приложения!',
            },
          ]}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
            placeholder="Введите аббревиатуру приложения"
          />
        </Form.Item>

        <Form.Item
          label="Полное наименование"
          name={APP_FIELDS.TITLE}
          validateStatus={appFieldsErrs && appFieldsErrs[APP_FIELDS.TITLE] ? ERR_VALIDATE_STATUS : null}
          help={appFieldsErrs ? appFieldsErrs[APP_FIELDS.TITLE] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, введите полное наименование приложения!',
            },
          ]}
        >
          <Input
            autoComplete="off"
            placeholder="Введите полное наименование приложения"
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
      </Form>
    </Modal>
  );
};


export default NewAppModal;
