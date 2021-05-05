import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { Table, Form, Button, Typography, Input, Row, Col } from 'antd';
import EditableTableCell from '../EditableTableCell';
import NewUserModal from '../NewUserModal';
import { ServerAPI, USER_FIELDS, ROLE_FIELDS } from '../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import usersTableColumns from './UsersTableColumns';
import getAppUserObjFromDBUserObj from '../../mappers/getAppUserObjFromDBUserObj';
import getAppRoleObjFromDBRoleObj from '../../mappers/getAppRoleObjFromDBRoleObj';
import SavableSelectMultiple from '../SavableSelectMultiple';
import expandIcon from '../ExpandIcon';

const { Text, Title } = Typography;


/**
 * Компонент таблицы с информацией о пользователях.
 */
const UsersTable = () => {
  // Информация по пользователям (массив объектов)
  const [tableData, setTableData] = useState(null);

  // Массив объектов, каждый из которых содержит id роли и ее аббревиатуру
  const [roleAbbrs, setRoleAbbrs] = useState(null);

  // Ошибка загрузки данных о пользователях
  const [loadDataErr, setLoadDataErr] = useState(null);

  // Флаг окончания загрузки информации
  const [dataLoaded, setDataLoaded] = useState(true);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для редактирования данных таблицы пользователей
  const [form] = Form.useForm();

  // Для редактирования пароля пользователя
  const [newPwdForm] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[USER_FIELDS.KEY] === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewUserModalVisible, setIsAddNewUserModalVisible] = useState(false);

  // Ошибки добавления информации о новом пользователе
  const [userFieldsErrs, setUserFieldsErrs] = useState(null);

  // Ошибки редактирования информации о пользователе
  const [modUserFieldsErrs, setModUserFieldsErrs] = useState(null);

  const message = useCustomMessage();

  // количество запущенных процессов добавления записей на сервере
  const [recsBeingAdded, setRecsBeingAdded] = useState(0);

  // id записей, по которым запущен процесс обработки данных на сервере (удаление, редактирование)
  const [recsBeingProcessed, setRecsBeingProcessed] = useState([]);


  /**
   * Извлекает информацию, которая должна быть отображена в таблице, из первоисточника
   * и устанавливает ее в локальное состояние
   */
  const fetchData = useCallback(async () => {
    setDataLoaded(false);

    try {
      // Делаем запрос на сервер с целью получения информации по пользователям
      let res = await request(ServerAPI.GET_ALL_USERS, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      const tableData = res.map((user) => getAppUserObjFromDBUserObj(user));

      // ---------------------------------

      // Делаем запрос на сервер с целью получения информации по ролям
      res = await request(ServerAPI.GET_ROLES_ABBR_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      const rolesData = res.map((role) => getAppRoleObjFromDBRoleObj(role));

      setTableData(tableData);
      setRoleAbbrs(rolesData);
      setLoadDataErr(null);

    } catch (e) {
      setTableData(null);
      setRoleAbbrs(null);
      setLoadDataErr(e.message);
    }

    setDataLoaded(true);
  }, [auth.token, request]);


  /**
   * При рендере компонента подгружает информацию для отображения в таблице из БД
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);


  /**
   * Чистит все сообщения добавления информации о пользователе (ошибки и успех).
   */
  const clearAddUserMessages = () => {
    setUserFieldsErrs(null);
  }


  /**
   * Добавляет информацию о пользователе в БД.
   *
   * @param {object} user
   */
  const handleAddNewUser = async (user) => {
    setRecsBeingAdded((value) => value + 1);

    try {
      // Делаем запрос на сервер с целью добавления информации о пользователе
      const res = await request(ServerAPI.ADD_NEW_USER, 'POST', { ...user, roles: [] }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      const newUser = getAppUserObjFromDBUserObj(res.user);

      setTableData([...tableData, newUser]);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setUserFieldsErrs(errs);
      }
    }

    setRecsBeingAdded((value) => value - 1);
  }


  /**
   * Удаляет информацию о пользователе из БД.
   *
   * @param {number} userId
   */
  const handleDelUser = async (userId) => {
    setRecsBeingProcessed((value) => [...value, userId]);

    try {
      // Делаем запрос на сервер с целью удаления всей информации о пользователе
      const res = await request(ServerAPI.DEL_USER, 'POST', { userId }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableData(tableData.filter((user) => user[USER_FIELDS.KEY] !== userId));

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== userId));
  }


  /**
   * Вводит выбранную строку таблицы в режим редактирования.
   *
   * @param {object} record
   */
  const handleStartEditUser = (record) => {
    form.setFieldsValue({
      [USER_FIELDS.LOGIN]: '',
      [USER_FIELDS.NAME]: '',
      [USER_FIELDS.FATHERNAME]: '',
      [USER_FIELDS.SURNAME]: '',
      [USER_FIELDS.POST]: '',
      [USER_FIELDS.SERVICE]: '',
      [USER_FIELDS.SECTOR]: '',
      ...record,
    });
    setEditingKey(record[USER_FIELDS.KEY]);
  };


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
  const finishEditing = () => {
    setEditingKey('');
    setModUserFieldsErrs(null);
  };


  /**
   * Отменяет редактирование текущей записи таблицы.
   */
  const handleCancelMod = () => {
    finishEditing();
  };


  /**
   * Редактирует информацию о пользователе в БД.
   *
   * @param {number} userId
   */
  const handleEditUser = async (userId) => {
    let rowData;

    try {
      rowData = await form.validateFields();

    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    setRecsBeingProcessed((value) => [...value, userId]);

    try {
      // Делаем запрос на сервер с целью редактирования информации о пользователе
      const res = await request(ServerAPI.MOD_USER, 'POST', { userId, ...rowData }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      const newTableData = tableData.map((user) => {
        if (user[USER_FIELDS.KEY] === userId) {
          return { ...user, ...res.user };
        }
        return user;
      });

      setTableData(newTableData);
      finishEditing();

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModUserFieldsErrs(errs);
      }
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== userId));
  };


  /**
   * Редактирует пароль пользователя в БД.
   *
   * @param {number} userId
   * @param {string} newPassword
   */
  const handleChangePassword = async ({ userId, newPassword }) => {
    try {
      const res = await request(ServerAPI.MOD_USER, 'POST',
        { userId, password: newPassword },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  };


  /**
   * Редактирует информацию о ролях пользователя в БД.
   *
   * @param {number} userId
   * @param {array} rolesIds
   */
   const handleEditUserRoles = async ({ userId, rolesIds }) => {
    try {
      // Делаем запрос на сервер с целью редактирования информации о пользователе
      const res = await request(ServerAPI.MOD_USER, 'POST', { userId, roles: rolesIds }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      const newTableData = tableData.map((user) => {
        if (user[USER_FIELDS.KEY] === userId) {
          return { ...user, roles: rolesIds };
        }
        return user;
      });

      setTableData(newTableData);
      setEditingKey('');

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  };


  // --------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новом пользователе

  const showAddNewUserModal = () => {
    setIsAddNewUserModalVisible(true);
  };

  const handleAddNewUserOk = (user) => {
    handleAddNewUser(user);
  };

  const handleAddNewUserCancel = () => {
    setIsAddNewUserModalVisible(false);
  };

  // --------------------------------------------------------------


  /**
   * Обработка события подтверждения пользователем окончания ввода.
   */
   const onFinish = (values, userId) => {
    handleChangePassword({ userId, newPassword: values[USER_FIELDS.PASSWORD] });
  };


  // Описание столбцов таблицы пользователей
  const columns = usersTableColumns({
    isEditing,
    editingKey,
    handleEditUser,
    handleCancelMod,
    handleStartEditUser,
    handleDelUser,
    recsBeingProcessed,
  });

  /**
   * Правила отображения редактируемых и нередактируемых столбцов таблицы.
   */
  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        required: (col.dataIndex !== USER_FIELDS.FATHERNAME),
        errMessage: modUserFieldsErrs ? modUserFieldsErrs[col.dataIndex] : null,
      }),
    };
  });


  return (
    <>
    {
      loadDataErr ? <Text type="danger">{loadDataErr}</Text> :

      <Form form={form} component={false}>
        <NewUserModal
          isModalVisible={isAddNewUserModalVisible}
          handleAddNewUserOk={handleAddNewUserOk}
          handleAddNewUserCancel={handleAddNewUserCancel}
          userFieldsErrs={userFieldsErrs}
          clearAddUserMessages={clearAddUserMessages}
          recsBeingAdded={recsBeingAdded}
        />

        <Title level={2} className="center top-margin-05">Пользователи</Title>

        <Button
          type="primary"
          style={{
            marginBottom: 16,
          }}
          onClick={showAddNewUserModal}
        >
          Добавить запись
        </Button>

        <Table
          loading={!dataLoaded}
          components={{
            body: {
              cell: EditableTableCell
            },
          }}
          bordered
          dataSource={tableData}
          columns={mergedColumns}
          rowClassName="editable-row"
          pagination={{
            onChange: handleCancelMod,
          }}
          sticky={true}
          onRow={(record) => {
            return {
              onDoubleClick: () => {
                if (!editingKey || editingKey !== record[USER_FIELDS.KEY]) {
                  handleStartEditUser(record);
                }
              },
              onKeyUp: event => {
                if (event.key === 'Enter') {
                  handleEditUser(record[USER_FIELDS.KEY]);
                }
              }
            };
          }}
          expandable={{
            expandedRowRender: record => (
              <div className="expandable-row-content">
                <Form
                  layout="horizontal"
                  size='small'
                  form={newPwdForm}
                  name="new-password-form"
                  onFinish={(values) => onFinish(values, record[USER_FIELDS.KEY])}
                >
                  <Row wrap={false}>
                    <Col span={6}>
                      <Form.Item
                        label="Новый пароль"
                        name={USER_FIELDS.PASSWORD}
                      >
                        <Input
                          autoComplete="off"
                          placeholder="Новый пароль пользователя"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item>
                        <Button type="primary" htmlType="submit">
                          Изменить
                        </Button>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>

                <Title level={4}>Роли</Title>
                <SavableSelectMultiple
                  key={`roles${record[USER_FIELDS.KEY]}`}
                  placeholder="Выберите роли"
                  options={
                    (!roleAbbrs || !roleAbbrs.length) ?
                    [] :
                    roleAbbrs.map((role) => {
                      return {
                        value: role[ROLE_FIELDS.ENGL_ABBREVIATION],
                      };
                    })
                  }
                  selectedItems={
                    (!record[USER_FIELDS.ROLES] || !record[USER_FIELDS.ROLES].length ||
                      !roleAbbrs || !roleAbbrs.length) ?
                    [] :
                    roleAbbrs
                      .filter((role) => record[USER_FIELDS.ROLES].includes(role[ROLE_FIELDS.KEY]))
                      .map(role => role[ROLE_FIELDS.ENGL_ABBREVIATION])
                  }
                  saveChangesCallback={(selectedVals) => {
                    const roleIds = roleAbbrs
                      .filter(role => selectedVals.includes(role[ROLE_FIELDS.ENGL_ABBREVIATION]))
                      .map(role => role[ROLE_FIELDS.KEY]);
                    handleEditUserRoles({
                      userId: record[USER_FIELDS.KEY],
                      rolesIds: roleIds,
                    });
                  }}
                />
              </div>
            ),
            rowExpandable: _record => true,
            expandIcon: expandIcon,
          }}
        />
      </Form>
    }
    </>
  );
};


export default UsersTable;
