import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { Table, Form, Button, Typography, Select } from 'antd';
import EditableTableCell from '../EditableTableCell';
import NewUserModal from '../NewUserModal';
import {
  ServerAPI,
  USER_FIELDS,
  ROLE_FIELDS,
  SERVICE_FIELDS,
  POST_FIELDS,
  STATION_FIELDS,
  STATION_WORK_PLACE_FIELDS,
  DNCSECTOR_FIELDS,
  ECDSECTOR_FIELDS,
} from '../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import usersTableColumns from './UsersTableColumns';
import getAppUserObjFromDBUserObj from '../../mappers/getAppUserObjFromDBUserObj';
import getAppRoleObjFromDBRoleObj from '../../mappers/getAppRoleObjFromDBRoleObj';
import getAppServiceObjFromDBServiceObj from '../../mappers/getAppServiceObjFromDBServiceObj';
import getAppPostObjFromDBPostObj from '../../mappers/getAppPostObjFromDBPostObj';
import getAppDNCSectorObjFromDBDNCSectorObj from '../../mappers/getAppDNCSectorObjFromDBDNCSectorObj';
import getAppECDSectorObjFromDBECDSectorObj from '../../mappers/getAppECDSectorObjFromDBECDSectorObj';
import getAppStationObjFromDBStationObj from '../../mappers/getAppStationObjFromDBStationObj';
import SavableSelectMultiple from '../SavableSelectMultiple';
import ChangePasswordBlock from './ChangePasswordBlock';
import expandIcon from '../ExpandIcon';
import compareStrings from '../../sorters/compareStrings';
import { useColumnSearchProps } from '../../hooks/columnSearchProps.hook';

const { Text, Title } = Typography;


/**
 * Компонент таблицы с информацией о пользователях.
 */
