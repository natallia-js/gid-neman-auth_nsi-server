import React from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';
import { POST_FIELDS } from '../../constants';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новой должности.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   handleAddNewPostOk,
 *   handleAddNewPostCancel,
 *   postFieldsErrs,
 *   clearAddPostMessages,
 *   recsBeingAdded,
 */
const NewPostModal = ({
  isModalVisible,
  handleAddNewPostOk,
  handleAddNewPostCancel,
  postFieldsErrs,
  clearAddPostMessages,
  recsBeingAdded,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();


  /**
   * Чистим поля ввода информации о новой должности.
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
    clearAddPostMessages();
    handleAddNewPostOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewPostCancel();
    // Чистим поля ввода
    onReset();
    // Чистим все сообщения
    clearAddPostMessages();
  };


  return (
    <Modal
      title="Введите информацию о новой должности"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size='small'
        form={form}
        name="new-post-form"
        onFinish={onFinish}
      >
        <Form.Item
          label="Аббревиатура"
          name={POST_FIELDS.ABBREV}
          validateStatus={postFieldsErrs && postFieldsErrs[POST_FIELDS.ABBREV] ? ERR_VALIDATE_STATUS : null}
          help={postFieldsErrs ? postFieldsErrs[POST_FIELDS.ABBREV] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, введите аббревиатуру должности!',
            },
          ]}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          label="Наименование"
          name={POST_FIELDS.TITLE}
          validateStatus={postFieldsErrs && postFieldsErrs[POST_FIELDS.TITLE] ? ERR_VALIDATE_STATUS : null}
          help={postFieldsErrs ? postFieldsErrs[POST_FIELDS.TITLE] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, введите наименование должности!',
            },
          ]}
        >
          <Input
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

        { recsBeingAdded > 0 && <Text type="warning">На сервер отправлено {recsBeingAdded} новых записей. Ожидаю ответ...</Text> }
      </Form>
    </Modal>
  );
};


export default NewPostModal;
