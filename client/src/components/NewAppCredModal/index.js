import React from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';
import { APP_CRED_FIELDS } from '../../constants';

import 'antd/dist/antd.css';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новом полномочии приложения.
 *
 * @param {object} params - свойства компонента:
 *   appId,
 *   isModalVisible,
 *   handleAddNewAppCredOk,
 *   handleAddNewAppCredCancel,
 *   commonAddErr,
 *   appCredFieldsErrs,
 *   clearAddAppCredMessages,
 *   successSaveMessage,
 */
const NewAppCredModal = ({
  appId,
  isModalVisible,
  handleAddNewAppCredOk,
  handleAddNewAppCredCancel,
  commonAddErr,
  appCredFieldsErrs,
  clearAddAppCredMessages,
  successSaveMessage,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();


  /**
   * Чистим поля ввода информации о новом полномочии.
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
    clearAddAppCredMessages();
    handleAddNewAppCredOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewAppCredCancel();
    // Чистим поля ввода
    onReset();
    // Чистим все сообщения
    clearAddAppCredMessages();
  };


  return (
    <Modal
      title="Введите информацию о новом полномочии приложения"
      visible={isModalVisible}
      footer={[]}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size='small'
        form={form}
        name={`new-app-cred-form${appId}`}
        onFinish={onFinish}
      >
        { successSaveMessage && <Text type="success">{successSaveMessage}</Text>}
        { commonAddErr && <Text type="danger">{commonAddErr}</Text> }

        <Form.Item
          label="Аббревиатура"
          name={APP_CRED_FIELDS.ENGL_ABBREVIATION}
          validateStatus={appCredFieldsErrs && appCredFieldsErrs[APP_CRED_FIELDS.ENGL_ABBREVIATION] ? ERR_VALIDATE_STATUS : null}
          help={appCredFieldsErrs ? appCredFieldsErrs[APP_CRED_FIELDS.ENGL_ABBREVIATION] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, введите аббревиатуру полномочия!',
            },
          ]}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
            placeholder="Введите аббревиатуру"
          />
        </Form.Item>

        <Form.Item
          label="Описание"
          name={APP_CRED_FIELDS.DESCRIPTION}
          validateStatus={appCredFieldsErrs && appCredFieldsErrs[APP_CRED_FIELDS.DESCRIPTION] ? ERR_VALIDATE_STATUS : null}
          help={appCredFieldsErrs ? appCredFieldsErrs[APP_CRED_FIELDS.DESCRIPTION] : null}
        >
          <Input
            autoComplete="off"
            placeholder="Введите описание полномочия"
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


export default NewAppCredModal;
