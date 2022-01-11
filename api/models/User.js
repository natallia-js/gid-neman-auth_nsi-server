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
  // служба (аббревиатура)
  service: { type: String, required: false },
  // список id's ролей ГИД НЕМАН
  roles: [Types.ObjectId],
  // список рабочих полигонов и времен последнего принятия и сдачи дежурства пользователем на них
  lastTakePassDutyTimes: [lastTakePassDutyTimesSchema],
});


module.exports = model('User', schema);
