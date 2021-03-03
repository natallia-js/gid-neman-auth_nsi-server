const { Schema, model, Types } = require('mongoose');


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
  // участок работы
  sector: { type: String, required: true },
  // должность
  post: { type: String, required: true },
  // список id's ролей ГИД НЕМАН
  roles: [Types.ObjectId]

  /*links: [{ type: Types.ObjectId, ref: 'Role' }]*/
});


module.exports = model('User', schema);
