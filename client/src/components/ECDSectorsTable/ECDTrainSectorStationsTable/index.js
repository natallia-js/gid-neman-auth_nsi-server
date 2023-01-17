import React, { useState } from 'react';
import EditableTableCell from '../../EditableTableCell';
import ecdTrainSectorStationsTableColumns from './ECDTrainSectorStationsTableColumns';
import { ServerAPI, ECDSECTOR_FIELDS, STATION_FIELDS, TRAIN_SECTOR_FIELDS } from '../../../constants';
import { Table, Form } from 'antd';
import { MESSAGE_TYPES, useCustomMessage } from '../../../hooks/customMessage.hook';
import { useHttp } from '../../../hooks/http.hook';


/**
 * Компонент таблицы с информацией о станциях поездного участка ЭЦД.
 */
const ECDTrainSectorStationsTable = (props) => {
  const {
    currECDTrainSectorRecord: record, // текущая запись о поездном участке ЭЦД
    setTableDataCallback, // функция, позволяющая внести изменения в исходный массив объектов участков ЭЦД
  } = props;

  // Для редактирования данных таблицы
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[STATION_FIELDS.KEY] === editingKey;

  // Ошибки редактирования информации о станции поездного участка ЭЦД
  const [modECDTrainSectorStationFieldsErrs, setModECDTrainSectorStationFieldsErrs] = useState(null);

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // id записей, по которым запущен процесс обработки данных на сервере (удаление, редактирование)
  const [recsBeingProcessed, setRecsBeingProcessed] = useState([]);


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
   const finishEditing = () => {
    setEditingKey('');
    setModECDTrainSectorStationFieldsErrs(null);
  };


  /**
   * Отменяет редактирование текущей записи таблицы.
   */
   const handleCancelMod = () => {
    finishEditing();
  };


  /**
   * Вводит выбранную строку таблицы в режим редактирования.
   *
   * @param {object} rec
   */
   const handleStartEdit = (rec) => {
    form.setFieldsValue({
      [STATION_FIELDS.POS_IN_TRAIN_SECTOR]: '',
      [STATION_FIELDS.BELONGS_TO_SECTOR]: '',
      ...rec,
    });
    setEditingKey(rec[STATION_FIELDS.KEY]);
  };


  /**
   * Редактирует информацию о станции поездного участка в БД.
   *
   * @param {number} stationId
   */
  const handleEdit = async (stationId) => {
    let rowData;

    try {
      rowData = await form.validateFields();
    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    setRecsBeingProcessed((value) => [...value, stationId]);

    try {
      // Делаем запрос на сервер с целью редактирования информации о станции участка
      const res = await request(ServerAPI.MOD_ECDTRAINSECTORSTATION_DATA, 'POST',
        {
          trainSectorId: record[TRAIN_SECTOR_FIELDS.KEY],
          stationId,
          posInTrainSector: rowData[STATION_FIELDS.POS_IN_TRAIN_SECTOR],
          belongsToSector: rowData[STATION_FIELDS.BELONGS_TO_SECTOR] ? 1 : 0,
        }
      );
      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Обновляем локальное состояние
      setTableDataCallback((value) => value.map((ecdSector) => {
        const trainSector = ecdSector[ECDSECTOR_FIELDS.TRAIN_SECTORS].find((el) =>
          el[TRAIN_SECTOR_FIELDS.KEY] === record[TRAIN_SECTOR_FIELDS.KEY]);
        if (!trainSector) {
          return ecdSector;
        }
        let trainSectorStation = trainSector[TRAIN_SECTOR_FIELDS.STATIONS].find((el) =>
          el[STATION_FIELDS.KEY] === stationId);
        if (!trainSectorStation) {
          return ecdSector;
        }
        trainSectorStation[STATION_FIELDS.POS_IN_TRAIN_SECTOR] = rowData[STATION_FIELDS.POS_IN_TRAIN_SECTOR];
        trainSectorStation[STATION_FIELDS.BELONGS_TO_SECTOR] = rowData[STATION_FIELDS.BELONGS_TO_SECTOR];
        return ecdSector;
      }));

      finishEditing();

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModECDTrainSectorStationFieldsErrs(errs);
      }
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== stationId));
  };


  /**
   * Удаляет информацию о станции поездного участка из БД.
   *
   * @param {number} stationId
   */
  const handleDel = async (stationId) => {
    setRecsBeingProcessed((value) => [...value, stationId]);

    try {
      // Делаем запрос на сервер с целью удаления всей информации о станции поездного участка ЭЦД
      const res = await request(ServerAPI.DEL_ECDTRAINSECTORSTATION_DATA, 'POST',
        {
          trainSectorId: record[TRAIN_SECTOR_FIELDS.KEY],
          stationId,
        }
      );
      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Обновляем локальное состояние
      setTableDataCallback((value) => value.map((ecdSector) => {
        const trainSector = ecdSector[ECDSECTOR_FIELDS.TRAIN_SECTORS].find((el) =>
          el[TRAIN_SECTOR_FIELDS.KEY] === record[TRAIN_SECTOR_FIELDS.KEY]);
        if (!trainSector) {
          return ecdSector;
        }
        trainSector[TRAIN_SECTOR_FIELDS.STATIONS] =
          trainSector[TRAIN_SECTOR_FIELDS.STATIONS].filter((station) => station[STATION_FIELDS.KEY] !== stationId);
        return ecdSector;
      }));

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== stationId));
  };


  // Описание столбцов таблицы станций поездного участка ЭЦД
  const columns = ecdTrainSectorStationsTableColumns({
    isEditing,
    editingKey,
    handleEdit,
    handleCancelMod,
    handleStartEdit,
    handleDel,
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
        inputType: (col.dataIndex === STATION_FIELDS.BELONGS_TO_SECTOR)
          ? 'boolean'
          : (col.dataIndex === STATION_FIELDS.POS_IN_TRAIN_SECTOR)
            ? 'number'
            : 'text',
        dataType: (col.dataIndex === STATION_FIELDS.BELONGS_TO_SECTOR)
          ? 'boolean'
          : (col.dataIndex === STATION_FIELDS.POS_IN_TRAIN_SECTOR)
            ? 'number'
            : 'string',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        required: true,
        data: form.getFieldValue([STATION_FIELDS.BELONGS_TO_SECTOR]),
        errMessage: modECDTrainSectorStationFieldsErrs ? modECDTrainSectorStationFieldsErrs[col.dataIndex] : null,
      }),
    };
  });


  return (
    <Form form={form} component={false}>
      <Table
        components={{
          body: {
            cell: EditableTableCell
          },
        }}
        bordered
        size="small"
        dataSource={
          // Хочу, чтобы станции выводились в порядке возрастания их позиций в рамках поездного участка
          record[TRAIN_SECTOR_FIELDS.STATIONS].sort((a, b) =>
            a[STATION_FIELDS.POS_IN_TRAIN_SECTOR] - b[STATION_FIELDS.POS_IN_TRAIN_SECTOR])
        }
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
                handleStartEdit(record);
              }
            },
            onKeyUp: event => {
              if (event.key === 'Enter') {
                handleEdit(record[STATION_FIELDS.KEY]);
              }
            }
          };
        }}
      />
    </Form>
  );
};


export default ECDTrainSectorStationsTable;
