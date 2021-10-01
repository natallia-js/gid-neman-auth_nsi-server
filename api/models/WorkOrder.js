const { Schema, model, Types } = require('mongoose');


// Схема записи в коллекции распоряжений, находящихся "в работе"
// (входящие уведомления и действующие распоряжения)
const schema = new Schema({
  // id и тип участка / рабочего полигона, с которого отправлено распоряжение
  senderWorkPoligon: {
    id: { type: Number, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
  },
  // id и тип участка / рабочего полигона, на который отправлено распоряжение
  recipientWorkPoligon: {
    id: { type: Number, required: true },
    type: { type: String, required: true },
  },
  // true - передача оригинала распоряжения, false - передача его копии
  sendOriginal: { type: Boolean, required: true },
  // id распоряжения
  orderId: { type: Types.ObjectId, required: true },
  // дата и время доставки распоряжения на рабочее место пользователя
  // (заполняется, когда распоряжение дойдет до рабочего места пользователя)
  deliverDateTime: { type: Date, required: false, default: null },
  // дата и время подтвеждения получения распоряжения пользователем
  // (заполняется, когда пользователь подтвердит получение распоряжения)
  confirmDateTime: { type: Date, required: false, default: null },
  // Время (временной интервал) действия распоряжения
  timeSpan: {
    start: { type: Date, required: false },
    end: { type: Date, required: false },
    tillCancellation: { type: Boolean, required: false },
  },
  // id "связанного" распоряжения (следующего за текущим в хронологическом порядке
  //  и логически связанного с ним)
  nextRelatedOrderId: { type: Types.ObjectId, required: false },
});


module.exports = model('WorkOrder', schema);
