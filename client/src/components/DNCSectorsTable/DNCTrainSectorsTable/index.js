import React, { useContext, useState } from 'react';
import EditableTableCell from '../../EditableTableCell';
import dncTrainSectorsTableColumns from './DNCTrainSectorsTableColumns';
import { TRAIN_SECTOR_FIELDS } from '../../../constants';
import { Table, Form } from 'antd';
import { MESSAGE_TYPES, useCustomMessage } from '../../../hooks/customMessage.hook';
import { useHttp } from '../../../hooks/http.hook';
import { ServerAPI, DNCSECTOR_FIELDS } from '../../../constants';
import { AuthContext } from '../../../context/AuthContext';


/**
 * Компонент таблицы с информацией о поездных участках ДНЦ.
 */
const DNCTrainSectorsTable = (props) => {
  const {
    currDNCSectorRecord: record, // текущая запись об участке ДНЦ
    setTableDataCallback, // функция, позволяющая внести изменения в исходный массив объектов участков ДНЦ
  } = props;

  // Для редактирования данных таблицы
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[TRAIN_SECTOR_FIELDS.KEY] === editingKey;

  // Ошибки редактирования информации о поездном участке ДНЦ
  const [modDNCTrainSectorFieldsErrs, setModDNCTrainSectorFieldsErrs] = useState(null);

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
   const finishEditing = () => {
    setEditingKey('');
    setModDNCTrainSectorFieldsErrs(null);
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
      [TRAIN_SECTOR_FIELDS.NAME]: '',
      ...rec,
    });
    setEditingKey(rec[TRAIN_SECTOR_FIELDS.KEY]);
  };


  /**
   * Редактирует информацию об участке в БД.
   *
   * @param {number} trainSectorId
   */
  const handleEdit = async (trainSectorId) => {
    let rowData;

    try {
      rowData = await form.validateFields();

    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    try {
      // Делаем запрос на сервер с целью редактирования информации об участке
      const res = await request(ServerAPI.MOD_DNCTRAINSECTORS_DATA, 'POST',
        { id: trainSectorId, ...rowData },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Обновляем локальное состояние
      setTableDataCallback((value) => value.map((dncSector) => {
        if (dncSector[DNCSECTOR_FIELDS.KEY] === record[DNCSECTOR_FIELDS.KEY]) {
          return {
            ...dncSector,
            [DNCSECTOR_FIELDS.TRAIN_SECTORS]: dncSector[DNCSECTOR_FIELDS.TRAIN_SECTORS].map(el =>
              el[TRAIN_SECTOR_FIELDS.KEY] === trainSectorId ? { ...el, ...rowData } : el),
          };
        }
        return dncSector;
      }));

      finishEditing();

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModDNCTrainSectorFieldsErrs(errs);
      }
    }
  };


  /**
   * Удаляет информацию об участке из БД.
   *
   * @param {number} trainSectorId
   */
  const handleDel = async (trainSectorId) => {
    try {
      // Делаем запрос на сервер с целью удаления всей информации об участке ДНЦ
      const res = await request(ServerAPI.DEL_DNCTRAINSECTORS_DATA, 'POST',
        { id: trainSectorId },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Обновляем локальное состояние
      setTableDataCallback((value) => value.map((dncSector) => {
        if (dncSector[DNCSECTOR_FIELDS.KEY] === record[DNCSECTOR_FIELDS.KEY]) {
          return {
            ...dncSector,
            [DNCSECTOR_FIELDS.TRAIN_SECTORS]: dncSector[DNCSECTOR_FIELDS.TRAIN_SECTORS].filter(el =>
              el[TRAIN_SECTOR_FIELDS.KEY] !== trainSectorId),
          };
        }
        return dncSector;
      }));

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
  };


  // Описание столбцов таблицы поездных участков ДНЦ
  const columns = dncTrainSectorsTableColumns({
    isEditing,
    editingKey,
    handleEdit,
    handleCancelMod,
    handleStartEdit,
    handleDel,
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
        errMessage: modDNCTrainSectorFieldsErrs ? modDNCTrainSectorFieldsErrs[col.dataIndex] : null,
      }),
    };
  });


  return (
    <Form form={form} component={false}>
      <Table
        showHeader={false}
        components={{
          body: {
            cell: EditableTableCell
          },
        }}
        bordered
        scroll={{ y: 200 }}
        dataSource={
          // Хочу, чтобы наименования участков выводились в алфавитном порядке
          record[DNCSECTOR_FIELDS.TRAIN_SECTORS].sort((a, b) => {
            const sectName1 = a[TRAIN_SECTOR_FIELDS.NAME];
            const sectName2 = b[TRAIN_SECTOR_FIELDS.NAME];
            if (sectName1 < sectName2) {
              return -1;
            }
            if (sectName1 > sectName2) {
              return 1;
            }
            return 0;
          })
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
              if (!editingKey || editingKey !== record[TRAIN_SECTOR_FIELDS.KEY]) {
                handleStartEdit(record);
              }
            },
            onKeyUp: event => {
              if (event.key === 'Enter') {
                handleEdit(record[TRAIN_SECTOR_FIELDS.KEY]);
              }
            }
          };
        }}
      />
    </Form>
  );
};


export default DNCTrainSectorsTable;
