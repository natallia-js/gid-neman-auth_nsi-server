const WorkOrder = require('../models/WorkOrder');
const Order = require('../models/Order');
const config = require('config');


async function processDelDBData() {
  // Удаляем те распоряжения из коллекции рабочих распоряжений, которые более не являются действующими
  const matchFilter = {
    $and: [
      { orderChain: { $exists: true } },
      { "orderChain.chainEndDateTime": { $exists: true } },
      { "orderChain.chainEndDateTime": { $ne: null } },
      { "orderChain.chainEndDateTime": { $lte: new Date() } },
    ]
  };
  await WorkOrder.deleteMany(matchFilter);

  // Удаляем данные о распоряжениях, хранящихся в основной коллекции распоряжений более заданного промежутка времени
  const storeOrdersInDBInMilliseconds = config.get('storeOrdersInDBInDays') * 24 * 60 * 60 * 1000;
  const delDataUpperDateBorder = new Date();
  delDataUpperDateBorder.setMilliseconds(delDataUpperDateBorder.getMilliseconds() - storeOrdersInDBInMilliseconds);
  await Order.deleteMany({ createDateTime: { $lte: delDataUpperDateBorder } });
}


module.exports = processDelDBData;
