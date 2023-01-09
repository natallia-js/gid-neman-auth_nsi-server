import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { Button, Collapse, Form, Input, Pagination, Popconfirm, Select, Space, Table, Typography } from 'antd';
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
  STATION_WORKPLACE_TYPES,
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
import { useColumnSearchPropsOnLazyLoad } from '../../hooks/columnSearchPropsOnLazyLoad.hook';
import tagRender from '../tagRender';

const { Text, Title } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

// Количество строк на одной странице таблицы
const MAX_TABLE_ROW_COUNT = 10;

const CLEAR_STATIONS_FILTER_MARK = '_';


/**
 * Компонент таблицы с информацией о пользователях.
 */
const UsersTable = () => {
  // Информация по пользователям (массив объектов)
  const [tableData, setTableData] = useState(null);

  // Фильтры по полям таблицы пользователей
  const [filterFields, setFilterFields] = useState([]);

  // Дополнительные фильтры по полям, не отображаемым в таблице (роли, участки ДНЦ, ЭЦД, станции)
  const [additionalFilters, setAdditionalFilters] = useState([]);

  // Массив объектов, каждый из которых содержит id роли и ее аббревиатуру
  const [rolesDataForMutipleSelect, setRolesDataForMutipleSelect] = useState(null);

  // Массив объектов служб
  const [services, setServices] = useState(null);

  // Массив объектов должностей
  const [posts, setPosts] = useState(null);

  // Краткая информация по участкам ДНЦ (массив объектов)
  const [dncSectorsDataForMultipleSelect, setDNCSectorsDataForMultipleSelect] = useState(null);

  // Краткая информация по участкам ЭЦД (массив объектов)
  const [ecdSectorsDataForMultipleSelect, setECDSectorsDataForMultipleSelect] = useState(null);

  // Информация по станциям
  const [stationsData, setStationsData] = useState(null);

  // Ошибка загрузки данных о пользователях
  const [loadDataErr, setLoadDataErr] = useState(null);

  // Флаг окончания загрузки информации
  const [dataLoaded, setDataLoaded] = useState(true);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Для фильтрации данных в таблице пользователей
  const [filterForm] = Form.useForm();

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

  // Общее количество записей в БД, удовлетворяющее условиям поиска
  const [totalItemsCount, setTotalItemsCount] = useState(0);

  // Текущая страница таблицы
  const [currentTablePage, setCurrentTablePage] = useState(1);

  // Для поиска данных в столбцах таблицы
  const { getColumnSearchProps } = useColumnSearchPropsOnLazyLoad();


  /**
   * Загрузка требуемой информации по пользователям
   */
  const lazyLoadUsers = useCallback(async ({ page, filters = null, additionalFilters = null }) => {
    setDataLoaded(false);
    try {
      // Делаем запрос на сервер с целью получения информации по пользователям
      const res = await request(ServerAPI.GET_ALL_USERS, 'POST', {
        filterFields: filters,
        additionalFilterFields: additionalFilters,
        page,
        docsCount: MAX_TABLE_ROW_COUNT,
      });

      const tableData = res.data.map((user) => getAppUserObjFromDBUserObj(user));

      setTableData(tableData);
      setTotalItemsCount(res.totalRecords);
      // Если после загрузки данных окажется, что пользователь запросил страницу, которая не существует в БД,
      // то устанавливаем номер страницы равный максимальному извлеченному номеру
      const pagesNumber = Math.ceil(res.totalItemsCount / MAX_TABLE_ROW_COUNT);
      if (currentTablePage > pagesNumber) {
        setCurrentTablePage(pagesNumber);
      }
      setLoadDataErr(null);

    } catch (e) {
      setTotalItemsCount(0);
      setCurrentTablePage(1);
      setLoadDataErr(e.message);
    }

    setDataLoaded(true);
  }, [request]);


  /**
   * Извлекает дополнительную информацию по пользователям, которая должна быть отображена в таблице, из первоисточника
   * и устанавливает ее в локальное состояние
   */
  const fetchData = useCallback(async () => {
    lazyLoadUsers({ page: currentTablePage, filters: filterFields, additionalFilters });

    setDataLoaded(false);

    try {
      // Делаем запрос на сервер с целью получения информации по участкам ДНЦ
      let res = await request(ServerAPI.GET_DNCSECTORS_SHORT_DATA, 'POST', {});
      // Участки ДНЦ будем сортировать при отображении в списках выбора
      const dncSectors = res
        .map((sector) => getAppDNCSectorObjFromDBDNCSectorObj(sector))
        .sort((a, b) => compareStrings(a[DNCSECTOR_FIELDS.NAME].toLowerCase(), b[DNCSECTOR_FIELDS.NAME].toLowerCase()))
        .map((sector) => ({
          label: sector[DNCSECTOR_FIELDS.NAME],
          value: sector[DNCSECTOR_FIELDS.KEY],
        }));
      setDNCSectorsDataForMultipleSelect(dncSectors);

      // ---------------------------------

      // Делаем запрос на сервер с целью получения информации по участкам ЭЦД
      res = await request(ServerAPI.GET_ECDSECTORS_SHORT_DATA, 'POST', {});
      // Участки ЭЦД будем сортировать при отображении в списках выбора
      const ecdSectors = res
        .map((sector) => getAppECDSectorObjFromDBECDSectorObj(sector))
        .sort((a, b) => compareStrings(a[ECDSECTOR_FIELDS.NAME].toLowerCase(), b[ECDSECTOR_FIELDS.NAME].toLowerCase()))
        .map((sector) => ({
          label: sector[ECDSECTOR_FIELDS.NAME],
          value: sector[ECDSECTOR_FIELDS.KEY],
        }));
      setECDSectorsDataForMultipleSelect(ecdSectors);

      // ---------------------------------

      // Делаем запрос на сервер с целью получения информации по станциям и их рабочим местам
      res = await request(ServerAPI.GET_FULL_STATIONS_DATA, 'POST', {});
      const stations = res.map((station) => getAppStationObjFromDBStationObj(station));
      setStationsData(stations);

      // ---------------------------------

      // Делаем запрос на сервер с целью получения информации по ролям
      res = await request(ServerAPI.GET_ROLES_ABBR_DATA, 'POST', {});
      // Роли отсортируем перед отображением в списках выбора
      const rolesData = res
        .map((role) => getAppRoleObjFromDBRoleObj(role))
        .sort((a, b) => compareStrings(a[ROLE_FIELDS.ENGL_ABBREVIATION].toLowerCase(), b[ROLE_FIELDS.ENGL_ABBREVIATION].toLowerCase()))
        .map((role) => ({
          label: role[ROLE_FIELDS.ENGL_ABBREVIATION],
          value: role[ROLE_FIELDS.KEY],
        }));
      setRolesDataForMutipleSelect(rolesData);

      // ---------------------------------

      // Делаем запрос на сервер с целью получения информации по службам
      res = await request(ServerAPI.GET_SERVICES_DATA, 'POST', {});
      // Хочу, чтобы службы в выпадающих списках были отсортированы по алфавиту
      const servicesData = res
        .map((service) => getAppServiceObjFromDBServiceObj(service))
        .sort((a, b) => compareStrings(a[SERVICE_FIELDS.ABBREV].toLowerCase(), b[SERVICE_FIELDS.ABBREV].toLowerCase()));
      // Поскольку поле наименования службы не является обязательным, в начало списка служб добавляю пустой элемент
      servicesData.unshift({
        [SERVICE_FIELDS.KEY]: null,
        [SERVICE_FIELDS.ABBREV]: null,
        [SERVICE_FIELDS.TITLE]: null,
      });
      setServices(servicesData);

      // ---------------------------------

      // Делаем запрос на сервер с целью получения информации по должностям
      res = await request(ServerAPI.GET_POSTS_DATA, 'POST', {});
      // Хочу, чтобы должности в выпадающих списках были отсортированы по алфавиту
      const postsData = res
        .map((post) => getAppPostObjFromDBPostObj(post))
        .sort((a, b) => compareStrings(a[POST_FIELDS.ABBREV].toLowerCase(), b[POST_FIELDS.ABBREV].toLowerCase()));
      setPosts(postsData);

      // ---------------------------------

      setLoadDataErr(null);

    } catch (e) {
      setTotalItemsCount(0);
      setCurrentTablePage(1);
      setLoadDataErr(e.message);
    }

    setDataLoaded(true);
  }, [request]);


  /**
   * При рендере компонента подгружает информацию для отображения в таблице из БД
   */
  useEffect(() => {
    fetchData();
  }, []);


  /**
   * Для отображения станций и их рабочих мест в списках выбора.
   * Данные сортируются.
   */
  const stationsDataForMultipleSelect = useMemo(() => {
    const dataForStationsMultipleSelect = [];
    (stationsData || [])
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
              workPlaceType: wp[STATION_WORK_PLACE_FIELDS.TYPE],
            });
          });
        }
      });
      return dataForStationsMultipleSelect;
  }, [stationsData]);


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
      const res = await request(ServerAPI.ADD_NEW_USER, 'POST', user);
      message(MESSAGE_TYPES.SUCCESS, res.message);
      //const newUser = getAppUserObjFromDBUserObj(res.user);
      //setTableData([...tableData, newUser]);
      lazyLoadUsers({ page: currentTablePage, filters: filterFields, additionalFilters });

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
      const res = await request(ServerAPI.DEL_USER, 'POST', { userId });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      //setTableData(tableData.filter((user) => user[USER_FIELDS.KEY] !== userId));
      lazyLoadUsers({ page: currentTablePage, filters: filterFields, additionalFilters });

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
      const res = await request(ServerAPI.CONFIRM_USER, 'POST', { userId });
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
      [USER_FIELDS.CONTACT_DATA]: '',
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
      const res = await request(ServerAPI.MOD_USER, 'POST', { userId, ...rowData });
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
      const res = await request(ServerAPI.MOD_USER, 'POST', { userId, roles: rolesIds });
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
      const res = await request(ServerAPI.MOD_STATIONS_WORK_POLIGON_LIST, 'POST', { userId, poligons });
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
      const res = await request(ServerAPI.MOD_DNC_SECTORS_WORK_POLIGON_LIST, 'POST', { userId, dncSectorIds });
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
      const res = await request(ServerAPI.MOD_ECD_SECTORS_WORK_POLIGON_LIST, 'POST', { userId, ecdSectorIds });
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
        required: ![USER_FIELDS.FATHERNAME, USER_FIELDS.SERVICE, USER_FIELDS.CONTACT_DATA].includes(col.dataIndex),
        services: col.dataIndex === USER_FIELDS.SERVICE ? services : null,
        posts: col.dataIndex === USER_FIELDS.POST ? posts : null,
        errMessage: modUserFieldsErrs ? modUserFieldsErrs[col.dataIndex] : null,
      }),
    };
  });


  /**
   * Для отображения информации о рабочих полигонах-станциях пользователя в списках выбора.
   */
  const getUserStationWorkPoligonsForMultipleSelect = (userObject) => {
    if (!userObject || !userObject[USER_FIELDS.STATION_WORK_POLIGONS]) {
      return [];
    }
    return userObject[USER_FIELDS.STATION_WORK_POLIGONS].map((item) => {
      if (!item.workPlaceId) {
        return `${item.id}`;
      }
      return `${item.id}_${item.workPlaceId}`;
    });
  };


  /**
   * Позволяет включить все рабочие места Руководителей работ всех станций в список рабочих мест пользователя.
   */
  const includeAllWorkManagerWorkPlaces = async (userObject) => {
    if (!userObject)
      return;
    const userStationWorkPoligons = userObject[USER_FIELDS.STATION_WORK_POLIGONS] || [];
    (stationsData || []).forEach((station) => {
      station[STATION_FIELDS.WORK_PLACES].forEach((workPlace) => {
        if (workPlace[STATION_WORK_PLACE_FIELDS.TYPE] === STATION_WORKPLACE_TYPES.WORKS_MANAGER) {
          if (!userStationWorkPoligons.find((userWorkPlace) =>
            userWorkPlace.id === station[STATION_FIELDS.KEY] && userWorkPlace.workPlaceId === workPlace[STATION_WORK_PLACE_FIELDS.KEY])) {
            userStationWorkPoligons.push({ id: station[STATION_FIELDS.KEY], workPlaceId: workPlace[STATION_WORK_PLACE_FIELDS.KEY] });
          }
        }
      });
    });
    // Делаем запрос на сервер с целью редактирования информации о пользователе в части информации по рабочим местам на станциях
    const res = await request(ServerAPI.MOD_STATIONS_WORK_POLIGON_LIST, 'POST', { userId: userObject[USER_FIELDS.KEY], poligons: userStationWorkPoligons });
    message(MESSAGE_TYPES.SUCCESS, res.message);
    const newTableData = tableData.map((user) => {
      if (user[USER_FIELDS.KEY] === userObject[USER_FIELDS.KEY]) {
        return { ...user, [USER_FIELDS.STATION_WORK_POLIGONS]: userStationWorkPoligons };
      }
      return user;
    });
    setTableData(newTableData);
  };

  /*const getTableDataToDisplay = useMemo(() =>
    (!filters || !filters.length) ?
    tableData :
    tableData.filter((el) => {
      let ok = true;
      for (let filter of filters) {
        switch (filter[0]) {
          case USER_FIELDS.KEY:
            if (el[USER_FIELDS.KEY] !== filter[1]) {
              ok = false;
            }
            break;
          case USER_FIELDS.ROLES:
            if (!el[USER_FIELDS.ROLES] || !el[USER_FIELDS.ROLES].includes(filter[1])) {
              ok = false;
            }
            break;
          case USER_FIELDS.STATION_WORK_POLIGONS:
            if (!el[USER_FIELDS.STATION_WORK_POLIGONS]) {
              ok = false;
            } else {
              let foundStation = false;
              for (let filterElement of filter[1]) {
                const ids = filterElement.split('_');
                const stationId = ids[0];
                const stationWorkPlaceId = ids.length > 1 ? ids[1] : null;
                if (el[USER_FIELDS.STATION_WORK_POLIGONS].find((swp) =>
                  (String(swp.id) === stationId) &&
                  (
                    (!swp.workPlaceId && !stationWorkPlaceId) ||
                    (swp.workPlaceId && stationWorkPlaceId && String(swp.workPlaceId) === stationWorkPlaceId)
                  )
                )) {
                  foundStation = true;
                  break;
                }
              }
              if (!foundStation) {
                ok = false;
              }
            }
            break;
          case USER_FIELDS.DNC_SECTOR_WORK_POLIGONS:
            if (!el[USER_FIELDS.DNC_SECTOR_WORK_POLIGONS] || !el[USER_FIELDS.DNC_SECTOR_WORK_POLIGONS].includes(filter[1])) {
              ok = false;
            }
            break;
          case USER_FIELDS.ECD_SECTOR_WORK_POLIGONS:
            if (!el[USER_FIELDS.ECD_SECTOR_WORK_POLIGONS] || !el[USER_FIELDS.ECD_SECTOR_WORK_POLIGONS].includes(filter[1])) {
              ok = false;
            }
            break;
          default:
            break;
        }
        if (!ok) {
          break;
        }
      }
      return ok;
    }), [tableData, filters]);*/


  /**
   * Обрабатывает подтверждение со стороны пользователя применения установленных дополнительных
   * фильтров в отношении таблицы пользователей.
   */
  const onFinishSetAdditionalFilters = () => {
    const currentAdditionalFilters = filterForm.getFieldsValue(); console.log('currentAdditionalFilters',currentAdditionalFilters)
    if (!currentAdditionalFilters || !Object.keys(currentAdditionalFilters).length) {
      setAdditionalFilters([]);
    } else {
      const newAdditionalFilters = Object.keys(currentAdditionalFilters)
        .map((field) => ({ field, value: currentAdditionalFilters[field] }))
        .filter((el) => {
          if (!el.value) {
            return false;
          }
          if (Object.prototype.toString.call(el.value) === '[object Array]' && !el.value.length) {
            return false;
          }
          return true;
        });
        console.log('newAdditionalFilters',newAdditionalFilters)
      setAdditionalFilters(newAdditionalFilters);
      lazyLoadUsers({ page: currentTablePage, filters: filterFields, additionalFilters: newAdditionalFilters });
    }
  };


  /**
   * Обрабатывает подтверждение со стороны пользователя сброса установленных дополнительных
   * фильтров в отношении таблицы пользователей.
   */
  const onResetAdditionalFilters = () => {
    setAdditionalFilters([]);
    filterForm.resetFields();
    lazyLoadUsers({ page: currentTablePage, filters: filterFields, additionalFilters: [] });
  };


  // Список станций и рабочих мест в рамках них для отображения в списке выбора в меню дополнительных фильтров
  const [stationsAndWorkPoligonsOptions, setStationsAndWorkPoligonsOptions] = useState([]);

  // Формируем основной массив данных (опций для отображения) по станциям и их рабочим местам (в меню дополнительных фильтров),
  // учитывая возможный установленный фильтр (фильтр, установленный непосредственно в списке выбора)
  useEffect(() => {
    setStationsAndWorkPoligonsOptions(
      !stationsDataForMultipleSelect ? [] :
      [{ label: '< очистить список >', value: CLEAR_STATIONS_FILTER_MARK }, ...stationsDataForMultipleSelect].map((item) => {
        const labelToDisplay = item.label || item.value;
        return (
          <Option label={labelToDisplay} value={item.value} key={item.value}>
            {
              !item.subitem ?
              <span>{labelToDisplay}</span> :
              <span style={{ marginLeft: 16 }}>{labelToDisplay}</span>
            }
          </Option>
        );
      })
    );
  }, [stationsDataForMultipleSelect]);


  /**
   * Сброс дополнительного фильтра по станциям / рабочим местам.
   */
  const handleSelectStation = (optionKey) => {
    if (optionKey === CLEAR_STATIONS_FILTER_MARK) {
      filterForm.resetFields([USER_FIELDS.STATION_WORK_POLIGONS]);
      setAdditionalFilters((value) => value ? value.filter((el) => el[0] !== USER_FIELDS.STATION_WORK_POLIGONS) : null);
    }
  };


  /**
   * Реакция на смену номера страницы таблицы пользователей.
   */
  const onChangePageNumber = (page, _pageSize) => {
    setCurrentTablePage(page);
    lazyLoadUsers({ page, filters: filterFields, additionalFilters });
  };


  /**
   * Обрабатываем событие установки фильтров / сортировки данных в таблице
   */
  const handleFilterAndSortData = (_pagination, filters, sorter) => {
    console.log('handleFilterAndSortData', filters, sorter)

    const currentFilters = [];
    for (const [field, filter] of Object.entries(filters || {})) {
      if (filter?.length) {
        currentFilters.push({ field, value: filter[0] });
      }
    }
    setFilterFields(currentFilters);
    const currentSorters = {};
    if (sorter.column) {
      currentSorters[sorter.column.field] = sorter.order;
    }

    const currentPage = 1;
    setCurrentTablePage(currentPage);

    lazyLoadUsers({ page: currentPage, filters: currentFilters, additionalFilters });
  };


  return (
    <>
      <Title level={2} className="center top-margin-05">Пользователи</Title>

      {loadDataErr ? <Text type="danger">{loadDataErr}</Text> :

      <>
        <Collapse bordered={false}>
          <Panel header="Фильтры" key="1" style={{ fontWeight: 600 }}>
            <Form
              form={filterForm}
              component={false}
              name="filter-users-form"
              layout="inline"
              size="small"
            >
              <Form.Item name={USER_FIELDS.KEY} label="ID пользователя">
                <Input
                  style={{ width: 300 }}
                  autoComplete="off"
                  allowClear
                />
              </Form.Item>
              <Form.Item name={USER_FIELDS.ROLES} label="Роль пользователя">
                <Select
                  style={{ width: 200 }}
                  showArrow
                  options={!rolesDataForMutipleSelect ? [] : [{ label: '', value: null }, ...rolesDataForMutipleSelect]}
                />
              </Form.Item>
              <Form.Item name={USER_FIELDS.STATION_WORK_POLIGONS} label="Станция / рабочее место на станции">
                <Select
                  mode="multiple"
                  size="default"
                  style={{ width: 400 }}
                  showArrow
                  tagRender={tagRender}
                  onSelect={handleSelectStation}
                  optionFilterProp="label"
                >
                  {stationsAndWorkPoligonsOptions}
                </Select>
              </Form.Item>
              <Form.Item name={USER_FIELDS.DNC_SECTOR_WORK_POLIGONS} label="Участок ДНЦ">
                <Select
                  style={{ width: 300 }}
                  showArrow
                  options={!dncSectorsDataForMultipleSelect ? [] : [{ label: '', value: null }, ...dncSectorsDataForMultipleSelect]}
                />
              </Form.Item>
              <Form.Item name={USER_FIELDS.ECD_SECTOR_WORK_POLIGONS} label="Участок ЭЦД">
                <Select
                  style={{ width: 300 }}
                  showArrow
                  options={!ecdSectorsDataForMultipleSelect ? [] : [{ label: '', value: null }, ...ecdSectorsDataForMultipleSelect]}
                />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" onClick={onFinishSetAdditionalFilters}>
                    Найти
                  </Button>
                  {
                    additionalFilters && additionalFilters.length &&
                    <Button type="primary" onClick={onResetAdditionalFilters}>
                      Сброс фильтров
                    </Button>
                  }
                </Space>
              </Form.Item>
              <Text>
                Примечание.
                Фильтрация производится путем сопоставления всех указанных значений с соответствующими
                значениями полей записей таблицы. В результирующую выборку попадают только те записи,
                для которых совпадение 100%. Исключения: поле "ID пользователя" (фильтрация производится по
                частичному совпадению заданной строки со строкой с id пользователя), поле "Станция / рабочее место на станции"
                (поиск производится по частичному совпадению, т.е. в результирующую выборку попадут все те
                записи, у которых хотя бы одно значение совпадает с хотя бы одним указанным значением).
              </Text>
            </Form>
          </Panel>
        </Collapse>

        <Form form={form} component={false} name="edit-user-info-form">
          <NewUserModal
            isModalVisible={isAddNewUserModalVisible}
            handleAddNewUserOk={handleAddNewUserOk}
            handleAddNewUserCancel={handleAddNewUserCancel}
            userFieldsErrs={userFieldsErrs}
            clearAddUserMessages={clearAddUserMessages}
            services={services}
            posts={posts}
            recsBeingAdded={recsBeingAdded}
            rolesDataForMutipleSelect={rolesDataForMutipleSelect}
            stationsDataForMultipleSelect={stationsDataForMultipleSelect}
            dncSectorsDataForMultipleSelect={dncSectorsDataForMultipleSelect}
            ecdSectorsDataForMultipleSelect={ecdSectorsDataForMultipleSelect}
          />

          <Button type="primary" onClick={showAddNewUserModal}>
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
            sticky={true}
            pagination={{ position: ['none', 'none'] }}
            footer={() =>
              <div align="end">
                <Pagination
                  current={currentTablePage}
                  pageSize={MAX_TABLE_ROW_COUNT}
                  onChange={onChangePageNumber}
                  total={totalItemsCount}
                  showQuickJumper
                  showTotal={(total, range) => `Всего записей: ${total}, показаны с ${range[0]} по ${range[1]}`}
                />
              </div>
            }
            onChange={handleFilterAndSortData}
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
                    options={rolesDataForMutipleSelect}
                    selectedItems={record[USER_FIELDS.ROLES]}
                    saveChangesCallback={(selectedVals) => {
                      handleEditUserRoles({
                        userId: record[USER_FIELDS.KEY],
                        rolesIds: selectedVals,
                      });
                    }}
                  />

                  {/*
                    Рабочие полигоны-станции/рабочие места на станциях данного пользователя
                  */}
                  <Title level={4}>Рабочие полигоны (станции)</Title>
                  <Popconfirm
                    title="Добавить рабочие места?"
                    onConfirm={() => includeAllWorkManagerWorkPlaces(record)}
                    okText="Да"
                    cancelText="Отмена"
                  >
                    <Button type="primary" size="small">
                      Включить рабочие места Руководителей работ всех станций
                    </Button>
                  </Popconfirm>
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
                    options={dncSectorsDataForMultipleSelect}
                    selectedItems={record[USER_FIELDS.DNC_SECTOR_WORK_POLIGONS]}
                    saveChangesCallback={(selectedVals) => {
                      handleEditUserDNCSectorWorkPoligons({
                        userId: record[USER_FIELDS.KEY],
                        dncSectorIds: selectedVals,
                      });
                    }}
                  />

                  {/*
                    Рабочие полигоны-участки ЭЦД данного пользователя
                  */}
                  <Title level={4}>Рабочие полигоны (участки ЭЦД)</Title>
                  <SavableSelectMultiple
                    placeholder="Выберите участки ЭЦД"
                    options={ecdSectorsDataForMultipleSelect}
                    selectedItems={record[USER_FIELDS.ECD_SECTOR_WORK_POLIGONS]}
                    saveChangesCallback={(selectedVals) => {
                      handleEditUserECDSectorWorkPoligons({
                        userId: record[USER_FIELDS.KEY],
                        ecdSectorIds: selectedVals,
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
      </>
    }
    </>
  );
};


export default UsersTable;
