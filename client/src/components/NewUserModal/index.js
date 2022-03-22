import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, Typography, Select, Row, Col} from 'antd';
import {
  USER_FIELDS,
  SERVICE_FIELDS,
  POST_FIELDS,
} from '../../constants';
import tagRender from '../tagRender';

const { Option } = Select;
const { Text } = Typography;

const ERR_VALIDATE_STATUS = 'error';


/**
 * Компонент модального окна добавления информации о новом пользователе.
 *
 * @param {object} params - свойства компонента
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
  rolesDataForMutipleSelect,
  stationsDataForMultipleSelect,
  dncSectorsDataForMultipleSelect,
  ecdSectorsDataForMultipleSelect,
}) => {
  // Сюда помещается информация, содержащаяся в полях ввода формы
  const [form] = Form.useForm();

  const [stationsDataToDisplay, setStationsDataToDisplay] = useState([]);
  const [selectedStationsWithWorkPlaces, setSelectedStationsWithWorkPlaces] = useState([]);
  useEffect(() => {
    if (!stationsDataForMultipleSelect) {
      setStationsDataToDisplay([]);
    } else {
      // убираю из списка те пункты, которые выбрал пользователь
      setStationsDataToDisplay(stationsDataForMultipleSelect.filter((option) =>
        !selectedStationsWithWorkPlaces.includes(option.value)));
    }
  }, [stationsDataForMultipleSelect, selectedStationsWithWorkPlaces]);

  const [rolesDataToDisplay, setRolesDataToDisplay] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  useEffect(() => {
    if (!rolesDataForMutipleSelect) {
      setRolesDataToDisplay([]);
    } else {
      // убираю из списка те пункты, которые выбрал пользователь
      setRolesDataToDisplay(rolesDataForMutipleSelect.filter((option) => !selectedRoles.includes(option.value)));
    }
  }, [rolesDataForMutipleSelect, selectedRoles]);

  const [dncSectorsToDisplay, setDNCSectorsToDisplay] = useState([]);
  const [selectedDNCSectors, setSelectedDNCSectors] = useState([]);
  useEffect(() => {
    if (!dncSectorsDataForMultipleSelect) {
      setDNCSectorsToDisplay([]);
    } else {
      // убираю из списка те пункты, которые выбрал пользователь
      setDNCSectorsToDisplay(dncSectorsDataForMultipleSelect.filter((option) => !selectedDNCSectors.includes(option.value)));
    }
  }, [dncSectorsDataForMultipleSelect, selectedDNCSectors]);

  const [ecdSectorsToDisplay, setECDSectorsToDisplay] = useState([]);
  const [selectedECDSectors, setSelectedECDSectors] = useState([]);
  useEffect(() => {
    if (!ecdSectorsDataForMultipleSelect) {
      setECDSectorsToDisplay([]);
    } else {
      // убираю из списка те пункты, которые выбрал пользователь
      setECDSectorsToDisplay(ecdSectorsDataForMultipleSelect.filter((option) => !selectedECDSectors.includes(option.value)));
    }
  }, [ecdSectorsDataForMultipleSelect, selectedECDSectors]);

  const [requiredLoginErrMess, setRequiredLoginErrMess] = useState(null);
  const [requiredPasswordErrMess, setRequiredPasswordErrMess] = useState(null);
  const [requiredNameErrMess, setRequiredNameErrMess] = useState(null);
  const [requiredSurnameErrMess, setRequiredSurnameErrMess] = useState(null);
  const [requiredPostErrMess, setRequiredPostErrMess] = useState(null);

  function handleChangeRoles(selectedItems) {
    setSelectedRoles([...selectedItems]);
  }

  function handleChangeStations(selectedItems) {
    setSelectedStationsWithWorkPlaces([...selectedItems]);
  }

  function handleChangeDNCSectors(selectedItems) {
    setSelectedDNCSectors([...selectedItems]);
  }

  function handleChangeECDSectors(selectedItems) {
    setSelectedECDSectors([...selectedItems]);
  }

  /**
   * Чистим поля ввода информации о новом пользователе.
   */
  const onReset = () => {
    form.resetFields();
    setSelectedRoles([]);
    setSelectedStationsWithWorkPlaces([]);
    setSelectedDNCSectors([]);
    setSelectedECDSectors([]);
  };

  const resetAll = () => {
    // Чистим все сообщения
    clearAddUserMessages();
    setRequiredLoginErrMess(null);
    setRequiredPasswordErrMess(null);
    setRequiredNameErrMess(null);
    setRequiredSurnameErrMess(null);
    setRequiredPostErrMess(null);
  };

  /**
   * Обработка события подтверждения пользователем окончания ввода.
   *
   * @param {object} values
   */
  const onFinish = (values) => {
    resetAll();
    handleAddNewUserOk({
      ...values,
      [USER_FIELDS.STATION_WORK_POLIGONS]: selectedStationsWithWorkPlaces.map((item) => {
        const ids = item.split('_');
        return {
          id: ids[0],
          workPlaceId: ids.length > 1 ? ids[1] : null,
        };
      }),
    });
  };

  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleAddNewUserCancel();
    // Чистим поля ввода
    onReset();
    resetAll();
  };


  return (
    <Modal
      title="Введите информацию о новом пользователе"
      centered
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
      width={700}
    >
      <Form
        layout="vertical"
        size="small"
        form={form}
        name="new-user-form"
        onFinish={onFinish}
      >
        <Row>
          <Col span={12}>
            <Form.Item
              label="Логин"
              name={USER_FIELDS.LOGIN}
              rules={[
                {
                  required: true,
                  validator: async (_, value) => {
                    if (!value || value.length < 1) {
                      setRequiredLoginErrMess('Пожалуйста, введите логин!');
                    } else {
                      setRequiredLoginErrMess(null);
                    }
                  },
                },
              ]}
              validateStatus={(userFieldsErrs && userFieldsErrs[USER_FIELDS.LOGIN]) || requiredLoginErrMess ? ERR_VALIDATE_STATUS : null}
              help={(userFieldsErrs && userFieldsErrs[USER_FIELDS.LOGIN]) || requiredLoginErrMess}
            >
              <Input
                autoFocus={true}
                placeholder="Введите логин"
                autoComplete="off"
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Пароль"
              name={USER_FIELDS.PASSWORD}
              rules={[
                {
                  required: true,
                  validator: async (_, value) => {
                    if (!value || value.length < 1) {
                      setRequiredPasswordErrMess('Пожалуйста, введите пароль!');
                    } else {
                      setRequiredPasswordErrMess(null);
                    }
                  },
                },
              ]}
              validateStatus={(userFieldsErrs && userFieldsErrs[USER_FIELDS.PASSWORD]) || requiredPasswordErrMess ? ERR_VALIDATE_STATUS : null}
              help={(userFieldsErrs && userFieldsErrs[USER_FIELDS.PASSWORD]) || requiredPasswordErrMess}
            >
              <Input
                placeholder="Введите пароль"
                autoComplete="off"
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={8}>
            <Form.Item
              label="Имя"
              name={USER_FIELDS.NAME}
              rules={[
                {
                  required: true,
                  validator: async (_, value) => {
                    if (!value || value.length < 1) {
                      setRequiredNameErrMess('Пожалуйста, введите имя!');
                    } else {
                      setRequiredNameErrMess(null);
                    }
                  },
                },
              ]}
              validateStatus={(userFieldsErrs && userFieldsErrs[USER_FIELDS.NAME]) || requiredNameErrMess ? ERR_VALIDATE_STATUS : null}
              help={(userFieldsErrs && userFieldsErrs[USER_FIELDS.NAME]) || requiredNameErrMess}
            >
              <Input
                placeholder="Введите имя"
                autoComplete="off"
                allowClear
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
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Фамилия"
              name={USER_FIELDS.SURNAME}
              rules={[
                {
                  required: true,
                  validator: async (_, value) => {
                    if (!value || value.length < 1) {
                      setRequiredSurnameErrMess('Пожалуйста, введите фамилию!');
                    } else {
                      setRequiredSurnameErrMess(null);
                    }
                  },
                },
              ]}
              validateStatus={(userFieldsErrs && userFieldsErrs[USER_FIELDS.SURNAME]) || requiredSurnameErrMess ? ERR_VALIDATE_STATUS : null}
              help={(userFieldsErrs && userFieldsErrs[USER_FIELDS.SURNAME]) || requiredSurnameErrMess}
            >
              <Input
                placeholder="Введите фамилию"
                autoComplete="off"
                allowClear
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
              <Select placeholder="Выберите службу">
              {
                services && services.map((service) =>
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
              rules={[
                {
                  required: true,
                  validator: async (_, value) => {
                    if (!value || value.length < 1) {
                      setRequiredPostErrMess('Пожалуйста, выберите должность!');
                    } else {
                      setRequiredPostErrMess(null);
                    }
                  },
                },
              ]}
              validateStatus={(userFieldsErrs && userFieldsErrs[USER_FIELDS.POST]) || requiredPostErrMess ? ERR_VALIDATE_STATUS : null}
              help={(userFieldsErrs && userFieldsErrs[USER_FIELDS.POST]) || requiredPostErrMess}
            >
              <Select placeholder="Выберите должность">
              {
                posts && posts.map((post) =>
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
            options={rolesDataToDisplay}
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
            placeholder="Выберите станции/рабочие места на станциях"
            showArrow
            style={{ width: '100%' }}
            bordered={false}
            value={selectedStationsWithWorkPlaces}
            onChange={handleChangeStations}
            tagRender={tagRender}
          >
            {
              stationsDataToDisplay.map((item) => {
                const labelToDisplay = item.label || item.value;
                return (
                  <Option value={item.value} key={item.value}>
                    {
                      !item.subitem ?
                      <span>{labelToDisplay}</span> :
                      <span style={{ marginLeft: 16 }}>{labelToDisplay}</span>
                    }
                  </Option>
                );
              })
            }
          </Select>
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
            options={dncSectorsToDisplay}
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
            options={ecdSectorsToDisplay}
            onChange={handleChangeECDSectors}
          />
        </Form.Item>

        <Form.Item
          label="Контактные данные"
          name={USER_FIELDS.CONTACT_DATA}
          validateStatus={userFieldsErrs && userFieldsErrs[USER_FIELDS.CONTACT_DATA] ? ERR_VALIDATE_STATUS : null}
          help={userFieldsErrs ? userFieldsErrs[USER_FIELDS.CONTACT_DATA] : null}
        >
          <Input
            placeholder="Введите контактные данные"
            autoComplete="off"
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


export default NewUserModal;
