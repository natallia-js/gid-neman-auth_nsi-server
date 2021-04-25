import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { Table, Form, Button, Typography } from 'antd';
import EditableTableCell from '../EditableTableCell';
import NewBlockModal from '../NewBlockModal';
import { ServerAPI, BLOCK_FIELDS, STATION_FIELDS } from '../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import blocksTableColumns from './BlocksTableColumns';
import getAppStationObjFromDBStationObj from '../../mappers/getAppStationObjFromDBStationObj';
import getAppBlockObjFromDBBlockObj from '../../mappers/getAppBlockObjFromDBBlockObj';

const { Title } = Typography;

/**
 * Компонент таблицы с информацией о перегонах.
 */
const BlocksTable = () => {
  // Информация по перегонам (массив объектов)
  const [tableData, setTableData] = useState(null);

  // Информация по станциям
  const [stations, setStations] = useState(null);

  // Ошибка загрузки данных
  const [loadDataErr, setLoadDataErr] = useState(null);

  // Флаг окончания загрузки информации
  const [dataLoaded, setDataLoaded] = useState(true);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для редактирования данных таблицы перегонов
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[BLOCK_FIELDS.KEY] === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewBlockModalVisible, setIsAddNewBlockModalVisible] = useState(false);

  // Ошибки добавления информации о новом перегоне
  const [commonAddErr, setCommonAddErr] = useState(null);
  const [blockFieldsErrs, setBlockFieldsErrs] = useState(null);

  // Ошибки редактирования информации о перегоне
  const [modBlockFieldsErrs, setModBlockFieldsErrs] = useState(null);

  // Сообщение об успешном окончании процесса сохранения нового перегона
  const [successSaveMessage, setSuccessSaveMessage] = useState(null);

  const message = useCustomMessage();


  /**
   * По заданному идентификатору станции возвращает строку с ее названием и кодом.
   */
  const getStationInfoByID = useCallback((id) => {
    if (!stations) {
      return id;
    }
    const station = stations.find((station) => station[STATION_FIELDS.KEY] === id);
    if (station) {
      return station[STATION_FIELDS.NAME_AND_CODE];
    }
    return id;
  }, [stations]);


  /**
   * Преобразует объект перегона, полученный из БД, в объект перегона приложения.
   *
   * @param {object} dbBlockObj
   */
  const getAppBlockObjFromDBBlockObj_WithAddInfo = useCallback((dbBlockObj) => {
    if (dbBlockObj) {
      return {
        ...getAppBlockObjFromDBBlockObj(dbBlockObj),
        [BLOCK_FIELDS.STATION1_NAME]: getStationInfoByID(dbBlockObj.Bl_StationID1),
        [BLOCK_FIELDS.STATION2_NAME]: getStationInfoByID(dbBlockObj.Bl_StationID2),
      };
    }
    return null;
  }, [getStationInfoByID]);


  /**
   * Извлекает информацию по станциям (от нее зависит отображение информации по перегонам) из первоисточника
   * и устанавливает ее в локальное состояние.
   */
  const fetchData = useCallback(async () => {
    setDataLoaded(false);

    try {
      // Делаем запрос на сервер с целью получения информации по станциям
      const resStations = await request(ServerAPI.GET_STATIONS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      // Хочу, чтобы станции в выпадающих списках были отсортированы по алфавиту
      const stationsData = resStations.map((station) => getAppStationObjFromDBStationObj(station));
      stationsData.sort((a, b) => {
        if (a[STATION_FIELDS.NAME] < b[STATION_FIELDS.NAME]) {
          return -1;
        }
        if (a[STATION_FIELDS.NAME] > b[STATION_FIELDS.NAME]) {
          return 1;
        }
        return 0;
      });

      setStations(stationsData);
      setLoadDataErr(null);

    } catch (e) {
      setStations(null);
      setLoadDataErr(e.message);
    }

    setDataLoaded(true);
  }, [auth.token, request]);


  /**
   * После извлечения информации о станциях извлекается информация о перегонах
   * и устанавлвается в локальное состояние.
   */
  useEffect(() => {
    async function loadBlocks() {
      setDataLoaded(false);

      try {
        // Делаем запрос на сервер с целью получения информации по участкам
        const res = await request(ServerAPI.GET_BLOCKS_DATA, 'GET', null, {
          Authorization: `Bearer ${auth.token}`
        });

        const tableData = res.map((block) => getAppBlockObjFromDBBlockObj_WithAddInfo(block));

        setTableData(tableData);
        setLoadDataErr(null);

      } catch (e) {
        setTableData(null);
        setLoadDataErr(e.message);
      }

      setDataLoaded(true);
    }

    loadBlocks();

  }, [auth.token, getAppBlockObjFromDBBlockObj_WithAddInfo, request, stations]);


  /**
   * При рендере компонента подгружает информацию для отображения в таблице из БД
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);


  /**
   * Чистит все сообщения добавления информации о перегоне (ошибки и успех).
   */
  const clearAddBlockMessages = () => {
    setCommonAddErr(null);
    setBlockFieldsErrs(null);
    setSuccessSaveMessage(null);
  }


  /**
   * Добавляет информацию о перегоне в БД.
   *
   * @param {object} block
   */
  const handleAddNewBlock = async (block) => {
    try {
      // Делаем запрос на сервер с целью добавления информации о перегоне
      const res = await request(ServerAPI.ADD_BLOCK_DATA, 'POST', {...block}, {
        Authorization: `Bearer ${auth.token}`
      });

      setSuccessSaveMessage(res.message);

      const newBlock = getAppBlockObjFromDBBlockObj_WithAddInfo(res.block);

      setTableData([...tableData, newBlock]);

    } catch (e) {
      setCommonAddErr(e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setBlockFieldsErrs(errs);
      }
    }
  }


  /**
   * Удаляет информацию о перегоне из БД.
   *
   * @param {number} blockId
   */
  const handleDelBlock = async (blockId) => {
    try {
      // Делаем запрос на сервер с целью удаления всей информации о перегоне
      const res = await request(ServerAPI.DEL_BLOCK_DATA, 'POST', { id: blockId }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableData(tableData.filter((block) => block[BLOCK_FIELDS.KEY] !== blockId));

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  }


  /**
   * Вводит выбранную строку таблицы в режим редактирования.
   *
   * @param {object} record
   */
  const handleStartEditBlock = (record) => {
    form.setFieldsValue({
      [BLOCK_FIELDS.NAME]: '',
      [BLOCK_FIELDS.STATION1]: '',
      [BLOCK_FIELDS.STATION2]: '',
      [BLOCK_FIELDS.STATION1_NAME]: '',
      [BLOCK_FIELDS.STATION2_NAME]: '',
      ...record,
    });
    setEditingKey(record[BLOCK_FIELDS.KEY]);
  };


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
   const finishEditing = () => {
    setEditingKey('');
    setModBlockFieldsErrs(null);
  };


  /**
   * Отменяет редактирование текущей записи таблицы.
   */
  const handleCancelMod = () => {
    finishEditing();
  };


  /**
   * Редактирует информацию о перегоне в БД.
   *
   * @param {number} blockId
   */
  const handleEditBlock = async (blockId) => {
    let rowData;

    try {
      rowData = await form.validateFields();

    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    rowData[BLOCK_FIELDS.STATION1_NAME] = getStationInfoByID(rowData[BLOCK_FIELDS.STATION1]);
    rowData[BLOCK_FIELDS.STATION2_NAME] = getStationInfoByID(rowData[BLOCK_FIELDS.STATION2]);

    try {
      // Делаем запрос на сервер с целью редактирования информации о перегоне
      const res = await request(ServerAPI.MOD_BLOCK_DATA, 'POST', { id: blockId, ...rowData }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      const newTableData = tableData.map((block) => {
        if (block[BLOCK_FIELDS.KEY] === blockId) {
          return { ...block, ...rowData };
        }
        return block;
      })

      setTableData(newTableData);
      finishEditing();

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModBlockFieldsErrs(errs);
      }
    }
  }


  // ---------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новом перегоне

  const showAddNewBlockModal = () => {
    setIsAddNewBlockModalVisible(true);
  };

  const handleAddNewBlockOk = (block) => {
    handleAddNewBlock(block);
  };

  const handleAddNewBlockCancel = () => {
    setIsAddNewBlockModalVisible(false);
  };

  // ---------------------------------------------------------------


  // Описание столбцов таблицы перегонов
  const columns = blocksTableColumns({
    isEditing,
    editingKey,
    handleEditBlock,
    handleCancelMod,
    handleStartEditBlock,
    handleDelBlock
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
        inputType: [BLOCK_FIELDS.STATION1_NAME, BLOCK_FIELDS.STATION2_NAME].includes(col.dataIndex) ? 'stationsSelect' : 'text',
        dataIndex: col.dataIndex === BLOCK_FIELDS.STATION1_NAME ? BLOCK_FIELDS.STATION1 :
                   col.dataIndex === BLOCK_FIELDS.STATION2_NAME ? BLOCK_FIELDS.STATION2 :
                   col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        required: true,
        stations: [BLOCK_FIELDS.STATION1_NAME, BLOCK_FIELDS.STATION2_NAME].includes(col.dataIndex) ?
          (
            stations &&
            stations.map(station => {
              return { id: station[STATION_FIELDS.KEY], name: station[STATION_FIELDS.NAME_AND_CODE] };
            })
          )
          : null,
        errMessage: modBlockFieldsErrs ? modBlockFieldsErrs[col.dataIndex] : null,
      }),
    };
  });


  return (
    <>
    {
      loadDataErr ? <p className="errMess">{loadDataErr}</p> :

      <Form form={form} component={false}>
        <NewBlockModal
          isModalVisible={isAddNewBlockModalVisible}
          handleAddNewBlockOk={handleAddNewBlockOk}
          handleAddNewBlockCancel={handleAddNewBlockCancel}
          commonAddErr={commonAddErr}
          blockFieldsErrs={blockFieldsErrs}
          clearAddBlockMessages={clearAddBlockMessages}
          successSaveMessage={successSaveMessage}
          stations={
            stations &&
            stations.map(station => {
              return { id: station[STATION_FIELDS.KEY], name: station[STATION_FIELDS.NAME_AND_CODE] };
            })
          }
        />

        <Title level={2} className="center top-margin-05">Перегоны</Title>

        <Button
          type="primary"
          style={{
            marginBottom: 16,
          }}
          onClick={showAddNewBlockModal}
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
                if (!editingKey || editingKey !== record[BLOCK_FIELDS.KEY]) {
                  handleStartEditBlock(record);
                }
              },
              onKeyUp: event => {
                if (event.key === 'Enter') {
                  handleEditBlock(record[BLOCK_FIELDS.KEY]);
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


export default BlocksTable;
