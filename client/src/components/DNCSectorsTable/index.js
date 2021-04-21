import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { Table, Form, Button } from 'antd';
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
import getAppDNCTrainSectorFromDBDNCTrainSectorObj from '../../mappers/getAppDNCTrainSectorFromDBDNCTrainSectorObj';

import 'antd/dist/antd.css';
import './styles.scss';


/**
 * Компонент таблицы с информацией об участках ДНЦ.
 */
const DNCSectorsTable = () => {
  // Информация по участкам ДНЦ (массив объектов)
  const [tableData, setTableData] = useState(null);

  // Информация по участкам ЭЦД (массив объектов)
  const [ecdSectorsData, setECDSectorsData] = useState(null);

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
  const isEditing = (record) => record.key === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewDNCSectorModalVisible, setIsAddNewDNCSectorModalVisible] = useState(false);

  // Ошибки добавления информации о новом участке ДНЦ
  const [commonAddErr, setCommonAddErr] = useState(null);
  const [dncSectorFieldsErrs, setDNCSectorFieldsErrs] = useState(null);

  // Сообщение об успешном окончании процесса сохранения нового участка ДНЦ
  const [successSaveMessage, setSuccessSaveMessage] = useState(null);

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();


  /**
   * Извлекает информацию, которая должна быть отображена в таблице, из первоисточника
   * и устанавливает ее в локальное состояние.
   */
  const fetchData = useCallback(async () => {
    setDataLoaded(false);

    try {
      // Делаем запрос на сервер с целью получения информации по участкам ДНЦ
      let res = await request(ServerAPI.GET_DNCSECTORS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      const tableData = res.map((sector) => getAppDNCSectorObjFromDBDNCSectorObj(sector));

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

      // -------------------

      // Осталось получить информацию о поездных участках ДНЦ

      res = await request(ServerAPI.GET_DNCTRAINSECTORS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      // Для каждой полученной записи создаем в tableData элемент массива поездных участков ДНЦ
      // для соответствующего участка ДНЦ
      res.forEach((data) => {
        const dncSector = tableData.find((el) => el[DNCSECTOR_FIELDS.KEY] === data.DNCTS_DNCSectorID);
        if (dncSector) {
          dncSector[DNCSECTOR_FIELDS.TRAIN_SECTORS].push(getAppDNCTrainSectorFromDBDNCTrainSectorObj(data));
        }
      });

      setTableData(tableData);
      setLoadDataErr(null);

    } catch (e) {
      setTableData(null);
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
    setCommonAddErr(null);
    setDNCSectorFieldsErrs(null);
    setSuccessSaveMessage(null);
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
    try {
      // Делаем запрос на сервер с целью добавления информации о новом участке ДНЦ
      const res = await request(ServerAPI.ADD_DNCSECTORS_DATA, 'POST',
        { ...sector },
        { Authorization: `Bearer ${auth.token}` }
      );

      setSuccessSaveMessage(res.message);

      // Обновляем локальное состояние
      const newSector = getAppDNCSectorObjFromDBDNCSectorObj(res.sector);
      setTableData((value) => [...value, newSector]);

    } catch (e) {
      setCommonAddErr(e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setDNCSectorFieldsErrs(errs);
      }
    }
  }


  /**
   * Удаляет информацию об участке ДНЦ из БД.
   *
   * @param {number} sectorId
   */
  const handleDelDNCSector = async (sectorId) => {
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
    setEditingKey(record.key);
  };


  /**
   * Отменяет редактирование текущей записи таблицы участков ДНЦ.
   */
  const handleCancelMod = () => {
    setEditingKey('');
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

      setEditingKey('');

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  }


  /**
   * По заданному id участка ДНЦ возвращает его название.
   */
  const getDNCSectorNameById = (id) => {
    if (!tableData || !tableData.length) {
      return;
    }
    const index = tableData.findIndex(sector => sector[DNCSECTOR_FIELDS.KEY] === id);
    if (index > -1) {
      return tableData[index][DNCSECTOR_FIELDS.NAME];
    }
    return null;
  };


  /**
   * По заданному id участка ЭЦД возвращает его название.
   */
   const getECDSectorNameById = (id) => {
    if (!ecdSectorsData || !ecdSectorsData.length) {
      return;
    }
    const index = ecdSectorsData.findIndex(sector => sector[ECDSECTOR_FIELDS.KEY] === id);
    if (index > -1) {
      return ecdSectorsData[index][ECDSECTOR_FIELDS.NAME];
    }
    return null;
  };


  // Описание столбцов таблицы участков ДНЦ
  const columns = dncSectorsTableColumns({
    isEditing,
    editingKey,
    handleEditDNCSector,
    handleCancelMod,
    handleStartEditDNCSector,
    handleDelDNCSector
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
        <NewDNCSectorModal
          isModalVisible={isAddNewDNCSectorModalVisible}
          handleAddNewDNCSectorOk={handleAddNewDNCSectorOk}
          handleAddNewDNCSectorCancel={handleAddNewDNCSectorCancel}
          commonAddErr={commonAddErr}
          dncSectorFieldsErrs={dncSectorFieldsErrs}
          clearAddDNCSectorMessages={clearAddDNCSectorMessages}
          successSaveMessage={successSaveMessage}
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
          scroll={{ x: '100vw', y: '100vh' }}
          onRow={(record) => {
            return {
              onDoubleClick: () => { handleStartEditDNCSector(record) },
              onKeyUp: event => {
                if (event.key === 'Enter') {
                  handleEditDNCSector(record.key);
                }
              }
            };
          }}
          expandable={{
            expandedRowRender: record => (
              <>
                <div className="adjacent-and-nearest-block">
                  {/*
                    В данном блоке у пользователя будет возможность формировать
                    список участков ДНЦ, смежных с текущим
                  */}
                  <AdjacentDNCSectorsBlock
                    currDNCSectorRecord={record}
                    possibleAdjDNCSectors={
                      tableData
                        .filter(el => {
                          let adjacentSectorsIds =
                            record[DNCSECTOR_FIELDS.ADJACENT_DNCSECTORS].map(sect => sect[ADJACENT_DNCSECTOR_FIELDS.SECTOR_ID]);

                          // Список выбора смежных участков не должен включать текущие смежные участки и сам текущий участок
                          return (!adjacentSectorsIds.includes(el[DNCSECTOR_FIELDS.KEY])) &&
                            el[DNCSECTOR_FIELDS.KEY] !== record[DNCSECTOR_FIELDS.KEY];
                        })
                        // Хочу, чтобы наименования участков выводились в алфавитном порядке
                        .sort((a, b) => {
                          const sectName1 = a[DNCSECTOR_FIELDS.NAME];
                          const sectName2 = b[DNCSECTOR_FIELDS.NAME];
                          if (sectName1 < sectName2) {
                            return -1;
                          }
                          if (sectName1 > sectName2) {
                            return 1;
                          }
                          return 0;
                        })
                    }
                    setTableDataCallback={setTableData}
                    getDNCSectorNameByIdCallback={getDNCSectorNameById}
                  />
                  <NearestECDSectorsBlock
                    dataSource={
                      // Хочу, чтобы наименования участков выводились в алфавитном порядке
                      record[DNCSECTOR_FIELDS.NEAREST_ECDSECTORS].sort((a, b) => {
                        const sectName1 = getECDSectorNameById(a[NEAREST_SECTOR_FIELDS.SECTOR_ID]);
                        const sectName2 = getECDSectorNameById(b[NEAREST_SECTOR_FIELDS.SECTOR_ID]);
                        if (sectName1 < sectName2) {
                          return -1;
                        }
                        if (sectName1 > sectName2) {
                          return 1;
                        }
                        return 0;
                      })
                    }
                    currDNCSectorRecord={record}
                    possibleNearECDSectors={
                      ecdSectorsData
                        .filter(el => {
                          let nearestECDSectorsIds =
                            record[DNCSECTOR_FIELDS.NEAREST_ECDSECTORS].map(sect => sect[NEAREST_SECTOR_FIELDS.SECTOR_ID]);

                          // Список выбора ближайших участков ЭЦД не должен включать текущие ближайшие участки ЭЦД
                          return !nearestECDSectorsIds.includes(el[ECDSECTOR_FIELDS.KEY]);
                        })
                        // Хочу, чтобы наименования участков выводились в алфавитном порядке
                        .sort((a, b) => {
                          const sectName1 = a[ECDSECTOR_FIELDS.NAME];
                          const sectName2 = b[ECDSECTOR_FIELDS.NAME];
                          if (sectName1 < sectName2) {
                            return -1;
                          }
                          if (sectName1 > sectName2) {
                            return 1;
                          }
                          return 0;
                        })
                    }
                    setTableDataCallback={setTableData}
                    getECDSectorNameByIdCallback={getECDSectorNameById}
                  />
                </div>
                {/*
                  В данном блоке у пользователя будет возможность формировать
                  список поездных участков ДНЦ для текущего участка ДНЦ
                */}
                <DNCTrainSectorsBlock
                  currDNCSectorRecord={record}
                  setTableDataCallback={setTableData}
                />
              </>
            ),
            rowExpandable: record => true,
          }}
        />
      </Form>
    }
    </>
  );
};


export default DNCSectorsTable;
