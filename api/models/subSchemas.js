const { Schema, Types } = require('mongoose');

const orderPlaceSchema = new Schema({
  place: { type: String, required: true },
  value: { type: Number, required: true },
});

const orderRecipientSchema = new Schema({
  // id станции / участка
  id: { type: Number, required: true },
  // тип участка ("станция" / "участок ДНЦ" / "участок ЭЦД")
  type: { type: String, required: true },
  // наименование станции / участка (на момент издания распоряжения)
  placeTitle: { type: String, required: true },
  // ФИО адресата
  fio: { type: String, required: false },
  // true - передать оригинал, false - передать копию
  sendOriginal: { type: Boolean, required: true },
  // дата-время доставки распоряжения адресату
  // (заполняется автоматически, когда распоряжение дойдет до рабочего места пользователя)
  deliverDateTime: { type: Date, required: false, default: null },
  // дата-время подтверждения адресатом получения распоряжения
  // (заполняется, когда пользователь подтвердит получение распоряжения)
  confirmDateTime: { type: Date, required: false, default: null },
});

const senderWorkPoligonSchema = new Schema({
  id: { type: Number, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
});

const recipientWorkPoligonSchema = new Schema({
  // id рабочего полигона
  id: { type: Number, required: true },
  // id рабочего места полигона
  workPlaceId: { type: Number, required: false },
  // тип рабочего полигона
  type: { type: String, required: true },
});

const timeSpanSchema = new Schema({
  start: { type: Date, required: true },
  end: { type: Date, required: false },
  tillCancellation: { type: Boolean, required: true },
});

const orderChainSchema = new Schema({
  // идентификатор цепочки
  chainId: { type: Types.ObjectId, required: true },
  // дата и время начала действия первого распоряжения в цепочке
  chainStartDateTime: { type: Date, required: true },
  // дата и время окончания действия последнего распоряжения в цепочке (если нет, то поле
  // отсутствует либо null)
  chainEndDateTime: { type: Date, required: false },
});

const shortUserInfoSchema = new Schema({
  // id пользователя
  id: { type: Types.ObjectId, required: true },
  // должность пользователя (на момент издания распоряжения)
  post: { type: String, required: true },
  // ФИО пользователя (на момент издания распоряжения)
  fio: { type: String, required: true },
});

const workPoligon = new Schema({
  id: { type: Number, required: true },
  type: { type: String, required: true },
});

const otherToSendSchema = new Schema({
  placeTitle: { type: String, required: true },
  post: { type: String, required: false },
  fio: { type: String, required: false },
  sendOriginal: { type: Boolean, required: true },
});

const orderTextSchema = new Schema({
  // тип элемента
  type: { type: String, required: true },
  // смысл элемента (просто текст, список станций, список номеров распоряжений ...)
  ref: { type: String, required: false },
  // значение элемента
  value: { type: String, required: false },
});

const fullOrderTextSchema = new Schema({
  // наименование
  orderTitle: { type: String, required: true },
  // id шаблона распоряжения, если источник текста - шаблон
  patternId: { type: Types.ObjectId, required: false },
  // источник (шаблон / не шаблон)
  orderTextSource: { type: String, required: true },
  // массив элементов текста
  orderText: [orderTextSchema],
});

module.exports = {
  orderPlaceSchema,
  orderRecipientSchema,
  senderWorkPoligonSchema,
  recipientWorkPoligonSchema,
  timeSpanSchema,
  orderChainSchema,
  shortUserInfoSchema,
  workPoligon,
  otherToSendSchema,
  fullOrderTextSchema,
};
