const { TStation } = require('../../models/TStation');
const { TDNCSector } = require('../../models/TDNCSector');

async function setLastStationPersonalUpdateDate({ date, stationIds, transaction }) {
  await TStation.update(
    { St_LastPersonalUpdateTime: date },
    {
      where: { St_ID: stationIds },
      transaction,
    });
}

async function setLastDNCSectorPersonalUpdateDate({ date, dncSectorIds, transaction }) {
  await TDNCSector.update(
    { DNCS_LastPersonalUpdateTime: date },
    {
      where: { DNCS_ID: dncSectorIds },
      transaction,
    });
}

module.exports = {
  setLastStationPersonalUpdateDate,
  setLastDNCSectorPersonalUpdateDate,
};
