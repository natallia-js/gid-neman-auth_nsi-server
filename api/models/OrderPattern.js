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
  // Отметки об особых категориях поездов, к которым имеет отношение шаблон распоряжения
  specialTrainCategories: [{ type: String }],
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
  // id пользователя, который последним внес изменения в шаблон
  lastPatternUpdater: { type: Types.ObjectId, required: true },
  // id пользователя, которому необходимо давать возможность редактировать данный шаблон
  // (полагается, что данный шаблон пользователь создал для себя либо для всех пользователей
  // своего рабочего участка)
  personalPattern: { type: Types.ObjectId, required: false },
  // id и тип участка / рабочего полигона пользователя (для тех случаев, когда пользователь создает
  // шаблон для себя, полагаем, что им может захотеть воспользоваться кто-то из сменных пользователей
  // того же самого рабочего полигона)
  workPoligon: {
    id: { type: Number, required: false },
    type: { type: String, required: false },
  },
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
  // Позиция шаблона среди шаблонов, относящихся к той же самой категории шаблонов распоряжений.
  // Поле нужно исключительно для удобства отображения шаблонов в порядке "значимости"/употребимости/...
  positionInPatternsCategory: { type: Number, required: true, default: -1 },
});


module.exports = model('OrderPattern', schema);
