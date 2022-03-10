import { ERROR_LOGS_FIELDS } from '../../constants';


// Описание столбцов таблицы логов серверных ошибок
const serverErrorsLogsTableColumns = () => {
  return [
    {
      title: 'Время ошибки',
      dataIndex: ERROR_LOGS_FIELDS.ERROR_TIME,
      key: ERROR_LOGS_FIELDS.ERROR_TIME,
      width: '10%',
      editable: false,
    },
    {
      title: 'Ошибка',
      dataIndex: ERROR_LOGS_FIELDS.ERROR,
      key: ERROR_LOGS_FIELDS.ERROR,
      width: '20%',
      editable: false,
    },
    {
      title: 'Действие',
      dataIndex: ERROR_LOGS_FIELDS.ACTION,
      key: ERROR_LOGS_FIELDS.ACTION,
      width: '20%',
      editable: false,
    },
    {
      title: 'Параметры действия',
      dataIndex: ERROR_LOGS_FIELDS.ACTION_PARAMS,
      key: ERROR_LOGS_FIELDS.ACTION_PARAMS,
      width: '50%',
      editable: false,
    },
  ];
};

export default serverErrorsLogsTableColumns;
