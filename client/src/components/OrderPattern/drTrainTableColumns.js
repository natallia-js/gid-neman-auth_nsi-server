// Описание столбцов таблицы "Поезд ДР"
const drTrainTableColumns = () => {
  return [
    {
      title: '№ п/п',
      width: '10%',
    },
    {
      title: 'Станция',
      width: '30%',
    },
    {
      title: 'Время отправления',
      width: '30%',
    },
    {
      title: 'Время прибытия',
      width: '30%',
    },
  ];
};

export default drTrainTableColumns;
