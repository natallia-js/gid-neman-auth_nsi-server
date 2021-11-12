import { ECD_STRUCTURAL_DIVISION_FIELDS } from '../constants';

/**
 * Преобразует объект структурного подразделения ЭЦД, полученный из БД, в объект структурного
 * подразделения ЭЦД, с которым работает приложение.
 */
const getAppECDStructuralDivisionFromDBECDStructuralDivisionObj = (dbECDStructuralDivisionObj) => {
  if (dbECDStructuralDivisionObj) {
    return {
      [ECD_STRUCTURAL_DIVISION_FIELDS.KEY]: dbECDStructuralDivisionObj.ECDSD_ID,
      [ECD_STRUCTURAL_DIVISION_FIELDS.NAME]: dbECDStructuralDivisionObj.ECDSD_Title,
      [ECD_STRUCTURAL_DIVISION_FIELDS.POST]: dbECDStructuralDivisionObj.ECDSD_Post,
      [ECD_STRUCTURAL_DIVISION_FIELDS.FIO]: dbECDStructuralDivisionObj.ECDSD_FIO,
    };
  }
  return null;
};

export default getAppECDStructuralDivisionFromDBECDStructuralDivisionObj;
