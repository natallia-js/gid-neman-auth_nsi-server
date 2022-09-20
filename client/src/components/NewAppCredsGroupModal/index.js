import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';
import { APP_CREDS_GROUP_FIELDS } from '../../constants';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новой группе полномочий в приложениях ГИД Неман.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   handleAddNewAppCredsGroupOk,
 *   handleAddNewAppCredsGroupCancel,
 *   appFieldsErrs,
 *   clearAddAppCredsGroupMessages,
 *   recsBeingAdded,
 */
const NewAppCredsGroupModal = ({
  isModalVisible,
  handleAddNewAppCredsGroupOk,
  handleAddNewAppCredsGroupCancel,
  appFieldsErrs,
  clearAddAppCredsGroupMessages,
  recsBeingAdded,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();

  const [requiredShortTitleErrMess, setRequiredShortTitleErrMess] = useState(null);
  const [requiredTitleErrMess, setRequiredTitleErrMess] = useState(null);


  /**
   * Чистим поля ввода информации о новой группе полномочий.
   */
  const onReset = () => {
    form.resetFields();
  };


  const resetAll = () => {
    // Чистим все сообщения
    clearAddAppCredsGroupMessages();
    setRequiredShortTitleErrMess(null);
    setRequiredTitleErrMess(null);
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   *
   * @param {object} values
   */
  const onFinish = (values) => {
    if (requiredShortTitleErrMess || requiredTitleErrMess)
      return;
    resetAll();
    handleAddNewAppCredsGroupOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewAppCredsGroupCancel();
    // Чистим поля ввода
    onReset();
    resetAll();
  };


  return (
    <Modal
      title="Введите информацию о новой группе полномочий"
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
        <Form.Item
          label="Аббревиатура"
          name={APP_CREDS_GROUP_FIELDS.SHORT_TITLE}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredShortTitleErrMess('Пожалуйста, введите аббревиатуру группы полномочий!');
                } else {
                  setRequiredShortTitleErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(appFieldsErrs && appFieldsErrs[APP_CREDS_GROUP_FIELDS.SHORT_TITLE]) || requiredShortTitleErrMess ? ERR_VALIDATE_STATUS : null}
          help={(appFieldsErrs && appFieldsErrs[APP_CREDS_GROUP_FIELDS.SHORT_TITLE]) || requiredShortTitleErrMess}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
            placeholder="Введите аббревиатуру группы полномочий"
            allowClear
          />
        </Form.Item>

        <Form.Item
          label="Полное наименование"
          name={APP_CREDS_GROUP_FIELDS.TITLE}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredTitleErrMess('Пожалуйста, введите полное наименование группы полномочий!');
                } else {
                  setRequiredTitleErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(appFieldsErrs && appFieldsErrs[APP_CREDS_GROUP_FIELDS.TITLE]) || requiredTitleErrMess ? ERR_VALIDATE_STATUS : null}
          help={(appFieldsErrs && appFieldsErrs[APP_CREDS_GROUP_FIELDS.TITLE]) || requiredTitleErrMess}
        >
          <Input
            autoComplete="off"
            placeholder="Введите полное наименование группы полномочий"
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


export default NewAppCredsGroupModal;
