import { ServerAPI, DNCSECTOR_FIELDS } from '../constants';
import getAppDNCSectorObjFromDBDNCSectorObj from '../mappers/getAppDNCSectorObjFromDBDNCSectorObj';
import compareStrings from '../sorters/compareStrings';
import { useHttp } from '../hooks/http.hook';

export const useDNCSectors = () => {
  const { request } = useHttp();

  //
  async function getFullDNCSectorsData() {
    const response = await request(ServerAPI.GET_DNCSECTORS_DATA, 'POST', {});
    return response
      .map((sector) => getAppDNCSectorObjFromDBDNCSectorObj(sector))
      .sort((a, b) => compareStrings(a[DNCSECTOR_FIELDS.NAME].toLowerCase(), b[DNCSECTOR_FIELDS.NAME].toLowerCase()));
  }

  //
  async function getShortDNCSectorsData({ mapSectorToLabelValue = false }) {
    let response = await request(ServerAPI.GET_DNCSECTORS_SHORT_DATA, 'POST', {});
    response = response.map((sector) => getAppDNCSectorObjFromDBDNCSectorObj(sector));

    if (mapSectorToLabelValue) {
      response = response.map((sector) => ({
        label: sector[DNCSECTOR_FIELDS.NAME],
        value: sector[DNCSECTOR_FIELDS.KEY],
      }));
    }

    const sortFieldName = mapSectorToLabelValue ? 'label' : [DNCSECTOR_FIELDS.NAME];
    return response.sort((a, b) => compareStrings(a[sortFieldName].toLowerCase(), b[sortFieldName].toLowerCase()));
  }

  return {
    getFullDNCSectorsData,
    getShortDNCSectorsData,
  };
}
