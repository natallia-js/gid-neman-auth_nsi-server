import { Typography, Popconfirm, Row, Col } from 'antd';
import { DNCSECTOR_FIELDS } from '../../constants';
import Loader from '../Loader';
import compareStrings from '../../sorters/compareStrings';


// Описание столбцов таблицы участков ДНЦ
const dncSectorsTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditDNCSector,
    handleCancelMod,
    handleStartEditDNCSector,
    handleDelDNCSector,
    recsBeingProcessed,
  } = props;

  return [
    {
      title: 'Наименование',
      dataIndex: DNCSECTOR_FIELDS.NAME,
      key: DNCSECTOR_FIELDS.NAME,
      width: '20%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(a[DNCSECTOR_FIELDS.NAME].toLowerCase(), b[DNCSECTOR_FIELDS.NAME].toLowerCase()),
      className: 'main-col',
    },
    {
      title: 'Комментарий',
      dataIndex: DNCSECTOR_FIELDS.NOTE,
      key: DNCSECTOR_FIELDS.NOTE,
      width: '30%',
      editable: false,
    },
    {
      title: 'ПЭНСИ ID',
      dataIndex: DNCSECTOR_FIELDS.PENSI_ID,
      key: DNCSECTOR_FIELDS.PENSI_ID,
      width: '10%',
      editable: false,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        if (!a && b) return -1;
        if (a && !b) return 1;
        if (a && b) return +a[DNCSECTOR_FIELDS.PENSI_ID] - +b[DNCSECTOR_FIELDS.PENSI_ID];
        return 0;
      },
    },
    {
      title: 'ПЭНСИ код',
      dataIndex: DNCSECTOR_FIELDS.PENSI_Code,
      key: DNCSECTOR_FIELDS.PENSI_Code,
      width: '10%',
      editable: false,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        if (!a && b) return -1;
        if (a && !b) return 1;
        if (a && b) return +a[DNCSECTOR_FIELDS.PENSI_Code] - +b[DNCSECTOR_FIELDS.PENSI_Code];
        return 0;
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
                onClick={() => handleEditDNCSector(record[DNCSECTOR_FIELDS.KEY])}
                style={{
                  marginRight: 10,
                }}
                disabled={recsBeingProcessed && recsBeingProcessed.includes(record[DNCSECTOR_FIELDS.KEY])}
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
                  disabled={recsBeingProcessed && recsBeingProcessed.includes(record[DNCSECTOR_FIELDS.KEY])}
                >
                  Отменить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[DNCSECTOR_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        ) : (
          <Row>
            <Col>
              <Typography.Link
                disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[DNCSECTOR_FIELDS.KEY]))}
                onClick={() => handleStartEditDNCSector(record)}
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
                onConfirm={() => handleDelDNCSector(record[DNCSECTOR_FIELDS.KEY])}
                okText="Да"
                cancelText="Отмена"
              >
                <a
                  href="#!"
                  disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[DNCSECTOR_FIELDS.KEY]))}
                  style={{
                    marginRight: 10,
                  }}
                >
                  Удалить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[DNCSECTOR_FIELDS.KEY]) &&
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

export default dncSectorsTableColumns;
