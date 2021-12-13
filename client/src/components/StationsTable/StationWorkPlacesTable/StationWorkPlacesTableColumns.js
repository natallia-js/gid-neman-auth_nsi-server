import { Typography, Popconfirm, Row, Col } from 'antd';
import { STATION_WORK_PLACE_FIELDS } from '../../../constants';
import Loader from '../../Loader';
import compareStrings from '../../../sorters/compareStrings';


// Описание столбцов таблицы рабочих мест станции
const stationWorkPlacesTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditStationWorkPlace,
    handleCancelMod,
    handleStartEditStationWorkPlace,
    handleDelStationWorkPlace,
    recsBeingProcessed,
  } = props;

  return [
    {
      title: 'Наименование рабочего места',
      dataIndex: STATION_WORK_PLACE_FIELDS.NAME,
      key: STATION_WORK_PLACE_FIELDS.NAME,
      width: '50%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(
        a[STATION_WORK_PLACE_FIELDS.NAME].toLowerCase(), b[STATION_WORK_PLACE_FIELDS.NAME].toLowerCase()),
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
                onClick={() => handleEditStationWorkPlace(record[STATION_WORK_PLACE_FIELDS.KEY])}
                style={{
                  marginRight: 10,
                }}
                disabled={recsBeingProcessed && recsBeingProcessed.includes(record[STATION_WORK_PLACE_FIELDS.KEY])}
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
                  disabled={recsBeingProcessed && recsBeingProcessed.includes(record[STATION_WORK_PLACE_FIELDS.KEY])}
                >
                  Отменить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[STATION_WORK_PLACE_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        ) : (
          <Row>
            <Col>
              <Typography.Link
                disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[STATION_WORK_PLACE_FIELDS.KEY]))}
                onClick={() => handleStartEditStationWorkPlace(record)}
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
                onConfirm={() => handleDelStationWorkPlace(record[STATION_WORK_PLACE_FIELDS.KEY])}
                okText="Да"
                cancelText="Отмена"
              >
                <a
                  href="#!"
                  disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[STATION_WORK_PLACE_FIELDS.KEY]))}
                  style={{
                    marginRight: 10,
                  }}
                >
                  Удалить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[STATION_WORK_PLACE_FIELDS.KEY]) &&
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

export default stationWorkPlacesTableColumns;
