import React, { useState, useEffect, useCallback } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { Table, Form, Button, Row, Col, Typography } from 'antd';
import EditableTableCell from '../EditableTableCell';
import NewBlockModal from '../NewBlockModal';
import { ServerAPI, BLOCK_FIELDS, STATION_FIELDS } from '../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import blocksTableColumns from './BlocksTableColumns';
import getAppStationObjFromDBStationObj from '../../mappers/getAppStationObjFromDBStationObj';
import getAppBlockObjFromDBBlockObj from '../../mappers/getAppBlockObjFromDBBlockObj';
import compareStrings from '../../sorters/compareStrings';
import { useColumnSearchProps } from '../../hooks/columnSearchProps.hook';
import expandIcon from '../ExpandIcon';
import BlockTracksTable from './BlockTracksTable';

const { Text, Title } = Typography;


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

  // Для редактирования данных таблицы перегонов
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[BLOCK_FIELDS.KEY] === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewBlockModalVisible, setIsAddNewBlockModalVisible] = useState(false);

  // Ошибки добавления информации о новом перегоне
  const [blockFieldsErrs, setBlockFieldsErrs] = useState(null);

  // Ошибки редактирования информации о перегоне
  const [modBlockFieldsErrs, setModBlockFieldsErrs] = useState(null);

  const message = useCustomMessage();

  // количество запущенных процессов добавления записей на сервере
  const [recsBeingAdded, setRecsBeingAdded] = useState(0);

  // id записей, по которым запущен процесс обработки данных на сервере (удаление, редактирование)
  const [recsBeingProcessed, setRecsBeingProcessed] = useState([]);

  // Для сортировки данных в столбцах таблицы
  const { getColumnSearchProps } = useColumnSearchProps();

  const [initialEditedRecordValues, setInitialEditedRecordValues] = useState(null);

  // Результаты синхронизации с ПЭНСИ
  const [syncDataResults, setSyncDataResults] = useState(null);


  /**
   * Извлекает информацию по станциям (от нее зависит отображение информации по перегонам) из первоисточника
   * и устанавливает ее в локальное состояние.
   */
  const fetchData = useCallback(async () => {
    setDataLoaded(false);

    try {
      // Делаем запрос на сервер с целью получения информации по перегонам
      let res = await request(ServerAPI.GET_BLOCKS_FULL_DATA, 'POST', {});
      const tableData = res.map((block) => getAppBlockObjFromDBBlockObj(block));
      setTableData(tableData);

      // -------------------------------

      // Делаем запрос на сервер с целью получения информации по станциям
      res = await request(ServerAPI.GET_STATIONS_DATA, 'POST', {});

      // Хочу, чтобы станции в выпадающих списках были отсортированы по алфавиту
      const stationsData = res.map((station) => getAppStationObjFromDBStationObj(station));
      stationsData.sort((a, b) =>
        compareStrings(a[STATION_FIELDS.NAME].toLowerCase(), b[STATION_FIELDS.NAME].toLowerCase()));
      setStations(stationsData);

      // -------------------------------

      setLoadDataErr(null);

    } catch (e) {
      setTableData(null);
      setStations(null);
      setLoadDataErr(e.message);
    }

    setDataLoaded(true);
  }, [request]);


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
    setBlockFieldsErrs(null);
  }


  /**
   * Добавляет информацию о перегоне в БД.
   *
   * @param {object} block
   */
  const handleAddNewBlock = async (block) => {
    setRecsBeingAdded((value) => value + 1);
    try {
      // Делаем запрос на сервер с целью добавления информации о перегоне
      const res = await request(ServerAPI.ADD_BLOCK_DATA, 'POST', { ...block });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      const newBlock = getAppBlockObjFromDBBlockObj(res.block);
      setTableData([...tableData, newBlock]);
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setBlockFieldsErrs(errs);
      }
    }
    setRecsBeingAdded((value) => value - 1);
  }


  /**
   * Удаляет информацию о перегоне из БД.
   *
   * @param {number} blockId
   */
  const handleDelBlock = async (blockId) => {
    setRecsBeingProcessed((value) => [...value, blockId]);
    try {
      // Делаем запрос на сервер с целью удаления всей информации о перегоне
      const res = await request(ServerAPI.DEL_BLOCK_DATA, 'POST', { id: blockId });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      setTableData(tableData.filter((block) => block[BLOCK_FIELDS.KEY] !== blockId));
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
    setRecsBeingProcessed((value) => value.filter((id) => id !== blockId));
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
      [BLOCK_FIELDS.PENSI_DNCSectorCode]: '',
      ...record,
    });
    setEditingKey(record[BLOCK_FIELDS.KEY]);
    setInitialEditedRecordValues(record);
  };


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
   const finishEditing = () => {
    setEditingKey('');
    setModBlockFieldsErrs(null);
    setInitialEditedRecordValues(null);
  };


  /**
   * Отменяет редактирование текущей записи таблицы.
   */
  const handleCancelMod = () => {
    finishEditing();
  };


  /**
   * Определяет данные, которые пользователь изменил в результате редактирования записи таблицы.
   *
   * @param {object} initialRec - исходные значения полей объекта редактируемой записи таблицы
   * @param {object} modifiedRec - значения полей объекта редактируемой записи таблицы, которые пользователь отправил на сохранение
   * @returns - null (если пользователь ничего не менял) либо объект, содержащий лишь измененные значения
   */
  const getDataToSave = (initialRec, modifiedRec) => {
    let dataToSave = {};

    Object.getOwnPropertyNames(modifiedRec).forEach((property) => {
      if ((property === BLOCK_FIELDS.STATION1) || (property === BLOCK_FIELDS.STATION2)) {
        if (initialRec[property][STATION_FIELDS.NAME_AND_CODE] !== modifiedRec[property][STATION_FIELDS.NAME_AND_CODE]) {
          dataToSave[property] = JSON.parse(modifiedRec[property][STATION_FIELDS.NAME_AND_CODE])[STATION_FIELDS.KEY];
        }
      } else if (initialRec[property] !== modifiedRec[property]) {
        dataToSave[property] = modifiedRec[property];
      }
    });

    if (Object.getOwnPropertyNames(dataToSave).length === 0) {
      return null;
    }
    return dataToSave;
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

    const prevRecData = tableData.find((block) => block[BLOCK_FIELDS.KEY] === blockId);
    if (!prevRecData) {
      return;
    }

    const modifiedData = getDataToSave(prevRecData, rowData);
    if (!modifiedData) {
      return;
    }

    setRecsBeingProcessed((value) => [...value, blockId]);

    try {
      // Делаем запрос на сервер с целью редактирования информации о перегоне
      const res = await request(ServerAPI.MOD_BLOCK_DATA, 'POST', { id: blockId, ...modifiedData });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      const newTableData = tableData.map((block) => {
        if (block[BLOCK_FIELDS.KEY] === blockId) {
          return { ...block, ...getAppBlockObjFromDBBlockObj(res.block) };
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

    setRecsBeingProcessed((value) => value.filter((id) => id !== blockId));
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

  /**
   * Синхронизация с ПЭНСИ (нужна была для первой синхронизации с таблицей перегонов АС ПРЕД;
   * не удаляю, т.к. может в ПЭНСИ появиться нужная информация для возобновления синхронизации)
   */
  /*const handleSyncWithPENSI = async () => {
    setDataLoaded(false);
    try {
      let res = await request(ServerAPI.SYNC_BLOCKS_WITH_PENSI, 'POST', {});
      message(MESSAGE_TYPES.SUCCESS, res.message);
      setSyncDataResults(res.syncResults);
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
      setSyncDataResults([e.message]);
    }
    setDataLoaded(true);

    // Обновляем информацию по перегонам
    fetchData();
  };*/

  // ---------------------------------------------------------------

  // Описание столбцов таблицы перегонов
  const columns = blocksTableColumns({
    isEditing,
    editingKey,
    handleEditBlock,
    handleCancelMod,
    handleStartEditBlock,
    handleDelBlock,
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
        inputType: Array.isArray(col.dataIndex) && (col.dataIndex.length === 2) &&
          [BLOCK_FIELDS.STATION1, BLOCK_FIELDS.STATION2].includes(col.dataIndex[0]) &&
          (col.dataIndex[1] === STATION_FIELDS.NAME_AND_CODE) ? 'stationsSelect' :
          (col.dataIndex === BLOCK_FIELDS.PENSI_DNCSectorCode) ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        required: true, // с этим не хочет нормально обновлять поле кода участка ДНЦ: (col.dataIndex !== BLOCK_FIELDS.PENSI_DNCSectorCode),
        stations: Array.isArray(col.dataIndex) && (col.dataIndex.length === 2) &&
          [BLOCK_FIELDS.STATION1, BLOCK_FIELDS.STATION2].includes(col.dataIndex[0]) &&
          (col.dataIndex[1] === STATION_FIELDS.NAME_AND_CODE) ? stations : null,
        errMessage: modBlockFieldsErrs ? modBlockFieldsErrs[col.dataIndex] : null,
      }),
    };
  });


  /**
   * Позволяет автоматически формировать наименование перегона на основании информации о выбранных станциях.
   */
  const onValuesChange = (changedValues) => {
    let station1Name;
    let station2Name;
    let oneOfStationNamesChanged = false;

    if (changedValues[BLOCK_FIELDS.STATION1]) {
      const stationInfoObj = JSON.parse(changedValues[BLOCK_FIELDS.STATION1][STATION_FIELDS.NAME_AND_CODE]);
      setInitialEditedRecordValues((value) => {
        return {
          ...value,
          [BLOCK_FIELDS.STATION1]: stationInfoObj,
        };
      });
      station1Name = stationInfoObj[STATION_FIELDS.NAME];
      station2Name = initialEditedRecordValues[BLOCK_FIELDS.STATION2][STATION_FIELDS.NAME];
      oneOfStationNamesChanged = true;
    }
    if (changedValues[BLOCK_FIELDS.STATION2]) {
      const stationInfoObj = JSON.parse(changedValues[BLOCK_FIELDS.STATION2][STATION_FIELDS.NAME_AND_CODE]);
      setInitialEditedRecordValues((value) => {
        return {
          ...value,
          [BLOCK_FIELDS.STATION2]: stationInfoObj,
        };
      });
      station2Name = stationInfoObj[STATION_FIELDS.NAME];
      station1Name = initialEditedRecordValues[BLOCK_FIELDS.STATION1][STATION_FIELDS.NAME];
      oneOfStationNamesChanged = true;
    }

    if (oneOfStationNamesChanged) {
      form.setFieldsValue({ [BLOCK_FIELDS.NAME]: `${station1Name} - ${station2Name}` });
    }
  }


  return (
    <>
      <Title level={2} className="center top-margin-05">Перегоны</Title>

      {loadDataErr ? <Text type="danger">{loadDataErr}</Text> :

      <Form form={form} component={false} onValuesChange={onValuesChange}>
        <NewBlockModal
          isModalVisible={isAddNewBlockModalVisible}
          handleAddNewBlockOk={handleAddNewBlockOk}
          handleAddNewBlockCancel={handleAddNewBlockCancel}
          blockFieldsErrs={blockFieldsErrs}
          clearAddBlockMessages={clearAddBlockMessages}
          stations={stations}
          recsBeingAdded={recsBeingAdded}
        />

        <Row>
          <Col span={12}>
            <Button type="primary" onClick={showAddNewBlockModal}>
              Добавить запись
            </Button>
          </Col>
          {/*
          // Данную кнопку комментирую, т.к. синхронизация с ПЭНСИ здесь приведет к удалению тех
          // данных, которые были изменены после самой первой синхронизации
          <Col span={12} style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={handleSyncWithPENSI}>
              Синхронизировать с ПЭНСИ
            </Button>
          </Col>*/}
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
          expandable={{
            expandedRowRender: record => (
              <div className="expandable-row-content">
                <Title level={4}>Пути перегона</Title>
                <BlockTracksTable
                  blockId={record[BLOCK_FIELDS.KEY]}
                  blockTracks={record[BLOCK_FIELDS.TRACKS]}
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


export default BlocksTable;
