import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { Table, Form, Button, Typography } from 'antd';
import EditableTableCell from '../EditableTableCell';
import NewECDSectorModal from '../NewECDSectorModal';
import {
  ServerAPI,
  ECDSECTOR_FIELDS,
  DNCSECTOR_FIELDS,
  ADJACENT_ECDSECTOR_FIELDS,
  NEAREST_SECTOR_FIELDS,
} from '../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import AdjacentECDSectorsBlock from './AdjacentECDSectorsBlock';
import NearestDNCSectorsBlock from './NearestDNCSectorsBlock';
import ecdSectorsTableColumns from './ECDSectorsTableColumns';
import ECDTrainSectorsBlock from './ECDTrainSectorsBlock';
import getAppECDSectorObjFromDBECDSectorObj from '../../mappers/getAppECDSectorObjFromDBECDSectorObj';
import getAppDNCSectorObjFromDBDNCSectorObj from '../../mappers/getAppDNCSectorObjFromDBDNCSectorObj';
import getAppECDTrainSectorFromDBECDTrainSectorObj from '../../mappers/getAppECDTrainSectorFromDBECDTrainSectorObj';
import { PlusCircleTwoTone, MinusCircleTwoTone } from '@ant-design/icons';

import './styles.scss';

const { Title } = Typography;


/**
 * Компонент таблицы с информацией об участках ЭЦД.
 */
