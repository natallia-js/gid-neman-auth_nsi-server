const { Schema, model, Types } = require('mongoose');


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
      // Размер (ширина) элемента шаблона
      size: { type: String, required: false },
      // Строка с описанием того, что должно отображаться в элементе шаблона при формировании распоряжения
      ref: { type: String, required: false },
      // Значение элемента шаблона (для элементов типа text)
      value: { type: String, required: false },
    },
  ],
  // id пользователя, которому необходимо показывать данный шаблон
  personalPattern: { type: Types.ObjectId, required: false },
  // Список дочерних шаблонов (шаблонов, связанных с текущим и применяемых после текущего)
  childPatterns: [
    {
      // id дочернего шаблона
      childPatternId: { type: Types.ObjectId, required: true },
      // таблица соответствия параметров базового и дочернего шаблонов
      patternsParamsMatchingTable: [
        {
          baseParamId: { type: Types.ObjectId, required: true },
          childParamId: { type: Types.ObjectId, required: true },
        },
      ],
    },
  ],
});

/*
  // select distinct values
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
