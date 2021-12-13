import React, { useState, useContext } from 'react';
import { useHttp } from '../../../hooks/http.hook';
import { AuthContext } from '../../../context/AuthContext';
import { Table, Form, Button } from 'antd';
import EditableTableCell from '../../EditableTableCell';
import NewStationTrackModal from '../../NewStationTrackModal';
import { ServerAPI, STATION_TRACK_FIELDS, STATION_FIELDS } from '../../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../../hooks/customMessage.hook';
import stationTracksTableColumns from './StationTracksTableColumns';
import getAppStationTrackObjFromDBStationTrackObj from '../../../mappers/getAppStationTrackObjFromDBStationTrackObj';


/**
 * Компонент таблицы с информацией о путях станции.
 */
const StationTracksTable = ({ stationId, stationTracks, setTableDataCallback }) => {
  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для редактирования данных таблицы путей
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[STATION_TRACK_FIELDS.KEY] === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewStationTrackModalVisible, setIsAddNewStationTrackModalVisible] = useState(false);

  // Ошибки добавления информации о новом пути
  const [stationTrackFieldsErrs, setStationTrackFieldsErrs] = useState(null);

  // Ошибки редактирования информации о путях станции
  const [modStationTrackFieldsErrs, setModStationTrackFieldsErrs] = useState(null);

  const message = useCustomMessage();

  // количество запущенных процессов добавления записей на сервере
  const [recsBeingAdded, setRecsBeingAdded] = useState(0);

  // id записей, по которым запущен процесс обработки данных на сервере (удаление, редактирование)
  const [recsBeingProcessed, setRecsBeingProcessed] = useState([]);


  /**
   * Чистит все сообщения добавления информации о пути (ошибки и успех).
   */
  const clearAddStationTrackMessages = () => {
    setStationTrackFieldsErrs(null);
  };


  /**
   * Добавляет информацию о пути в БД.
   *
   * @param {object} track
   */
  const handleAddNewStationTrack = async (track) => {
    setRecsBeingAdded((value) => value + 1);

    try {
      // Делаем запрос на сервер с целью добавления информации о пути
      const res = await request(ServerAPI.ADD_STATION_TRACK_DATA, 'POST', { stationId, ...track }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableDataCallback((value) =>
        value.map((station) => {
          if (String(station[STATION_FIELDS.KEY]) === String(stationId)) {
            const newStationTracks = station[STATION_FIELDS.TRACKS] ? station[STATION_FIELDS.TRACKS].slice() : [];
            newStationTracks.push(getAppStationTrackObjFromDBStationTrackObj(res.stationTrack));
            station[STATION_FIELDS.TRACKS] = newStationTracks;
          }
          return station;
        })
      );

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setStationTrackFieldsErrs(errs);
      }
    }

    setRecsBeingAdded((value) => value - 1);
  }


  /**
   * Удаляет информацию о пути станции из БД.
   *
   * @param {number} stationTrackId
   */
  const handleDelStationTrack = async (stationTrackId) => {
    setRecsBeingProcessed((value) => [...value, stationTrackId]);

    try {
      // Делаем запрос на сервер с целью удаления всей информации о пути станции
      const res = await request(ServerAPI.DEL_STATION_TRACK_DATA, 'POST', { id: stationTrackId }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableDataCallback((value) =>
        value.map((station) => {
          if (String(station[STATION_FIELDS.KEY]) === String(stationId)) {
            station[STATION_FIELDS.TRACKS] =
              station[STATION_FIELDS.TRACKS].filter((track) => String(track[STATION_TRACK_FIELDS.KEY]) !== String(stationTrackId))
          }
          return station;
        })
      );

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== stationTrackId));
  }


  /**
   * Вводит выбранную строку таблицы в режим редактирования.
   *
   * @param {object} record
   */
  const handleStartEditStationTrack = (record) => {
    form.setFieldsValue({
      [STATION_TRACK_FIELDS.NAME]: '',
      ...record,
    });
    setEditingKey(record[STATION_TRACK_FIELDS.KEY]);
  };


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
   const finishEditing = () => {
    setEditingKey('');
    setModStationTrackFieldsErrs(null);
  };


  /**
   * Отменяет редактирование текущей записи таблицы.
   */
  const handleCancelMod = () => {
    finishEditing();
  };


  /**
   * Редактирует информацию о пути станции в БД.
   *
   * @param {number} stationTrackId
   */
  const handleEditStationTrack = async (stationTrackId) => {
    let rowData;

    try {
      rowData = await form.validateFields();

    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    setRecsBeingProcessed((value) => [...value, stationTrackId]);

    try {
      // Делаем запрос на сервер с целью редактирования информации о пути станции
      const res = await request(ServerAPI.MOD_STATION_TRACK_DATA, 'POST', { id: stationTrackId, ...rowData }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableDataCallback((value) =>
        value.map((station) => {
          if (String(station[STATION_FIELDS.KEY]) === String(stationId)) {
            station[STATION_FIELDS.TRACKS] = station[STATION_FIELDS.TRACKS].map((track) => {
              if (String(track[STATION_TRACK_FIELDS.KEY]) === String(stationTrackId)) {
                return { ...track, ...getAppStationTrackObjFromDBStationTrackObj(res.stationTrack) };
              }
              return track;
            });
          }
          return station;
        })
      );

      finishEditing();

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModStationTrackFieldsErrs(errs);
      }
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== stationTrackId));
  }


  // --------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новом пути станции

  const showAddNewStationTrackModal = () => {
    setIsAddNewStationTrackModalVisible(true);
  };

  const handleAddNewStationTrackOk = (station) => {
    handleAddNewStationTrack(station);
  };

  const handleAddNewStationTrackCancel = () => {
    setIsAddNewStationTrackModalVisible(false);
  };

  // --------------------------------------------------------------


  // Описание столбцов таблицы путей станции
  const columns = stationTracksTableColumns({
    isEditing,
    editingKey,
    handleEditStationTrack,
    handleCancelMod,
    handleStartEditStationTrack,
    handleDelStationTrack,
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
        errMessage: modStationTrackFieldsErrs ? modStationTrackFieldsErrs[col.dataIndex] : null,
      }),
    };
  });


  return (
    <Form form={form} component={false}>
      <NewStationTrackModal
        isModalVisible={isAddNewStationTrackModalVisible}
        handleAddNewStationTrackOk={handleAddNewStationTrackOk}
        handleAddNewStationTrackCancel={handleAddNewStationTrackCancel}
        stationTrackFieldsErrs={stationTrackFieldsErrs}
        clearAddStationTrackMessages={clearAddStationTrackMessages}
        recsBeingAdded={recsBeingAdded}
      />
      <Button
        type="primary"
        style={{
          marginBottom: 16,
        }}
        onClick={showAddNewStationTrackModal}
      >
        Добавить запись
      </Button>

      <Table
        components={{
          body: {
            cell: EditableTableCell
          },
        }}
        bordered
        dataSource={stationTracks}
        columns={mergedColumns}
        rowClassName="editable-row"
        pagination={{
          onChange: handleCancelMod,
        }}
        sticky={true}
        onRow={(record) => {
          return {
            onDoubleClick: () => { handleStartEditStationTrack(record) },
            onKeyUp: event => {
              if (event.key === 'Enter') {
                handleEditStationTrack(record[STATION_TRACK_FIELDS.KEY]);
              }
            }
          };
        }}
      />
    </Form>
  );
};


export default StationTracksTable;
