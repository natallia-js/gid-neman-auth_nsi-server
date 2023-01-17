import { ECD_STRUCTURAL_DIVISION_FIELDS } from '../constants';

/**
 * Преобразует объект структурного подразделения ЭЦД, полученный из БД, в объект структурного
 * подразделения ЭЦД, с которым работает приложение.
 */
const getAppECDStructuralDivisionFromDBECDStructuralDivisionObj = (dbECDStructuralDivisionObj) => {
  if (dbECDStructuralDivisionObj) {
    return {
      // приходит типа number
      [ECD_STRUCTURAL_DIVISION_FIELDS.KEY]: dbECDStructuralDivisionObj.ECDSD_ID,
      // приходит типа string
      [ECD_STRUCTURAL_DIVISION_FIELDS.NAME]: dbECDStructuralDivisionObj.ECDSD_Title,
      // приходит типа string
      [ECD_STRUCTURAL_DIVISION_FIELDS.POST]: dbECDStructuralDivisionObj.ECDSD_Post,
      // приходит типа string
      [ECD_STRUCTURAL_DIVISION_FIELDS.FIO]: dbECDStructuralDivisionObj.ECDSD_FIO,
      // приходит типа number
      [ECD_STRUCTURAL_DIVISION_FIELDS.POSITION]: dbECDStructuralDivisionObj.ECDSD_Position,
    };
  }
  return null;
};

export default getAppECDStructuralDivisionFromDBECDStructuralDivisionObj;
