import { Typography, Popconfirm, Row, Col } from 'antd';
import { BLOCK_FIELDS, STATION_FIELDS } from '../../constants';
import Loader from '../Loader';
import compareStrings from '../../sorters/compareStrings';


// Описание столбцов таблицы перегонов
const blocksTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditBlock,
    handleCancelMod,
    handleStartEditBlock,
    handleDelBlock,
    recsBeingProcessed,
  } = props;

  return [
    {
      title: 'Наименование',
      dataIndex: BLOCK_FIELDS.NAME,
      key: BLOCK_FIELDS.NAME,
      width: '20%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[BLOCK_FIELDS.NAME].toLowerCase(), b[BLOCK_FIELDS.NAME].toLowerCase()),
      className: 'main-col',
    },
    {
      title: 'Станция 1',
      dataIndex: [BLOCK_FIELDS.STATION1, STATION_FIELDS.NAME_AND_CODE],
      key: STATION_FIELDS.NAME_AND_CODE,
      width: '20%',
      editable: true,
    },
    {
      title: 'Станция 2',
      dataIndex: [BLOCK_FIELDS.STATION2, STATION_FIELDS.NAME_AND_CODE],
      key: STATION_FIELDS.NAME_AND_CODE,
      width: '20%',
      editable: true,
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
                onClick={() => handleEditBlock(record[BLOCK_FIELDS.KEY])}
                style={{
                  marginRight: 10,
                }}
                disabled={recsBeingProcessed && recsBeingProcessed.includes(record[BLOCK_FIELDS.KEY])}
              >
                Сохранить
              </a>
            </Col>
            <Col>
              <Popconfirm title="Отменить редактирование?" onConfirm={handleCancelMod}>
                <a
                  href="#!"
                  style={{
                    marginRight: 10,
                  }}
                  disabled={recsBeingProcessed && recsBeingProcessed.includes(record[BLOCK_FIELDS.KEY])}
                >
                  Отменить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[BLOCK_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        ) : (
          <Row>
            <Col>
              <Typography.Link
                disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[BLOCK_FIELDS.KEY]))}
                onClick={() => handleStartEditBlock(record)}
                style={{
                  marginRight: 10,
                }}
              >
                Редактировать
              </Typography.Link>
            </Col>
            <Col>
              <Popconfirm title="Удалить запись?" onConfirm={() => handleDelBlock(record[BLOCK_FIELDS.KEY])}>
                <a
                  href="#!"
                  disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[BLOCK_FIELDS.KEY]))}
                  style={{
                    marginRight: 10,
                  }}
                >
                  Удалить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[BLOCK_FIELDS.KEY]) &&
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

export default blocksTableColumns;
