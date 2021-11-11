const { Schema, model } = require('mongoose');

// Схема записи в коллекции смысловых значений элементов шаблонов распоряжений
const schema = new Schema({
  // Тип элемента шаблона
  elementType: { type: String, required: true },
  // Список возможных смысловых значений элемента
  possibleRefs: [
    {
      // название смыслового значения
      refName: { type: String, required: true },
      // true - учитывать значение элементв как дополнительную информацию о месте действия распоряжения
      // в ГИД, false - не учитывать
      additionalOrderPlaceInfoForGID: { type: Boolean, required: true },
    },
  ],
});


module.exports = model('OrderPatternElementRef', schema);
