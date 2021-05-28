import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';
import { APP_CRED_FIELDS } from '../../constants';

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
 *   appCredFieldsErrs,
 *   clearAddAppCredMessages,
 *   recsBeingAdded,
 */
const NewAppCredModal = ({
  appId,
  isModalVisible,
  handleAddNewAppCredOk,
  handleAddNewAppCredCancel,
  appCredFieldsErrs,
  clearAddAppCredMessages,
  recsBeingAdded,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();

  const [requiredCredErrMess, setRequiredCredErrMess] = useState(null);

  /**
   * Чистим поля ввода информации о новом полномочии.
   */
  const onReset = () => {
    form.resetFields();
  };


  const resetAll = () => {
    // Чистим все сообщения
    clearAddAppCredMessages();
    setRequiredCredErrMess(null);
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   *
   * @param {object} values
   */
  const onFinish = (values) => {
    resetAll();
    handleAddNewAppCredOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewAppCredCancel();
    // Чистим поля ввода
    onReset();
    resetAll();
  };


  return (
    <Modal
      title="Введите информацию о новом полномочии в приложении"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size="small"
        form={form}
        name="new-app-cred-form"
        onFinish={onFinish}
      >
        <Form.Item
          label="Аббревиатура"
          name={APP_CRED_FIELDS.ENGL_ABBREVIATION}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredCredErrMess('Пожалуйста, введите аббревиатуру полномочия!');
                } else {
                  setRequiredCredErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(appCredFieldsErrs && appCredFieldsErrs[APP_CRED_FIELDS.ENGL_ABBREVIATION]) || requiredCredErrMess ? ERR_VALIDATE_STATUS : null}
          help={(appCredFieldsErrs && appCredFieldsErrs[APP_CRED_FIELDS.ENGL_ABBREVIATION]) || requiredCredErrMess}
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


export default NewAppCredModal;
