import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { Table, Form, Button, Typography } from 'antd';
import EditableTableCell from '../EditableTableCell';
import NewDNCSectorModal from '../NewDNCSectorModal';
import {
  ServerAPI,
  DNCSECTOR_FIELDS,
  ECDSECTOR_FIELDS,
  ADJACENT_DNCSECTOR_FIELDS,
  NEAREST_SECTOR_FIELDS,
} from '../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import AdjacentDNCSectorsBlock from './AdjacentDNCSectorsBlock';
import NearestECDSectorsBlock from './NearestECDSectorsBlock';
import dncSectorsTableColumns from './DNCSectorsTableColumns';
import DNCTrainSectorsBlock from './DNCTrainSectorsBlock';
import getAppDNCSectorObjFromDBDNCSectorObj from '../../mappers/getAppDNCSectorObjFromDBDNCSectorObj';
import getAppECDSectorObjFromDBECDSectorObj from '../../mappers/getAppECDSectorObjFromDBECDSectorObj';
import getAppStationObjFromDBStationObj from '../../mappers/getAppStationObjFromDBStationObj';
import getAppBlockObjFromDBBlockObj from '../../mappers/getAppBlockObjFromDBBlockObj';
import expandIcon from '../ExpandIcon';

const { Text, Title } = Typography;


/**
 * Компонент таблицы с информацией об участках ДНЦ.
 */
const DNCSectorsTable = () => {
  // Информация по участкам ДНЦ (массив объектов)
  const [tableData, setTableData] = useState(null);

  // Информация по участкам ЭЦД (массив объектов)
  const [ecdSectorsData, setECDSectorsData] = useState(null);

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

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для редактирования данных таблицы участков ДНЦ
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[DNCSECTOR_FIELDS.KEY] === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewDNCSectorModalVisible, setIsAddNewDNCSectorModalVisible] = useState(false);

  // Ошибки добавления информации о новом участке ДНЦ
  const [dncSectorFieldsErrs, setDNCSectorFieldsErrs] = useState(null);

  // Ошибки редактирования информации об участке ДНЦ
  const [modDNCSectorFieldsErrs, setModDNCSectorFieldsErrs] = useState(null);

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
      // Делаем запрос на сервер с целью получения информации по участкам ДНЦ
      // (запрос возвратит информацию в виде массива объектов участков ДНЦ; для каждого
      // объекта участка ДНЦ будет определен массив объектов поездных участков ДНЦ; для
      // каждого поездного участка ДНЦ будет определен массив объектов соответствующих станций)
      let res = await request(ServerAPI.GET_DNCSECTORS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });
console.log(res)
      const tableData = res.map((sector) => getAppDNCSectorObjFromDBDNCSectorObj(sector));
