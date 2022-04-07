const deleteBlock = require('./deleteBlock');
const { TBlock } = require('../../models/TBlock');
const { TDNCTrainSectorStation } = require('../../models/TDNCTrainSectorStation');
const { TECDTrainSectorStation } = require('../../models/TECDTrainSectorStation');
const { TStationTrack } = require('../../models/TStationTrack');
const { TStationWorkPlace } = require('../../models/TStationWorkPlace');
const { TStationWorkPoligon } = require('../../models/TStationWorkPoligon');
const { TStation } = require('../../models/TStation');
const { Op } = require('sequelize');


/**
 * Удаляет станцию с заданным id из БД со всей связанной с нею информацией.
 */
async function deleteStation(id, transaction) {
  // Удаляем перегоны, связанные с удаляемой станцией
  const blocksToDelete = await TBlock.findAll({
    where: {
      [Op.or]: [
        { Bl_StationID1: id },
        { Bl_StationID2: id },
      ],
    },
    transaction,
  });
  if (blocksToDelete && blocksToDelete.length) {
    // Удаляем сами перегоны и информацию в других таблицах, связанную с удаляемыми перегонами
    for (let block of blocksToDelete) {
      await deleteBlock(block.Bl_ID, transaction);
    }
  }

  // Удаляем информацию о принадлежности станции поездному участку ДНЦ
  await TDNCTrainSectorStation.destroy({ where: { DNCTSS_StationID: id }, transaction });

  // Удаляем информацию о принадлежности станции поездному участку ЭЦД
  await TECDTrainSectorStation.destroy({ where: { ECDTSS_StationID: id }, transaction });

  // Удаляем информацию о путях станции
  await TStationTrack.destroy({ where: { ST_StationId: id }, transaction });

  // Удаляем информацию о рабочих местах станции
  await TStationWorkPlace.destroy({ where: { SWP_StationId: id }, transaction });

  // Удаляем информацию о рабочих полигонах данной станции
  await TStationWorkPoligon.destroy({ where: { SWP_StID: id }, transaction });

  const deletedCount = await TStation.destroy({ where: { St_ID: id }, transaction });

  return deletedCount;
}

module.exports = deleteStation;
