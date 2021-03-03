const { Schema, model } = require('mongoose');


// Схема записи в коллекции приложений ГИД НЕМАН
const schema = new Schema({
  // Аббревиатура приложения
  shortTitle: { type: String, required: true, unique: true },
  // Полное наименование приложения
  title: { type: String, required: true },
  // Список допустимых полномочий пользователей
  credentials: [
    {
      // Аббревиатура полномочия на английском языке
      englAbbreviation: { type: String, required: true },
      // Описание полномочия
      description: { type: String }
    }
  ]
});


module.exports = model('App', schema);
