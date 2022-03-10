import React, { useState, useCallback, useContext, useEffect } from 'react';
import { useHttp } from '../../hooks/http.hook';
import { AuthContext } from '../../context/AuthContext';
import { Button, DatePicker, Form, Pagination, Table, Typography } from 'antd';
import { ServerAPI } from '../../constants';
import getAppDY58UserLogObjFromDBDY58UserLogObj from '../../mappers/getAppDY58UserLogObjFromDBDY58UserLogObj';
import DY58UsersLogsTableColumns from './DY58UsersLogsTableColumns';

const { Text, Title } = Typography;
const ERR_VALIDATE_STATUS = 'error';

// Количество строк на одной странице таблицы
const MAX_TABLE_ROW_COUNT = 10;

export const DateTimeFormat = 'DD.MM.YYYY HH:mm';


/**
 * Компонент таблицы с логами действий пользователей ДУ-58.
 */
const DY58UsersLogsTable = () => {
  // Информация, которая в данный момент отображается в таблице (массив объектов)
  const [tableData, setTableData] = useState(null);

  // Ошибка загрузки данных с сервера
  const [loadDataErr, setLoadDataErr] = useState(null);

  // Флаг окончания загрузки информации
  const [dataLoaded, setDataLoaded] = useState(true);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Текущая страница таблицы
  const [currentTablePage, setCurrentTablePage] = useState(1);

  // Общее количество записей в БД, удовлетворяющее условиям поиска
  const [totalItemsCount, setTotalItemsCount] = useState(0);

  // Для указания условий поиска информации
  const [form] = Form.useForm();

  // Сообщения об ошибках для полей ввода критериев поиска информации
  const [startDateFieldErrMessage, setStartDateFieldErrMessage] = useState(null);
  const [endDateFieldErrMessage, setEndDateFieldErrMessage] = useState(null);

  // Описание столбцов таблицы
  const columns = DY58UsersLogsTableColumns();

  // Временной промежуток поиска информации
  const [searchDataTimeSpan, setSearchDataTimeSpan] = useState({ startDate: null, endDate: null });


  /**
   * Извлекает информацию, которая должна быть отображена в таблице, из первоисточника
   * и устанавливает ее в локальное состояние
   */
  const fetchData = useCallback(async (timeSpan, page) => {
    if (!timeSpan.startDate) {
      return;
    }

    setDataLoaded(false);

    try {
      // Делаем запрос на сервер с целью получения данных
      const res = await request(ServerAPI.GET_DY58USERS_LOGS_LIST, 'POST',
        {
          datetimeStart: timeSpan.startDate,
          datetimeEnd: timeSpan.endDate,
          page,
          docsCount: MAX_TABLE_ROW_COUNT,
        },
        { Authorization: `Bearer ${auth.token}` }
      );

      const tableData = res.data.map((item) => getAppDY58UserLogObjFromDBDY58UserLogObj(item));
      setTotalItemsCount(res.totalRecords);
      setTableData(tableData);
      setLoadDataErr(null);
      // Если после загрузки данных окажется, что пользователь запросил страницу, которая не существует в БД,
      // то устанавливаем номер страницы равный максимальному извлеченному номеру (такое может, в частности,
      // произойти в случае, если на сервере перед запросом произошла "чистка" БД)
      const pagesNumber = Math.ceil(res.totalItemsCount / MAX_TABLE_ROW_COUNT);
      if (page > pagesNumber) {
        setCurrentTablePage(pagesNumber);
      }

    } catch (e) {
      setTotalItemsCount(0);
      setTableData(null);
      setCurrentTablePage(1);
      setLoadDataErr(e.message);
    }

    setDataLoaded(true);
  }, [auth.token, request]);


  useEffect(() => {
    fetchData(searchDataTimeSpan, currentTablePage);
  }, [searchDataTimeSpan, currentTablePage]);


  /**
   * Обработка события подтверждения пользователем окончания ввода параметров поиска информации.
   */
  const onFinish = (values) => {
    if (searchDataTimeSpan.startDate !== values.startDate.toDate() ||
      searchDataTimeSpan.endDate !== values.endDate.toDate()) {
      setSearchDataTimeSpan({
        startDate: values.startDate.toDate(),
        endDate: values.endDate ? values.endDate.toDate() : null,
      });
    }
  };


  const onChange = (page, _pageSize) => {
    if (page !== currentTablePage) {
      setCurrentTablePage(page);
    }
  };


  return (
    <>
      <Title level={2} className="center top-margin-05">Логи действий пользователей ДУ-58</Title>
      <Form
        layout="inline"
        size="small"
        form={form}
        name="set-dy58users-logs-search-params-form"
        onFinish={onFinish}
      >
        <Form.Item
          label="Извлечь данные с"
          name='startDate'
          rules={[
            {
              required: true,
              validator: async (_, value) => {
                if (!value) {
                  setStartDateFieldErrMessage('Пожалуйста, введите дату и время начала поиска информации!');
                  return Promise.reject();
                }
                setStartDateFieldErrMessage(null);
                return Promise.resolve();
              },
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (value && getFieldValue('endDate') && value.isAfter(getFieldValue('endDate'))) {
                  setEndDateFieldErrMessage('Корректно определите временной диапазон поиска информации!');
                  return Promise.reject();
                }
                setEndDateFieldErrMessage(null);
                return Promise.resolve();
              },
            }),
          ]}
          validateStatus={startDateFieldErrMessage ? ERR_VALIDATE_STATUS : null}
          help={startDateFieldErrMessage}
        >
          <DatePicker
            showTime
            showNow
            format={DateTimeFormat}
            size="small"
          />
        </Form.Item>

        <Form.Item
          label="по"
          name='endDate'
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (value && getFieldValue('startDate') && !value.isAfter(getFieldValue('startDate'))) {
                  setEndDateFieldErrMessage('Корректно определите временной диапазон поиска информации!');
                  return Promise.reject();
                }
                setEndDateFieldErrMessage(null);
                return Promise.resolve();
              },
            }),
          ]}
          validateStatus={endDateFieldErrMessage ? ERR_VALIDATE_STATUS : null}
          help={endDateFieldErrMessage}
        >
          <DatePicker
            showTime
            showNow
            format={DateTimeFormat}
            size="small"
          />
        </Form.Item>

        <Form.Item>
          <Button htmlType="submit" type="primary">
            Найти
          </Button>
        </Form.Item>
      </Form>

      {
        loadDataErr ?
        <Text type="danger">{loadDataErr}</Text> :
        <Table
          loading={!dataLoaded}
          bordered
          dataSource={tableData}
          columns={columns}
          sticky={true}
          pagination={{ position: ['none', 'none'] }}
          footer={() =>
            <div align="end">
              <Pagination
                current={currentTablePage}
                pageSize={MAX_TABLE_ROW_COUNT}
                onChange={onChange}
                total={totalItemsCount}
                showQuickJumper
                showTotal={(total, range) => `Всего записей: ${total}, показаны с ${range[0]} по ${range[1]}`}
              />
            </div>
          }
        />
      }
    </>
  );
};


export default DY58UsersLogsTable;
