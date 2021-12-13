const { TBlockTrack } = require('../../models/TBlockTrack');
const { TDNCTrainSectorBlock } = require('../../models/TDNCTrainSectorBlock');
const { TECDTrainSectorBlock } = require('../../models/TECDTrainSectorBlock');
const { TBlock } = require('../../models/TBlock');

/**
 * Удаляет перегон с заданным id из БД со всей связанной с ним информацией.
 */
async function deleteBlock(id, transaction) {
  // Удаляем информацию о путях перегона
  await TBlockTrack.destroy({ where: { BT_BlockId: id }, transaction });

  // Удаляем информацию о принадлежности перегона поездному участку ДНЦ
  await TDNCTrainSectorBlock.destroy({ where: { DNCTSB_BlockID: id }, transaction });

  // Удаляем информацию о принадлежности перегона поездному участку ЭЦД
  await TECDTrainSectorBlock.destroy({ where: { ECDTSB_BlockID: id }, transaction });

  // Удаляем в БД запись о перегоне
  const deletedCount = await TBlock.destroy({ where: { Bl_ID: id }, transaction });

  return deletedCount;
}

module.exports = deleteBlock;
