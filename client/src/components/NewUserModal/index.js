import React from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';
import { USER_FIELDS } from '../../constants';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новом пользователе.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   handleAddNewUserOk,
 *   handleAddNewUserCancel,
 *   commonAddErr,
 *   userFieldsErrs,
 *   clearAddUserMessages,
 *   successSaveMessage,
 */
const NewUserModal = ({
  isModalVisible,
  handleAddNewUserOk,
  handleAddNewUserCancel,
  commonAddErr,
  userFieldsErrs,
  clearAddUserMessages,
  successSaveMessage,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();


  /**
   * Чистим поля ввода информации о новом пользователе.
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
    clearAddUserMessages();
    handleAddNewUserOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewUserCancel();
    // Чистим поля ввода
    onReset();
    // Чистим все сообщения
    clearAddUserMessages();
  };


  return (
    <Modal
      title="Введите информацию о новом пользователе"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size='small'
        form={form}
        name="new-user-form"
        onFinish={onFinish}
      >
        { successSaveMessage && <Text type="success">{successSaveMessage}</Text>}
        { commonAddErr && <Text type="danger">{commonAddErr}</Text> }

        <Form.Item
          label="Логин"
          name={USER_FIELDS.LOGIN}
          validateStatus={userFieldsErrs && userFieldsErrs[USER_FIELDS.LOGIN] ? ERR_VALIDATE_STATUS : null}
          help={userFieldsErrs ? userFieldsErrs[USER_FIELDS.LOGIN] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, введите логин!',
            },
          ]}
        >
          <Input
            autoFocus={true}
            placeholder="Введите логин"
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          label="Пароль"
          name={USER_FIELDS.PASSWORD}
          validateStatus={userFieldsErrs && userFieldsErrs[USER_FIELDS.PASSWORD] ? ERR_VALIDATE_STATUS : null}
          help={userFieldsErrs ? userFieldsErrs[USER_FIELDS.PASSWORD] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, введите пароль!',
            },
          ]}
        >
          <Input
            placeholder="Введите пароль"
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          label="Имя"
          name={USER_FIELDS.NAME}
          validateStatus={userFieldsErrs && userFieldsErrs[USER_FIELDS.NAME] ? ERR_VALIDATE_STATUS : null}
          help={userFieldsErrs ? userFieldsErrs[USER_FIELDS.NAME] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, введите имя!',
            },
          ]}
        >
          <Input
            placeholder="Введите имя"
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          label="Отчество"
          name={USER_FIELDS.FATHERNAME}
          validateStatus={userFieldsErrs && userFieldsErrs[USER_FIELDS.FATHERNAME] ? ERR_VALIDATE_STATUS : null}
          help={userFieldsErrs ? userFieldsErrs[USER_FIELDS.FATHERNAME] : null}
        >
          <Input
            placeholder="Введите отчество"
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          label="Фамилия"
          name={USER_FIELDS.SURNAME}
          validateStatus={userFieldsErrs && userFieldsErrs[USER_FIELDS.SURNAME] ? ERR_VALIDATE_STATUS : null}
          help={userFieldsErrs ? userFieldsErrs[USER_FIELDS.SURNAME] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, введите фамилию!',
            },
          ]}
        >
          <Input
            placeholder="Введите фамилию"
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          label="Должность"
          name={USER_FIELDS.POST}
          validateStatus={userFieldsErrs && userFieldsErrs[USER_FIELDS.POST] ? ERR_VALIDATE_STATUS : null}
          help={userFieldsErrs ? userFieldsErrs[USER_FIELDS.POST] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, введите должность!',
            },
          ]}
        >
          <Input
            placeholder="Введите должность"
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          label="Служба"
          name={USER_FIELDS.SERVICE}
          validateStatus={userFieldsErrs && userFieldsErrs[USER_FIELDS.SERVICE] ? ERR_VALIDATE_STATUS : null}
          help={userFieldsErrs ? userFieldsErrs[USER_FIELDS.SERVICE] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, введите наименование службы!',
            },
          ]}
        >
          <Input
            placeholder="Введите наименование службы"
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          label="Участок"
          name={USER_FIELDS.SECTOR}
          validateStatus={userFieldsErrs && userFieldsErrs[USER_FIELDS.SECTOR] ? ERR_VALIDATE_STATUS : null}
          help={userFieldsErrs ? userFieldsErrs[USER_FIELDS.SECTOR] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, введите наименование участка!',
            },
          ]}
        >
          <Input
            placeholder="Введите наименование участка"
            autoComplete="off"
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


export default NewUserModal;
