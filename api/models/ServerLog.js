const { Schema, model } = require('mongoose');


// Схема записи в коллекции логов действий сервера
const schema = new Schema({
  // Время действия
  actionTime: { type: Date, required: true },
  // Наименование действия
  action: { type: String, required: true },
  // Описание действия
  description: { type: Object, required: false },
});


module.exports = model('ServerLog', schema);
