import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { Table, Form, Button } from 'antd';
import EditableTableCell from '../EditableTableCell';
import NewStationModal from '../NewStationModal';
import { ServerAPI, STATION_FIELDS } from '../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import stationsTableColumns from './StationsTableColumns';

import 'antd/dist/antd.css';


/**
 * Компонент таблицы с информацией о станциях.
 */
const StationsTable = () => {
  // Информация по станциям (массив объектов)
  const [tableData, setTableData] = useState(null);

  // Ошибка загрузки данных о станциях
  const [loadDataErr, setLoadDataErr] = useState(null);

  // Флаг окончания загрузки информации
  const [dataLoaded, setDataLoaded] = useState(true);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для редактирования данных таблицы станций
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record.key === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewStationModalVisible, setIsAddNewStationModalVisible] = useState(false);

  // Ошибки добавления информации о новой станции
  const [commonAddErr, setCommonAddErr] = useState(null);
  const [stationFieldsErrs, setStationFieldsErrs] = useState(null);

  // Сообщение об успешном окончании процесса сохранения новой станции
  const [successSaveMessage, setSuccessSaveMessage] = useState(null);

  const message = useCustomMessage();


  /**
   * Преобразует объект станции, полученный из БД, в объект станции приложения.
   *
   * @param {object} dbStationObj
   */
  const getAppStationObjFromDBStationObj = (dbStationObj) => {
    if (dbStationObj) {
      return {
        [STATION_FIELDS.KEY]: dbStationObj.St_ID,
        [STATION_FIELDS.ESR_CODE]: dbStationObj.St_UNMC,
        [STATION_FIELDS.NAME]: dbStationObj.St_Title,
      }
    }
    return null;
  }


  /**
   * Извлекает информацию, которая должна быть отображена в таблице, из первоисточника
   * и устанавливает ее в локальное состояние
   */
  const fetchData = useCallback(async () => {
    setDataLoaded(false);

    try {
      // Делаем запрос на сервер с целью получения информации по станциям
      const res = await request(ServerAPI.GET_STATIONS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      const tableData = res.map((station) => getAppStationObjFromDBStationObj(station));

      setTableData(tableData);
      setLoadDataErr(null);

    } catch (e) {
      setTableData(null);
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
   * Чистит все сообщения добавления информации о станции (ошибки и успех).
   */
  const clearAddStationMessages = () => {
    setCommonAddErr(null);
    setStationFieldsErrs(null);
    setSuccessSaveMessage(null);
  }


  /**
   * Добавляет информацию о станции в БД.
   *
   * @param {object} station
   */
  const handleAddNewStation = async (station) => {
    try {
      // Делаем запрос на сервер с целью добавления информации о станции
      const res = await request(ServerAPI.ADD_STATION_DATA, 'POST', {...station}, {
        Authorization: `Bearer ${auth.token}`
      });

      setSuccessSaveMessage(res.message);

      const newStation = getAppStationObjFromDBStationObj(res.station);

      setTableData([...tableData, newStation]);

    } catch (e) {
      setCommonAddErr(e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setStationFieldsErrs(errs);
      }
    }
  }


  /**
   * Удаляет информацию о станции из БД.
   *
   * @param {number} stationId
   */
  const handleDelStation = async (stationId) => {
    try {
      // Делаем запрос на сервер с целью удаления всей информации о станции
      const res = await request(ServerAPI.DEL_STATION_DATA, 'POST', { id: stationId }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableData(tableData.filter((station) => station[STATION_FIELDS.KEY] !== stationId));

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  }


  /**
   * Вводит выбранную строку таблицы в режим редактирования.
   *
   * @param {object} record
   */
  const handleStartEditStation = (record) => {
    form.setFieldsValue({
      [STATION_FIELDS.ESR_CODE]: '',
      [STATION_FIELDS.NAME]: '',
      ...record,
    });
    setEditingKey(record.key);
  };


  /**
   * Отменяет редактирование текущей записи таблицы.
   */
  const handleCancelMod = () => {
    setEditingKey('');
  };


  /**
   * Редактирует информацию о станции в БД.
   *
   * @param {number} stationId
   */
  const handleEditStation = async (stationId) => {
    let rowData;

    try {
      rowData = await form.validateFields();

    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    try {
      // Делаем запрос на сервер с целью редактирования информации о станции
      const res = await request(ServerAPI.MOD_STATION_DATA, 'POST', { id: stationId, ...rowData }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      const newTableData = tableData.map((station) => {
        if (station[STATION_FIELDS.KEY] === stationId) {
          return { ...station, ...rowData };
        }
        return station;
      })

      setTableData(newTableData);
      setEditingKey('');

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  }


  // --------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новой станции

  const showAddNewStationModal = () => {
    setIsAddNewStationModalVisible(true);
  };

  const handleAddNewStationOk = (station) => {
    handleAddNewStation(station);
  };

  const handleAddNewStationCancel = () => {
    setIsAddNewStationModalVisible(false);
  };

  // --------------------------------------------------------------


  // Описание столбцов таблицы станций
  const columns = stationsTableColumns({
    isEditing,
    editingKey,
    handleEditStation,
    handleCancelMod,
    handleStartEditStation,
    handleDelStation
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
      }),
    };
  });


  return (
    <>
    {
      loadDataErr ? <p className="errMess">{loadDataErr}</p> :

      <Form form={form} component={false}>
        <NewStationModal
          isModalVisible={isAddNewStationModalVisible}
          handleAddNewStationOk={handleAddNewStationOk}
          handleAddNewStationCancel={handleAddNewStationCancel}
          commonAddErr={commonAddErr}
          stationFieldsErrs={stationFieldsErrs}
          clearAddStationMessages={clearAddStationMessages}
          successSaveMessage={successSaveMessage}
        />
        <Button
          type="primary"
          style={{
            marginBottom: 16,
          }}
          onClick={showAddNewStationModal}
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
          scroll={{ x: '100vw', y: '100vh' }}
          onRow={(record) => {
            return {
              onDoubleClick: () => { handleStartEditStation(record) },
              onKeyUp: event => {
                if (event.key === 'Enter') {
                  handleEditStation(record.key);
                }
              }
            };
          }}
        />
      </Form>
    }
    </>
  );
};


export default StationsTable;
