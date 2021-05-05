import { Typography, Popconfirm, Row, Col } from 'antd';
import { TRAIN_SECTOR_FIELDS } from '../../../constants';
import Loader from '../../Loader';
import compareStrings from '../../../sorters/compareStrings';


// Описание столбцов таблицы поездных участков ЭЦД
const ecdTrainSectorsTableColumns = (props) => {
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
      title: 'Наименование',
      dataIndex: TRAIN_SECTOR_FIELDS.NAME,
      key: TRAIN_SECTOR_FIELDS.NAME,
      width: '50%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[TRAIN_SECTOR_FIELDS.NAME].toLowerCase(), b[TRAIN_SECTOR_FIELDS.NAME].toLowerCase()),
      className: 'main-sub-col',
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
                onClick={() => handleEdit(record[TRAIN_SECTOR_FIELDS.KEY])}
                style={{
                  marginRight: 10,
                }}
                disabled={recsBeingProcessed && recsBeingProcessed.includes(record[TRAIN_SECTOR_FIELDS.KEY])}
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
                  disabled={recsBeingProcessed && recsBeingProcessed.includes(record[TRAIN_SECTOR_FIELDS.KEY])}
                >
                  Отменить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[TRAIN_SECTOR_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        ) : (
          <Row>
            <Col>
              <Typography.Link
                disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[TRAIN_SECTOR_FIELDS.KEY]))}
                onClick={() => handleStartEdit(record)}
                style={{
                  marginRight: 10,
                }}
              >
                Редактировать
              </Typography.Link>
            </Col>
            <Col>
              <Popconfirm title="Удалить запись?" onConfirm={() => handleDel(record[TRAIN_SECTOR_FIELDS.KEY])}>
                <a
                  href="#!"
                  disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[TRAIN_SECTOR_FIELDS.KEY]))}
                  style={{
                    marginRight: 10,
                  }}
                >
                  Удалить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[TRAIN_SECTOR_FIELDS.KEY]) &&
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

export default ecdTrainSectorsTableColumns;
