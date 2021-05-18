import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography, Select, Row, Col} from 'antd';
import {
  USER_FIELDS,
  SERVICE_FIELDS,
  POST_FIELDS,
  STATION_FIELDS,
  DNCSECTOR_FIELDS,
  ECDSECTOR_FIELDS,
  ROLE_FIELDS,
} from '../../constants';
import compareStrings from '../../sorters/compareStrings';

const { Option } = Select;
const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новом пользователе.
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   handleAddNewUserOk,
 *   handleAddNewUserCancel,
 *   userFieldsErrs,
 *   clearAddUserMessages,
 *   services,
 *   posts,
 *   recsBeingAdded,
 *   roleAbbrs,
 *   stations,
 *   dncSectors,
 *   ecdSectors,
 */
const NewUserModal = ({
  isModalVisible,
  handleAddNewUserOk,
  handleAddNewUserCancel,
  userFieldsErrs,
  clearAddUserMessages,
  services,
  posts,
  recsBeingAdded,
  roleAbbrs,
  stations,
  dncSectors,
  ecdSectors,
}) => {

  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();

  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedStations, setSelectedStations] = useState([]);
  const [selectedDNCSectors, setSelectedDNCSectors] = useState([]);
  const [selectedECDSectors, setSelectedECDSectors] = useState([]);

  function handleChangeRoles(selectedItems) {
    setSelectedRoles(selectedItems);
  }

  function handleChangeStations(selectedItems) {
    setSelectedStations(selectedItems);
  }

  function handleChangeDNCSectors(selectedItems) {
    setSelectedDNCSectors(selectedItems);
  }

  function handleChangeECDSectors(selectedItems) {
    setSelectedECDSectors(selectedItems);
  }


  /**
   * Чистим поля ввода информации о новом пользователе.
   */
  const onReset = () => {
    form.resetFields();
    setSelectedStations([]);
    setSelectedDNCSectors([]);
    setSelectedECDSectors([]);
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
        <Row>
          <Col span={12}>
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
          </Col>
          <Col span={12}>
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
          </Col>
        </Row>

        <Row>
          <Col span={8}>
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
          </Col>
          <Col span={8}>
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
          </Col>
          <Col span={8}>
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
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <Form.Item
              label="Служба"
              name={USER_FIELDS.SERVICE}
              validateStatus={userFieldsErrs && userFieldsErrs[USER_FIELDS.SERVICE] ? ERR_VALIDATE_STATUS : null}
              help={userFieldsErrs ? userFieldsErrs[USER_FIELDS.SERVICE] : null}
            >
              <Select>
              {
                services &&
                services.map(service =>
                  <Option
                    key={service[SERVICE_FIELDS.ABBREV]}
                    value={service[SERVICE_FIELDS.ABBREV]}
                  >
                    {service[SERVICE_FIELDS.ABBREV]}
                  </Option>
                )
              }
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Должность"
              name={USER_FIELDS.POST}
              validateStatus={userFieldsErrs && userFieldsErrs[USER_FIELDS.POST] ? ERR_VALIDATE_STATUS : null}
              help={userFieldsErrs ? userFieldsErrs[USER_FIELDS.POST] : null}
              rules={[
                {
                  required: true,
                  message: 'Пожалуйста, выберите должность!',
                },
              ]}
            >
              <Select>
              {
                posts &&
                posts.map(post =>
                  <Option
                    key={post[POST_FIELDS.ABBREV]}
                    value={post[POST_FIELDS.ABBREV]}
                  >
                    {post[POST_FIELDS.ABBREV]}
                  </Option>
                )
              }
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Text strong>Роли</Text>
        <Form.Item
          name={USER_FIELDS.ROLES}
        >
          <Select
            mode="multiple"
            size="default"
            placeholder="Выберите роли"
            showArrow
            style={{ width: '100%' }}
            bordered={false}
            value={selectedRoles}
            options={
              !roleAbbrs ? [] :
              roleAbbrs.map((role) => {
                return {
                  label: role[ROLE_FIELDS.ENGL_ABBREVIATION],
                  value: role[ROLE_FIELDS.KEY],
                };
              })
              // убираю из списка те пункты, которые выбрал пользователь
              .filter((option) => !selectedRoles.includes(option.label))
              // оставшиеся сортирую в алфавитном порядке
              .sort((a, b) => compareStrings(a.label.toLowerCase(), b.label.toLowerCase()))
            }
            onChange={handleChangeRoles}
          />
        </Form.Item>

        <Text strong>Полигоны работы</Text>
        <Form.Item
          label="Станции"
          name={USER_FIELDS.STATION_WORK_POLIGONS}
        >
          <Select
            mode="multiple"
            size="default"
            placeholder="Выберите станции"
            showArrow
            style={{ width: '100%' }}
            bordered={false}
            value={selectedStations}
            options={
              !stations ? [] :
              stations.map((station) => {
                return {
                  label: station[STATION_FIELDS.NAME_AND_CODE],
                  value: station[STATION_FIELDS.KEY],
                };
              })
              // убираю из списка те пункты, которые выбрал пользователь
              .filter((option) => !selectedStations.includes(option.label))
              // оставшиеся сортирую в алфавитном порядке
              .sort((a, b) => compareStrings(a.label.toLowerCase(), b.label.toLowerCase()))
            }
            onChange={handleChangeStations}
          />
        </Form.Item>

        <Form.Item
          label="Участки ДНЦ"
          name={USER_FIELDS.DNC_SECTOR_WORK_POLIGONS}
        >
          <Select
            mode="multiple"
            size="default"
            placeholder="Выберите участки ДНЦ"
            showArrow
            style={{ width: '100%' }}
            bordered={false}
            value={selectedDNCSectors}
            options={
              !dncSectors ? [] :
              dncSectors.map((sector) => {
                return {
                  label: sector[DNCSECTOR_FIELDS.NAME],
                  value: sector[DNCSECTOR_FIELDS.KEY],
                };
              })
              // убираю из списка те пункты, которые выбрал пользователь
              .filter((option) => !selectedDNCSectors.includes(option.label))
              // оставшиеся сортирую в алфавитном порядке
              .sort((a, b) => compareStrings(a.label.toLowerCase(), b.label.toLowerCase()))
            }
            onChange={handleChangeDNCSectors}
          />
        </Form.Item>

        <Form.Item
          label="Участки ЭЦД"
          name={USER_FIELDS.ECD_SECTOR_WORK_POLIGONS}
        >
          <Select
            mode="multiple"
            size="default"
            placeholder="Выберите участки ЭЦД"
            showArrow
            style={{ width: '100%' }}
            bordered={false}
            value={selectedECDSectors}
            options={
              !ecdSectors ? [] :
              ecdSectors.map((sector) => {
                return {
                  label: sector[ECDSECTOR_FIELDS.NAME],
                  value: sector[ECDSECTOR_FIELDS.KEY],
                };
              })
              // убираю из списка те пункты, которые выбрал пользователь
              .filter((option) => !selectedECDSectors.includes(option.label))
              // оставшиеся сортирую в алфавитном порядке
              .sort((a, b) => compareStrings(a.label.toLowerCase(), b.label.toLowerCase()))
            }
            onChange={handleChangeECDSectors}
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


export default NewUserModal;
