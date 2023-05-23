import { Typography, Popconfirm, Row, Col } from 'antd';
import { STATION_TRACK_FIELDS } from '../../../constants';
import Loader from '../../Loader';
import compareStrings from '../../../sorters/compareStrings';

const YesElement = <span>&#10004;</span>;
const NoElement = <span>-</span>;

// Описание столбцов таблицы путей станции
const stationTracksTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditStationTrack,
    handleCancelMod,
    handleStartEditStationTrack,
    handleDelStationTrack,
    recsBeingProcessed,
  } = props;

  return [
    {
      title: 'Наимен пути',
      dataIndex: STATION_TRACK_FIELDS.NAME,
      key: STATION_TRACK_FIELDS.NAME,
      width: '6%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(
        a[STATION_TRACK_FIELDS.NAME].toLowerCase(), b[STATION_TRACK_FIELDS.NAME].toLowerCase()),
    },
    {
      title: 'Прием пригород',
      dataIndex: STATION_TRACK_FIELDS.ST_SuburbanReception,
      key: STATION_TRACK_FIELDS.ST_SuburbanReception,
      width: '6%',
      editable: true,
      render: (_, record) => record[STATION_TRACK_FIELDS.ST_SuburbanReception] ? YesElement : NoElement,
    },
    {
      title: 'Прием пасс',
      dataIndex: STATION_TRACK_FIELDS.ST_PassengerReception,
      key: STATION_TRACK_FIELDS.ST_PassengerReception,
      width: '6%',
      editable: true,
      render: (_, record) => record[STATION_TRACK_FIELDS.ST_PassengerReception] ? YesElement : NoElement,
    },
    {
      title: 'Прием груз',
      dataIndex: STATION_TRACK_FIELDS.ST_CargoReception,
      key: STATION_TRACK_FIELDS.ST_CargoReception,
      width: '6%',
      editable: true,
      render: (_, record) => record[STATION_TRACK_FIELDS.ST_CargoReception] ? YesElement : NoElement,
    },
    {
      title: 'Отпр пригород',
      dataIndex: STATION_TRACK_FIELDS.ST_SuburbanDeparture,
      key: STATION_TRACK_FIELDS.ST_SuburbanDeparture,
      width: '6%',
      editable: true,
      render: (_, record) => record[STATION_TRACK_FIELDS.ST_SuburbanDeparture] ? YesElement : NoElement,
    },
    {
      title: 'Отпр пасс',
      dataIndex: STATION_TRACK_FIELDS.ST_PassengerDeparture,
      key: STATION_TRACK_FIELDS.ST_PassengerDeparture,
      width: '6%',
      editable: true,
      render: (_, record) => record[STATION_TRACK_FIELDS.ST_PassengerDeparture] ? YesElement : NoElement,
    },
    {
      title: 'Отпр груз',
      dataIndex: STATION_TRACK_FIELDS.ST_CargoDeparture,
      key: STATION_TRACK_FIELDS.ST_CargoDeparture,
      width: '6%',
      editable: true,
      render: (_, record) => record[STATION_TRACK_FIELDS.ST_CargoDeparture] ? YesElement : NoElement,
    },
    {
      title: 'Проп пригород',
      dataIndex: STATION_TRACK_FIELDS.ST_SuburbanPass,
      key: STATION_TRACK_FIELDS.ST_SuburbanPass,
      width: '6%',
      editable: true,
      render: (_, record) => record[STATION_TRACK_FIELDS.ST_SuburbanPass] ? YesElement : NoElement,
    },
    {
      title: 'Проп пасс',
      dataIndex: STATION_TRACK_FIELDS.ST_PassengerPass,
      key: STATION_TRACK_FIELDS.ST_PassengerPass,
      width: '6%',
      editable: true,
      render: (_, record) => record[STATION_TRACK_FIELDS.ST_PassengerPass] ? YesElement : NoElement,
    },
    {
      title: 'Проп груз',
      dataIndex: STATION_TRACK_FIELDS.ST_CargoPass,
      key: STATION_TRACK_FIELDS.ST_CargoPass,
      width: '6%',
      editable: true,
      render: (_, record) => record[STATION_TRACK_FIELDS.ST_CargoPass] ? YesElement : NoElement,
    },
    {
      title: 'Спец прием',
      dataIndex: STATION_TRACK_FIELDS.ST_SpecialTrainReception,
      key: STATION_TRACK_FIELDS.ST_SpecialTrainReception,
      width: '6%',
      editable: true,
      render: (_, record) => record[STATION_TRACK_FIELDS.ST_SpecialTrainReception] ? YesElement : NoElement,
    },
    {
      title: 'Спец отпр',
      dataIndex: STATION_TRACK_FIELDS.ST_SpecialTrainDeparture,
      key: STATION_TRACK_FIELDS.ST_SpecialTrainDeparture,
      width: '6%',
      editable: true,
      render: (_, record) => record[STATION_TRACK_FIELDS.ST_SpecialTrainDeparture] ? YesElement : NoElement,
    },
    {
      title: 'Спец проп',
      dataIndex: STATION_TRACK_FIELDS.ST_SpecialTrainPass,
      key: STATION_TRACK_FIELDS.ST_SpecialTrainPass,
      width: '6%',
      editable: true,
      render: (_, record) => record[STATION_TRACK_FIELDS.ST_SpecialTrainPass] ? YesElement : NoElement,
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
                onClick={() => handleEditStationTrack(record[STATION_TRACK_FIELDS.KEY])}
                style={{
                  marginRight: 10,
                }}
                disabled={recsBeingProcessed && recsBeingProcessed.includes(record[STATION_TRACK_FIELDS.KEY])}
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
                  disabled={recsBeingProcessed && recsBeingProcessed.includes(record[STATION_TRACK_FIELDS.KEY])}
                >
                  Отменить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[STATION_TRACK_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        ) : (
          <Row>
            <Col>
              <Typography.Link
                disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[STATION_TRACK_FIELDS.KEY]))}
                onClick={() => handleStartEditStationTrack(record)}
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
                onConfirm={() => handleDelStationTrack(record[STATION_TRACK_FIELDS.KEY])}
                okText="Да"
                cancelText="Отмена"
              >
                <a
                  href="#!"
                  disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[STATION_TRACK_FIELDS.KEY]))}
                  style={{
                    marginRight: 10,
                  }}
                >
                  Удалить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[STATION_TRACK_FIELDS.KEY]) &&
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

export default stationTracksTableColumns;
