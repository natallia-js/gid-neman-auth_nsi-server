import { ServerAPI, ECDSECTOR_FIELDS } from '../constants';
import getAppECDSectorObjFromDBECDSectorObj from '../mappers/getAppECDSectorObjFromDBECDSectorObj';
import compareStrings from '../sorters/compareStrings';
import { useHttp } from '../hooks/http.hook';

export const useECDSectors = () => {
  const { request } = useHttp();

  //
  async function getFullECDSectorsData() {
    const response = await request(ServerAPI.GET_ECDSECTORS_DATA, 'POST', {});
    return response
      .map((sector) => getAppECDSectorObjFromDBECDSectorObj(sector))
      .sort((a, b) => compareStrings(a[ECDSECTOR_FIELDS.NAME].toLowerCase(), b[ECDSECTOR_FIELDS.NAME].toLowerCase()));
  }

  //
  async function getShortECDSectorsData({ mapSectorToLabelValue = false }) {
    let response = await request(ServerAPI.GET_ECDSECTORS_SHORT_DATA, 'POST', {});
    response = response.map((sector) => getAppECDSectorObjFromDBECDSectorObj(sector));

    if (mapSectorToLabelValue) {
      response = response.map((sector) => ({
        label: sector[ECDSECTOR_FIELDS.NAME],
        value: sector[ECDSECTOR_FIELDS.KEY],
      }));
    }

    const sortFieldName = mapSectorToLabelValue ? 'label' : [ECDSECTOR_FIELDS.NAME];
    return response.sort((a, b) => compareStrings(a[sortFieldName].toLowerCase(), b[sortFieldName].toLowerCase()));
  }

  return {
    getFullECDSectorsData,
    getShortECDSectorsData,
  };
}
