import React from 'react';
import { Modal, Button, Typography } from 'antd';
import SavableSelectMultiple from '../SavableSelectMultiple';
import { BLOCK_FIELDS } from '../../constants';

const { Text } = Typography;


/**
 * Компонент модального окна редактирования информации о перегонах поездного участка (ДНЦ либо ЭЦД).
 *
 * @param {object} params - свойства компонента:
 *   isModalVisible,
 *   trainSectorName,
 *   allBlocks,
 *   selectedBlocks,
 *   handleOk,
 *   handleCancel,
 *   recsBeingProcessed, // количество запросов на редактирование списка перегонов, отправленных по данному участку на сервер
 */
const EditTrainSectorBlockListModal = ({
  isModalVisible,
  trainSectorName,
  allBlocks,
  selectedBlocks,
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
      title="Определите перегоны поездного участка"
      visible={isModalVisible}
      footer={null}
      onCancel={onCancel}
      destroyOnClose={true}
      width={600}
    >
      <Text strong>{`Поездной участок ${trainSectorName}`}</Text>

      <SavableSelectMultiple
        placeholder="Выберите перегоны"
        options={
          (!allBlocks || !allBlocks.length) ?
          [] :
          allBlocks.map((block) => {
            return {
              value: block[BLOCK_FIELDS.NAME],
            };
          })
        }
        selectedItems={
          (!selectedBlocks || !selectedBlocks.length) ?
          [] :
          selectedBlocks.map((block) => block[BLOCK_FIELDS.NAME])
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


export default EditTrainSectorBlockListModal;
