const { Schema, model } = require('mongoose');


// Схема записи в коллекции логов серверных ошибок
const schema = new Schema({
  // Время, когда ошибка произошла
  errorTime: { type: Date, required: true },
  // Наименование действия, при выполнении которого произошла ошибка
  action: { type: String, required: true },
  // Описание ошибки
  error: { type: String, required: true },
  // Параметры действия, при которых ошибка была зафиксирована
  actionParams: { type: Object, required: false },
});


module.exports = model('ErrorsLog', schema);
