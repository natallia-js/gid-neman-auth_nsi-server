const { TECDTrainSectorStation } = require('../../models/TECDTrainSectorStation');
const { TECDTrainSectorBlock } = require('../../models/TECDTrainSectorBlock');
const { TECDTrainSector } = require('../../models/TECDTrainSector');

/**
 * Удаляет поездной участок ЭЦД с заданным id из БД со всей связанной с ним информацией.
 */
async function deleteECDTrainSector(id, transaction) {
  // Удаляем информацию о связи станций с удаляемым участком ЭЦД
  await TECDTrainSectorStation.destroy({ where: { ECDTSS_TrainSectorID: id }, transaction });

  // Удаляем информацию о связи перегонов с удаляемым участком ЭЦД
  await TECDTrainSectorBlock.destroy({ where: { ECDTSB_TrainSectorID: id }, transaction });

  const deletedCount = await TECDTrainSector.destroy({ where: { ECDTS_ID: id }, transaction });

  return deletedCount;
}

module.exports = deleteECDTrainSector;
