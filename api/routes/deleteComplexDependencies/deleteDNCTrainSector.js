const { TDNCTrainSectorStation } = require('../../models/TDNCTrainSectorStation');
const { TDNCTrainSectorBlock } = require('../../models/TDNCTrainSectorBlock');
const { TDNCTrainSector } = require('../../models/TDNCTrainSector');

/**
 * Удаляет поездной участок ДНЦ с заданным id из БД со всей связанной с ним информацией.
 */
async function deleteDNCTrainSector(id, transaction) {
  // Удаляем информацию о связи станций с удаляемым участком ДНЦ
  await TDNCTrainSectorStation.destroy({ where: { DNCTSS_TrainSectorID: id }, transaction });

  // Удаляем информацию о связи перегонов с удаляемым участком ДНЦ
  await TDNCTrainSectorBlock.destroy({ where: { DNCTSB_TrainSectorID: id }, transaction });

  const deletedCount = await TDNCTrainSector.destroy({ where: { DNCTS_ID: id }, transaction });

  return deletedCount;
}

module.exports = deleteDNCTrainSector;
