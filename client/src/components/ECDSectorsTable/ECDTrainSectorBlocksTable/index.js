import React, { useContext, useState } from 'react';
import EditableTableCell from '../../EditableTableCell';
import ecdTrainSectorBlocksTableColumns from './ECDTrainSectorBlocksTableColumns';
import { ServerAPI, ECDSECTOR_FIELDS, BLOCK_FIELDS, TRAIN_SECTOR_FIELDS } from '../../../constants';
import { Table, Form } from 'antd';
import { MESSAGE_TYPES, useCustomMessage } from '../../../hooks/customMessage.hook';
import { useHttp } from '../../../hooks/http.hook';
import { AuthContext } from '../../../context/AuthContext';


/**
 * Компонент таблицы с информацией о перегонах поездного участка ЭЦД.
 */
const ECDTrainSectorBlocksTable = (props) => {
  const {
    currECDTrainSectorRecord: record, // текущая запись о поездном участке ЭЦД
    setTableDataCallback, // функция, позволяющая внести изменения в исходный массив объектов участков ЭЦД
  } = props;

  // Для редактирования данных таблицы
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[BLOCK_FIELDS.KEY] === editingKey;

  // Ошибки редактирования информации о перегоне поездного участка ЭЦД
  const [modECDTrainSectorBlockFieldsErrs, setModECDTrainSectorBlockFieldsErrs] = useState(null);

  // Для вывода всплывающих сообщений
  const message = useCustomMessage();

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // id записей, по которым запущен процесс обработки данных на сервере (удаление, редактирование)
  const [recsBeingProcessed, setRecsBeingProcessed] = useState([]);


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
   const finishEditing = () => {
    setEditingKey('');
    setModECDTrainSectorBlockFieldsErrs(null);
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
      [BLOCK_FIELDS.POS_IN_TRAIN_SECTOR]: '',
      [BLOCK_FIELDS.BELONGS_TO_SECTOR]: '',
      ...rec,
    });
    setEditingKey(rec[BLOCK_FIELDS.KEY]);
  };


  /**
   * Редактирует информацию о перегоне поездного участка в БД.
   *
   * @param {number} blockId
   */
  const handleEdit = async (blockId) => {
    let rowData;

    try {
      rowData = await form.validateFields();

    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    setRecsBeingProcessed((value) => [...value, blockId]);

    try {
      // Делаем запрос на сервер с целью редактирования информации о перегоне участка
      const res = await request(ServerAPI.MOD_ECDTRAINSECTORBLOCK_DATA, 'POST',
        {
          trainSectorId: record[TRAIN_SECTOR_FIELDS.KEY],
          blockId,
          posInTrainSector: rowData[BLOCK_FIELDS.POS_IN_TRAIN_SECTOR],
          belongsToSector: rowData[BLOCK_FIELDS.BELONGS_TO_SECTOR] ? 1 : 0,
        },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Обновляем локальное состояние
      setTableDataCallback((value) => value.map((ecdSector) => {
        const trainSector = ecdSector[ECDSECTOR_FIELDS.TRAIN_SECTORS].find((el) =>
          el[TRAIN_SECTOR_FIELDS.KEY] === record[TRAIN_SECTOR_FIELDS.KEY]);
        if (!trainSector) {
          return ecdSector;
        }
        let trainSectorBlock = trainSector[TRAIN_SECTOR_FIELDS.BLOCKS].find((el) =>
          el[BLOCK_FIELDS.KEY] === blockId);
        if (!trainSectorBlock) {
          return ecdSector;
        }
        trainSectorBlock[BLOCK_FIELDS.POS_IN_TRAIN_SECTOR] = rowData[BLOCK_FIELDS.POS_IN_TRAIN_SECTOR];
        trainSectorBlock[BLOCK_FIELDS.BELONGS_TO_SECTOR] = rowData[BLOCK_FIELDS.BELONGS_TO_SECTOR];
        return ecdSector;
      }));

      finishEditing();

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModECDTrainSectorBlockFieldsErrs(errs);
      }
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== blockId));
  };


  /**
   * Удаляет информацию о перегоне поездного участка из БД.
   *
   * @param {number} blockId
   */
  const handleDel = async (blockId) => {
    setRecsBeingProcessed((value) => [...value, blockId]);

    try {
      // Делаем запрос на сервер с целью удаления всей информации о станции поездного участка ЭЦД
      const res = await request(ServerAPI.DEL_ECDTRAINSECTORBLOCK_DATA, 'POST',
        {
          trainSectorId: record[TRAIN_SECTOR_FIELDS.KEY],
          blockId,
        },
        { Authorization: `Bearer ${auth.token}` }
      );

      message(MESSAGE_TYPES.SUCCESS, res.message);

      // Обновляем локальное состояние
      setTableDataCallback((value) => value.map((ecdSector) => {
        const trainSector = ecdSector[ECDSECTOR_FIELDS.TRAIN_SECTORS].find((el) =>
          el[TRAIN_SECTOR_FIELDS.KEY] === record[TRAIN_SECTOR_FIELDS.KEY]);
        if (!trainSector) {
          return ecdSector;
        }
        trainSector[TRAIN_SECTOR_FIELDS.BLOCKS] =
          trainSector[TRAIN_SECTOR_FIELDS.BLOCKS].filter((block) => block[BLOCK_FIELDS.KEY] !== blockId);
        return ecdSector;
      }));

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== blockId));
  };


  // Описание столбцов таблицы перегонов поездного участка ЭЦД
  const columns = ecdTrainSectorBlocksTableColumns({
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
        inputType: (col.dataIndex === BLOCK_FIELDS.BELONGS_TO_SECTOR) ? 'boolean' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
        required: true,
        data: form.getFieldValue([BLOCK_FIELDS.BELONGS_TO_SECTOR]),
        errMessage: modECDTrainSectorBlockFieldsErrs ? modECDTrainSectorBlockFieldsErrs[col.dataIndex] : null,
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
        dataSource={record[TRAIN_SECTOR_FIELDS.BLOCKS]}
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
                handleStartEdit(record);
              }
            },
            onKeyUp: event => {
              if (event.key === 'Enter') {
                handleEdit(record[BLOCK_FIELDS.KEY]);
              }
            }
          };
        }}
      />
    </Form>
  );
};


export default ECDTrainSectorBlocksTable;
