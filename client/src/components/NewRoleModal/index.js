import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography, Checkbox } from 'antd';
import { ROLE_FIELDS } from '../../constants';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новой роли.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   handleAddNewRoleOk,
 *   handleAddNewRoleCancel,
 *   roleFieldsErrs,
 *   clearAddRoleMessages,
 *   recsBeingAdded,
 */
const NewRoleModal = ({
  isModalVisible,
  handleAddNewRoleOk,
  handleAddNewRoleCancel,
  roleFieldsErrs,
  clearAddRoleMessages,
  recsBeingAdded,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();

  const [requiredAbbrevErrMess, setRequiredAbbrevErrMess] = useState(null);


  /**
   * Чистим поля ввода информации о новой роли.
   */
  const onReset = () => {
    form.resetFields();
  };


  const resetAll = () => {
    // Чистим все сообщения
    clearAddRoleMessages();
    setRequiredAbbrevErrMess(null);
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   *
   * @param {object} values
   */
  const onFinish = (values) => {
    resetAll();
    handleAddNewRoleOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewRoleCancel();
    // Чистим поля ввода
    onReset();
    resetAll();
  };


  return (
    <Modal
      title="Введите информацию о новой роли"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size="small"
        form={form}
        name="new-role-form"
        onFinish={onFinish}
        initialValues={{
          [ROLE_FIELDS.SUB_ADMIN_CAN_USE]: false,
        }}
      >
        <Form.Item
          label="Аббревиатура"
          name={ROLE_FIELDS.ENGL_ABBREVIATION}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredAbbrevErrMess('Пожалуйста, введите аббревиатуру роли!');
                } else {
                  setRequiredAbbrevErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(roleFieldsErrs && roleFieldsErrs[ROLE_FIELDS.ENGL_ABBREVIATION]) || requiredAbbrevErrMess ? ERR_VALIDATE_STATUS : null}
          help={(roleFieldsErrs && roleFieldsErrs[ROLE_FIELDS.ENGL_ABBREVIATION]) || requiredAbbrevErrMess}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
            placeholder="Введите аббревиатуру роли"
            allowClear
          />
        </Form.Item>

        <Form.Item
          label="Описание"
          name={ROLE_FIELDS.DESCRIPTION}
          validateStatus={roleFieldsErrs && roleFieldsErrs[ROLE_FIELDS.DESCRIPTION] ? ERR_VALIDATE_STATUS : null}
          help={roleFieldsErrs ? roleFieldsErrs[ROLE_FIELDS.DESCRIPTION] : null}
        >
          <Input
            autoComplete="off"
            placeholder="Введите описание роли"
            allowClear
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


export default NewRoleModal;
