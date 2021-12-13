const deleteDNCTrainSector = require('./deleteDNCTrainSector');
const { TDNCTrainSector } = require('../../models/TDNCTrainSector');
const { TAdjacentDNCSector } = require('../../models/TAdjacentDNCSector');
const { TNearestDNCandECDSector } = require('../../models/TNearestDNCandECDSector');
const { TDNCSectorWorkPoligon } = require('../../models/TDNCSectorWorkPoligon');
const { TDNCSector } = require('../../models/TDNCSector');
const { Op } = require('sequelize');

/**
 * Удаляет участок ДНЦ с заданным id из БД со всей связанной с ним информацией.
 */
async function deleteDNCSector(id, transaction) {
  // Вначале удаляем поездные участки ДНЦ
  const dncTrainSectorsToDelete = await TDNCTrainSector.findAll({
    where: { DNCTS_DNCSectorID: id },
    transaction,
  });
  if (dncTrainSectorsToDelete && dncTrainSectorsToDelete.length) {
    // Удаляем сами поездные участки ДНЦ и информацию в других таблицах, связанную с ними
    for (let trainSector of dncTrainSectorsToDelete) {
      await deleteDNCTrainSector(trainSector.DNCTS_ID, transaction);
    }
  }

  await TAdjacentDNCSector.destroy({
    where: {
      [Op.or]: [
        { ADNCS_DNCSectorID1: id },
        { ADNCS_DNCSectorID2: id },
      ],
    },
    transaction,
  });
  await TNearestDNCandECDSector.destroy({ where: { NDE_DNCSectorID: id }, transaction });
  await TDNCSectorWorkPoligon.destroy({ where: { DNCSWP_DNCSID: id }, transaction });

  // Наконец, удаляем запись в самой таблице участков ЭЦД
  const deletedCount = await TDNCSector.destroy({ where: { DNCS_ID: id }, transaction });

  return deletedCount;
}

module.exports = deleteDNCSector;
