const { Schema, model } = require('mongoose');


// Схема записи в коллекции логов пользователей системы ДУ-58
const schema = new Schema({
  // Информация о пользователе (ФИО, должность)
  user: { type: String, required: true },
  // Наименование рабочего полигона
  workPoligon: { type: String, required: true },
  // Время совершения действия
  actionTime: { type: Date, required: true },
  // Наименование действия
  action: { type: String, required: true },
  // Параметры действия
  actionParams: { type: Object, required: false },
});


module.exports = model('DY58UsersLog', schema);
