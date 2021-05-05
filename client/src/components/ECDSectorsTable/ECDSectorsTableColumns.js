import { Typography, Popconfirm, Row, Col } from 'antd';
import { ECDSECTOR_FIELDS } from '../../constants';
import Loader from '../Loader';
import compareStrings from '../../sorters/compareStrings';


// Описание столбцов таблицы участков ЭЦД
const ecdSectorsTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditECDSector,
    handleCancelMod,
    handleStartEditECDSector,
    handleDelECDSector,
    recsBeingProcessed,
  } = props;

  return [
    {
      title: 'Наименование',
      dataIndex: ECDSECTOR_FIELDS.NAME,
      key: ECDSECTOR_FIELDS.NAME,
      width: '40%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[ECDSECTOR_FIELDS.NAME].toLowerCase(), b[ECDSECTOR_FIELDS.NAME].toLowerCase()),
      className: 'main-col',
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
                onClick={() => handleEditECDSector(record[ECDSECTOR_FIELDS.KEY])}
                style={{
                  marginRight: 10,
                }}
                disabled={recsBeingProcessed && recsBeingProcessed.includes(record[ECDSECTOR_FIELDS.KEY])}
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
                  disabled={recsBeingProcessed && recsBeingProcessed.includes(record[ECDSECTOR_FIELDS.KEY])}
                >
                  Отменить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[ECDSECTOR_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        ) : (
          <Row>
            <Col>
              <Typography.Link
                disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[ECDSECTOR_FIELDS.KEY]))}
                onClick={() => handleStartEditECDSector(record)}
                style={{
                  marginRight: 10,
                }}
              >
                Редактировать
              </Typography.Link>
            </Col>
            <Col>
              <Popconfirm title="Удалить запись?" onConfirm={() => handleDelECDSector(record[ECDSECTOR_FIELDS.KEY])}>
                <a
                  href="#!"
                  disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[ECDSECTOR_FIELDS.KEY]))}
                  style={{
                    marginRight: 10,
                  }}
                >
                  Удалить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[ECDSECTOR_FIELDS.KEY]) &&
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

export default ecdSectorsTableColumns;
