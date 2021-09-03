const { Schema, model, Types } = require('mongoose');


// Схема записи в коллекции распоряжений
const schema = new Schema({
  // Тип распоряжения (распоряжение / заявка / уведомление / запрещение...)
  type: { type: String, required: true },
  // Номер распоряжения
  number: { type: Number, required: true },
  // Дата и время издания распоряжения
  createDateTime: { type: Date, required: true },
  // Тип и код места (участка) действия распоряжения
  place: {
    place: { type: String, required: false },
    value: { type: Number, required: false },
  },
  // Время (временной интервал) действия распоряжения
  timeSpan: {
    end: { type: Date, required: false },
    start: { type: Date, required: false },
    tillCancellation: { type: Boolean, required: false },
  },
  // Наименование и текст распоряжения
  orderText: {
    orderTitle: { type: String, required: true },
    orderTextSource: { type: String, required: true },
    orderText: [
      {
        type: { type: String, required: true },
        ref: { type: String, required: false },
        value: { type: String, required: false },
      },
    ],
  },
  // Список участков ДНЦ, на которые необходимо передать распоряжение
  dncToSend: [
    {
      id: { type: Number, required: false },
      fio: { type: String, required: false },
      sendOriginalToDNC: { type: Number, required: false },
    },
  ],
  // Список участков ДСП, на которые необходимо передать распоряжение
  dspToSend: [
    {
      id: { type: Number, required: false },
      fio: { type: String, required: false },
      sendOriginalToDSP: { type: Number, required: false },
    },
  ],
  // id и тип участка / рабочего полигона пользователя, издавшего распоряжение
  workPoligon: {
    id: { type: Number, required: true },
    type: { type: String, required: true },
  },
  // id пользователя, издавшего распоряжение
  creatorId: { type: Types.ObjectId, required: true },
});


module.exports = model('Order', schema);
