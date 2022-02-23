const { Schema, model } = require('mongoose');

const {
  /*orderPlaceSchema,
  timeSpanSchema,
  orderRecipientSchema,*/
  workPoligon,
  /*otherToSendSchema,
  fullOrderTextSchema,*/
} = require('./subSchemas');

// Схема записи в коллекции черновиков распоряжений
const schema = new Schema({
  // Тип распоряжения (распоряжение / заявка / уведомление / запрещение...)
  type: { type: String, required: true },
  // Дата и время создания черновика
  createDateTime: { type: Date, required: true },
  // Тип и код места (участка) действия распоряжения
  //place: { type: orderPlaceSchema, required: false },
  place: { type: Object, required: false },
  // Время (временной интервал) действия распоряжения
  //timeSpan: { type: timeSpanSchema, required: false },
  timeSpan: { type: Object, required: false },
  defineOrderTimeSpan: { type: Object, required: false },
  // Наименование и текст распоряжения
  //orderText: { type: fullOrderTextSchema, required: false },
  orderText: { type: Object, required: false },
  // Список участков ДНЦ, на которые необходимо передать распоряжение
  dncToSend: [Object], //[orderRecipientSchema],
  // Список станций, на которые необходимо передать распоряжение
  dspToSend: [Object], //[orderRecipientSchema],
  // Список участков ЭЦД, на которые необходимо передать распоряжение
  ecdToSend: [Object], //[orderRecipientSchema],
  // Список остальных адресатов
  otherToSend: [Object], //[otherToSendSchema],
  // id и тип участка / рабочего полигона пользователя, создавшего черновик
  workPoligon: { type: workPoligon, required: true },
  // От имени кого издается распоряжение
  createdOnBehalfOf: { type: String, required: false },
  // true - отображать на ГИД, false - не отображать на ГИД
  //showOnGID: { type: Boolean, required: false },
  showOnGID: { type: Object, required: false },
});


module.exports = model('Draft', schema);
