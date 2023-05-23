import { ServerAPI, STATION_FIELDS } from '../constants';
import getAppStationObjFromDBStationObj from '../mappers/getAppStationObjFromDBStationObj';
import compareStrings from '../sorters/compareStrings';
import { useHttp } from '../hooks/http.hook';

export const useStations = () => {
  const { request } = useHttp();

  //
  async function getFullStationsData() {
    const response = await request(ServerAPI.GET_FULL_STATIONS_DATA, 'POST', {});
    console.log(response)
    return response
      .map((station) => getAppStationObjFromDBStationObj(station))
      .sort((a, b) => compareStrings(a[STATION_FIELDS.NAME].toLowerCase(), b[STATION_FIELDS.NAME].toLowerCase()));
  }

  //
  async function getShortStationsData({ mapStationToLabelValue = false }) {
    let response = await request(ServerAPI.GET_STATIONS_DATA, 'POST', {});
    response = response.map((station) => getAppStationObjFromDBStationObj(station));

    if (mapStationToLabelValue) {
      response = response.map((station) => ({
        label: `${station[STATION_FIELDS.NAME]} (${station[STATION_FIELDS.ESR_CODE]})`,
        value: station[STATION_FIELDS.KEY],
      }));
    }

    const sortFieldName = mapStationToLabelValue ? 'label' : [STATION_FIELDS.NAME];
    return response.sort((a, b) => compareStrings(a[sortFieldName].toLowerCase(), b[sortFieldName].toLowerCase()));
  }

  return {
    getFullStationsData,
    getShortStationsData,
  };
}
