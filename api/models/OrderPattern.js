const { Schema, model } = require('mongoose');


// Схема записи в коллекции шаблонов распоряжений
const schema = new Schema({
  // Служба (аббревиатура)
  service: { type: String, required: true },
  // Тип распоряжения
  type: { type: String, required: true },
  // Категория распоряжения
  category: { type: String, required: true },
  // Наименование распоряжения
  title: { type: String, required: true },
  // Список элементов шаблона
  elements: [
    {
      // Тип элемента шаблона
      type: { type: String, required: true },
      // Ширина элемента шаблона
      width: { type: String, required: false },
      // Строка с описанием того, что должно отображаться в элементе шаблона при формировании распоряжения
      ref: { type: String, required: false },
      // Значение элемента шаблона (для элементов типа text)
      value: { type: String, required: false },
    },
  ],
});

/*
  // select distunct values
  db.orderPatterns.aggregate([{
    $group: {
      _id: {
        service: '$service',
        type: '$type',
        category: '$category',
      }
    }
  }]);
*/

module.exports = model('OrderPattern', schema);