const ECDSectorsTable = () => {
  // Информация по участкам ЭЦД (массив объектов)
  const [tableData, setTableData] = useState(null);

  // Информация по участкам ДНЦ (массив объектов)
  const [dncSectorsData, setDNCSectorsData] = useState(null);

  // Ошибка загрузки данных
  const [loadDataErr, setLoadDataErr] = useState(null);

  // Флаг окончания загрузки информации
  const [dataLoaded, setDataLoaded] = useState(true);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для редактирования данных таблицы участков ЭЦД
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[ECDSECTOR_FIELDS.KEY] === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewECDSectorModalVisible, setIsAddNewECDSectorModalVisible] = useState(false);

  // Ошибки добавления информации о новом участке ЭЦД
  const [commonAddErr, setCommonAddErr] = useState(null);
  const [ecdSectorFieldsErrs, setECDSectorFieldsErrs] = useState(null);

  // Ошибки редактирования информации об участке ЭЦД
  const [modECDSectorFieldsErrs, setModECDSectorFieldsErrs] = useState(null);

  // Сообщение об успешном окончании процесса сохранения нового участка ЭЦД
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
      // Делаем запрос на сервер с целью получения информации по участкам ЭЦД
      let res = await request(ServerAPI.GET_ECDSECTORS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      const tableData = res.map((sector) => getAppECDSectorObjFromDBECDSectorObj(sector));

      // -------------------

      // Теперь получаем информацию о смежных участках ЭЦД
      res = await request(ServerAPI.GET_ADJACENTECDSECTORS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

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
      res = await request(ServerAPI.GET_DNCSECTORS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      const dncSectors = res.map((sector) => getAppDNCSectorObjFromDBDNCSectorObj(sector));
      setDNCSectorsData(dncSectors);

      // -------------------

      // Теперь обращаемся к серверу за информацией о ближайших участках ДНЦ и ЭЦД
      res = await request(ServerAPI.GET_NEARESTDNCECDSECTORS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

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

      // Осталось получить информацию о поездных участках ЭЦД

      res = await request(ServerAPI.GET_ECDTRAINSECTORS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      // Для каждой полученной записи создаем в tableData элемент массива поездных участков ЭЦД
      // для соответствующего участка ЭЦД
      res.forEach((data) => {
        const ecdSector = tableData.find((el) => el[ECDSECTOR_FIELDS.KEY] === data.ECDTS_ECDSectorID);
        if (ecdSector) {
          ecdSector[ECDSECTOR_FIELDS.TRAIN_SECTORS].push(getAppECDTrainSectorFromDBECDTrainSectorObj(data));
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
   * Чистит все сообщения добавления информации об участке ЭЦД (ошибки и успех).
   */
  const clearAddECDSectorMessages = () => {
    setCommonAddErr(null);
    setECDSectorFieldsErrs(null);
    setSuccessSaveMessage(null);
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
    try {
      // Делаем запрос на сервер с целью добавления информации о новом участке ЭЦД
      const res = await request(ServerAPI.ADD_ECDSECTORS_DATA, 'POST',
        { ...sector },
        { Authorization: `Bearer ${auth.token}` }
      );

      setSuccessSaveMessage(res.message);

      // Обновляем локальное состояние
      const newSector = getAppECDSectorObjFromDBECDSectorObj(res.sector);
      setTableData((value) => [...value, newSector]);

    } catch (e) {
      setCommonAddErr(e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setECDSectorFieldsErrs(errs);
      }
    }
  }


  /**
   * Удаляет информацию об участке ЭЦД из БД.
   *
   * @param {number} sectorId
   */
  const handleDelECDSector = async (sectorId) => {
    try {
      // Делаем запрос на сервер с целью удаления всей информации об участке ЭЦД
      const res = await request(ServerAPI.DEL_ECDSECTORS_DATA, 'POST',
        { id: sectorId },
        { Authorization: `Bearer ${auth.token}` }
      );

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

    try {
      // Делаем запрос на сервер с целью редактирования информации об участке ЭЦД
      const res = await request(ServerAPI.MOD_ECDSECTORS_DATA, 'POST',
        { id: sectorId, ...rowData },
        { Authorization: `Bearer ${auth.token}` }
      );

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
  }


  /**
   * По заданному id участка ЭЦД возвращает его название.
   */
  const getECDSectorNameById = (id) => {
    if (!tableData || !tableData.length) {
      return;
    }
    const index = tableData.findIndex(sector => sector[ECDSECTOR_FIELDS.KEY] === id);
    if (index > -1) {
      return tableData[index][ECDSECTOR_FIELDS.NAME];
    }
    return null;
  };


  /**
   * По заданному id участка ДНЦ возвращает его название.
   */
   const getDNCSectorNameById = (id) => {
    if (!dncSectorsData || !dncSectorsData.length) {
      return;
    }
    const index = dncSectorsData.findIndex(sector => sector[DNCSECTOR_FIELDS.KEY] === id);
    if (index > -1) {
      return dncSectorsData[index][DNCSECTOR_FIELDS.NAME];
    }
    return null;
  };


  // Описание столбцов таблицы участков ЭЦД
  const columns = ecdSectorsTableColumns({
    isEditing,
    editingKey,
    handleEditECDSector,
    handleCancelMod,
    handleStartEditECDSector,
    handleDelECDSector
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
    {
      loadDataErr ? <p className="errMess">{loadDataErr}</p> :

      <Form form={form} component={false}>
        <NewECDSectorModal
          isModalVisible={isAddNewECDSectorModalVisible}
          handleAddNewECDSectorOk={handleAddNewECDSectorOk}
          handleAddNewECDSectorCancel={handleAddNewECDSectorCancel}
          commonAddErr={commonAddErr}
          ecdSectorFieldsErrs={ecdSectorFieldsErrs}
          clearAddECDSectorMessages={clearAddECDSectorMessages}
          successSaveMessage={successSaveMessage}
        />

        <Title level={2} className="center top-margin-05">Участки ЭЦД</Title>

        <Button
          type="primary"
          style={{
            marginBottom: 16,
          }}
          onClick={showAddNewECDSectorModal}
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
                <div className="adjacent-and-nearest-block">
                  {/*
                    В данном блоке у пользователя будет возможность формировать
                    список участков ЭЦД, смежных с текущим
                  */}
                  <AdjacentECDSectorsBlock
                    currECDSectorRecord={record}
                    possibleAdjECDSectors={
                      tableData
                        .filter(el => {
                          let adjacentSectorsIds =
                            record[ECDSECTOR_FIELDS.ADJACENT_ECDSECTORS].map(sect => sect[ADJACENT_ECDSECTOR_FIELDS.SECTOR_ID]);

                          // Список выбора смежных участков не должен включать текущие смежные участки и сам текущий участок
                          return (!adjacentSectorsIds.includes(el[ECDSECTOR_FIELDS.KEY])) &&
                            el[ECDSECTOR_FIELDS.KEY] !== record[ECDSECTOR_FIELDS.KEY];
                        })
                    }
                    setTableDataCallback={setTableData}
                    getECDSectorNameByIdCallback={getECDSectorNameById}
                  />
                  <NearestDNCSectorsBlock
                    dataSource={record[ECDSECTOR_FIELDS.NEAREST_DNCSECTORS]}
                    currECDSectorRecord={record}
                    possibleNearDNCSectors={
                      dncSectorsData
                        .filter(el => {
                          let nearestDNCSectorsIds =
                            record[ECDSECTOR_FIELDS.NEAREST_DNCSECTORS].map(sect => sect[NEAREST_SECTOR_FIELDS.SECTOR_ID]);

                          // Список выбора ближайших участков ДНЦ не должен включать текущие ближайшие участки ДНЦ
                          return !nearestDNCSectorsIds.includes(el[DNCSECTOR_FIELDS.KEY]);
                        })
                    }
                    setTableDataCallback={setTableData}
                    getDNCSectorNameByIdCallback={getDNCSectorNameById}
                  />
                </div>
                {/*
                  В данном блоке у пользователя будет возможность формировать
                  список поездных участков ЭЦД для текущего участка ЭЦД
                */}
                <ECDTrainSectorsBlock
                  currECDSectorRecord={record}
                  setTableDataCallback={setTableData}
                />
              </div>
            ),
            rowExpandable: _record => true,
            expandIcon: ({ expanded, onExpand, record }) =>
              expanded ? (
                <MinusCircleTwoTone onClick={e => onExpand(record, e)} style={{ fontSize: '1rem' }} />
              ) : (
                <PlusCircleTwoTone onClick={e => onExpand(record, e)} style={{ fontSize: '1rem' }} />
              ),
          }}
        />
      </Form>
    }
    </>
  );
};


export default ECDSectorsTable;
