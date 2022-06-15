const { Schema, model } = require('mongoose');


// Схема записи в коллекции полномочий в приложениях ГИД НЕМАН
const schema = new Schema({
  // Аббревиатура группы полномочий
  shortTitle: { type: String, required: true, unique: true },
  // Полное наименование группы полномочий (комментарий)
  title: { type: String, required: true },
  // Список полномочий пользователей в системах ГИД Неман
  credentials: [
    {
      // Аббревиатура полномочия на английском языке
      englAbbreviation: { type: String, required: true },
      // Описание полномочия
      description: { type: String },
    }
  ]
});


module.exports = model('AppCred', schema);
