import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { Table, Form, Button, Typography } from 'antd';
import EditableTableCell from '../EditableTableCell';
import NewStationModal from '../NewStationModal';
import {
  ServerAPI,
  DNCSECTOR_FIELDS,
  ECDSECTOR_FIELDS,
  STATION_FIELDS,
  TRAIN_SECTOR_FIELDS,
} from '../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import stationsTableColumns from './StationsTableColumns';
import getAppStationObjFromDBStationObj from '../../mappers/getAppStationObjFromDBStationObj';
import getAppDNCSectorObjFromDBDNCSectorObj from '../../mappers/getAppDNCSectorObjFromDBDNCSectorObj';
import getAppECDSectorObjFromDBECDSectorObj from '../../mappers/getAppECDSectorObjFromDBECDSectorObj';
import getAppDNCTrainSectorFromDBDNCTrainSectorObj from '../../mappers/getAppDNCTrainSectorFromDBDNCTrainSectorObj';
import getAppECDTrainSectorFromDBECDTrainSectorObj from '../../mappers/getAppECDTrainSectorFromDBECDTrainSectorObj';

const { Title } = Typography;


/**
 * Компонент таблицы с информацией о станциях.
 */
const StationsTable = () => {
  // Информация по станциям (массив объектов)
  const [tableData, setTableData] = useState(null);

  // Информация по участкам ДНЦ
  const [dncSectors, setDNCSectors] = useState(null);

  // Информация по участкам ЭЦД
  const [ecdSectors, setECDSectors] = useState(null);

  // Информация по поездным участкам ДНЦ
  const [dncTrainSectors, setDNCTrainSectors] = useState(null);

  // Информация по поездным участкам ЭЦД
  const [ecdTrainSectors, setECDTrainSectors] = useState(null);

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
  const [commonAddErr, setCommonAddErr] = useState(null);
  const [stationFieldsErrs, setStationFieldsErrs] = useState(null);

  // Ошибки редактирования информации о станции
  const [modStationFieldsErrs, setModStationFieldsErrs] = useState(null);

  // Сообщение об успешном окончании процесса сохранения новой станции
  const [successSaveMessage, setSuccessSaveMessage] = useState(null);

  const message = useCustomMessage();


  /**
   * Извлекает информацию, которая должна быть отображена в таблице, из первоисточника
   * и устанавливает ее в локальное состояние
   */
  const fetchData = useCallback(async () => {
    setDataLoaded(false);

    try {
      // Делаем запрос на сервер с целью получения информации по станциям
      let res = await request(ServerAPI.GET_STATIONS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      const tableData = res.map((station) => getAppStationObjFromDBStationObj(station));

      // ---------------------------------

      // Теперь получаем информацию по всем участкам ДНЦ
      res = await request(ServerAPI.GET_DNCSECTORS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      const dncSectorsData = res.map((sector) => getAppDNCSectorObjFromDBDNCSectorObj(sector));
      setDNCSectors(dncSectorsData);

      res.forEach((data) => {
        const sector = getAppDNCSectorObjFromDBDNCSectorObj(data);
        tableData.forEach((station) => {
          if (station[STATION_FIELDS.DNC_SECTOR_ID] === sector[DNCSECTOR_FIELDS.KEY]) {
            station[STATION_FIELDS.DNC_SECTOR_NAME] = sector[DNCSECTOR_FIELDS.NAME];
          }
        });
      });

      // ---------------------------------

      // Получаем инфорацию по всем участкам ЭЦД
      res = await request(ServerAPI.GET_ECDSECTORS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      const ecdSectorsData = res.map((sector) => getAppECDSectorObjFromDBECDSectorObj(sector));
      setECDSectors(ecdSectorsData);

      res.forEach((data) => {
        const sector = getAppECDSectorObjFromDBECDSectorObj(data);
        tableData.forEach((station) => {
          if (station[STATION_FIELDS.ECD_SECTOR_ID] === sector[ECDSECTOR_FIELDS.KEY]) {
            station[STATION_FIELDS.ECD_SECTOR_NAME] = sector[ECDSECTOR_FIELDS.NAME];
          }
        });
      });

      // ---------------------------------

      // Получаем информацию по всем поездным участкам ДНЦ
      res = await request(ServerAPI.GET_DNCTRAINSECTORS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      const dncTrainSectorsData = res.map((sector) => getAppDNCTrainSectorFromDBDNCTrainSectorObj(sector));
      setDNCTrainSectors(dncTrainSectorsData);

      res.forEach((data) => {
        const sector = getAppDNCTrainSectorFromDBDNCTrainSectorObj(data);
        tableData.forEach((station) => {
          if (station[STATION_FIELDS.DNC_TRAINSECTOR_ID] === sector[TRAIN_SECTOR_FIELDS.KEY]) {
            station[STATION_FIELDS.DNC_TRAINSECTOR_NAME] = sector[TRAIN_SECTOR_FIELDS.NAME];
          }
        });
      });

      // ---------------------------------

      // Получаем информацию по всем поездным участкам ЭЦД
      res = await request(ServerAPI.GET_ECDTRAINSECTORS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      const ecdTrainSectorsData = res.map((sector) => getAppECDTrainSectorFromDBECDTrainSectorObj(sector));
      setECDTrainSectors(ecdTrainSectorsData);

      res.forEach((data) => {
        const sector = getAppECDTrainSectorFromDBECDTrainSectorObj(data);
        tableData.forEach((station) => {
          if (station[STATION_FIELDS.ECD_TRAINSECTOR_ID] === sector[TRAIN_SECTOR_FIELDS.KEY]) {
            station[STATION_FIELDS.ECD_TRAINSECTOR_NAME] = sector[TRAIN_SECTOR_FIELDS.NAME];
          }
        });
      });

      setTableData(tableData);
      setLoadDataErr(null);

    } catch (e) {
      setTableData(null);
      // setDNCSectors(null);
      // setECDSectors(null);
      // setDNCTrainSectors(null);
      // setECDTrainSectors(null);
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
        required: true,
        errMessage: modStationFieldsErrs ? modStationFieldsErrs[col.dataIndex] : null,
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
          dncSectors={
            dncSectors &&
            dncSectors.map(sector => {
              return { id: sector[DNCSECTOR_FIELDS.KEY], name: sector[DNCSECTOR_FIELDS.NAME] };
            })
          }
        />

        <Title level={2} className="center top-margin-05">Станции</Title>

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
        />
      </Form>
    }
    </>
  );
};


export default StationsTable;
