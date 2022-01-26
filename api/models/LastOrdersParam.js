const { Schema, model } = require('mongoose');


// Схема записи в коллекции параметров последних изданных распоряжений
const schema = new Schema({
  // id и тип участка / рабочего полигона
  workPoligon: {
    // id рабочего полигона
    id: { type: Number, required: true },
    // тип рабочего полигона
    type: { type: String, required: true },
  },
  // Тип распоряжений (распоряжение / заявка / уведомление / запрещение...)
  ordersType: { type: String, required: true },
  // Номер последнего распоряжения заданного типа
  lastOrderNumber: { type: Number, required: true },
  // Дата и время издания последнего распоряжения заданного типа
  lastOrderDateTime: { type: Date, required: true },
});


module.exports = model('LastOrdersParam', schema);