const UsersTable = () => {
  // Информация по пользователям (массив объектов)
  const [tableData, setTableData] = useState(null);

  // Массив объектов, каждый из которых содержит id роли и ее аббревиатуру
  const [roleAbbrs, setRoleAbbrs] = useState(null);

  // Массив объектов служб
  const [services, setServices] = useState(null);

  // Массив объектов должностей
  const [posts, setPosts] = useState(null);

  // Краткая информация по участкам ДНЦ (массив объектов)
  const [dncSectorsData, setDNCSectorsData] = useState(null);

  // Краткая информация по участкам ЭЦД (массив объектов)
  const [ecdSectorsData, setECDSectorsData] = useState(null);

  // Краткая информация по станциям (массив объектов)
  const [stations, setStations] = useState(null);

  const [stationsDataForMultipleSelect, setStationsDataForMultipleSelect] = useState([]);

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

  // Для сортировки данных в столбцах таблицы
  const { getColumnSearchProps } = useColumnSearchProps();


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
      const tableData = res
        .map((user) => getAppUserObjFromDBUserObj(user))
        // Неподтвержденные записи по пользователям выводим в начале списка
        .sort((a, b) => {
          if (!a[USER_FIELDS.CONFIRMED] && b[USER_FIELDS.CONFIRMED]) {
            return -1;
          } else if (a[USER_FIELDS.CONFIRMED] && !b[USER_FIELDS.CONFIRMED]) {
            return 1;
          }
          return 0;
        });
      setTableData(tableData);

      // ---------------------------------

      // Делаем запрос на сервер с целью получения информации по участкам ДНЦ
      res = await request(ServerAPI.GET_DNCSECTORS_SHORT_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });
      // Участки ДНЦ будем сортировать при отображении в списке выбора
      const dncSectors = res
        .map((sector) => getAppDNCSectorObjFromDBDNCSectorObj(sector))
        .sort((a, b) => compareStrings(a[DNCSECTOR_FIELDS.NAME].toLowerCase(), b[DNCSECTOR_FIELDS.NAME].toLowerCase()));
      setDNCSectorsData(dncSectors);

      // ---------------------------------

      // Делаем запрос на сервер с целью получения информации по участкам ЭЦД
      res = await request(ServerAPI.GET_ECDSECTORS_SHORT_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });
     // Участки ЭЦД будем сортировать при отображении в списке выбора
      const ecdSectors = res
        .map((sector) => getAppECDSectorObjFromDBECDSectorObj(sector))
        .sort((a, b) => compareStrings(a[ECDSECTOR_FIELDS.NAME].toLowerCase(), b[ECDSECTOR_FIELDS.NAME].toLowerCase()));
      setECDSectorsData(ecdSectors);

      // ---------------------------------

      // Делаем запрос на сервер с целью получения информации по станциям
      res = await request(ServerAPI.GET_FULL_STATIONS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });
      const stations = res.map((station) => getAppStationObjFromDBStationObj(station));
      setStations(stations);
      // Станции будем сортировать при отображении в списке выбора
      const dataForStationsMultipleSelect = [];
      stations
        .sort((a, b) => compareStrings(a[STATION_FIELDS.NAME].toLowerCase(), b[STATION_FIELDS.NAME].toLowerCase()))
        .forEach((station) => {
          dataForStationsMultipleSelect.push({
            label: station[STATION_FIELDS.NAME_AND_CODE],
            value: `${station[STATION_FIELDS.KEY]}`,
          });
          if (station[STATION_FIELDS.WORK_PLACES]) {
            station[STATION_FIELDS.WORK_PLACES].forEach((wp) => {
              dataForStationsMultipleSelect.push({
                label: `${wp[STATION_WORK_PLACE_FIELDS.NAME]} (${station[STATION_FIELDS.NAME]})`,
                value: `${station[STATION_FIELDS.KEY]}_${wp[STATION_WORK_PLACE_FIELDS.KEY]}`,
                subitem: true,
              });
            });
          }
        });
      setStationsDataForMultipleSelect(dataForStationsMultipleSelect);

      // ---------------------------------

      // Делаем запрос на сервер с целью получения информации по ролям
      res = await request(ServerAPI.GET_ROLES_ABBR_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });
      // Роли будем сортировать при отображении в списке выбора
      const rolesData = res
        .map((role) => getAppRoleObjFromDBRoleObj(role))
        .sort((a, b) => compareStrings(a[ROLE_FIELDS.ENGL_ABBREVIATION].toLowerCase(), b[ROLE_FIELDS.ENGL_ABBREVIATION].toLowerCase()));
      setRoleAbbrs(rolesData);

      // ---------------------------------

      // Делаем запрос на сервер с целью получения информации по службам
      res = await request(ServerAPI.GET_SERVICES_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      // Хочу, чтобы службы в выпадающих списках были отсортированы по алфавиту
      const servicesData = res.map((service) => getAppServiceObjFromDBServiceObj(service));
      servicesData.sort((a, b) =>
        compareStrings(a[SERVICE_FIELDS.ABBREV].toLowerCase(), b[SERVICE_FIELDS.ABBREV].toLowerCase()));
      // Поскольку поле наименования службы не является обязательным, в начало списка служб добавляю пустой элемент
      servicesData.unshift({
        [SERVICE_FIELDS.KEY]: null,
        [SERVICE_FIELDS.ABBREV]: null,
        [SERVICE_FIELDS.TITLE]: null,
      });
      setServices(servicesData);

      // ---------------------------------

      // Делаем запрос на сервер с целью получения информации по должностям
      res = await request(ServerAPI.GET_POSTS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      // Хочу, чтобы должности в выпадающих списках были отсортированы по алфавиту
      const postsData = res.map((post) => getAppPostObjFromDBPostObj(post));
      postsData.sort((a, b) =>
        compareStrings(a[POST_FIELDS.ABBREV].toLowerCase(), b[POST_FIELDS.ABBREV].toLowerCase()));
      setPosts(postsData);

      setLoadDataErr(null);

    } catch (e) {
      setTableData(null);
      setRoleAbbrs(null);
      setServices(null);
      setPosts(null);
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
      const res = await request(ServerAPI.ADD_NEW_USER, 'POST', user, {
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
  };


  /**
   * Подтверждает информацию о пользователе в БД.
   *
   * @param {number} userId
   */
  const handleConfirmUser = async (userId) => {
    setRecsBeingProcessed((value) => [...value, userId]);
    try {
      // Делаем запрос на сервер с целью подтверждения всей информации о пользователе
      const res = await request(ServerAPI.CONFIRM_USER, 'POST', { userId }, {
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

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
    setRecsBeingProcessed((value) => value.filter((id) => id !== userId));
  };


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
          return { ...user, [USER_FIELDS.ROLES]: rolesIds };
        }
        return user;
      });

      setTableData(newTableData);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  };


  /**
   * Редактирует информацию о рабочих полигонах-станциях (и рабочих местах на станциях) пользователя в БД.
   *
   * @param {number} userId
   * @param {array} poligons - массив объектов с полями id (id станции) и (необязательно)
   *                           workPlaceId (id рабочего места на станции)
   */
   const handleEditUserStationWorkPoligons = async ({ userId, poligons }) => {
    try {
      const res = await request(ServerAPI.MOD_STATIONS_WORK_POLIGON_LIST, 'POST',
        { userId, poligons },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      const newTableData = tableData.map((user) => {
        if (user[USER_FIELDS.KEY] === userId) {
          return { ...user, [USER_FIELDS.STATION_WORK_POLIGONS]: poligons };
        }
        return user;
      });

      setTableData(newTableData);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  };


  /**
   * Редактирует информацию о рабочих полигонах-участках ДНЦ пользователя в БД.
   *
   * @param {number} userId
   * @param {array} dncSectorIds
   */
   const handleEditUserDNCSectorWorkPoligons = async ({ userId, dncSectorIds }) => {
    try {
      const res = await request(ServerAPI.MOD_DNC_SECTORS_WORK_POLIGON_LIST, 'POST',
        { userId, dncSectorIds },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      const newTableData = tableData.map((user) => {
        if (user[USER_FIELDS.KEY] === userId) {
          return { ...user, [USER_FIELDS.DNC_SECTOR_WORK_POLIGONS]: dncSectorIds };
        }
        return user;
      });

      setTableData(newTableData);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  };


  /**
   * Редактирует информацию о рабочих полигонах-участках ЭЦД пользователя в БД.
   *
   * @param {number} userId
   * @param {array} ecdSectorIds
   */
   const handleEditUserECDSectorWorkPoligons = async ({ userId, ecdSectorIds }) => {
    try {
      const res = await request(ServerAPI.MOD_ECD_SECTORS_WORK_POLIGON_LIST, 'POST',
        { userId, ecdSectorIds },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      const newTableData = tableData.map((user) => {
        if (user[USER_FIELDS.KEY] === userId) {
          return { ...user, [USER_FIELDS.ECD_SECTOR_WORK_POLIGONS]: ecdSectorIds };
        }
        return user;
      });

      setTableData(newTableData);

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


  // Описание столбцов таблицы пользователей
  const columns = usersTableColumns({
    isEditing,
    editingKey,
    handleEditUser,
    handleCancelMod,
    handleStartEditUser,
    handleDelUser,
    handleConfirmUser,
    recsBeingProcessed,
    getColumnSearchProps,
    /*roleAbbrs,
    stations,
    dncSectorsData,
    ecdSectorsData,*/
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
        inputType: col.dataIndex === USER_FIELDS.SERVICE ? 'servicesSelect' :
                   col.dataIndex === USER_FIELDS.POST ? 'postsSelect' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        required: (col.dataIndex !== USER_FIELDS.FATHERNAME) && (col.dataIndex !== USER_FIELDS.SERVICE),
        services: col.dataIndex === USER_FIELDS.SERVICE ? services : null,
        posts: col.dataIndex === USER_FIELDS.POST ? posts : null,
        errMessage: modUserFieldsErrs ? modUserFieldsErrs[col.dataIndex] : null,
      }),
    };
  });

  // Формирует наименование рабочего полигона на станции, отображаемого в списке выбора
  const getDisplayedStationWorkPlaceName = (stationNameCode, stationWorkPlaceName) => {
    return `${stationNameCode} - ${stationWorkPlaceName}`;
  };

  const userGroupedPoligonsArray = (record) => {
    if (!record[USER_FIELDS.STATION_WORK_POLIGONS] || !record[USER_FIELDS.STATION_WORK_POLIGONS].length) {
      return {};
    }
    return record[USER_FIELDS.STATION_WORK_POLIGONS].reduce((prevVal, currVal) => {
      prevVal[currVal.id] = prevVal[currVal.id] || [];
      if (currVal.workPlaceId) {
        prevVal[currVal.id].push(currVal.workPlaceId);
      }
      return prevVal;
    }, {});
  };

  const getStationById = (id) => {
    return stations.find((station) => String(station[STATION_FIELDS.KEY]) == String(id));
  };

  const getStationWorkPlaceName = (stationId, workPlaceId) => {
    if (!stationId || !workPlaceId) {
      return null;
    }
    const station = getStationById(stationId);
    if (!station || !station[STATION_FIELDS.WORK_PLACES] || !station[STATION_FIELDS.WORK_PLACES].length) {
      return null;
    }
    const workPlace = station[STATION_FIELDS.WORK_PLACES].find((wp) => String(wp[STATION_WORK_PLACE_FIELDS.KEY]) == String(workPlaceId));
    if (!workPlace) {
      return null;
    }
    return workPlace[STATION_WORK_PLACE_FIELDS.NAME];
  };

  const getStationIdByNameCodeString = (nameCodeString) => {
    if (!nameCodeString || !stations || !stations.length) {
      return null;
    }
    const station = stations.find((station) => station[STATION_FIELDS.NAME_AND_CODE] === nameCodeString);
    return station ? station[STATION_FIELDS.KEY] : null;
  };

  const getStationWorkPlaceIdByDisplayedName = (displayedWorkPlaceName, stationId) => {
    if (!displayedWorkPlaceName || !stationId || !stations || !stations.length) {
      return null;
    }
    const station = stations.find((station) => station[STATION_FIELDS.KEY] === stationId);
    if (!station) {
      return null;
    }
    const workPlace = station[STATION_FIELDS.WORK_PLACES].find((wp) => {
      const workPlaceNameToDisplay = getDisplayedStationWorkPlaceName(station[STATION_FIELDS.NAME_AND_CODE], wp[STATION_WORK_PLACE_FIELDS.NAME]);
      return workPlaceNameToDisplay === displayedWorkPlaceName;
    });
    return workPlace ? workPlace[STATION_WORK_PLACE_FIELDS.KEY] : null;
  };

  const getUserStationWorkPoligonsForMultipleSelect = (userObject) => {
    if (!userObject || !userObject[USER_FIELDS.STATION_WORK_POLIGONS] ||
      !userObject[USER_FIELDS.STATION_WORK_POLIGONS].length ||
      !stationsDataForMultipleSelect || !stationsDataForMultipleSelect.length) {
      return [];
    }
    const userStationWorkPoligonsValues = userObject[USER_FIELDS.STATION_WORK_POLIGONS].map((item) => {
      if (!item.workPlaceId) {
        return `${item.id}`;
      }
      return `${item.id}_${item.workPlaceId}`;
    });
    return userStationWorkPoligonsValues;
  };


  return (
    <>
      <Title level={2} className="center top-margin-05">Пользователи</Title>

      {loadDataErr ? <Text type="danger">{loadDataErr}</Text> :

      <Form form={form} component={false}>
        <NewUserModal
          isModalVisible={isAddNewUserModalVisible}
          handleAddNewUserOk={handleAddNewUserOk}
          handleAddNewUserCancel={handleAddNewUserCancel}
          userFieldsErrs={userFieldsErrs}
          clearAddUserMessages={clearAddUserMessages}
          services={services}
          posts={posts}
          recsBeingAdded={recsBeingAdded}
          roleAbbrs={roleAbbrs}
          stations={stations}
          dncSectors={dncSectorsData}
          ecdSectors={ecdSectorsData}
        />

        {/*
          Кнопка добавления нового пользователя
        */}
        <Button
          type="primary"
          style={{
            marginBottom: 16,
          }}
          onClick={showAddNewUserModal}
        >
          Добавить запись
        </Button>

        {/*
          Таблица пользователей
        */}
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
                <ChangePasswordBlock
                  userId={record[USER_FIELDS.KEY]}
                />

                {/*
                  Роли данного пользователя
                */}
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

                {/*
                  Рабочие полигоны-станции/рабочие места на станциях данного пользователя
                */}
                <Title level={4}>Рабочие полигоны (станции)</Title>
                <SavableSelectMultiple
                  placeholder="Выберите станции/рабочие места на станциях"
                  options={stationsDataForMultipleSelect}
                  selectedItems={getUserStationWorkPoligonsForMultipleSelect(record)}
                  saveChangesCallback={(selectedVals) => {
                    handleEditUserStationWorkPoligons({
                      userId: record[USER_FIELDS.KEY],
                      poligons: selectedVals.map((item) => {
                        const ids = item.split('_');
                        return {
                          id: ids[0],
                          workPlaceId: ids.length > 1 ? ids[1] : null,
                        };
                      }),
                    });
                  }}
                />

                {/*
                  Рабочие полигоны-участки ДНЦ данного пользователя
                */}
                <Title level={4}>Рабочие полигоны (участки ДНЦ)</Title>
                <SavableSelectMultiple
                  placeholder="Выберите участки ДНЦ"
                  options={
                    (!dncSectorsData || !dncSectorsData.length) ?
                    [] :
                    dncSectorsData.map((sector) => {
                      return {
                        value: sector[DNCSECTOR_FIELDS.NAME],
                      };
                    })
                  }
                  selectedItems={
                    (!record[USER_FIELDS.DNC_SECTOR_WORK_POLIGONS] || !record[USER_FIELDS.DNC_SECTOR_WORK_POLIGONS].length ||
                      !dncSectorsData || !dncSectorsData.length) ?
                    [] :
                    dncSectorsData
                      .filter((sector) => record[USER_FIELDS.DNC_SECTOR_WORK_POLIGONS].includes(sector[DNCSECTOR_FIELDS.KEY]))
                      .map(sector => sector[DNCSECTOR_FIELDS.NAME])
                  }
                  saveChangesCallback={(selectedVals) => {
                    const dncSectorIds = dncSectorsData
                      .filter(sector => selectedVals.includes(sector[DNCSECTOR_FIELDS.NAME]))
                      .map(sector => sector[DNCSECTOR_FIELDS.KEY]);
                    handleEditUserDNCSectorWorkPoligons({
                      userId: record[USER_FIELDS.KEY],
                      dncSectorIds,
                    });
                  }}
                />

                {/*
                  Рабочие полигоны-участки ЭЦД данного пользователя
                */}
                <Title level={4}>Рабочие полигоны (участки ЭЦД)</Title>
                <SavableSelectMultiple
                  placeholder="Выберите участки ЭЦД"
                  options={
                    (!ecdSectorsData || !ecdSectorsData.length) ?
                    [] :
                    ecdSectorsData.map((sector) => {
                      return {
                        value: sector[ECDSECTOR_FIELDS.NAME],
                      };
                    })
                  }
                  selectedItems={
                    (!record[USER_FIELDS.ECD_SECTOR_WORK_POLIGONS] || !record[USER_FIELDS.ECD_SECTOR_WORK_POLIGONS].length ||
                      !ecdSectorsData || !ecdSectorsData.length) ?
                    [] :
                    ecdSectorsData
                      .filter((sector) => record[USER_FIELDS.ECD_SECTOR_WORK_POLIGONS].includes(sector[ECDSECTOR_FIELDS.KEY]))
                      .map(sector => sector[ECDSECTOR_FIELDS.NAME])
                  }
                  saveChangesCallback={(selectedVals) => {
                    const ecdSectorIds = ecdSectorsData
                      .filter(sector => selectedVals.includes(sector[ECDSECTOR_FIELDS.NAME]))
                      .map(sector => sector[ECDSECTOR_FIELDS.KEY]);
                    handleEditUserECDSectorWorkPoligons({
                      userId: record[USER_FIELDS.KEY],
                      ecdSectorIds,
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
