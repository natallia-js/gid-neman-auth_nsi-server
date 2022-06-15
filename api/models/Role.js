const { Schema, model, Types } = require('mongoose');


// Схема записи в коллекции ролей ГИД НЕМАН
const schema = new Schema({
  // Аббревиатура роли на английском языке
  englAbbreviation: { type: String, required: true, unique: true },
  // Описание роли
  description: { type: String },
  // Доступность для применения подчиненным администратором
  subAdminCanUse: { type: Boolean, required: true, default: true },
  // Список групп полномочий в приложениях ГИД Неман, с которыми связана данная роль
  appsCreds: [
    {
      // id группы полномочий
      credsGroupId: { type: Types.ObjectId },
      // список id's полномочий группы
      creds: [Types.ObjectId]
    }
  ]
});


module.exports = model('Role', schema);
