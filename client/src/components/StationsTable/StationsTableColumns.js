import { Typography, Popconfirm, Row, Col } from 'antd';
import { STATION_FIELDS } from '../../constants';
import Loader from '../Loader';
import compareStrings from '../../sorters/compareStrings';


// Описание столбцов таблицы станций
const stationsTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditStation,
    handleCancelMod,
    handleStartEditStation,
    handleDelStation,
    recsBeingProcessed,
    getColumnSearchProps,
  } = props;

  return [
    {
      title: 'Код ЕСР',
      dataIndex: STATION_FIELDS.ESR_CODE,
      key: STATION_FIELDS.ESR_CODE,
      width: '10%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => +a[STATION_FIELDS.ESR_CODE] - +b[STATION_FIELDS.ESR_CODE],
      className: 'main-col',
      ...getColumnSearchProps(STATION_FIELDS.ESR_CODE),
    },
    {
      title: 'Код ЕСР ГИД',
      dataIndex: STATION_FIELDS.GID_ESR_CODE,
      key: STATION_FIELDS.GID_ESR_CODE,
      width: '10%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => +a[STATION_FIELDS.GID_ESR_CODE] - +b[STATION_FIELDS.GID_ESR_CODE],
      ...getColumnSearchProps(STATION_FIELDS.GID_ESR_CODE),
    },
    {
      title: 'Название',
      dataIndex: STATION_FIELDS.NAME,
      key: STATION_FIELDS.NAME,
      width: '15%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[STATION_FIELDS.NAME].toLowerCase(), b[STATION_FIELDS.NAME].toLowerCase()),
      ...getColumnSearchProps(STATION_FIELDS.NAME),
    },
    {
      title: 'ПЭНСИ ID',
      dataIndex: STATION_FIELDS.PENSI_ID,
      key: STATION_FIELDS.PENSI_ID,
      width: '15%',
      editable: false,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        if (!a && b) return -1;
        if (a && !b) return 1;
        if (a && b) return +a[STATION_FIELDS.PENSI_ID] - +b[STATION_FIELDS.PENSI_ID];
        return 0;
      },
      ...getColumnSearchProps(STATION_FIELDS.PENSI_ID),
    },
    {
      title: 'ПЭНСИ код ЕСР',
      dataIndex: STATION_FIELDS.PENSI_UNMC,
      key: STATION_FIELDS.PENSI_UNMC,
      width: '15%',
      editable: false,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[STATION_FIELDS.PENSI_UNMC].toLowerCase(), b[STATION_FIELDS.PENSI_UNMC].toLowerCase()),
      ...getColumnSearchProps(STATION_FIELDS.PENSI_UNMC),
    },
    {
      title: 'Операции',
      dataIndex: 'operation',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Row>
            <Col>
              <a
                href="#!"
                onClick={() => handleEditStation(record[STATION_FIELDS.KEY])}
                style={{
                  marginRight: 10,
                }}
                disabled={recsBeingProcessed && recsBeingProcessed.includes(record[STATION_FIELDS.KEY])}
              >
                Сохранить
              </a>
            </Col>
            <Col>
              <Popconfirm
                title="Отменить редактирование?"
                onConfirm={handleCancelMod}
                okText="Да"
                cancelText="Отмена"
              >
                <a
                  href="#!"
                  style={{
                    marginRight: 10,
                  }}
                  disabled={recsBeingProcessed && recsBeingProcessed.includes(record[STATION_FIELDS.KEY])}
                >
                  Отменить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[STATION_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        ) : (
          <Row>
            <Col>
              <Typography.Link
                disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[STATION_FIELDS.KEY]))}
                onClick={() => handleStartEditStation(record)}
                style={{
                  marginRight: 10,
                }}
              >
                Редактировать
              </Typography.Link>
            </Col>
            <Col>
              <Popconfirm
                title="Удалить запись?"
                onConfirm={() => handleDelStation(record[STATION_FIELDS.KEY])}
                okText="Да"
                cancelText="Отмена"
              >
                <a
                  href="#!"
                  disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[STATION_FIELDS.KEY]))}
                  style={{
                    marginRight: 10,
                  }}
                >
                  Удалить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[STATION_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        );
      },
    },
  ];
};

export default stationsTableColumns;
