import React, { useContext, useState } from 'react';
import EditableTableCell from '../../EditableTableCell';
import dncTrainSectorsTableColumns from './DNCTrainSectorsTableColumns';
import { Table, Form, Row, Col } from 'antd';
import { MESSAGE_TYPES, useCustomMessage } from '../../../hooks/customMessage.hook';
import { useHttp } from '../../../hooks/http.hook';
import { ServerAPI, DNCSECTOR_FIELDS, TRAIN_SECTOR_FIELDS, STATION_FIELDS, BLOCK_FIELDS } from '../../../constants';
import { AuthContext } from '../../../context/AuthContext';
import expandIcon from '../../ExpandIcon';
import DNCTrainSectorStationsBlock from '../DNCTrainSectorStationsBlock';
import DNCTrainSectorBlocksBlock from '../DNCTrainSectorBlocksBlock';
import compareStrings from '../../../sorters/compareStrings';


/**
 * Компонент таблицы с информацией о поездных участках ДНЦ.
 */
const DNCTrainSectorsTable = (props) => {
  const {
    currDNCSectorRecord: record, // текущая запись об участке ДНЦ
    setTableDataCallback, // функция, позволяющая внести изменения в исходный массив объектов участков ДНЦ
    stations, // список всех станций ЖД
    blocks, // список всех перегонов ЖД
  } = props;

  // Для редактирования данных таблицы
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (rec) => rec[TRAIN_SECTOR_FIELDS.KEY] === editingKey;

  // Ошибки редактирования информации о поездном участке ДНЦ
  const [modDNCTrainSectorFieldsErrs, setModDNCTrainSectorFieldsErrs] = useState(null);

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

    setRecsBeingProcessed((value) => [...value, trainSectorId]);

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

    setRecsBeingProcessed((value) => value.filter((id) => id !== trainSectorId));
  };


  /**
   * Удаляет информацию об участке из БД.
   *
   * @param {number} trainSectorId
   */
  const handleDel = async (trainSectorId) => {
    setRecsBeingProcessed((value) => [...value, trainSectorId]);

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

    setRecsBeingProcessed((value) => value.filter((id) => id !== trainSectorId));
  };


  // Описание столбцов таблицы поездных участков ДНЦ
  const columns = dncTrainSectorsTableColumns({
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
      onCell: (rec) => ({
        rec,
        inputType: 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(rec),
        required: true,
        errMessage: modDNCTrainSectorFieldsErrs ? modDNCTrainSectorFieldsErrs[col.dataIndex] : null,
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
        dataSource={
          // Хочу, чтобы наименования участков выводились в алфавитном порядке
          record[DNCSECTOR_FIELDS.TRAIN_SECTORS].sort((a, b) =>
            compareStrings(a[TRAIN_SECTOR_FIELDS.NAME].toLowerCase(), b[TRAIN_SECTOR_FIELDS.NAME].toLowerCase()))
        }
        columns={mergedColumns}
        rowClassName="editable-row"
        pagination={{
          onChange: handleCancelMod,
        }}
        sticky={true}
        onRow={(rec) => {
          return {
            onDoubleClick: () => {
              if (!editingKey || editingKey !== rec[TRAIN_SECTOR_FIELDS.KEY]) {
                handleStartEdit(rec);
              }
            },
            onKeyUp: event => {
              if (event.key === 'Enter') {
                handleEdit(rec[TRAIN_SECTOR_FIELDS.KEY]);
              }
            }
          };
        }}
        expandable={{
          expandedRowRender: rec => (
            <Row className="expandable-row-content">
              <Col>
                <DNCTrainSectorStationsBlock
                  currTrainSectorRecord={rec}
                  stations={stations}
                  setTableDataCallback={setTableDataCallback}
                />
                <DNCTrainSectorBlocksBlock
                  currTrainSectorRecord={rec}
                  // отображать буду не все перегоны ЖД, а лишь те, которые ограничены станциями,
                  // выбранными пользователем для текущего поездного участка
                  blocks={blocks.filter((block) => {
                    const stationIndex = rec[TRAIN_SECTOR_FIELDS.STATIONS].findIndex((station) =>
                      station[STATION_FIELDS.KEY] === block[BLOCK_FIELDS.STATION1][STATION_FIELDS.KEY] ||
                      station[STATION_FIELDS.KEY] === block[BLOCK_FIELDS.STATION2][STATION_FIELDS.KEY]);
                    return stationIndex > -1;
                  })}
                  setTableDataCallback={setTableDataCallback}
                />
              </Col>
            </Row>
          ),
          rowExpandable: _record => true,
          expandIcon: expandIcon,
        }}
      />
    </Form>
  );
};


export default DNCTrainSectorsTable;
