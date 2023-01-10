import React, { useState, useEffect, useCallback } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { Table, Form, Button, Typography } from 'antd';
import EditableTableCell from '../EditableTableCell';
import NewECDSectorModal from '../NewECDSectorModal';
import {
  ServerAPI,
  ECDSECTOR_FIELDS,
  DNCSECTOR_FIELDS,
  ADJACENT_ECDSECTOR_FIELDS,
  NEAREST_SECTOR_FIELDS,
  STATION_FIELDS,
  BLOCK_FIELDS,
} from '../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import AdjacentECDSectorsBlock from './AdjacentECDSectorsBlock';
import NearestDNCSectorsBlock from './NearestDNCSectorsBlock';
import ecdSectorsTableColumns from './ECDSectorsTableColumns';
import ECDTrainSectorsBlock from './ECDTrainSectorsBlock';
import ECDStructuralDivisionsTable from './ECDStructuralDivisionsTable';
import getAppECDSectorObjFromDBECDSectorObj from '../../mappers/getAppECDSectorObjFromDBECDSectorObj';
import getAppDNCSectorObjFromDBDNCSectorObj from '../../mappers/getAppDNCSectorObjFromDBDNCSectorObj';
import getAppStationObjFromDBStationObj from '../../mappers/getAppStationObjFromDBStationObj';
import getAppBlockObjFromDBBlockObj from '../../mappers/getAppBlockObjFromDBBlockObj';
import expandIcon from '../ExpandIcon';
import compareStrings from '../../sorters/compareStrings';

const { Text, Title } = Typography;


/**
 * Компонент таблицы с информацией об участках ЭЦД.
 */
