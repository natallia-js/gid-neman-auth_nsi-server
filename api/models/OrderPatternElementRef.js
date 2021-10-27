const { Schema, model } = require('mongoose');

// Схема записи в коллекции смысловых значений элементов шаблонов распоряжений
const schema = new Schema({
  // Тип элемента шаблона
  elementType: { type: String, required: true },
  // Список возможных смысловых значений элемента
  possibleRefs: [{ type: String }],
});


module.exports = model('OrderPatternElementRef', schema);
