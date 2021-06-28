import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';
import { STATION_TRACK_FIELDS } from '../../constants';

const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новом пути станции.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   handleAddNewStationTrackOk,
 *   handleAddNewStationTrackCancel,
 *   stationTrackFieldsErrs,
 *   clearAddStationTrackMessages,
 *   recsBeingAdded,
 */
const NewStationTrackModal = ({
  isModalVisible,
  handleAddNewStationTrackOk,
  handleAddNewStationTrackCancel,
  stationTrackFieldsErrs,
  clearAddStationTrackMessages,
  recsBeingAdded,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();

  const [requiredTrackErrMess, setRequiredTrackErrMess] = useState(null);

  /**
   * Чистим поля ввода информации о новом пути.
   */
  const onReset = () => {
    form.resetFields();
  };


  const resetAll = () => {
    // Чистим все сообщения
    clearAddStationTrackMessages();
    setRequiredTrackErrMess(null);
  };


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   *
   * @param {object} values
   */
  const onFinish = (values) => {
    resetAll();
    handleAddNewStationTrackOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewStationTrackCancel();
    // Чистим поля ввода
    onReset();
    resetAll();
  };


  return (
    <Modal
      title="Введите информацию о новом пути станции"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size="small"
        form={form}
        name="new-station-track-form"
        onFinish={onFinish}
      >
        <Form.Item
          label="Наименование"
          name={STATION_TRACK_FIELDS.NAME}
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value || value.length < 1) {
                  setRequiredTrackErrMess('Пожалуйста, введите наименование пути!');
                } else {
                  setRequiredTrackErrMess(null);
                }
              },
            },
          ]}
          validateStatus={(stationTrackFieldsErrs && stationTrackFieldsErrs[STATION_TRACK_FIELDS.NAME]) || requiredTrackErrMess ? ERR_VALIDATE_STATUS : null}
          help={(stationTrackFieldsErrs && stationTrackFieldsErrs[STATION_TRACK_FIELDS.NAME]) || requiredTrackErrMess}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
            placeholder="Введите наименование"
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


export default NewStationTrackModal;
