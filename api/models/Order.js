const { Schema, model } = require('mongoose');

const {
  orderPlaceSchema,
  timeSpanSchema,
  orderRecipientSchema,
  shortUserInfoSchema,
  workPoligon,
  otherToSendSchema,
  fullOrderTextSchema,
  orderChainSchema,
} = require('./subSchemas');

// Схема записи в коллекции распоряжений
const schema = new Schema({
  // Тип распоряжения (распоряжение / заявка / уведомление / запрещение...)
  type: { type: String, required: true },
  // Номер распоряжения
  number: { type: Number, required: true },
  // Дата и время издания распоряжения
  createDateTime: { type: Date, required: true },
  // Тип и код места (участка) действия распоряжения
  place: { type: orderPlaceSchema, required: false },
  // Время (временной интервал) действия распоряжения
  timeSpan: { type: timeSpanSchema, required: true },
  // Наименование и текст распоряжения
  orderText: { type: fullOrderTextSchema, required: true },
  // Список участков ДНЦ, на которые необходимо передать распоряжение
  dncToSend: [orderRecipientSchema],
  // Список станций, на которые необходимо передать распоряжение
  dspToSend: [orderRecipientSchema],
  // Список участков ЭЦД, на которые необходимо передать распоряжение
  ecdToSend: [orderRecipientSchema],
  // Список остальных адресатов
  otherToSend: [otherToSendSchema],
  // Список рабочих мест на станциях, на которые направлено распоряжение
  stationWorkPlacesToSend: [orderRecipientSchema],
  // id и тип участка / рабочего полигона пользователя, издавшего распоряжение
  workPoligon: { type: workPoligon, required: true },
  // пользователь, издавший распоряжение (post - должность пользователя на момент издания распоряжения)
  creator: { type: shortUserInfoSchema, required: true },
  // От имени кого издано распоряжение (данное поле присутствует/заполняется лишь тогда,
  // когда распоряжение издается не от своего имени; пример: ДНЦ издается заявку от имени ДСП)
  createdOnBehalfOf: { type: String, required: false },
  // Отметки об особых категориях поездов, к которым имеет отношение распоряжение
  specialTrainCategories: [{ type: String }],
  // информация о цепочке распоряжений, которой принадлежит текущее распоряжение
  orderChain: { type: orderChainSchema, required: true },
  // true - отображать на ГИД, false - не отображать на ГИД
  showOnGID: { type: Boolean, required: false },
});


module.exports = model('Order', schema);
