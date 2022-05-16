const deleteECDTrainSector = require('./deleteECDTrainSector');
const { TECDTrainSector } = require('../../models/TECDTrainSector');
const { TAdjacentECDSectorFields, TAdjacentECDSector } = require('../../models/TAdjacentECDSector');
const { TNearestDNCandECDSector } = require('../../models/TNearestDNCandECDSector');
const { TECDStructuralDivision } = require('../../models/TECDStructuralDivision');
const { TECDSectorWorkPoligon } = require('../../models/TECDSectorWorkPoligon');
const { TECDSector } = require('../../models/TECDSector');
const { Op } = require('sequelize');

/**
 * Удаляет участок ЭЦД с заданным id из БД со всей связанной с ним информацией.
 */
async function deleteECDSector(id, transaction) {
  // Вначале удаляем поездные участки ЭЦД
  const ecdTrainSectorsToDelete = await TECDTrainSector.findAll({
    where: { ECDTS_ECDSectorID: id },
    transaction,
  });
  if (ecdTrainSectorsToDelete && ecdTrainSectorsToDelete.length) {
    // Удаляем сами поездные участки ЭЦД и информацию в других таблицах, связанную с ними
    for (let trainSector of ecdTrainSectorsToDelete) {
      await deleteECDTrainSector(trainSector.ECDTS_ID, transaction);
    }
  }

  await TAdjacentECDSector.destroy({
    where: {
      [Op.or]: [
        { [TAdjacentECDSectorFields.AECDS_ECDSectorID1]: id },
        { [TAdjacentECDSectorFields.AECDS_ECDSectorID2]: id },
      ],
    },
    transaction,
  });
  await TNearestDNCandECDSector.destroy({ where: { NDE_ECDSectorID: id }, transaction });
  await TECDStructuralDivision.destroy({ where: { ECDSD_ECDSectorID: id }, transaction });
  await TECDSectorWorkPoligon.destroy({ where: { ECDSWP_ECDSID: id }, transaction });

  // Наконец, удаляем запись в самой таблице участков ЭЦД
  const deletedCount = await TECDSector.destroy({ where: { ECDS_ID: id }, transaction });

  return deletedCount;
}

module.exports = deleteECDSector;
