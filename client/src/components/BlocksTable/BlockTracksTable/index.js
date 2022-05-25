import React, { useState } from 'react';
import { useHttp } from '../../../hooks/http.hook';
import { Table, Form, Button } from 'antd';
import EditableTableCell from '../../EditableTableCell';
import NewBlockTrackModal from '../../NewBlockTrackModal';
import { ServerAPI, BLOCK_TRACK_FIELDS, BLOCK_FIELDS } from '../../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../../hooks/customMessage.hook';
import blockTracksTableColumns from './BlockTracksTableColumns';
import getAppBlockTrackObjFromDBBlockTrackObj from '../../../mappers/getAppBlockTrackObjFromDBBlockTrackObj';


/**
 * Компонент таблицы с информацией о путях перегона.
 */
const BlockTracksTable = ({ blockId, blockTracks, setTableDataCallback }) => {
  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Для редактирования данных таблицы путей
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[BLOCK_TRACK_FIELDS.KEY] === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewBlockTrackModalVisible, setIsAddNewBlockTrackModalVisible] = useState(false);

  // Ошибки добавления информации о новом пути
  const [blockTrackFieldsErrs, setBlockTrackFieldsErrs] = useState(null);

  // Ошибки редактирования информации о путях перегона
  const [modBlockTrackFieldsErrs, setModBlockTrackFieldsErrs] = useState(null);

  const message = useCustomMessage();

  // количество запущенных процессов добавления записей на сервере
  const [recsBeingAdded, setRecsBeingAdded] = useState(0);

  // id записей, по которым запущен процесс обработки данных на сервере (удаление, редактирование)
  const [recsBeingProcessed, setRecsBeingProcessed] = useState([]);


  /**
   * Чистит все сообщения добавления информации о пути (ошибки и успех).
   */
  const clearAddBlockTrackMessages = () => {
    setBlockTrackFieldsErrs(null);
  }


  /**
   * Добавляет информацию о пути в БД.
   *
   * @param {object} track
   */
  const handleAddNewBlockTrack = async (track) => {
    setRecsBeingAdded((value) => value + 1);
    try {
      // Делаем запрос на сервер с целью добавления информации о пути
      const res = await request(ServerAPI.ADD_BLOCK_TRACK_DATA, 'POST', { blockId, ...track });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      setTableDataCallback((value) =>
        value.map((block) => {
          if (String(block[BLOCK_FIELDS.KEY]) === String(blockId)) {
            const newBlockTracks = block[BLOCK_FIELDS.TRACKS].slice();
            newBlockTracks.push(getAppBlockTrackObjFromDBBlockTrackObj(res.blockTrack));
            block[BLOCK_FIELDS.TRACKS] = newBlockTracks;
          }
          return block;
        })
      );
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setBlockTrackFieldsErrs(errs);
      }
    }
    setRecsBeingAdded((value) => value - 1);
  }


  /**
   * Удаляет информацию о пути перегона из БД.
   *
   * @param {number} blockTrackId
   */
  const handleDelBlockTrack = async (blockTrackId) => {
    setRecsBeingProcessed((value) => [...value, blockTrackId]);
    try {
      // Делаем запрос на сервер с целью удаления всей информации о пути перегона
      const res = await request(ServerAPI.DEL_BLOCK_TRACK_DATA, 'POST', { id: blockTrackId });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      setTableDataCallback((value) =>
        value.map((block) => {
          if (String(block[BLOCK_FIELDS.KEY]) === String(blockId)) {
            block[BLOCK_FIELDS.TRACKS] =
              block[BLOCK_FIELDS.TRACKS].filter((track) => String(track[BLOCK_TRACK_FIELDS.KEY]) !== String(blockTrackId))
          }
          return block;
        })
      );
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
    setRecsBeingProcessed((value) => value.filter((id) => id !== blockTrackId));
  }


  /**
   * Вводит выбранную строку таблицы в режим редактирования.
   *
   * @param {object} record
   */
  const handleStartEditBlockTrack = (record) => {
    form.setFieldsValue({
      [BLOCK_TRACK_FIELDS.NAME]: '',
      ...record,
    });
    setEditingKey(record[BLOCK_TRACK_FIELDS.KEY]);
  };


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
   const finishEditing = () => {
    setEditingKey('');
    setModBlockTrackFieldsErrs(null);
  };


  /**
   * Отменяет редактирование текущей записи таблицы.
   */
  const handleCancelMod = () => {
    finishEditing();
  };


  /**
   * Редактирует информацию о пути перегона в БД.
   *
   * @param {number} blockTrackId
   */
  const handleEditBlockTrack = async (blockTrackId) => {
    let rowData;

    try {
      rowData = await form.validateFields();

    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    setRecsBeingProcessed((value) => [...value, blockTrackId]);

    try {
      // Делаем запрос на сервер с целью редактирования информации о пути перегона
      const res = await request(ServerAPI.MOD_BLOCK_TRACK_DATA, 'POST', { id: blockTrackId, ...rowData });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      setTableDataCallback((value) =>
        value.map((block) => {
          if (String(block[BLOCK_FIELDS.KEY]) === String(blockId)) {
            block[BLOCK_FIELDS.TRACKS] = block[BLOCK_FIELDS.TRACKS].map((track) => {
              if (String(track[BLOCK_TRACK_FIELDS.KEY]) === String(blockTrackId)) {
                return { ...track, ...getAppBlockTrackObjFromDBBlockTrackObj(res.blockTrack) };
              }
              return track;
            });
          }
          return block;
        })
      );
      finishEditing();
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModBlockTrackFieldsErrs(errs);
      }
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== blockTrackId));
  }


  // --------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новом пути перегона

  const showAddNewBlockTrackModal = () => {
    setIsAddNewBlockTrackModalVisible(true);
  };

  const handleAddNewBlockTrackOk = (block) => {
    handleAddNewBlockTrack(block);
  };

  const handleAddNewBlockTrackCancel = () => {
    setIsAddNewBlockTrackModalVisible(false);
  };

  // --------------------------------------------------------------


  // Описание столбцов таблицы путей перегона
  const columns = blockTracksTableColumns({
    isEditing,
    editingKey,
    handleEditBlockTrack,
    handleCancelMod,
    handleStartEditBlockTrack,
    handleDelBlockTrack,
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
        errMessage: modBlockTrackFieldsErrs ? modBlockTrackFieldsErrs[col.dataIndex] : null,
      }),
    };
  });


  return (
    <Form form={form} component={false}>
      <NewBlockTrackModal
        isModalVisible={isAddNewBlockTrackModalVisible}
        handleAddNewBlockTrackOk={handleAddNewBlockTrackOk}
        handleAddNewBlockTrackCancel={handleAddNewBlockTrackCancel}
        blockTrackFieldsErrs={blockTrackFieldsErrs}
        clearAddBlockTrackMessages={clearAddBlockTrackMessages}
        recsBeingAdded={recsBeingAdded}
      />
      <Button type="primary" onClick={showAddNewBlockTrackModal}>
        Добавить запись
      </Button>

      <Table
        components={{
          body: {
            cell: EditableTableCell
          },
        }}
        bordered
        dataSource={blockTracks}
        columns={mergedColumns}
        rowClassName="editable-row"
        pagination={{
          onChange: handleCancelMod,
        }}
        sticky={true}
        onRow={(record) => {
          return {
            onDoubleClick: () => { handleStartEditBlockTrack(record) },
            onKeyUp: event => {
              if (event.key === 'Enter') {
                handleEditBlockTrack(record[BLOCK_TRACK_FIELDS.KEY]);
              }
            }
          };
        }}
      />
    </Form>
  );
};


export default BlockTracksTable;
