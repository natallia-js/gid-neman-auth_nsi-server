const { Schema, model, Types } = require('mongoose');
const { lastTakePassDutyTimesSchema } = require('./subSchemas');

function isPostFieldRequired() {
  return typeof this.post === 'string' ? false : true;
}

// Схема записи в коллекции пользователей ГИД НЕМАН
const schema = new Schema({
  // имя пользователя
  login: { type: String, required: true, unique: true },
  // пароль
  password: { type: String, required: true },
  // имя
  name: { type: String, required: true },
  // фамилия
  surname: { type: String, required: true },
  // отчество
  fatherName: { type: String, required: false },
  // должность
  post: { type: String, required: isPostFieldRequired },
  // служба (аббревиатура) - не та, которой принадлежит пользователь, а та, за которой закреплен определенный
  // список шаблонов документов - для работы с шаблонами документов
  service: { type: String, required: false },
  // аббревиатура службы, которой принадлежит пользователь
  userService: { type: String, required: false },
  // список id's ролей ГИД НЕМАН
  roles: [Types.ObjectId],
  // контактные данные пользователя
  contactData: { type: String, required: false },
  // список рабочих полигонов и времен последнего принятия и сдачи дежурства пользователем на них
  lastTakePassDutyTimes: [lastTakePassDutyTimesSchema],
  // true - данные о пользователе созданы/подтверждены уполномоченным лицом;
  // false - данные о пользователе еще не подтверждены уполномоченным лицом;
  confirmed: { type: Boolean, required: true },
});


module.exports = model('User', schema);
