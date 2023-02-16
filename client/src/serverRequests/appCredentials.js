import { ServerAPI, APP_CREDS_GROUP_FIELDS } from '../constants';
import getAppCredsGroupObjFromDBCredsGroupObj from '../mappers/getAppCredsGroupObjFromDBCredsGroupObj';
import compareStrings from '../sorters/compareStrings';
import { useHttp } from '../hooks/http.hook';

export const useAppCredentials = () => {
  const { request } = useHttp();

  async function getFullAppCredentialsData() {
    const response = await request(ServerAPI.GET_APPS_CREDS_DATA, 'POST', {});
    return response
      .map((appCred) => getAppCredsGroupObjFromDBCredsGroupObj(appCred))
      .sort((a, b) => compareStrings(a[APP_CREDS_GROUP_FIELDS.SHORT_TITLE].toLowerCase(), b[APP_CREDS_GROUP_FIELDS.SHORT_TITLE].toLowerCase()));
  }

  async function addNewAppCredsGroup(groupData) {
    return await request(ServerAPI.ADD_APP_CREDS_GROUP_DATA, 'POST', { ...groupData, credentials: [] });
  }

  async function delAppCredsGroup(groupId) {
    return await request(ServerAPI.DEL_APP_CREDS_GROUP_DATA, 'POST', { credsGroupId: groupId });
  }

  return {
    getFullAppCredentialsData,
    addNewAppCredsGroup,
    delAppCredsGroup,
  };
}
