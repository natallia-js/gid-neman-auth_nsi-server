import { Typography, Popconfirm, Row, Col } from 'antd';
import { ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS, WORK_POLIGON_FIELDS } from '../../../constants';
import Loader from '../../Loader';
import compareStrings from '../../../sorters/compareStrings';


// Описание столбцов таблицы смысловых значений элемента шаблона распоряжения
const orderPatternElementRefsTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditOrderPatternElementRef,
    handleCancelMod,
    handleStartEditOrderPatternElementRef,
    handleDelOrderPatternElementRef,
    recsBeingProcessed,
  } = props;

  return [
    {
      title: 'Наименование',
      dataIndex: ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME,
      key: ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME,
      width: '20%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => compareStrings(
        (a[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME] || '').toLowerCase(), (b[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.NAME] || '').toLowerCase()),
    },
    {
      title: 'Рабочий полигон',
      dataIndex: ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.WORK_POLIGON,
      key: ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.WORK_POLIGON,
      width: '20%',
      editable: true,
      render: (_, record) => {
        return <span>
          {
            record[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.WORK_POLIGON] &&
            record[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.WORK_POLIGON][WORK_POLIGON_FIELDS.NAME] ?
            record[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.WORK_POLIGON][WORK_POLIGON_FIELDS.NAME] : ''
          }
          </span>
      },
    },
    {
      title: 'Доп.инфо о месте действия для ГИД',
      dataIndex: ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.IS_ORDER_PLACE_FOR_GID,
      key: ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.IS_ORDER_PLACE_FOR_GID,
      width: '20%',
      editable: true,
      render: (_, record) => {
        return <span>{record[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.IS_ORDER_PLACE_FOR_GID] ? 'Да' : 'Нет'}</span>
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
                onClick={() => handleEditOrderPatternElementRef(record[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY])}
                style={{
                  marginRight: 10,
                }}
                disabled={recsBeingProcessed && recsBeingProcessed.includes(record[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY])}
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
                  disabled={recsBeingProcessed && recsBeingProcessed.includes(record[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY])}
                >
                  Отменить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY]) &&
              <Col>
                <Loader />
              </Col>
            }
          </Row>
        ) : (
          <Row>
            <Col>
              <Typography.Link
                disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY]))}
                onClick={() => handleStartEditOrderPatternElementRef(record)}
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
                onConfirm={() => handleDelOrderPatternElementRef(record[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY])}
                okText="Да"
                cancelText="Отмена"
              >
                <a
                  href="#!"
                  disabled={editingKey !== '' || (recsBeingProcessed && recsBeingProcessed.includes(record[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY]))}
                  style={{
                    marginRight: 10,
                  }}
                >
                  Удалить
                </a>
              </Popconfirm>
            </Col>
            {recsBeingProcessed && recsBeingProcessed.includes(record[ORDER_PATTERN_ELEMENT_REF_POSSIBLE_DATA_FIELDS.KEY]) &&
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

export default orderPatternElementRefsTableColumns;
