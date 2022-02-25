const { Schema, model } = require('mongoose');
const { workPoligon } = require('./subSchemas');

// Схема записи в коллекции черновиков распоряжений
const schema = new Schema({
  // Тип распоряжения (распоряжение / заявка / уведомление / запрещение...)
  type: { type: String, required: true },
  // Дата и время создания черновика
  createDateTime: { type: Date, required: true },
  // Тип и код места (участка) действия распоряжения
  place: { type: Object, required: false },
  // Время (временной интервал) действия распоряжения
  timeSpan: { type: Object, required: false },
  defineOrderTimeSpan: { type: Object, required: false },
  // Наименование и текст распоряжения
  orderText: { type: Object, required: false },
  // Список участков ДНЦ, на которые необходимо передать распоряжение
  dncToSend: [Object],
  // Список станций, на которые необходимо передать распоряжение
  dspToSend: [Object],
  // Список участков ЭЦД, на которые необходимо передать распоряжение
  ecdToSend: [Object],
  // Список остальных адресатов
  otherToSend: [Object],
  // id и тип участка / рабочего полигона пользователя, создавшего черновик
  workPoligon: { type: workPoligon, required: true },
  // От имени кого издается распоряжение
  createdOnBehalfOf: { type: String, required: false },
  // Отображать либо не отображать на ГИД
  showOnGID: { type: Object, required: false },
});

module.exports = model('Draft', schema);
