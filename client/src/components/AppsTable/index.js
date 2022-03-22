import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { Table, Form, Button, Typography } from 'antd';
import EditableTableCell from '../EditableTableCell';
import NewAppModal from '../NewAppModal';
import { ServerAPI, APP_FIELDS } from '../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import appsTableColumns from './AppsTableColumns';
import getAppApplicationObjFromDBApplicationObj from '../../mappers/getAppApplicationObjFromDBApplicationObj';
import AppCredsTable from './AppCredsTable';
import expandIcon from '../ExpandIcon';

const { Text, Title } = Typography;


/**
 * Компонент таблицы с информацией о приложениях.
 */
const AppsTable = () => {
  // Информация по приложениям (массив объектов)
  const [tableData, setTableData] = useState(null);

  // Ошибка загрузки данных о приложениях
  const [loadDataErr, setLoadDataErr] = useState(null);

  // Флаг окончания загрузки информации
  const [dataLoaded, setDataLoaded] = useState(true);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для редактирования данных таблицы приложений
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[APP_FIELDS.KEY] === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewAppModalVisible, setIsAddNewAppModalVisible] = useState(false);

  // Ошибки добавления информации о новом приложении (разложенные по добавляемым полям)
  const [appFieldsErrs, setAppFieldsErrs] = useState(null);

  // Ошибки редактирования информации о приложении
  const [modAppFieldsErrs, setModAppFieldsErrs] = useState(null);

  const message = useCustomMessage();

  // количество запущенных процессов добавления записей на сервере
  const [recsBeingAdded, setRecsBeingAdded] = useState(0);

  // id записей, по которым запущен процесс обработки данных на сервере (удаление, редактирование)
  const [recsBeingProcessed, setRecsBeingProcessed] = useState([]);


  /**
   * Извлекает информацию, которая должна быть отображена в таблице, из первоисточника
   * и устанавливает ее в локальное состояние
   */
  const fetchData = useCallback(async () => {
    setDataLoaded(false);

    try {
      // Делаем запрос на сервер с целью получения информации по приложениям
      const res = await request(ServerAPI.GET_APPS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      const tableData = res.map((app) => getAppApplicationObjFromDBApplicationObj(app));

      setTableData(tableData);
      setLoadDataErr(null);

    } catch (e) {
      setTableData(null);
      setLoadDataErr(e.message);
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
   * Чистит все сообщения добавления информации о приложении (ошибки и успех).
   */
  const clearAddAppMessages = () => {
    setAppFieldsErrs(null);
  }


  /**
   * Добавляет информацию о приложении в БД.
   *
   * @param {object} app
   */
  const handleAddNewApp = async (app) => {
    setRecsBeingAdded((value) => value + 1);

    try {
      // Делаем запрос на сервер с целью добавления информации о приложении
      const res = await request(ServerAPI.ADD_APP_DATA, 'POST', { ...app, credentials: [] }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableData([...tableData, getAppApplicationObjFromDBApplicationObj(res.app)]);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setAppFieldsErrs(errs);
      }
    }

    setRecsBeingAdded((value) => value - 1);
  }


  /**
   * Удаляет информацию о приложении из БД.
   *
   * @param {number} appId
   */
  const handleDelApp = async (appId) => {
    setRecsBeingProcessed((value) => [...value, appId]);

    try {
      // Делаем запрос на сервер с целью удаления всей информации о приложении
      const res = await request(ServerAPI.DEL_APP_DATA, 'POST', { appId }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableData(tableData.filter((app) => String(app[APP_FIELDS.KEY]) !== String(appId)));

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== appId));
  }


  /**
   * Вводит выбранную строку таблицы в режим редактирования.
   *
   * @param {object} record
   */
  const handleStartEditApp = (record) => {
    form.setFieldsValue({
      [APP_FIELDS.SHORT_TITLE]: '',
      [APP_FIELDS.TITLE]: '',
      ...record,
    });
    setEditingKey(record[APP_FIELDS.KEY]);
  };


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
   const finishEditing = () => {
    setEditingKey('');
    setModAppFieldsErrs(null);
  };


  /**
   * Отменяет редактирование текущей записи таблицы.
   */
  const handleCancelMod = () => {
    finishEditing();
  };


  /**
   * Редактирует информацию о приложении в БД.
   *
   * @param {number} appId
   */
  const handleEditApp = async (appId) => {
    let rowData;

    try {
      rowData = await form.validateFields();

    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    setRecsBeingProcessed((value) => [...value, appId]);

    try {
      // Делаем запрос на сервер с целью редактирования информации о приложении
      const res = await request(ServerAPI.MOD_APP_DATA, 'POST', { appId, ...rowData }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      const newTableData = tableData.map((app) => {
        if (String(app[APP_FIELDS.KEY]) === String(res.app._id)) {
          return { ...app, ...getAppApplicationObjFromDBApplicationObj(res.app) };
        }
        return app;
      })

      setTableData(newTableData);
      finishEditing();

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModAppFieldsErrs(errs);
      }
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== appId));
  }


  // --------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новом приложении

  const showAddNewAppModal = () => {
    setIsAddNewAppModalVisible(true);
  };

  const handleAddNewAppOk = (app) => {
    handleAddNewApp(app);
  };

  const handleAddNewAppCancel = () => {
    setIsAddNewAppModalVisible(false);
  };

  // --------------------------------------------------------------


  // Описание столбцов таблицы приложений
  const columns = appsTableColumns({
    isEditing,
    editingKey,
    handleEditApp,
    handleCancelMod,
    handleStartEditApp,
    handleDelApp,
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
        errMessage: modAppFieldsErrs ? modAppFieldsErrs[col.dataIndex] : null,
      }),
    };
  });


  return (
    <>
      <Title level={2} className="center top-margin-05">Приложения ГИД НЕМАН</Title>

      {loadDataErr ? <Text type="danger">{loadDataErr}</Text> :

      <Form form={form} component={false}>
        <NewAppModal
          isModalVisible={isAddNewAppModalVisible}
          handleAddNewAppOk={handleAddNewAppOk}
          handleAddNewAppCancel={handleAddNewAppCancel}
          appFieldsErrs={appFieldsErrs}
          clearAddAppMessages={clearAddAppMessages}
          recsBeingAdded={recsBeingAdded}
        />

        <Button type="primary" onClick={showAddNewAppModal}>
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
                if (!editingKey || editingKey !== record[APP_FIELDS.KEY]) {
                  handleStartEditApp(record);
                }
              },
              onKeyUp: event => {
                if (event.key === 'Enter') {
                  handleEditApp(record[APP_FIELDS.KEY]);
                }
              },
            };
          }}
          expandable={{
            expandedRowRender: record => (
              <div className="expandable-row-content">
                <Title level={4}>Полномочия пользователей</Title>
                <AppCredsTable
                  appId={record[APP_FIELDS.KEY]}
                  appCredentials={record[APP_FIELDS.CREDENTIALS]}
                  setTableDataCallback={setTableData}
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


export default AppsTable;
