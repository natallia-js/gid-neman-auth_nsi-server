import { Typography, Popconfirm, Row, Col } from 'antd';
import { STATION_FIELDS } from '../../../constants';
import Loader from '../../Loader';


// Описание столбцов таблицы станций поездного участка ЭЦД
const ecdTrainSectorStationsTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEdit,
    handleCancelMod,
    handleStartEdit,
    handleDel,
    recsBeingProcessed,
  } = props;

  return [
    {
      title: 'Станция',
      dataIndex: STATION_FIELDS.NAME_AND_CODE,
      key: STATION_FIELDS.NAME_AND_CODE,
      width: '20%',
      editable: false,
    },
    {
      title: 'Позиция на поездном участке',
      dataIndex: STATION_FIELDS.POS_IN_TRAIN_SECTOR,
      key: STATION_FIELDS.POS_IN_TRAIN_SECTOR,
      width: '20%',
      editable: true,
    },
    {
      title: 'Принадлежность участку ЭЦД',
      dataIndex: STATION_FIELDS.BELONGS_TO_SECTOR,
      key: STATION_FIELDS.BELONGS_TO_SECTOR,
      width: '20%',
      editable: true,
      render: (_, record) => {
        return <span>{record[STATION_FIELDS.BELONGS_TO_SECTOR] ? 'Да' : 'Нет'}</span>
      },
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
                onClick={() => handleEdit(record[STATION_FIELDS.KEY])}
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
                onClick={() => handleStartEdit(record)}
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
                onConfirm={() => handleDel(record[STATION_FIELDS.KEY])}
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

export default ecdTrainSectorStationsTableColumns;
