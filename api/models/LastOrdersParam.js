const { Schema, model } = require('mongoose');


// Схема записи в коллекции параметров последних изданных распоряжений
const schema = new Schema({
  // id и тип участка / рабочего полигона
  workPoligon: {
    id: { type: Number, required: true },
    type: { type: String, required: true },
  },
  // Тип распоряжений (распоряжение / заявка / уведомление / запрещение...)
  ordersType: { type: String, required: true },
  // Номер последнего распоряжения заданного типа
  lastOrderNumber: { type: Number, required: true },
});


module.exports = model('LastOrdersParam', schema);
