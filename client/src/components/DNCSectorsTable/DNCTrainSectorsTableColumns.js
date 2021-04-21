import { TRAIN_SECTOR_FIELDS } from '../../constants';
import { Typography, Popconfirm } from 'antd';


// Описание столбцов таблицы поездных участков ДНЦ
const dncTrainSectorsTableColumns = (props) => {
  const {
    isEditing,
    editingKey,
    handleEdit,
    handleCancelMod,
    handleStartEdit,
    handleDel,
  } = props;

  return [
    {
      title: 'Наименование',
      dataIndex: TRAIN_SECTOR_FIELDS.NAME,
      key: TRAIN_SECTOR_FIELDS.NAME,
      width: '60%',
      editable: true,
      sortDirections: ['ascend', 'descend'],
      sorter: (a, b) => {
        const sortA = a[TRAIN_SECTOR_FIELDS.NAME].toLowerCase();
        const sortB = b[TRAIN_SECTOR_FIELDS.NAME].toLowerCase();
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
              onClick={() => handleEdit(record.key)}
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
            <Typography.Link disabled={editingKey !== ''} onClick={() => handleStartEdit(record)}>
              Редактировать
            </Typography.Link>
            <Popconfirm title="Удалить запись?" onConfirm={() => handleDel(record.key)}>
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

export default dncTrainSectorsTableColumns;
