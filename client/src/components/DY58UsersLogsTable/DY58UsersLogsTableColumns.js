import { DY58USER_LOGS_FIELDS } from '../../constants';


// Описание столбцов таблицы логов действий пользователей ДУ-58
const dy58UsersLogsTableColumns = ({ getColumnSearchProps }) => {
  return [
    {
      title: 'Рабочий полигон',
      dataIndex: DY58USER_LOGS_FIELDS.WORK_POLIGON,
      key: DY58USER_LOGS_FIELDS.WORK_POLIGON,
      width: '10%',
      editable: false,
      className: 'main-col',
      ...getColumnSearchProps(DY58USER_LOGS_FIELDS.WORK_POLIGON),
    },
    {
      title: 'Пользователь',
      dataIndex: DY58USER_LOGS_FIELDS.USER,
      key: DY58USER_LOGS_FIELDS.USER,
      width: '10%',
      editable: false,
      ...getColumnSearchProps(DY58USER_LOGS_FIELDS.USER),
    },
    {
      title: 'Время операции',
      dataIndex: DY58USER_LOGS_FIELDS.ACTION_TIME,
      key: DY58USER_LOGS_FIELDS.ACTION_TIME,
      width: '10%',
      editable: false,
    },
    {
      title: 'Действие',
      dataIndex: DY58USER_LOGS_FIELDS.ACTION,
      key: DY58USER_LOGS_FIELDS.ACTION,
      width: '20%',
      editable: false,
      ...getColumnSearchProps(DY58USER_LOGS_FIELDS.ACTION),
    },
    {
      title: 'Параметры действия',
      dataIndex: DY58USER_LOGS_FIELDS.ACTION_PARAMS,
      key: DY58USER_LOGS_FIELDS.ACTION_PARAMS,
      width: '50%',
      editable: false,
    },
  ];
};

export default dy58UsersLogsTableColumns;
