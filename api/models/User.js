const { Schema, model, Types } = require('mongoose');

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
  // дата-время последнего принятия дежурства
  lastTakeDutyTime: { type: Date, required: false },
  // дата-время последней сдачи дежурства (если пользователь дежурство принял, но не сдал, то значение
  // в данном поле либо отсутствует, либо не определено, либо меньше значения в lastTakeDutyTime)
  lastPassDutyTime: { type: Date, required: false },
});


module.exports = model('User', schema);
