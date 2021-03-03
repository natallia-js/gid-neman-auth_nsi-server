const { Schema, model, Types } = require('mongoose');


// Схема записи в коллекции ролей ГИД НЕМАН
const schema = new Schema({
  // Аббревиатура роли на английском языке
  englAbbreviation: { type: String, required: true, unique: true },
  // Описание роли
  description: { type: String },
  // Список приложений, с которыми связана данная роль
  apps: [
    {
      // id приложения
      appId: { type: Types.ObjectId },
      // список id's полномочий в данном приложении
      creds: [Types.ObjectId]
    }
  ]
});


module.exports = model('Role', schema);
