import React, { useState, useEffect } from 'react';
import { Button, Select } from 'antd';
import compareStrings from '../../sorters/compareStrings';

import './styles.scss';


/**
 * Компонент выпадающего списка с возможностью осуществления множественного выбора
 * и кнопкой сохранения сделанных в списке изменений.
 * Выбранные пользователем значения не отображаются в списке выбора.
 *
 * @param {object} props
 */
const SavableSelectMultiple = (props) => {
  const {
    placeholder,
    options, // массив объектов, у которых обязательное поле - value; именно массив из value и отображается
             // в списке выбора (за исключением selectedItems)
    selectedItems, // строки из options.value, которые должны отображаться как выбранные
    saveChangesCallback,
  } = props;

  const [selectedVals, setSelectedVals] = useState([]);

  useEffect(() => {
    setSelectedVals(selectedItems);
  }, [selectedItems]);

  function handleChange(value) {
    setSelectedVals(value);
  }

  function handleSaveChanges() {
    saveChangesCallback(selectedVals);
  }

  const userMadeChanges =
    (selectedVals && !selectedItems) ||
    (!selectedVals && selectedItems) ||
    (selectedVals.length !== selectedItems.length) ||
    selectedVals.find((val) => !selectedItems.includes(val));

  return (
    <div className="savable-select-container">
      <div className="select-block">
        <Select
          mode="multiple"
          size="default"
          placeholder={placeholder}
          showArrow
          style={{ width: '100%' }}
          bordered={false}
          value={selectedVals}
          options={
            options
              // убираю из списка те пункты, которые выбрал пользователь
              .filter((option) => !selectedVals.includes(option.value))
              // оставшиеся сортирую в алфавитном порядке
              .sort((a, b) => compareStrings(a.value.toLowerCase(), b.value.toLowerCase()))
          }
          onChange={handleChange}
        />
      </div>
      <div className="btn-block">
        <Button
          className={`save-user-select-btn ${userMadeChanges ? 'user-made-changes-btn' : ''}`}
          type="primary"
          style={{
            marginBottom: 16,
          }}
          disabled={!userMadeChanges}
          onClick={handleSaveChanges}
        >
          Сохранить изменения
        </Button>
      </div>
    </div>
  );
}


export default SavableSelectMultiple;
