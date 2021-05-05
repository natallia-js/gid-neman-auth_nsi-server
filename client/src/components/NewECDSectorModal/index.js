import React from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';
import { ECDSECTOR_FIELDS } from '../../constants';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новом участке ЭЦД.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   handleAddNewECDSectorOk,
 *   handleAddNewECDSectorCancel,
 *   ecdSectorFieldsErrs,
 *   clearAddECDSectorMessages,
 *   recsBeingAdded,
 */
const NewECDSectorModal = ({
  isModalVisible,
  handleAddNewECDSectorOk,
  handleAddNewECDSectorCancel,
  ecdSectorFieldsErrs,
  clearAddECDSectorMessages,
  recsBeingAdded,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();


  /**
   * Чистим поля ввода информации о новом участке.
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
    clearAddECDSectorMessages();
    handleAddNewECDSectorOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewECDSectorCancel();
    // Чистим поля ввода
    onReset();
    // Чистим все сообщения
    clearAddECDSectorMessages();
  };


  return (
    <Modal
      title="Введите информацию о новом участке ЭЦД"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size='small'
        form={form}
        name="new-ecdsector-form"
        onFinish={onFinish}
      >
        <Form.Item
          label="Наименование"
          name={ECDSECTOR_FIELDS.NAME}
          validateStatus={ecdSectorFieldsErrs && ecdSectorFieldsErrs[ECDSECTOR_FIELDS.NAME] ? ERR_VALIDATE_STATUS : null}
          help={ecdSectorFieldsErrs ? ecdSectorFieldsErrs[ECDSECTOR_FIELDS.NAME] : null}
          rules={[
            {
              required: true,
              message: 'Пожалуйста, введите наименование участка!',
            },
          ]}
        >
          <Input
            autoFocus={true}
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


export default NewECDSectorModal;
