import { Typography, Popconfirm, Row, Col } from 'antd';
import { SERVICE_FIELDS } from '../../constants';
import Loader from '../Loader';
import compareStrings from '../../sorters/compareStrings';


// Описание столбцов таблицы служб
const servicesTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditService,
    handleCancelMod,
    handleStartEditService,
    handleDelService,
    recsBeingProcessed,
  } = props;

  return [
    {
      title: 'Аббревиатура',
      dataIndex: SERVICE_FIELDS.ABBREV,
      key: SERVICE_FIELDS.ABBREV,
      width: '20%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[SERVICE_FIELDS.ABBREV].toLowerCase(), b[SERVICE_FIELDS.ABBREV].toLowerCase()),
      className: 'main-col',
    },
    {
      title: 'Наименование',
      dataIndex: SERVICE_FIELDS.TITLE,
      key: SERVICE_FIELDS.TITLE,
      width: '40%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[SERVICE_FIELDS.TITLE].toLowerCase(), b[SERVICE_FIELDS.TITLE].toLowerCase()),
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
                onClick={() => handleEditService(record[SERVICE_FIELDS.KEY])}
                style={{
                  marginRight: 10,
                }}
                disabled={recsBeingProcessed && recsBeingProcessed.includes(record[SERVICE_FIELDS.KEY])}
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
                  disabled={recsBeingProcessed && recsBeingProcessed.includes(record[SERVICE_FIELDS.KEY])}
                >
                  Отменить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[SERVICE_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        ) : (
          <Row>
            <Col>
              <Typography.Link
                disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[SERVICE_FIELDS.KEY]))}
                onClick={() => handleStartEditService(record)}
                style={{
                  marginRight: 10,
                }}
              >
                Редактировать
              </Typography.Link>
            </Col>
            <Col>
              <Popconfirm title="Удалить запись?" onConfirm={() => handleDelService(record[SERVICE_FIELDS.KEY])}>
                <a
                  href="#!"
                  disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[SERVICE_FIELDS.KEY]))}
                  style={{
                    marginRight: 10,
                  }}
                >
                  Удалить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[SERVICE_FIELDS.KEY]) &&
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

export default servicesTableColumns;
