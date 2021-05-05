import React from 'react';
import { Modal, Button, Typography } from 'antd';
import SavableSelectMultiple from '../SavableSelectMultiple';
import { STATION_FIELDS } from '../../constants';

const { Text } = Typography;


/**
 * Компонент модального окна редактирования информации о станциях поездного участка (ДНЦ либо ЭЦД).
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   trainSectorName,
 *   allStations,
 *   selectedStations,
 *   handleOk,
 *   handleCancel,
 *   recsBeingProcessed, // количество запросов на редактирование списка станций, отправленных по данному участку на сервер
 */
const EditTrainSectorStationListModal = ({
  isModalVisible,
  trainSectorName,
  allStations,
  selectedStations,
  handleOk,
  handleCancel,
  recsBeingProcessed,
}) => {
  /**
   * Обработка события отмены ввода информации.
   */
  const onCancel = () => {
    handleCancel();
  };


  return (
    <Modal
      title="Определите станции поездного участка"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
      destroyOnClose={true}
    >
      <Text strong>{`Поездной участок ${trainSectorName}`}</Text>

      <SavableSelectMultiple
        placeholder="Выберите станции"
        options={
          (!allStations || !allStations.length) ?
          [] :
          allStations.map((station) => {
            return {
              value: station[STATION_FIELDS.NAME_AND_CODE],
            };
          })
        }
        selectedItems={
          (!selectedStations || !selectedStations.length) ?
          [] :
          selectedStations.map((station) => station[STATION_FIELDS.NAME_AND_CODE])
        }
        saveChangesCallback={(selectedVals) => handleOk(selectedVals)}
      />

      <div className="new-item-modal-btns-block">
        <Button htmlType="button" onClick={onCancel} className="new-item-modal-btn" type="primary">
          Отмена
        </Button>
      </div>

      { recsBeingProcessed > 0 && <Text type="warning">На сервер отправлено {recsBeingProcessed} запросов. Ожидаю ответ...</Text> }
    </Modal>
  );
};


export default EditTrainSectorStationListModal;
