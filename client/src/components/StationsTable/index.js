import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { Table, Form, Button, Row, Col, Typography } from 'antd';
import EditableTableCell from '../EditableTableCell';
import NewStationModal from '../NewStationModal';
import { ServerAPI, STATION_FIELDS } from '../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import stationsTableColumns from './StationsTableColumns';
import getAppStationObjFromDBStationObj from '../../mappers/getAppStationObjFromDBStationObj';
import { useColumnSearchProps } from '../../hooks/columnSearchProps.hook';
import expandIcon from '../ExpandIcon';
import StationTracksTable from './StationTracksTable';
import StationWorkPlacesTable from './StationWorkPlacesTable';

const { Text, Title } = Typography;


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
  const isEditing = (record) => record[STATION_FIELDS.KEY] === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewStationModalVisible, setIsAddNewStationModalVisible] = useState(false);

  // Ошибки добавления информации о новой станции
  const [stationFieldsErrs, setStationFieldsErrs] = useState(null);

  // Ошибки редактирования информации о станции
  const [modStationFieldsErrs, setModStationFieldsErrs] = useState(null);

  const message = useCustomMessage();

  // количество запущенных процессов добавления записей на сервере
  const [recsBeingAdded, setRecsBeingAdded] = useState(0);

  // id записей, по которым запущен процесс обработки данных на сервере (удаление, редактирование)
  const [recsBeingProcessed, setRecsBeingProcessed] = useState([]);

  // Для сортировки данных в столбцах таблицы
  const { getColumnSearchProps } = useColumnSearchProps();

  // Результаты синхронизации с ПЭНСИ
  const [syncDataResults, setSyncDataResults] = useState(null);


  /**
   * Извлекает информацию, которая должна быть отображена в таблице, из первоисточника
   * и устанавливает ее в локальное состояние
   */
  const fetchData = useCallback(async () => {
    setDataLoaded(false);

    try {
      // Делаем запрос на сервер с целью получения информации по станциям
      let res = await request(ServerAPI.GET_FULL_STATIONS_DATA, 'GET', null, {
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
    setStationFieldsErrs(null);
  }


  /**
   * Добавляет информацию о станции в БД.
   *
   * @param {object} station
   */
  const handleAddNewStation = async (station) => {
    setRecsBeingAdded((value) => value + 1);

    try {
      // Делаем запрос на сервер с целью добавления информации о станции
      const res = await request(ServerAPI.ADD_STATION_DATA, 'POST', { ...station }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      const newStation = getAppStationObjFromDBStationObj(res.station);

      setTableData([...tableData, newStation]);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setStationFieldsErrs(errs);
      }
    }

    setRecsBeingAdded((value) => value - 1);
  }


  /**
   * Удаляет информацию о станции из БД.
   *
   * @param {number} stationId
   */
  const handleDelStation = async (stationId) => {
    setRecsBeingProcessed((value) => [...value, stationId]);

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

    setRecsBeingProcessed((value) => value.filter((id) => id !== stationId));
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
    setEditingKey(record[STATION_FIELDS.KEY]);
  };


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
  const finishEditing = () => {
    setEditingKey('');
    setModStationFieldsErrs(null);
  };


  /**
   * Отменяет редактирование текущей записи таблицы.
   */
  const handleCancelMod = () => {
    finishEditing();
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

    setRecsBeingProcessed((value) => [...value, stationId]);

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
      });

      setTableData(newTableData);
      finishEditing();

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModStationFieldsErrs(errs);
      }
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== stationId));
  }


  // --------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новой станции

  const handleShowAddNewStationModal = () => {
    setIsAddNewStationModalVisible(true);
  };

  const handleAddNewStationOk = (station) => {
    handleAddNewStation(station);
  };

  const handleAddNewStationCancel = () => {
    setIsAddNewStationModalVisible(false);
  };

  // --------------------------------------------------------------
  // Синхронизация с ПЭНСИ

  const handleSyncWithPENSI = async () => {
    setDataLoaded(false);
    try {
      let res = await request(ServerAPI.SYNC_STATIONS_WITH_PENSI, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      setSyncDataResults(res.syncResults);
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
      setSyncDataResults([e.message]);
    }
    setDataLoaded(true);

    // Обновляем информацию по станциям
    fetchData();
  };

  // --------------------------------------------------------------

  // Описание столбцов таблицы станций
  const columns = stationsTableColumns({
    isEditing,
    editingKey,
    handleEditStation,
    handleCancelMod,
    handleStartEditStation,
    handleDelStation,
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
        inputType: 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        required: true,
        errMessage: modStationFieldsErrs ? modStationFieldsErrs[col.dataIndex] : null,
      }),
    };
  });


  return (
    <>
      <Title level={2} className="center top-margin-05">Станции</Title>

      {loadDataErr ? <Text type="danger">{loadDataErr}</Text> :

      <Form form={form} component={false}>
        <NewStationModal
          isModalVisible={isAddNewStationModalVisible}
          handleAddNewStationOk={handleAddNewStationOk}
          handleAddNewStationCancel={handleAddNewStationCancel}
          stationFieldsErrs={stationFieldsErrs}
          clearAddStationMessages={clearAddStationMessages}
          recsBeingAdded={recsBeingAdded}
        />

        <Row>
          <Col span={12}>
            <Button type="primary" onClick={handleShowAddNewStationModal}>
              Добавить запись
            </Button>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={handleSyncWithPENSI}>
              Синхронизировать с ПЭНСИ
            </Button>
          </Col>
        </Row>

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
                if (!editingKey || editingKey !== record[STATION_FIELDS.KEY]) {
                  handleStartEditStation(record);
                }
              },
              onKeyUp: event => {
                if (event.key === 'Enter') {
                  handleEditStation(record[STATION_FIELDS.KEY]);
                }
              }
            };
          }}
          expandable={{
            expandedRowRender: record => (
              <div className="expandable-row-content">
                <Title level={4}>Пути станции</Title>
                <StationTracksTable
                  stationId={record[STATION_FIELDS.KEY]}
                  stationTracks={record[STATION_FIELDS.TRACKS]}
                  setTableDataCallback={setTableData}
                />
                <Title level={4}>Рабочие места на станции</Title>
                <StationWorkPlacesTable
                  stationId={record[STATION_FIELDS.KEY]}
                  stationWorkPlaces={record[STATION_FIELDS.WORK_PLACES]}
                  setTableDataCallback={setTableData}
                />
              </div>
            ),
            rowExpandable: _record => true,
            expandIcon: expandIcon,
          }}
        />
        {
          syncDataResults &&
          <Row style={{ margin: '0 2rem' }}>
            <Col span={24}>Результаты синхронизации данных с ПЭНСИ:</Col>
            {syncDataResults.map((res, index) => (
              <Col span={24} key={index}>{res}</Col>
            ))}
          </Row>
        }
      </Form>
      }
    </>
  );
};


export default StationsTable;
