const {
  WORK_POLIGON_TYPES,
  NO_RIGHT_WORK_ON_WORK_POLIGON_ERR_MESS,
} = require('../constants');

/**
 * Промежуточный обработчик проверки того, может ли лицо, запрашивающее действие, работать на указанном
 * в запросе рабочем полигоне.
 * В req.user должна быть информация, извлеченная из token (см. auth.middleware.js).
 * В req.body должна быть информация о рабочем полигоне: workPoligonType, workPoligonId, workSubPoligonId.
 *
 * @param {object} req - объект запроса
 * @param {object} res - объект ответа
 * @param {function} next - функция, при вызове которой активируется следующая функция промежуточной обработки
 *                          (управление передается следующему обработчику)
 */
module.exports = async (req, res, next) => {
  // Справка: HTTP-метод OPTIONS используется для описания параметров соединения с целевым ресурсом.
  //          Клиент может указать особый URL для обработки метода OPTIONS, или * (зведочку) чтобы
  //          указать весь сервер целиком.
  if (req.method === 'OPTIONS') {
    return next();
  }

  const { workPoligonType, workPoligonId, workSubPoligonId } = req.body;
  const userData = req.user;
  let hasRight = true;

  // Теперь проверяем возможность пользователя работать на желаемом рабочем полигоне, анализируя
  // информацию, извлеченную из его токена
  try {
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
      return res.status(UNAUTHORIZED).json({ message: NO_RIGHT_WORK_ON_WORK_POLIGON_ERR_MESS });
    }

    next();

  } catch (e) {
    console.log(e)
    res.status(UNAUTHORIZED).json({ message: UNAUTHORIZED_ERR_MESS });
  }
}
