import React from 'react';
import { Modal, Form, Input, Button, Typography, Checkbox } from 'antd';
import { ROLE_FIELDS } from '../../constants';

import 'antd/dist/antd.css';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новой роли.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   handleAddNewRoleOk,
 *   handleAddNewRoleCancel,
 *   commonAddErr,
 *   roleFieldsErrs,
 *   clearAddRoleMessages,
 *   successSaveMessage,
 */
const NewRoleModal = ({
  isModalVisible,
  handleAddNewRoleOk,
  handleAddNewRoleCancel,
  commonAddErr,
  roleFieldsErrs,
  clearAddRoleMessages,
  successSaveMessage,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();


  /**
   * Чистим поля ввода информации о новой роли.
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
    clearAddRoleMessages();
    handleAddNewRoleOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewRoleCancel();
    // Чистим поля ввода
    onReset();
    // Чистим все сообщения
    clearAddRoleMessages();
  };


  return (
    <Modal
      title="Введите информацию о новой роли"
      visible={isModalVisible}
      footer={[]}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size='small'
        form={form}
        name="new-role-form"
        onFinish={onFinish}
        initialValues={{
          [ROLE_FIELDS.SUB_ADMIN_CAN_USE]: false,
        }}
      >
        { successSaveMessage && <Text type="success">{successSaveMessage}</Text>}
        { commonAddErr && <Text type="danger">{commonAddErr}</Text> }

        <Form.Item
          label="Аббревиатура"
          name={ROLE_FIELDS.ENGL_ABBREVIATION}
          validateStatus={roleFieldsErrs && roleFieldsErrs[ROLE_FIELDS.ENGL_ABBREVIATION] ? ERR_VALIDATE_STATUS : null}
          help={roleFieldsErrs ? roleFieldsErrs[ROLE_FIELDS.ENGL_ABBREVIATION] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, введите аббревиатуру роли!',
            },
          ]}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
            placeholder="Введите аббревиатуру роли"
          />
        </Form.Item>

        <Form.Item
          label="Описание"
          name={ROLE_FIELDS.DESCRIPTION}
          validateStatus={roleFieldsErrs && roleFieldsErrs[ROLE_FIELDS.DESCRIPTION] ? ERR_VALIDATE_STATUS : null}
          help={roleFieldsErrs ? roleFieldsErrs[ROLE_FIELDS.DESCRIPTION] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, введите описание роли!',
            },
          ]}
        >
          <Input
            autoComplete="off"
            placeholder="Введите описание роли"
          />
        </Form.Item>

        <Form.Item
          name={ROLE_FIELDS.SUB_ADMIN_CAN_USE}
          valuePropName="checked"
          validateStatus={roleFieldsErrs && roleFieldsErrs[ROLE_FIELDS.SUB_ADMIN_CAN_USE] ? ERR_VALIDATE_STATUS : null}
          help={roleFieldsErrs ? roleFieldsErrs[ROLE_FIELDS.SUB_ADMIN_CAN_USE] : null}
        >
          <Checkbox>
            Доступна администратору нижнего уровня
          </Checkbox>
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


export default NewRoleModal;
