import React from 'react';
import { Modal, Form, Input, Button, Select, Typography } from 'antd';
import { STATION_FIELDS, DNCSECTOR_FIELDS } from '../../constants';

const { Text } = Typography;
const { Option } = Select;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новой станции.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   handleAddNewStationOk,
 *   handleAddNewStationCancel,
 *   commonAddErr,
 *   stationFieldsErrs,
 *   clearAddStationMessages,
 *   successSaveMessage,
 *   dncSectors,
 */
const NewStationModal = ({
  isModalVisible,
  handleAddNewStationOk,
  handleAddNewStationCancel,
  commonAddErr,
  stationFieldsErrs,
  clearAddStationMessages,
  successSaveMessage,
  dncSectors,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();


  /**
   * Чистим поля ввода информации о новой станции.
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
    clearAddStationMessages();
    handleAddNewStationOk({ ...values });
  };


  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewStationCancel();
    // Чистим поля ввода
    onReset();
    // Чистим все сообщения
    clearAddStationMessages();
  };


  return (
    <Modal
      title="Введите информацию о новой станции"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        layout="vertical"
        size='small'
        form={form}
        name="new-station-form"
        onFinish={onFinish}
      >
        { successSaveMessage && <Text type="success">{successSaveMessage}</Text>}
        { commonAddErr && <Text type="danger">{commonAddErr}</Text> }

        <Form.Item
          label="ЕСР-код"
          name={STATION_FIELDS.ESR_CODE}
          validateStatus={stationFieldsErrs && stationFieldsErrs[STATION_FIELDS.ESR_CODE] ? ERR_VALIDATE_STATUS : null}
          help={stationFieldsErrs ? stationFieldsErrs[STATION_FIELDS.ESR_CODE] : null}
        >
          <Input
            autoFocus={true}
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          label="Наименование"
          name={STATION_FIELDS.NAME}
          validateStatus={stationFieldsErrs && stationFieldsErrs[STATION_FIELDS.NAME] ? ERR_VALIDATE_STATUS : null}
          help={stationFieldsErrs ? stationFieldsErrs[STATION_FIELDS.NAME] : null}
        >
          <Input
            autoComplete="off"
          />
        </Form.Item>
{/*
        <Form.Item
          label="Участок ДНЦ"
          name={DNCSECTOR_FIELDS.NAME}
        >
          <Select>
          {
            dncSectors &&
            dncSectors.map(sector => <Option key={sector.id} value={sector.id}>{sector.name}</Option>)
          }
          </Select>
        </Form.Item>
        */}
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


export default NewStationModal;
