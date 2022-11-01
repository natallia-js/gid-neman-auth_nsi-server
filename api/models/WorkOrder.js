const { Schema, model, Types } = require('mongoose');

const {
  senderWorkPoligonSchema,
  workPoligonSchema,
  timeSpanSchema,
  orderChainSchema,
} = require('./subSchemas');

// Схема записи в коллекции распоряжений, находящихся "в работе"
// (входящие уведомления и действующие распоряжения)
const schema = new Schema({
  // id и тип участка / рабочего полигона, с которого отправлено распоряжение
  senderWorkPoligon: { type: senderWorkPoligonSchema, required: true },
  // id и тип участка / рабочего полигона, на который отправлено распоряжение
  recipientWorkPoligon: { type: workPoligonSchema, required: true },
  // true - передача оригинала распоряжения, false - передача его копии
  sendOriginal: { type: Boolean, required: true },
  // id распоряжения
  orderId: { type: Types.ObjectId, required: true },
  // дата и время доставки распоряжения на рабочее место пользователя
  // (заполняется автоматически, когда распоряжение дойдет до рабочего места пользователя)
  deliverDateTime: { type: Date, required: false, default: null },
  // дата и время подтвеждения получения распоряжения пользователем
  // (заполняется, когда пользователь подтвердит получение распоряжения)
  confirmDateTime: { type: Date, required: false, default: null },
  // Время (временной интервал) действия распоряжения
  timeSpan: { type: timeSpanSchema, required: true },
  // информация о цепочке распоряжений, которой принадлежит текущее распоряжение
  orderChain: { type: orderChainSchema, required: true },
  // true - документ скрытый (добавлен неявно, пользователь о его существовании не догадывается,
  // необходим для реализации определенной логики системы; в частности, данное поле принимает
  // значение true в случае циркулярного распоряжения ДНЦ, которое адресуется неявно ЭЦД)
  hidden: { type: Boolean, required: true, default: false },
});


module.exports = model('WorkOrder', schema);