console.log(tableData)
      // -------------------

      // Теперь получаем информацию о смежных участках ДНЦ
      res = await request(ServerAPI.GET_ADJACENTDNCSECTORS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      // Для каждой полученной записи создаем в tableData элемент массива смежных участков ДНЦ
      // у двух записей - соответствующих смежным участкам
      res.forEach((data) => {
        const sector1 = tableData.find((el) => el[DNCSECTOR_FIELDS.KEY] === data.ADNCS_DNCSectorID1);
        const sector2 = tableData.find((el) => el[DNCSECTOR_FIELDS.KEY] === data.ADNCS_DNCSectorID2);
        if (sector1 && sector2) {
          sector1[DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS].push({
            [ADJACENT_DNCSECTOR_FIELDS.SECTOR_ID]: sector2[DNCSECTOR_FIELDS.KEY],
          });
          sector2[DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS].push({
            [ADJACENT_DNCSECTOR_FIELDS.SECTOR_ID]: sector1[DNCSECTOR_FIELDS.KEY],
          });
        }
      });

      // -------------------

      // Делаем запрос на сервер с целью получения информации по участкам ЭЦД
      res = await request(ServerAPI.GET_ECDSECTORS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      const ecdSectors = res.map((sector) => getAppECDSectorObjFromDBECDSectorObj(sector));
      setECDSectorsData(ecdSectors);

      // -------------------

      // Теперь обращаемся к серверу за информацией о ближайших участках ДНЦ и ЭЦД
      res = await request(ServerAPI.GET_NEARESTDNCECDSECTORS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      // Для каждой полученной записи создаем в tableData элемент массива ближайших участков ЭЦД
      // для соответствующего участка ДНЦ
      res.forEach((data) => {
        const dncSector = tableData.find((el) => el[DNCSECTOR_FIELDS.KEY] === data.NDE_DNCSectorID);
        const ecdSector = ecdSectors.find((el) => el[ECDSECTOR_FIELDS.KEY] === data.NDE_ECDSectorID);
        if (dncSector && ecdSector) {
          dncSector[DNCSECTOR_FIELDS.NEAREST_ECDSECTORS].push({
            [NEAREST_SECTOR_FIELDS.SECTOR_ID]: ecdSector[ECDSECTOR_FIELDS.KEY],
          });
        }
      });

      setTableData(tableData);

      // -------------------

      // Получаем информацию о всех станциях

      res = await request(ServerAPI.GET_STATIONS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      setStations(res.map((station) => getAppStationObjFromDBStationObj(station)));

      // -------------------

      // Получаем информацию о всех перегонах

      res = await request(ServerAPI.GET_BLOCKS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      setBlocks(res.map((block) => getAppBlockObjFromDBBlockObj(block)));

      // -------------------

      setLoadDataErr(null);

    } catch (e) {
      setTableData(null);
      setECDSectorsData(null);
      setStations(null);
      setBlocks(null);
      setLoadDataErr(e.message);
      return;
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
   * Чистит все сообщения добавления информации об участке ДНЦ (ошибки и успех).
   */
  const clearAddDNCSectorMessages = () => {
    setDNCSectorFieldsErrs(null);
  }


  // ---------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новом участке

  const showAddNewDNCSectorModal = () => {
    setIsAddNewDNCSectorModalVisible(true);
  };

  const handleAddNewDNCSectorOk = (sector) => {
    handleAddNewDNCSector(sector);
  };

  const handleAddNewDNCSectorCancel = () => {
    setIsAddNewDNCSectorModalVisible(false);
  };

  // ---------------------------------------------------------------


  /**
   * Добавляет информацию об участке ДНЦ в БД.
   *
   * @param {object} sector
   */
  const handleAddNewDNCSector = async (sector) => {
    setRecsBeingAdded((value) => value + 1);

    try {
      // Делаем запрос на сервер с целью добавления информации о новом участке ДНЦ
      const res = await request(ServerAPI.ADD_DNCSECTORS_DATA, 'POST',
        { ...sector },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Обновляем локальное состояние
      const newSector = getAppDNCSectorObjFromDBDNCSectorObj(res.sector);
      setTableData((value) => [...value, newSector]);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setDNCSectorFieldsErrs(errs);
      }
    }

    setRecsBeingAdded((value) => value - 1);
  }


  /**
   * Удаляет информацию об участке ДНЦ из БД.
   *
   * @param {number} sectorId
   */
  const handleDelDNCSector = async (sectorId) => {
    setRecsBeingProcessed((value) => [...value, sectorId]);

    try {
      // Делаем запрос на сервер с целью удаления всей информации об участке ДНЦ
      const res = await request(ServerAPI.DEL_DNCSECTORS_DATA, 'POST',
        { id: sectorId },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Обновляем локальное состояние (удаляем запись из основного массива участков ДНЦ, а также
      // из массивов смежных участков ДНЦ)
      setTableData(value => {
        const newValue = value.filter((sector) => sector[DNCSECTOR_FIELDS.KEY] !== sectorId);
        newValue.forEach((sector) => {
          sector[DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS] =
            sector[DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS].filter((adjSect) =>
              adjSect[ADJACENT_DNCSECTOR_FIELDS.SECTOR_ID] !== sectorId)
        });
        return newValue;
      });

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== sectorId));
  };


  /**
   * Вводит выбранную строку таблицы участков ДНЦ в режим редактирования.
   *
   * @param {object} record
   */
  const handleStartEditDNCSector = (record) => {
    form.setFieldsValue({
      [DNCSECTOR_FIELDS.NAME]: '',
      ...record,
    });
    setEditingKey(record[DNCSECTOR_FIELDS.KEY]);
  };


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
   const finishEditing = () => {
    setEditingKey('');
    setModDNCSectorFieldsErrs(null);
  };


  /**
   * Отменяет редактирование текущей записи таблицы участков ДНЦ.
   */
  const handleCancelMod = () => {
    finishEditing();
  };


  /**
   * Редактирует информацию об участке ДНЦ в БД.
   *
   * @param {number} sectorId
   */
  const handleEditDNCSector = async (sectorId) => {
    let rowData;

    try {
      rowData = await form.validateFields();

    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    setRecsBeingProcessed((value) => [...value, sectorId]);

    try {
      // Делаем запрос на сервер с целью редактирования информации об участке ДНЦ
      const res = await request(ServerAPI.MOD_DNCSECTORS_DATA, 'POST',
        { id: sectorId, ...rowData },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Обновляем локальное состояние
      setTableData((value) => value.map((sector) => {
        if (sector[DNCSECTOR_FIELDS.KEY] === sectorId) {
          return { ...sector, ...rowData };
        }
        return sector;
      }));

      finishEditing();

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModDNCSectorFieldsErrs(errs);
      }
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== sectorId));
  }


  // Описание столбцов таблицы участков ДНЦ
  const columns = dncSectorsTableColumns({
    isEditing,
    editingKey,
    handleEditDNCSector,
    handleCancelMod,
    handleStartEditDNCSector,
    handleDelDNCSector,
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
        errMessage: modDNCSectorFieldsErrs ? modDNCSectorFieldsErrs[col.dataIndex] : null,
      }),
    };
  });


  return (
    <>
      <Title level={2} className="center top-margin-05">Участки ДНЦ</Title>

      {loadDataErr ? <Text type="danger">{loadDataErr}</Text> :

      <Form form={form} component={false}>
        <NewDNCSectorModal
          isModalVisible={isAddNewDNCSectorModalVisible}
          handleAddNewDNCSectorOk={handleAddNewDNCSectorOk}
          handleAddNewDNCSectorCancel={handleAddNewDNCSectorCancel}
          dncSectorFieldsErrs={dncSectorFieldsErrs}
          clearAddDNCSectorMessages={clearAddDNCSectorMessages}
          recsBeingAdded={recsBeingAdded}
        />

        <Button
          type="primary"
          style={{
            marginBottom: 16,
          }}
          onClick={showAddNewDNCSectorModal}
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
                if (!editingKey || editingKey !== record[DNCSECTOR_FIELDS.KEY]) {
                  handleStartEditDNCSector(record);
                }
              },
              onKeyUp: event => {
                if (event.key === 'Enter') {
                  handleEditDNCSector(record[DNCSECTOR_FIELDS.KEY]);
                }
              }
            };
          }}
          expandable={{
            expandedRowRender: record => (
              <div className="expandable-row-content">
                {/*
                  В данном блоке у пользователя будет возможность формировать
                  список участков ДНЦ, смежных с текущим
                */}
                <AdjacentDNCSectorsBlock
                  dncSector={record}
                  allDNCSectors={tableData}
                  setTableDataCallback={setTableData}
                />
                {/*
                  В данном блоке у пользователя будет возможность формировать
                  список участков ЭЦД, ближайших к текущему участку ДНЦ
                */}
                <NearestECDSectorsBlock
                  dncSector={record}
                  allECDSectors={ecdSectorsData}
                  setTableDataCallback={setTableData}
                />
                {/*
                  В данном блоке у пользователя будет возможность формировать
                  список поездных участков ДНЦ для текущего участка ДНЦ
                */}
                <DNCTrainSectorsBlock
                  currDNCSectorRecord={record}
                  setTableDataCallback={setTableData}
                  stations={stations}
                  blocks={blocks}
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


export default DNCSectorsTable;
