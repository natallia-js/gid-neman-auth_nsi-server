import { DNCSECTOR_FIELDS } from '../../constants';
import { Typography, Popconfirm } from 'antd';


// Описание столбцов таблицы участков ДНЦ
const dncSectorsTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEditDNCSector,
    handleCancelMod,
    handleStartEditDNCSector,
    handleDelDNCSector
  } = props;

  return [
    {
      title: 'Наименование',
      dataIndex: DNCSECTOR_FIELDS.NAME,
      key: DNCSECTOR_FIELDS.NAME,
      width: '40%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = a[DNCSECTOR_FIELDS.NAME].toLowerCase();
        const sortB = b[DNCSECTOR_FIELDS.NAME].toLowerCase();
        if (sortA < sortB) {
          return -1;
        } else if (sortA > sortB) {
          return 1;
        }
        return 0;
      },
    },
    {
      title: 'Операции',
      dataIndex: 'operation',
      fixed: 'right',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <a
              href="#!"
              onClick={() => handleEditDNCSector(record.key)}
              style={{
                marginRight: 10,
              }}
            >
              Сохранить
            </a>
            <Popconfirm title="Отменить редактирование?" onConfirm={handleCancelMod}>
              <a href="#!">Отменить</a>
            </Popconfirm>
          </span>
        ) : (
          <span>
            <Typography.Link disabled={editingKey !== ''} onClick={() => handleStartEditDNCSector(record)}>
              Редактировать
            </Typography.Link>
            <Popconfirm title="Удалить запись?" onConfirm={() => handleDelDNCSector(record.key)}>
              <a
                href="#!"
                disabled={editingKey !== ''}
                style={{
                  marginLeft: 10,
                }}
              >
                Удалить
              </a>
            </Popconfirm>
          </span>
        );
      },
    },
  ];
};

export default dncSectorsTableColumns;
