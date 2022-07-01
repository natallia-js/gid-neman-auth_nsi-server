const {
  WORK_POLIGON_TYPES,
  NO_RIGHT_WORK_ON_WORK_POLIGON_ERR_MESS,
} = require('../constants');
const { addError } = require('../serverSideProcessing/processLogsActions');
const AUTH_NSI_ACTIONS = require('./AUTH_NSI_ACTIONS');

/**
 * Проверяет, может ли лицо, запрашивающее действие, работать на указанном в запросе рабочем полигоне.
 * В req.user должна быть информация, извлеченная из хранящегося в session token.
 * В req.body должна быть информация о рабочем полигоне: workPoligonType, workPoligonId, workSubPoligonId.
 */
module.exports = (req) => {
  if (!req) {
    return { err: true, status: UNAUTHORIZED, message: NO_RIGHT_WORK_ON_WORK_POLIGON_ERR_MESS };
  }
  if (![
    AUTH_NSI_ACTIONS.START_WORK_WITHOUT_TAKING_DUTY,
    AUTH_NSI_ACTIONS.START_WORK_WITH_TAKING_DUTY,
    ].includes(req.requestedAction)
  ) {
    return { err: false };
  }

  // Теперь проверяем возможность пользователя работать на желаемом рабочем полигоне, анализируя
  // информацию, извлеченную из его токена
  try {
    const { workPoligonType, workPoligonId, workSubPoligonId } = req.body;
    const userData = req.user;
    let hasRight = true;

    switch (workPoligonType) {
      case WORK_POLIGON_TYPES.STATION:
        if (
          !userData.stationWorkPoligons ||
          !userData.stationWorkPoligons.length ||
          !userData.stationWorkPoligons.find((item) =>
            item.SWP_StID === workPoligonId &&
            (
              (!workSubPoligonId && !item.SWP_StWP_ID) ||
              (workSubPoligonId && workSubPoligonId === item.SWP_StWP_ID)
            )
        )) {
          hasRight = false;
        }
        break;
      case WORK_POLIGON_TYPES.DNC_SECTOR:
        if (!userData.dncSectorsWorkPoligons || !userData.dncSectorsWorkPoligons.length ||
          !userData.dncSectorsWorkPoligons.find((item) => item.DNCSWP_DNCSID === workPoligonId))
        {
          hasRight = false;
        }
        break;
      case WORK_POLIGON_TYPES.ECD_SECTOR:
        if (!userData.ecdSectorsWorkPoligons || !userData.ecdSectorsWorkPoligons.length ||
          !userData.ecdSectorsWorkPoligons.find((item) => item.ECDSWP_ECDSID === workPoligonId))
        {
          hasRight = false;
        }
        break;
      default:
        hasRight = false;
    }

    if (!hasRight) {
      return { err: true, status: UNAUTHORIZED, message: NO_RIGHT_WORK_ON_WORK_POLIGON_ERR_MESS };
    }

    return { err: false };

  } catch (error) {
    addError({
      errorTime: new Date(),
      action: 'Проверка возможности работать на указанном рабочем полигоне',
      error: error.message,
      actionParams: {
        requestBody: req.body,
        requestUser: req.user,
      },
    });
    return { err: true, status: UNAUTHORIZED, message: UNAUTHORIZED_ERR_MESS };
  }
}
