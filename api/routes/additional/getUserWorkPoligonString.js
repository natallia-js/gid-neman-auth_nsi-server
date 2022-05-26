const { WORK_POLIGON_TYPES } = require('../../constants');
const { TStation } = require('../../models/TStation');
const { TStationWorkPlace } = require('../../models/TStationWorkPlace');
const { TDNCSector } = require('../../models/TDNCSector');
const { TECDSector } = require('../../models/TECDSector');

async function getUserWorkPoligonString({ workPoligonType, workPoligonId, workSubPoligonId }) {
  let workPoligonString = '';
  let workPoligonObject;
  switch (workPoligonType) {
    case WORK_POLIGON_TYPES.STATION:
      workPoligonObject = await TStation.findOne({
        attributes: ['St_Title'],
        where: { St_ID: workPoligonId },
      });
      workPoligonString = `Станция ${workPoligonObject ? workPoligonObject.St_Title : '?'}`;
      if (workPoligonObject && workSubPoligonId) {
        workPoligonObject = await TStationWorkPlace.findOne({
          attributes: ['SWP_Name'],
          where: { SWP_ID: workSubPoligonId, SWP_StationId: workPoligonId },
        });
        if (workPoligonObject) {
          workPoligonString += `, ${workPoligonObject.SWP_Name}`;
        }
      }
      break;
    case WORK_POLIGON_TYPES.DNC_SECTOR:
      workPoligonObject = await TDNCSector.findOne({
        attributes: ['DNCS_Title'],
        where: { DNCS_ID: workPoligonId },
      });
      workPoligonString = `Участок ДНЦ ${workPoligonObject ? workPoligonObject.DNCS_Title : '?'}`;
      break;
    case WORK_POLIGON_TYPES.ECD_SECTOR:
      workPoligonObject = await TECDSector.findOne({
        attributes: ['ECDS_Title'],
        where: { ECDS_ID: workPoligonId },
      });
      workPoligonString = `Участок ЭЦД ${workPoligonObject ? workPoligonObject.ECDS_Title : '?'}`;
      break;
    default:
      break;
  }
  return workPoligonString;
}

module.exports = getUserWorkPoligonString;
