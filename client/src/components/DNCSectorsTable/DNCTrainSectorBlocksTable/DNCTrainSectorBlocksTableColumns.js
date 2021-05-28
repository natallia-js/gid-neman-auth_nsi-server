import { Typography, Popconfirm, Row, Col } from 'antd';
import { BLOCK_FIELDS } from '../../../constants';
import Loader from '../../Loader';


// Описание столбцов таблицы перегонов поездного участка ДНЦ
const dncTrainSectorBlocksTableColumns = (props) => {
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
      title: 'Перегон',
      dataIndex: BLOCK_FIELDS.NAME,
      key: BLOCK_FIELDS.NAME,
      width: '20%',
      editable: false,
    },
    {
      title: 'Позиция на поездном участке',
      dataIndex: BLOCK_FIELDS.POS_IN_TRAIN_SECTOR,
      key: BLOCK_FIELDS.POS_IN_TRAIN_SECTOR,
      width: '20%',
      editable: true,
      // Хочу, чтобы перегоны всегда выводились в порядке возрастания их позиций в рамках поездного участка
      sortOrder: 'ascend',
      sorter: (a, b) => a[BLOCK_FIELDS.POS_IN_TRAIN_SECTOR] - b[BLOCK_FIELDS.POS_IN_TRAIN_SECTOR],
    },
    {
      title: 'Принадлежность участку ДНЦ',
      dataIndex: BLOCK_FIELDS.BELONGS_TO_SECTOR,
      key: BLOCK_FIELDS.BELONGS_TO_SECTOR,
      width: '20%',
      editable: true,
      render: (_, record) => {
        return <span>{record[BLOCK_FIELDS.BELONGS_TO_SECTOR] ? 'Да' : 'Нет'}</span>
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
                onClick={() => handleEdit(record[BLOCK_FIELDS.KEY])}
                style={{
                  marginRight: 10,
                }}
                disabled={recsBeingProcessed && recsBeingProcessed.includes(record[BLOCK_FIELDS.KEY])}
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
                onConfirm={() => handleDel(record[BLOCK_FIELDS.KEY])}
                okText="Да"
                cancelText="Отмена"
              >
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

export default dncTrainSectorBlocksTableColumns;
