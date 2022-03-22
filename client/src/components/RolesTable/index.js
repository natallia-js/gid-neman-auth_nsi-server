import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { Table, Form, Button, Typography } from 'antd';
import EditableTableCell from '../EditableTableCell';
import NewRoleModal from '../NewRoleModal';
import { ServerAPI, APP_CRED_FIELDS, APP_FIELDS, ROLE_FIELDS } from '../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import rolesTableColumns from './RolesTableColumns';
import getAppRoleObjFromDBRoleObj from '../../mappers/getAppRoleObjFromDBRoleObj';
import getAppApplicationObjFromDBApplicationObj from '../../mappers/getAppApplicationObjFromDBApplicationObj';
import SavableSelectMultiple from '../SavableSelectMultiple';
import expandIcon from '../ExpandIcon';
import compareStrings from '../../sorters/compareStrings';

const { Text, Title } = Typography;


/**
 * Компонент таблицы с информацией о ролях.
 */
const RolesTable = () => {
  // Информация по ролям (массив объектов)
  const [tableData, setTableData] = useState(null);

  // Массив объектов, каждый из которых содержит id и аббревиатуру приложения, а также вложенный
  // массив соответствующих объектов полномочий пользователей (id + аббревиатура полномочия)
  const [appCredAbbrs, setAppCredAbbrs] = useState(null);

  // Ошибка загрузки данных о ролях
  const [loadDataErr, setLoadDataErr] = useState(null);

  // Флаг окончания загрузки информации
  const [dataLoaded, setDataLoaded] = useState(true);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для редактирования данных таблицы ролей
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[ROLE_FIELDS.KEY] === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewRoleModalVisible, setIsAddNewRoleModalVisible] = useState(false);

  // Ошибки добавления информации о новой роли
  const [roleFieldsErrs, setRoleFieldsErrs] = useState(null);

  // Ошибки редактирования информации о роли
  const [modRoleFieldsErrs, setModRoleFieldsErrs] = useState(null);

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
      // Делаем запрос на сервер с целью получения информации по ролям
      const res = await request(ServerAPI.GET_ROLES_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });
      const tableData = res.map((role) => getAppRoleObjFromDBRoleObj(role));
      setTableData(tableData);

      // -------------------

      // Получаем также необходимую информацию по приложениям
      const appsData = await request(ServerAPI.GET_APPS_ABBR_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });
      const appsTableData = appsData.map((app) => getAppApplicationObjFromDBApplicationObj(app));
      setAppCredAbbrs(appsTableData);

      // -------------------

      setLoadDataErr(null);

    } catch (e) {
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
   * Чистит все сообщения добавления информации о роли (ошибки и успех).
   */
  const clearAddRoleMessages = () => {
    setRoleFieldsErrs(null);
  }


  /**
   * Добавляет информацию о роли в БД.
   *
   * @param {object} role
   */
  const handleAddNewRole = async (role) => {
    setRecsBeingAdded((value) => value + 1);
    try {
      // Делаем запрос на сервер с целью добавления информации о роли
      const res = await request(ServerAPI.ADD_ROLE_DATA, 'POST', { ...role, apps: [] }, {
        Authorization: `Bearer ${auth.token}`
      });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      setTableData([...tableData, getAppRoleObjFromDBRoleObj(res.role)]);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setRoleFieldsErrs(errs);
      }
    }
    setRecsBeingAdded((value) => value - 1);
  }


  /**
   * Удаляет информацию о роли из БД.
   *
   * @param {number} roleId
   */
  const handleDelRole = async (roleId) => {
    setRecsBeingProcessed((value) => [...value, roleId]);
    try {
      // Делаем запрос на сервер с целью удаления всей информации о роли
      const res = await request(ServerAPI.DEL_ROLE_DATA, 'POST', { roleId }, {
        Authorization: `Bearer ${auth.token}`
      });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      setTableData(tableData.filter((role) => String(role[ROLE_FIELDS.KEY]) !== String(roleId)));

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
    setRecsBeingProcessed((value) => value.filter((id) => id !== roleId));
  }


  /**
   * Вводит выбранную строку таблицы в режим редактирования.
   *
   * @param {object} record
   */
  const handleStartEditRole = (record) => {
    form.setFieldsValue({
      [ROLE_FIELDS.ENGL_ABBREVIATION]: '',
      [ROLE_FIELDS.DESCRIPTION]: '',
      ...record,
    });
    setEditingKey(record[ROLE_FIELDS.KEY]);
  };


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
   const finishEditing = () => {
    setEditingKey('');
    setModRoleFieldsErrs(null);
  };


  /**
   * Отменяет редактирование текущей записи таблицы.
   */
  const handleCancelMod = () => {
    finishEditing();
  };


  /**
   * Редактирует информацию о роли в БД.
   *
   * @param {number} roleId
   */
  const handleEditRole = async (roleId) => {
    let rowData;
    try {
      rowData = await form.validateFields();
    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }
    setRecsBeingProcessed((value) => [...value, roleId]);
    try {
      // Делаем запрос на сервер с целью редактирования информации о роли
      const res = await request(ServerAPI.MOD_ROLE_DATA, 'POST', { roleId, ...rowData }, {
        Authorization: `Bearer ${auth.token}`
      });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      const newTableData = tableData.map((role) => {
        if (String(role[ROLE_FIELDS.KEY]) === String(res.role._id)) {
          return { ...role, ...getAppRoleObjFromDBRoleObj(res.role) };
        }
        return role;
      });
      setTableData(newTableData);
      finishEditing();

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModRoleFieldsErrs(errs);
      }
    }
    setRecsBeingProcessed((value) => value.filter((id) => id !== roleId));
  }


  /**
   * Редактирует информацию о полномочиях роли в приложениях ГИД Неман в БД.
   *
   * @param {object} param - объект с полями:
   *   roleId - id текущей роли,
   *   appId - id приложения, к которому относится список полномочий,
   *   credAbbrs - массив аббревиатур выбранных полномочий
   */
  const handleModRoleCreds = async ({ roleId, appId, credIds }) => {
    if (!roleId || !appId || !credIds) {
      return;
    }
    try {
      // Отправляем запрос об изменении списка полномочий на сервер
      const res = await request(ServerAPI.MOD_ROLE_CREDS, 'POST',
        { roleId, appId, newCredIds: credIds },
        { Authorization: `Bearer ${auth.token}` }
      );
      message(MESSAGE_TYPES.SUCCESS, res.message);
      setTableData((roles) => roles.map((role) => {
        if (String(role[ROLE_FIELDS.KEY]) !== String(roleId)) {
          return role;
        }
        let application = role[ROLE_FIELDS.APPLICATIONS].find((app) => String(app[APP_FIELDS.KEY]) === String(appId));
        if (application) {
          application[APP_FIELDS.CREDENTIALS] = credIds;
        } else {
          role[ROLE_FIELDS.APPLICATIONS].push({
            [APP_FIELDS.KEY]: appId,
            [APP_FIELDS.CREDENTIALS]: credIds,
          });
        }
        return role;
      }));

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  };


  // --------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новой роли

  const showAddNewRoleModal = () => {
    setIsAddNewRoleModalVisible(true);
  };

  const handleAddNewRoleOk = (role) => {
    handleAddNewRole(role);
  };

  const handleAddNewRoleCancel = () => {
    setIsAddNewRoleModalVisible(false);
  };

  // --------------------------------------------------------------


  // Описание столбцов таблицы ролей
  const columns = rolesTableColumns({
    isEditing,
    editingKey,
    handleEditRole,
    handleCancelMod,
    handleStartEditRole,
    handleDelRole,
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
        inputType: (col.dataIndex === ROLE_FIELDS.SUB_ADMIN_CAN_USE) ? 'boolean' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        required: (col.dataIndex !== ROLE_FIELDS.DESCRIPTION),
        data: form.getFieldValue([ROLE_FIELDS.SUB_ADMIN_CAN_USE]),
        errMessage: modRoleFieldsErrs ? modRoleFieldsErrs[col.dataIndex] : null,
      }),
    };
  });


  return (
    <>
      <Title level={2} className="center top-margin-05">Роли ГИД НЕМАН</Title>

      {loadDataErr ? <Text type="danger">{loadDataErr}</Text> :

      <Form form={form} component={false}>
        <NewRoleModal
          isModalVisible={isAddNewRoleModalVisible}
          handleAddNewRoleOk={handleAddNewRoleOk}
          handleAddNewRoleCancel={handleAddNewRoleCancel}
          roleFieldsErrs={roleFieldsErrs}
          clearAddRoleMessages={clearAddRoleMessages}
          recsBeingAdded={recsBeingAdded}
        />

        <Button type="primary" onClick={showAddNewRoleModal}>
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
                if (!editingKey || editingKey !== record[ROLE_FIELDS.KEY]) {
                  handleStartEditRole(record);
                }
              },
              onKeyUp: event => {
                if (event.key === 'Enter') {
                  handleEditRole(record[ROLE_FIELDS.KEY]);
                }
              },
            };
          }}
          expandable={{
            expandedRowRender: record => (
              <div className="expandable-row-content">
                <Title level={4}>Полномочия в приложениях</Title>
                {
                  appCredAbbrs &&
                  appCredAbbrs.map((app) => (
                    <React.Fragment key={`${record[ROLE_FIELDS.KEY]}${app[APP_FIELDS.KEY]}`}>
                      <Title level={5}>{`Полномочия в ${app[APP_FIELDS.SHORT_TITLE]}:`}</Title>
                      <SavableSelectMultiple
                        placeholder="Выберите полномочия"
                        options={
                          (!app[APP_FIELDS.CREDENTIALS] || !app[APP_FIELDS.CREDENTIALS].length) ?
                          [] :
                          app[APP_FIELDS.CREDENTIALS].map((cred) => {
                            return {
                              value: cred[APP_CRED_FIELDS.ENGL_ABBREVIATION],
                            };
                          }).sort((a, b) => compareStrings(a.value.toLowerCase(), b.value.toLowerCase()))
                        }
                        selectedItems={
                          (!app[APP_FIELDS.CREDENTIALS] || !app[APP_FIELDS.CREDENTIALS].length ||
                           !record[ROLE_FIELDS.APPLICATIONS] || !record[ROLE_FIELDS.APPLICATIONS].length) ?
                          [] :
                          app[APP_FIELDS.CREDENTIALS].filter((cred) =>
                            record[ROLE_FIELDS.APPLICATIONS].some(el =>
                              (String(el[APP_FIELDS.KEY]) === String(app[APP_FIELDS.KEY])) &&
                              el[APP_FIELDS.CREDENTIALS].includes(cred[APP_CRED_FIELDS.KEY])
                            )
                          ).map(cred => cred[APP_CRED_FIELDS.ENGL_ABBREVIATION])
                        }
                        saveChangesCallback={(selectedVals) => {
                          const credIds = app[APP_FIELDS.CREDENTIALS]
                            .filter(cred => selectedVals.includes(cred[APP_CRED_FIELDS.ENGL_ABBREVIATION]))
                            .map(cred => cred[APP_CRED_FIELDS.KEY]);
                          handleModRoleCreds({
                              roleId: record[ROLE_FIELDS.KEY],
                              appId: app[APP_FIELDS.KEY],
                              credIds,
                          });
                        }}
                      />
                    </React.Fragment>
                  ))
                }
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


export default RolesTable;
