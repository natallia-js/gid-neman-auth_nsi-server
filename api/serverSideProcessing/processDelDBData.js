const WorkOrder = require('../models/WorkOrder');
const Order = require('../models/Order');
const config = require('config');


/**
 * 1) Удаляем те цепочки распоряжений из КОЛЛЕКЦИИ РАБОЧИХ РАСПОРЯЖЕНИЙ, у которых последнее распоряжение
 * не является действующим и дата окончания его действия не попадает во временной промежуток,
 * в течение которого распоряжение считается находящимся в работе (заданное количество часов назад от
 * текущего времени).
 * Ни в коем случае не удаляем распоряжения, которые не были доставлены на рабочее место либо не были
 * подтверждены на рабочем месте, если дата окончания действия последнего распоряжения в их цепочке
 * больше либо равна указанной дате.
 *
 * 2) Удаляем те цепочки распоряжений, хранящихся в ОСНОВНОЙ КОЛЛЕКЦИИ РАСПОРЯЖЕНИЙ, у которых последнее
 * распоряжение не является действующим и дата окончания его действия меньше указанной даты.
 */
async function processDelDBData() {
  const today = new Date();
  const workPeriodInDays = config.has('workPeriodInDays') ? config.get('workPeriodInDays') : 1;
  const storeOrdersInDBInDays = config.has('storeOrdersInDBInDays') ? config.get('storeOrdersInDBInDays') : 365;
  const maxDaysToStoreUndeliveredAndUnconfirmedOrders = config.has('maxDaysToStoreUndeliveredAndUnconfirmedOrders')
    ? config.get('maxDaysToStoreUndeliveredAndUnconfirmedOrders') : 100;
  const daysToMillisecondsMultiplier = 24 * 60 * 60 * 1000;

  // 1)
  let matchFilter = {
    $or: [
      {
        $and: [
          {
            $or: [
              // { field: null } means that field is null or does not exist
              { deliverDateTime: null },
              { confirmDateTime: null },
            ],
          },
          { orderChain: { $exists: true } },
          { "orderChain.chainEndDateTime": { $exists: true } },
          { "orderChain.chainEndDateTime": { $ne: null } },
          { "orderChain.chainEndDateTime": { $lt: new Date(today.getTime() - maxDaysToStoreUndeliveredAndUnconfirmedOrders * daysToMillisecondsMultiplier) } },
        ],
      },
      {
        $and: [
          // $ne selects the documents where the value of the field is not equal to the specified value.
          // This includes documents that do not contain the field.
          { deliverDateTime: { $ne: null } },
          { confirmDateTime: { $ne: null } },
          { orderChain: { $exists: true } },
          { "orderChain.chainEndDateTime": { $exists: true } },
          { "orderChain.chainEndDateTime": { $ne: null } },
          { "orderChain.chainEndDateTime": { $lt: new Date(today.getTime() - workPeriodInDays * daysToMillisecondsMultiplier) } },
        ],
      },
    ],
  };
  await WorkOrder.deleteMany(matchFilter);

  // 2)
  matchFilter = {
    $and: [
      { orderChain: { $exists: true } },
      { "orderChain.chainEndDateTime": { $exists: true } },
      { "orderChain.chainEndDateTime": { $ne: null } },
      { "orderChain.chainEndDateTime": { $lt: new Date(today.getTime() - storeOrdersInDBInDays * daysToMillisecondsMultiplier) } },
    ],
  };
  await Order.deleteMany(matchFilter);
}


module.exports = processDelDBData;
