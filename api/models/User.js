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
  // служба
  service: { type: String, required: false },
  // список id's ролей ГИД НЕМАН
  roles: [Types.ObjectId]

  /*links: [{ type: Types.ObjectId, ref: 'Role' }]*/
});


module.exports = model('User', schema);
