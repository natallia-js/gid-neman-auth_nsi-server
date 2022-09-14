const { Schema, model } = require('mongoose');

// Схема записи в коллекции смысловых значений элементов шаблонов распоряжений
const schema = new Schema({
  // Тип элемента шаблона
  elementType: { type: String, required: true, unique: true },
  // Список возможных смысловых значений элемента
  possibleRefs: [
    {
      // название смыслового значения
      refName: { type: String, required: true },
      // true - учитывать значение элемента как дополнительную информацию о месте действия распоряжения
      // в ГИД, false - не учитывать
      additionalOrderPlaceInfoForGID: { type: Boolean, required: true },
      // список допустимых значений элемента шаблона распоряжения с данным смысловым значением
      possibleMeanings: [String],
    },
  ],
});


module.exports = model('OrderPatternElementRef', schema);
