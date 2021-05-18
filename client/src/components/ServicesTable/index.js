import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { Table, Form, Button, Typography } from 'antd';
import EditableTableCell from '../EditableTableCell';
import NewServiceModal from '../NewServiceModal';
import {
  ServerAPI,
  SERVICE_FIELDS,
} from '../../constants';
import { MESSAGE_TYPES, useCustomMessage } from '../../hooks/customMessage.hook';
import servicesTableColumns from './ServicesTableColumns';
import getAppServiceObjFromDBServiceObj from '../../mappers/getAppServiceObjFromDBServiceObj';

const { Text, Title } = Typography;


/**
 * Компонент таблицы с информацией о службах.
 */
const ServicesTable = () => {
  // Информация по службам (массив объектов)
  const [tableData, setTableData] = useState(null);

  // Ошибка загрузки данных о службах
  const [loadDataErr, setLoadDataErr] = useState(null);

  // Флаг окончания загрузки информации
  const [dataLoaded, setDataLoaded] = useState(true);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для редактирования данных таблицы служб
  const [form] = Form.useForm();

  // Ключ редактируемой записи таблицы
  const [editingKey, setEditingKey] = useState('');

  // Флаг текущего состояния редактируемости записи в таблице
  const isEditing = (record) => record[SERVICE_FIELDS.KEY] === editingKey;

  // Видимо либо нет модальное окно добавления новой записи
  const [isAddNewServiceModalVisible, setIsAddNewServiceModalVisible] = useState(false);

  // Ошибки добавления информации о новой службе
  const [serviceFieldsErrs, setServiceFieldsErrs] = useState(null);

  // Ошибки редактирования информации о службе
  const [modServiceFieldsErrs, setModServiceFieldsErrs] = useState(null);

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
      // Делаем запрос на сервер с целью получения информации по службам
      let res = await request(ServerAPI.GET_SERVICES_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      const tableData = res.map((service) => getAppServiceObjFromDBServiceObj(service));

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
   * Чистит все сообщения добавления информации о службе (ошибки и успех).
   */
  const clearAddServiceMessages = () => {
    setServiceFieldsErrs(null);
  }


  /**
   * Добавляет информацию о службе в БД.
   *
   * @param {object} service
   */
  const handleAddNewService = async (service) => {
    setRecsBeingAdded((value) => value + 1);

    try {
      // Делаем запрос на сервер с целью добавления информации о службе
      const res = await request(ServerAPI.ADD_SERVICE_DATA, 'POST', { ...service }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      const newService = getAppServiceObjFromDBServiceObj(res.service);

      setTableData([...tableData, newService]);

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setServiceFieldsErrs(errs);
      }
    }

    setRecsBeingAdded((value) => value - 1);
  }


  /**
   * Удаляет информацию о службе из БД.
   *
   * @param {number} serviceId
   */
  const handleDelService = async (serviceId) => {
    setRecsBeingProcessed((value) => [...value, serviceId]);

    try {
      // Делаем запрос на сервер с целью удаления всей информации о службе
      const res = await request(ServerAPI.DEL_SERVICE_DATA, 'POST', { id: serviceId }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      setTableData(tableData.filter((service) => service[SERVICE_FIELDS.KEY] !== serviceId));

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== serviceId));
  }


  /**
   * Вводит выбранную строку таблицы в режим редактирования.
   *
   * @param {object} record
   */
  const handleStartEditService = (record) => {
    form.setFieldsValue({
      [SERVICE_FIELDS.ABBREV]: '',
      [SERVICE_FIELDS.TITLE]: '',
      ...record,
    });
    setEditingKey(record[SERVICE_FIELDS.KEY]);
  };


  /**
   * Действия, выполняемые по окончании процесса редактирования записи
   * (вне зависимости от результата редактирования).
   */
  const finishEditing = () => {
    setEditingKey('');
    setModServiceFieldsErrs(null);
  };


  /**
   * Отменяет редактирование текущей записи таблицы.
   */
  const handleCancelMod = () => {
    finishEditing();
  };


  /**
   * Редактирует информацию о службе в БД.
   *
   * @param {number} serviceId
   */
  const handleEditService = async (serviceId) => {
    let rowData;

    try {
      rowData = await form.validateFields();

    } catch (errInfo) {
      message(MESSAGE_TYPES.ERROR, `Ошибка валидации: ${JSON.stringify(errInfo)}`);
      return;
    }

    setRecsBeingProcessed((value) => [...value, serviceId]);

    try {
      // Делаем запрос на сервер с целью редактирования информации о службе
      const res = await request(ServerAPI.MOD_SERVICE_DATA, 'POST', { id: serviceId, ...rowData }, {
        Authorization: `Bearer ${auth.token}`
      });

      message(MESSAGE_TYPES.SUCCESS, res.message);

      const newTableData = tableData.map((service) => {
        if (service[SERVICE_FIELDS.KEY] === serviceId) {
          return { ...service, ...rowData };
        }
        return service;
      });

      setTableData(newTableData);
      finishEditing();

    } catch (e) {
      message(MESSAGE_TYPES.ERROR, e.message);

      if (e.errors) {
        const errs = {};
        e.errors.forEach((e) => { errs[e.param] = e.msg; });
        setModServiceFieldsErrs(errs);
      }
    }

    setRecsBeingProcessed((value) => value.filter((id) => id !== serviceId));
  }


  // --------------------------------------------------------------
  // Для работы с диалоговым окном ввода информации о новой службе

  const showAddNewServiceModal = () => {
    setIsAddNewServiceModalVisible(true);
  };

  const handleAddNewServiceOk = (service) => {
    handleAddNewService(service);
  };

  const handleAddNewServiceCancel = () => {
    setIsAddNewServiceModalVisible(false);
  };

  // --------------------------------------------------------------


  // Описание столбцов таблицы служб
  const columns = servicesTableColumns({
    isEditing,
    editingKey,
    handleEditService,
    handleCancelMod,
    handleStartEditService,
    handleDelService,
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
        errMessage: modServiceFieldsErrs ? modServiceFieldsErrs[col.dataIndex] : null,
      }),
    };
  });


  return (
    <>
      <Title level={2} className="center top-margin-05">Службы</Title>

      {loadDataErr ? <Text type="danger">{loadDataErr}</Text> :

      <Form form={form} component={false}>
        <NewServiceModal
          isModalVisible={isAddNewServiceModalVisible}
          handleAddNewServiceOk={handleAddNewServiceOk}
          handleAddNewServiceCancel={handleAddNewServiceCancel}
          serviceFieldsErrs={serviceFieldsErrs}
          clearAddServiceMessages={clearAddServiceMessages}
          recsBeingAdded={recsBeingAdded}
        />

        <Button
          type="primary"
          style={{
            marginBottom: 16,
          }}
          onClick={showAddNewServiceModal}
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
                if (!editingKey || editingKey !== record[SERVICE_FIELDS.KEY]) {
                  handleStartEditService(record);
                }
              },
              onKeyUp: event => {
                if (event.key === 'Enter') {
                  handleEditService(record[SERVICE_FIELDS.KEY]);
                }
              }
            };
          }}
        />
      </Form>
    }
    </>
  );
};


export default ServicesTable;
