import React, { useState, useEffect, useCallback } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { Table, Form, Button, Typography } from 'antd';
import EditableTableCell from '../EditableTableCell';
import NewAppCredsGroupModal from '../NewAppCredsGroupModal';
import { ServerAPI, APP_CREDS_GROUP_FIELDS } from '../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import appCredsTableColumns from './AppCredsTableColumns';
import getAppCredsGroupObjFromDBCredsGroupObj from '../../mappers/getAppCredsGroupObjFromDBCredsGroupObj';
import AppCredsTable from './AppCredsTable';
import expandIcon from '../ExpandIcon';

const { Text, Title } = Typography;


/**
 * Компонент таблицы с информацией о группах полномочий в приложениях ГИД Неман.
 */
const AppsCredsTable = () => {
  // Информация по группам полномочий (массив объектов)
  const [tableData, setTableData] = useState(null);

  // Ошибка загрузки данных о группах полномочий
  const [loadDataErr, setLoadDataErr] = useState(null);

  // Флаг окончания загрузки информации
  const [dataLoaded, setDataLoaded] = useState(true);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Для редактирования данных таблицы групп полномочий
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[APP_CREDS_GROUP_FIELDS.KEY] === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewAppModalVisible, setIsAddNewAppModalVisible] = useState(false);

  // Ошибки добавления информации о новой группе полномочий (разложенные по добавляемым полям)
  const [appFieldsErrs, setAppFieldsErrs] = useState(null);

  // Ошибки редактирования информации о группе полномочий
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
      // Запрашиваем у сервера все имеющиеся группы полномочий
      const res = await request(ServerAPI.GET_APPS_CREDS_DATA, 'POST', {});
      const tableData = res.map((app) => getAppCredsGroupObjFromDBCredsGroupObj(app));
      setTableData(tableData);
      setLoadDataErr(null);
    } catch (e) {
      setTableData(null);
      setLoadDataErr(e.message);
    }
    setDataLoaded(true);
  }, [request]);


  /**
   * При рендере компонента подгружает информацию для отображения в таблице из БД
   */
  useEffect(() => {
    fetchData();
  }, []);


  /**
   * Чистит все сообщения добавления информации о группе полномочий (ошибки и успех).
   */
  const clearAddAppCredsGroupMessages = () => {
    setAppFieldsErrs(null);
  }


  /**
   * Добавляет информацию о группе полномочий в БД.
   *
   * @param {object} groupData
   */
  const handleAddNewAppCredsGroup = async (groupData) => {
    setRecsBeingAdded((value) => value + 1);
    try {
      // Делаем запрос на сервер с целью добавления информации о группе полномочий
      const res = await request(ServerAPI.ADD_APP_CREDS_GROUP_DATA, 'POST', { ...groupData, credentials: [] });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      setTableData([...tableData, getAppCredsGroupObjFromDBCredsGroupObj(res.credsGroup)]);
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
   * Удаляет информацию о группе полномочий из БД.
   *
   * @param {number} groupId
   */
  const handleDelAppCredsGroup = async (groupId) => {
    setRecsBeingProcessed((value) => [...value, groupId]);
    try {
      // Делаем запрос на сервер с целью удаления всей информации о группе полномочий
      const res = await request(ServerAPI.DEL_APP_CREDS_GROUP_DATA, 'POST', { credsGroupId: groupId });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      setTableData(tableData.filter((app) => String(app[APP_CREDS_GROUP_FIELDS.KEY]) !== String(groupId)));
    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }
    setRecsBeingProcessed((value) => value.filter((id) => id !== groupId));
  }


  /**
   * Вводит выбранную строку таблицы в режим редактирования.
   *
   * @param {object} record
   */
  const handleStartEditAppCredsGroup = (record) => {
    form.setFieldsValue({
      [APP_CREDS_GROUP_FIELDS.SHORT_TITLE]: '',
      [APP_CREDS_GROUP_FIELDS.TITLE]: '',
      ...record,
    });
    setEditingKey(record[APP_CREDS_GROUP_FIELDS.KEY]);
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
   * Редактирует информацию о группе полномочий в БД.
   *
   * @param {number} groupId
   */
  const handleEditAppCredsGroup = async (groupId) => {
    let rowData;

    try {
      rowData = await form.validateFields();
    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    setRecsBeingProcessed((value) => [...value, groupId]);

    try {
      // Делаем запрос на сервер с целью редактирования информации о группе полномочий
      const res = await request(ServerAPI.MOD_APP_CREDS_GROUP_DATA, 'POST', { credsGroupId: groupId, ...rowData });
      message(MESSAGE_TYPES.SUCCESS, res.message);
      const newTableData = tableData.map((appCredsGroup) => {
        if (String(appCredsGroup[APP_CREDS_GROUP_FIELDS.KEY]) === String(res.appCredsGroup._id)) {
          return { ...appCredsGroup, ...getAppCredsGroupObjFromDBCredsGroupObj(res.appCredsGroup) };
        }
        return appCredsGroup;
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

    setRecsBeingProcessed((value) => value.filter((id) => id !== groupId));
  }


  // --------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новой группе полномочий

  const showAddNewAppModal = () => {
    setIsAddNewAppModalVisible(true);
  };

  const handleAddNewAppCredsGroupOk = (app) => {
    handleAddNewAppCredsGroup(app);
  };

  const handleAddNewAppCredsGroupCancel = () => {
    setIsAddNewAppModalVisible(false);
  };

  // --------------------------------------------------------------


  // Описание столбцов таблицы группы полномочий
  const columns = appCredsTableColumns({
    isEditing,
    editingKey,
    handleEditAppCredsGroup,
    handleCancelMod,
    handleStartEditAppCredsGroup,
    handleDelAppCredsGroup,
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
        dataType: 'string',
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
      <Title level={2} className="center top-margin-05">Группы полномочий в приложениях ГИД НЕМАН</Title>

      {loadDataErr ? <Text type="danger">{loadDataErr}</Text> :

      <Form form={form} component={false}>
        <NewAppCredsGroupModal
          isModalVisible={isAddNewAppModalVisible}
          handleAddNewAppCredsGroupOk={handleAddNewAppCredsGroupOk}
          handleAddNewAppCredsGroupCancel={handleAddNewAppCredsGroupCancel}
          appFieldsErrs={appFieldsErrs}
          clearAddAppCredsGroupMessages={clearAddAppCredsGroupMessages}
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
                if (!editingKey || editingKey !== record[APP_CREDS_GROUP_FIELDS.KEY]) {
                  handleStartEditAppCredsGroup(record);
                }
              },
              onKeyUp: event => {
                if (event.key === 'Enter') {
                  handleEditAppCredsGroup(record[APP_CREDS_GROUP_FIELDS.KEY]);
                }
              },
            };
          }}
          expandable={{
            expandedRowRender: record => (
              <div className="expandable-row-content">
                <Title level={4}>Полномочия пользователей</Title>
                <AppCredsTable
                  appId={record[APP_CREDS_GROUP_FIELDS.KEY]}
                  appCredentials={record[APP_CREDS_GROUP_FIELDS.CREDENTIALS]}
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


export default AppsCredsTable;
