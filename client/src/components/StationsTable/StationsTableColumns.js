import { STATION_FIELDS } from '../../constants';
import { Typography, Popconfirm } from 'antd';

// Описание столбцов таблицы станций
const stationsTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditStation,
    handleCancelMod,
    handleStartEditStation,
    handleDelStation
  } = props;

  return [
    {
      title: 'Код ЕСР',
      dataIndex: STATION_FIELDS.ESR_CODE,
      key: STATION_FIELDS.ESR_CODE,
      width: '30%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => +a[STATION_FIELDS.ESR_CODE] - +b[STATION_FIELDS.ESR_CODE],
      className: 'main-col',
    },
    {
      title: 'Название',
      dataIndex: STATION_FIELDS.NAME,
      key: STATION_FIELDS.NAME,
      width: '30%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = a[STATION_FIELDS.NAME].toLowerCase();
        const sortB = b[STATION_FIELDS.NAME].toLowerCase();
        if (sortA < sortB) {
          return -1;
        } else if (sortA > sortB) {
          return 1;
        }
        return 0;
      },
    },
    {
      title: 'Операции',
      dataIndex: 'operation',
      fixed: 'right',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <a
              href="#!"
              onClick={() => handleEditStation(record[STATION_FIELDS.KEY])}
              style={{
                marginRight: 10,
              }}
            >
              Сохранить
            </a>
            <Popconfirm title="Отменить редактирование?" onConfirm={handleCancelMod}>
              <a href="#!">Отменить</a>
            </Popconfirm>
          </span>
        ) : (
          <span>
            <Typography.Link disabled={editingKey !== ''} onClick={() => handleStartEditStation(record)}>
              Редактировать
            </Typography.Link>
            <Popconfirm title="Удалить запись?" onConfirm={() => handleDelStation(record[STATION_FIELDS.KEY])}>
              <a
                href="#!"
                disabled={editingKey !== ''}
                style={{
                  marginLeft: 10,
                }}
              >
                Удалить
              </a>
            </Popconfirm>
          </span>
        );
      },
    },
  ];
};

export default stationsTableColumns;
