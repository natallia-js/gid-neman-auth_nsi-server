const { Schema, model, Types } = require('mongoose');

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
  timeSpan: { type: timeSpanSchema, required: false },
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
  // id и тип участка / рабочего полигона пользователя, издавшего распоряжение
  workPoligon: { type: workPoligon, required: true },
  // пользователь, издавший распоряжение (post - должность пользователя на момент издания распоряжения)
  creator: { type: shortUserInfoSchema, required: true },
  // От имени кого издано распоряжение (данное поле присутствует/заполняется лишь тогда,
  // когда распоряжение издается не от своего имени; пример: ДНЦ издается заявку от имени ДСП)
  createdOnBehalfOf: { type: String, required: false },
  // id "связанного" распоряжения (следующего за текущим в хронологическом порядке
  //  и логически связанного с ним)
  nextRelatedOrderId: { type: Types.ObjectId, required: false },
  // информация о цепочке распоряжений, которой принадлежит текущее распоряжение
  orderChain: { type: orderChainSchema, required: true },
});


module.exports = model('Order', schema);
