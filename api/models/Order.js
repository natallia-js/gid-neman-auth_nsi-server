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
    start: { type: Date, required: false },
    end: { type: Date, required: false },
    tillCancellation: { type: Boolean, required: false },
  },
  // Наименование и текст распоряжения
  orderText: {
    // наименование
    orderTitle: { type: String, required: true },
    // источник (шаблон / не шаблон)
    orderTextSource: { type: String, required: true },
    // массив элементов текста
    orderText: [
      {
        // тип элемента
        type: { type: String, required: true },
        // смысл элемента (просто текст, список станций, список номеров распоряжений ...)
        ref: { type: String, required: false },
        // значение элемента
        value: { type: String, required: false },
      },
    ],
  },
  // Список участков ДНЦ, на которые необходимо передать распоряжение
  dncToSend: [
    {
      // id участка
      id: { type: Number, required: true },
      // тип участка ("участок ДНЦ")
      type: { type: String, required: true },
      // наименование участка (на момент издания распоряжения)
      placeTitle: { type: String, required: true },
      // ФИО ДНЦ
      fio: { type: String, required: false },
      // true - передать оригинал, false - передать копию
      sendOriginal: { type: Boolean, required: true },
      // дата-время доставки распоряжения адресату
      // (заполняется, когда распоряжение дойдет до рабочего места пользователя)
      deliverDateTime: { type: Date, required: false, default: null },
      // дата-время подтверждения адресатом получения распоряжения
      // (заполняется, когда пользователь подтвердит получение распоряжения)
      confirmDateTime: { type: Date, required: false, default: null },
    },
  ],
  // Список станций, на которые необходимо передать распоряжение
  dspToSend: [
    {
      // id станции
      id: { type: Number, required: true },
      // тип участка ("станция")
      type: { type: String, required: true },
      // наименование станции (на момент издания распоряжения)
      placeTitle: { type: String, required: true },
      // ФИО ДСП
      fio: { type: String, required: false },
      // true - передать оригинал, false - передать копию
      sendOriginal: { type: Boolean, required: true },
      // дата-время доставки распоряжения адресату
      // (заполняется, когда распоряжение дойдет до рабочего места пользователя)
      deliverDateTime: { type: Date, required: false, default: null },
      // дата-время подтверждения адресатом получения распоряжения
      // (заполняется, когда пользователь подтвердит получение распоряжения)
      confirmDateTime: { type: Date, required: false, default: null },
    },
  ],
  // Список участков ЭЦД, на которые необходимо передать распоряжение
  ecdToSend: [
    {
      // id участка
      id: { type: Number, required: true },
      // тип участка ("участок ДНЦ")
      type: { type: String, required: true },
      // наименование участка (на момент издания распоряжения)
      placeTitle: { type: String, required: true },
      // ФИО ДНЦ
      fio: { type: String, required: false },
      // true - передать оригинал, false - передать копию
      sendOriginal: { type: Boolean, required: true },
      // дата-время доставки распоряжения адресату
      // (заполняется, когда распоряжение дойдет до рабочего места пользователя)
      deliverDateTime: { type: Date, required: false, default: null },
      // дата-время подтверждения адресатом получения распоряжения
      // (заполняется, когда пользователь подтвердит получение распоряжения)
      confirmDateTime: { type: Date, required: false, default: null },
    },
  ],
  // id и тип участка / рабочего полигона пользователя, издавшего распоряжение
  workPoligon: {
    id: { type: Number, required: true },
    type: { type: String, required: true },
  },
  // пользователь, издавший распоряжение
  creator: {
    // id пользователя
    id: { type: Types.ObjectId, required: true },
    // должность пользователя (на момент издания распоряжения)
    post: { type: String, required: true },
    // ФИО пользователя (на момент издания распоряжения)
    fio: { type: String, required: true },
  },
  // id "связанного" распоряжения (следующего за текущим в хронологическом порядке
  //  и логически связанного с ним)
  nextRelatedOrderId: { type: Types.ObjectId, required: false },
});


module.exports = model('Order', schema);