const ECDSectorsTable = () => {
  const [dataBeingLoadedMessage, setDataBeingLoadedMessage] = useState(null);

  // Информация по участкам ЭЦД (массив объектов)
  const [tableData, setTableData] = useState(null);

  // Информация по участкам ДНЦ (массив объектов)
  const [dncSectorsData, setDNCSectorsData] = useState(null);

  // Информация по станциям (массив объектов)
  const [stations, setStations] = useState(null);

  // Информация по перегонам (массив объектов)
  const [blocks, setBlocks] = useState(null);

  // Ошибка загрузки данных
  const [loadDataErr, setLoadDataErr] = useState(null);

  // Флаг окончания загрузки информации
  const [dataLoaded, setDataLoaded] = useState(true);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Для редактирования данных таблицы участков ЭЦД
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[ECDSECTOR_FIELDS.KEY] === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewECDSectorModalVisible, setIsAddNewECDSectorModalVisible] = useState(false);

  // Ошибки добавления информации о новом участке ЭЦД
  const [ecdSectorFieldsErrs, setECDSectorFieldsErrs] = useState(null);

  // Ошибки редактирования информации об участке ЭЦД
  const [modECDSectorFieldsErrs, setModECDSectorFieldsErrs] = useState(null);

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  // количество запущенных процессов добавления записей на сервере
  const [recsBeingAdded, setRecsBeingAdded] = useState(0);

  // id записей, по которым запущен процесс обработки данных на сервере (удаление, редактирование)
  const [recsBeingProcessed, setRecsBeingProcessed] = useState([]);


  /**
   * Извлекает информацию, которая должна быть отображена в таблице, из первоисточника
   * и устанавливает ее в локальное состояние.
   */
  const fetchData = useCallback(async () => {
    setDataLoaded(false);

    try {
      // Делаем запрос на сервер с целью получения информации по участкам ЭЦД
      // (запрос возвратит информацию в виде массива объектов участков ЭЦД; для каждого
      // объекта участка ЭЦД будет определен массив объектов поездных участков ЭЦД и массив
      // структурных подразделений ЭЦД; для каждого поездного участка ЭЦД будет определен
      // массив объектов соответствующих станций)
      setDataBeingLoadedMessage('Загружаю информацию по участкам ЭЦД...');
      let res = await request(ServerAPI.GET_ECDSECTORS_DATA, 'POST', {});
      const tableData = res
        .map((sector) => getAppECDSectorObjFromDBECDSectorObj(sector))
        .sort((a, b) => compareStrings(a[ECDSECTOR_FIELDS.NAME].toLowerCase(), b[ECDSECTOR_FIELDS.NAME].toLowerCase()))

      // -------------------

      // Теперь получаем информацию о смежных участках ЭЦД
      setDataBeingLoadedMessage('Загружаю информацию по смежным участкам ЭЦД...');
      res = await request(ServerAPI.GET_ADJACENTECDSECTORS_DATA, 'POST', {});
      // Для каждой полученной записи создаем в tableData элемент массива смежных участков ЭЦД
      // у двух записей - соответствующих смежным участкам
      res.forEach((data) => {
        const sector1 = tableData.find((el) => el[ECDSECTOR_FIELDS.KEY] === data.AECDS_ECDSectorID1);
        const sector2 = tableData.find((el) => el[ECDSECTOR_FIELDS.KEY] === data.AECDS_ECDSectorID2);
        if (sector1 && sector2) {
          sector1[ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS].push({
            [ADJACENT_ECDSECTOR_FIELDS.SECTOR_ID]: sector2[ECDSECTOR_FIELDS.KEY],
          });
          sector2[ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS].push({
            [ADJACENT_ECDSECTOR_FIELDS.SECTOR_ID]: sector1[ECDSECTOR_FIELDS.KEY],
          });
        }
      });

      // -------------------

      // Делаем запрос на сервер с целью получения информации по участкам ДНЦ
      setDataBeingLoadedMessage('Загружаю информацию по участкам ДНЦ...');
      res = await request(ServerAPI.GET_DNCSECTORS_DATA, 'POST', {});
      const dncSectors = res
        .map((sector) => getAppDNCSectorObjFromDBDNCSectorObj(sector))
        .sort((a, b) => compareStrings(a[DNCSECTOR_FIELDS.NAME].toLowerCase(), b[DNCSECTOR_FIELDS.NAME].toLowerCase()));
      setDNCSectorsData(dncSectors);

      // -------------------

      // Теперь обращаемся к серверу за информацией о ближайших участках ДНЦ и ЭЦД
      setDataBeingLoadedMessage('Загружаю информацию о ближайших участках ДНЦ...');
      res = await request(ServerAPI.GET_NEARESTDNCECDSECTORS_DATA, 'POST', {});
      // Для каждой полученной записи создаем в tableData элемент массива ближайших участков ДНЦ
      // для соответствующего участка ЭЦД
      res.forEach((data) => {
        const ecdSector = tableData.find((el) => el[ECDSECTOR_FIELDS.KEY] === data.NDE_ECDSectorID);
        const dncSector = dncSectors.find((el) => el[DNCSECTOR_FIELDS.KEY] === data.NDE_DNCSectorID);
        if (ecdSector && dncSector) {
          ecdSector[ECDSECTOR_FIELDS.NEAREST_DNCSECTORS].push({
            [NEAREST_SECTOR_FIELDS.SECTOR_ID]: dncSector[DNCSECTOR_FIELDS.KEY],
          });
        }
      });

      // -------------------

      setTableData(tableData);

      // -------------------

      // Получаем информацию о всех станциях
      setDataBeingLoadedMessage('Загружаю информацию о станциях...');
      res = await request(ServerAPI.GET_STATIONS_DATA, 'POST', {});
      setStations(res
        .map((station) => getAppStationObjFromDBStationObj(station))
        .sort((a, b) => compareStrings(a[STATION_FIELDS.NAME].toLowerCase(), b[STATION_FIELDS.NAME].toLowerCase()))
      );

      // -------------------

      // Получаем информацию о всех перегонах
      setDataBeingLoadedMessage('Загружаю информацию о перегонах...');
      res = await request(ServerAPI.GET_BLOCKS_DATA, 'POST', {});
      setBlocks(res
        .map((block) => getAppBlockObjFromDBBlockObj(block))
        .sort((a, b) => compareStrings(a[BLOCK_FIELDS.NAME].toLowerCase(), b[BLOCK_FIELDS.NAME].toLowerCase()))
      );

      // -------------------

      setLoadDataErr(null);

    } catch (e) {
      setTableData(null);
      setDNCSectorsData(null);
      setStations(null);
      setBlocks(null);
      setLoadDataErr(e.message);
      return;
    }
    setDataBeingLoadedMessage(null);
    setDataLoaded(true);
  }, [request]);


  /**
   * При рендере компонента подгружает информацию для отображения в таблице из БД
   */
  useEffect(() => {
    fetchData();
  }, []);


  /**
   * Чистит все сообщения добавления информации об участке ЭЦД (ошибки и успех).
   */
  const clearAddECDSectorMessages = () => {
    setECDSectorFieldsErrs(null);
  }


  // ---------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новом участке

  const showAddNewECDSectorModal = () => {
    setIsAddNewECDSectorModalVisible(true);
  };

  const handleAddNewECDSectorOk = (sector) => {
    handleAddNewECDSector(sector);
  };

  const handleAddNewECDSectorCancel = () => {
    setIsAddNewECDSectorModalVisible(false);
  };

  // ---------------------------------------------------------------


  /**
   * Добавляет информацию об участке ЭЦД в БД.
   *
   * @param {object} sector
   */
  const handleAddNewECDSector = async (sector) => {
    setRecsBeingAdded((value) => value + 1);

    try {
      // Делаем запрос на сервер с целью добавления информации о новом участке ЭЦД
      const res = await request(ServerAPI.ADD_ECDSECTORS_DATA, 'POST', { ...sector });
      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Обновляем локальное состояние
      const newSector = getAppECDSectorObjFromDBECDSectorObj(res.sector);
      setTableData((value) => [...value, newSector]);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setECDSectorFieldsErrs(errs);
      }
    }

    setRecsBeingAdded((value) => value - 1);
  }


  /**
   * Удаляет информацию об участке ЭЦД из БД.
   *
   * @param {number} sectorId
   */
  const handleDelECDSector = async (sectorId) => {
    setRecsBeingProcessed((value) => [...value, sectorId]);

    try {
      // Делаем запрос на сервер с целью удаления всей информации об участке ЭЦД
      const res = await request(ServerAPI.DEL_ECDSECTORS_DATA, 'POST', { id: sectorId });
      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Обновляем локальное состояние (удаляем запись из основного массива участков ЭЦД, а также
      // из массивов смежных участков ЭЦД)
      setTableData(value => {
        const newValue = value.filter((sector) => sector[ECDSECTOR_FIELDS.KEY] !== sectorId);
        newValue.forEach((sector) => {
          sector[ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS] =
            sector[ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS].filter((adjSect) =>
              adjSect[ADJACENT_ECDSECTOR_FIELDS.SECTOR_ID] !== sectorId)
        });
        return newValue;
      });

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== sectorId));
  }


  /**
   * Вводит выбранную строку таблицы участков ЭЦД в режим редактирования.
   *
   * @param {object} record
   */
  const handleStartEditECDSector = (record) => {
    form.setFieldsValue({
      [ECDSECTOR_FIELDS.NAME]: '',
      ...record,
    });
    setEditingKey(record[ECDSECTOR_FIELDS.KEY]);
  };


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
   const finishEditing = () => {
    setEditingKey('');
    setModECDSectorFieldsErrs(null);
  };


  /**
   * Отменяет редактирование текущей записи таблицы участков ЭЦД.
   */
  const handleCancelMod = () => {
    finishEditing();
  };


  /**
   * Редактирует информацию об участке ЭЦД в БД.
   *
   * @param {number} sectorId
   */
  const handleEditECDSector = async (sectorId) => {
    let rowData;

    try {
      rowData = await form.validateFields();

    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    setRecsBeingProcessed((value) => [...value, sectorId]);

    try {
      // Делаем запрос на сервер с целью редактирования информации об участке ЭЦД
      const res = await request(ServerAPI.MOD_ECDSECTORS_DATA, 'POST', { id: sectorId, ...rowData });
      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Обновляем локальное состояние
      const newTableData = tableData.map((sector) => {
        if (sector[ECDSECTOR_FIELDS.KEY] === sectorId) {
          return { ...sector, ...rowData };
        }
        return sector;
      })

      setTableData(newTableData);
      finishEditing();

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModECDSectorFieldsErrs(errs);
      }
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== sectorId));
  }


  // Описание столбцов таблицы участков ЭЦД
  const columns = ecdSectorsTableColumns({
    isEditing,
    editingKey,
    handleEditECDSector,
    handleCancelMod,
    handleStartEditECDSector,
    handleDelECDSector,
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
        required: true,
        errMessage: modECDSectorFieldsErrs ? modECDSectorFieldsErrs[col.dataIndex] : null,
      }),
    };
  });


  return (
    <>
      <Title level={2} className="center top-margin-05">Участки ЭЦД</Title>

      {loadDataErr ? <Text type="danger">{loadDataErr}</Text> :

      <Form form={form} component={false}>
        <NewECDSectorModal
          isModalVisible={isAddNewECDSectorModalVisible}
          handleAddNewECDSectorOk={handleAddNewECDSectorOk}
          handleAddNewECDSectorCancel={handleAddNewECDSectorCancel}
          ecdSectorFieldsErrs={ecdSectorFieldsErrs}
          clearAddECDSectorMessages={clearAddECDSectorMessages}
          recsBeingAdded={recsBeingAdded}
        />

        <Button type="primary" onClick={showAddNewECDSectorModal}>
          Добавить запись
        </Button>

        {
          dataBeingLoadedMessage &&
          <div>
            {dataBeingLoadedMessage}
          </div>
        }

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
                if (!editingKey || editingKey !== record[ECDSECTOR_FIELDS.KEY]) {
                  handleStartEditECDSector(record);
                }
              },
              onKeyUp: event => {
                if (event.key === 'Enter') {
                  handleEditECDSector(record[ECDSECTOR_FIELDS.KEY]);
                }
              }
            };
          }}
          expandable={{
            expandedRowRender: record => (
              <div className="expandable-row-content">
                {/*
                  В данном блоке у пользователя будет возможность формировать
                  список участков ЭЦД, смежных с текущим
                */}
                <AdjacentECDSectorsBlock
                  ecdSector={record}
                  allECDSectors={tableData}
                  setTableDataCallback={setTableData}
                />
                {/*
                  В данном блоке у пользователя будет возможность формировать
                  список участков ДНЦ, ближайших к текущему участку ЭЦД
                */}
                <NearestDNCSectorsBlock
                  ecdSector={record}
                  allDNCSectors={dncSectorsData}
                  setTableDataCallback={setTableData}
                />
                {/*
                  В данном блоке у пользователя будет возможность формировать
                  список поездных участков ЭЦД для текущего участка ЭЦД
                */}
                <ECDTrainSectorsBlock
                  currECDSectorRecord={record}
                  setTableDataCallback={setTableData}
                  stations={stations}
                  blocks={blocks}
                />
                {/*
                  В данном блоке у пользователя будет возможность формировать
                  список структурных подразделений для текущего участка ЭЦД
                */}
                <div>
                  <Title level={4}>Структурные подразделения</Title>
                  <ECDStructuralDivisionsTable
                    currECDSectorRecordId={record[ECDSECTOR_FIELDS.KEY]}
                    ecdSectorStructuralDivisions={record[ECDSECTOR_FIELDS.STRUCTURAL_DIVISIONS]}
                    setTableDataCallback={setTableData}
                  />
                </div>
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


export default ECDSectorsTable;
