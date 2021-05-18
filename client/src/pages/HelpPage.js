import React from 'react';
import { Typography } from 'antd';

import './HelpPage.css';

const { Title } = Typography;

/**
 * Возвращает компонент, представляющий собой страницу руководства пользователя.
 */
export const HelpPage = () => {
  return (
    <div className="HelpBlock">
      <Title level={2} className="center top-margin-05">Руководство пользователя</Title>

      <Title level={4}>Chapter1</Title>

      <p className="flow-text helpData">I am Flow Text I am Flow Text I am Flow Text I am Flow Text I am Flow Text
      I am Flow Text I am Flow Text I am Flow Text I am Flow Text I am Flow Text I am Flow Text I am Flow Text
      </p>

      <Title level={4}>Роли в системах ГИД Неман</Title>

      <p className="flow-text helpData">Для работы с системами ГИД Неман...</p>

      <p className="flow-text helpData">Роль администратора ГИД Неман. Наименование роли: GID_NEMAN_ADMIN.</p>

      <Title level={4}>Полномочия в системах</Title>

      <Title level={5}>GidNemanAuthNSIUtil (Утилита аутентификации и НСИ ГИД Неман)</Title>

      <p className="flow-text helpData">GET_ALL_DNCSECTORS_ACTION - позволяет получить список всех смежных участков ДНЦ, ближайших участков ДНЦ и ЭЦД</p>
      <p className="flow-text helpData">MOD_DNCSECTOR_ACTION - позволяет добавлять, удалять, изменять смежные участки ДНЦ, а также ближайшие участки ДНЦ и ЭЦД</p>

      <p className="flow-text helpData">GET_ALL_ECDSECTORS_ACTION - позволяет получить список всех смежных участков ЭЦД, ближайших участков ДНЦ и ЭЦД</p>
      <p className="flow-text helpData">MOD_ECDSECTOR_ACTION - позволяет добавлять, удалять, изменять смежные участки ЭЦД, а также ближайшие участки ДНЦ и ЭЦД</p>

      <p className="flow-text helpData">GET_ALL_APPS_ACTION - позволяет получить список всех приложений ДНЦ (доступно лишь главному администратору ГИД Неман, наделенному соответствующим полномочием)</p>
      <p className="flow-text helpData">GET_APPS_CREDENTIALS_ACTION - позволяет получить список аббревиатур всех приложений, их идентификаторов и, для каждого приложения, - соответствующего списка полномочий пользователей (доступно лишь главному администратору ГИД Неман, наделенному соответствующим полномочием)</p>
      <p className="flow-text helpData">MOD_APP_ACTION - позволяет добавлять, удалять, изменять информацию о приложениях ГИД Неман (доступно лишь главному администратору ГИД Неман, наделенному соответствующим полномочием)</p>
      <p className="flow-text helpData">MOD_APP_CREDENTIAL_ACTION - позволяет добавлять, удалять, изменять информацию о полномочиях в приложениях ГИД Неман (доступно лишь главному администратору ГИД Неман, наделенному соответствующим полномочием)</p>

      <p className="flow-text helpData">MOD_APP_CREDENTIALS_ACTION - позволяет изменять списки полномочий в приложениях ГИД Неман (доступно лишь главному администратору ГИД Неман, наделенному соответствующим полномочием)</p>
      <p className="flow-text helpData">GET_ALL_ROLES_ACTION - позволяет получить список ролей в приложениях ГИД Неман (главный администратор ГИД Неман получит список всех ролей, иные лица - список ролей, которые им позволил использовать главный администратор)</p>
      <p className="flow-text helpData">MOD_ROLE_ACTION - позволяет добавлять, удалять, изменять информацию о ролях в приложениях ГИД Неман (доступно лишь главному администратору ГИД Неман, наделенному соответствующим полномочием)</p>

      <p className="flow-text helpData">GET_ALL_USERS_ACTION - позволяет получить список пользователей ГИД Неман (главный администратор ГИД Неман получит список всех пользователей, иные лица - список пользователей, принадлежащих их службе), а также список рабочих полигонов (станций, участков ДНЦ, участков ЭЦД) всех пользователей</p>
      <p className="flow-text helpData">REGISTER_USER_ACTION - позволяет зарегистрировать пользователя ГИД Неман (главный администратор ГИД Неман может зарегистрировать любого пользователя, иные лица - лишь пользователей в рамках своей службы)</p>
      <p className="flow-text helpData">MOD_USER_ACTION - позволяет удалять, изменять информацию о пользователях ГИД Неман, их ролях в приложениях ГИД Неман (главный администратор ГИД Неман может выполнять действия в отношении всех пользователей, иные лица - лишь в отношении пользователей в рамках своей службы), а также изменять информацию о рабочих полигонах (станциях, участках ДНЦ, участках ЭЦД) всех пользователей</p>

      <p className="flow-text helpData">GET_ALL_BLOCKS_ACTION - позволяет получить список всех перегонов</p>
      <p className="flow-text helpData">MOD_BLOCK_ACTION - позволяет добавлять, удалять, изменять информацию о перегонах</p>

      <p className="flow-text helpData">GET_ALL_STATIONS_ACTION - позволяет получить список всех станций</p>
      <p className="flow-text helpData">MOD_STATION_ACTION - позволяет добавлять, удалять, изменять информацию о станциях</p>

      <p className="flow-text helpData">GET_ALL_DNCSECTORS_ACTION - позволяет получить список всех участков ДНЦ</p>
      <p className="flow-text helpData">MOD_DNCSECTOR_ACTION - позволяет добавлять, удалять, изменять информацию об участках ДНЦ, о поездных участках в составе участков ДНЦ, о станциях, перегонах в составе поездных участков</p>

      <p className="flow-text helpData">GET_ALL_ECDSECTORS_ACTION - позволяет получить список всех участков ЭЦД</p>
      <p className="flow-text helpData">MOD_ECDSECTOR_ACTION - позволяет добавлять, удалять, изменять информацию об участках ЭЦД, о поездных участках в составе участков ЭЦД, о станциях, перегонах в составе поездных участков</p>

      <p className="flow-text helpData">GET_ALL_POSTS_ACTION - позволяет получить список всех должностей</p>
      <p className="flow-text helpData">MOD_POST_ACTION - позволяет добавлять, удалять, изменять информацию о должностях</p>

      <p className="flow-text helpData">GET_ALL_SERVICES_ACTION - позволяет получить список всех служб</p>
      <p className="flow-text helpData">MOD_SERVICE_ACTION - позволяет добавлять, удалять, изменять информацию о службах</p>

      <Title level={4}>Chapter4</Title>

      <p className="flow-text helpData">I am Flow Text</p>

      <Title level={4}>Chapter5</Title>

      <p className="flow-text helpData">I am Flow Text</p>
    </div>
  )
}
