import React, { useState } from 'react';
import { Button, Select } from 'antd';

import './styles.scss';


/**
 * Компонент выпадающего списка с возможностью осуществления множественного выбора.
 *
 * @param {object} props
 */
const SelectMultiple = (props) => {
  const {
    placeholder,
    options,
    selectedItems,
    saveChangesCallback,
  } = props;

  const [selectedVals, setSelectedVals] = useState(selectedItems);

  function handleChange(value) {
    setSelectedVals(value);
  }

  function handleSaveChanges() {
    saveChangesCallback(selectedVals);
  }

  function userMadeChanges() {
    if ((selectedVals && !selectedItems) || (!selectedVals && selectedItems) ||
      (selectedVals.length !== selectedItems.length)) {
      return true;
    }
    const elem = selectedVals.find((val) => !selectedItems.includes(val));
    if (elem) {
      return true;
    }
    return false;
  }

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
              .sort((a, b) => {
                if (a < b) {
                  return -1;
                } else if (a > b) {
                  return 1;
                }
                return 0;
              })
          }
          onChange={handleChange}
        />
      </div>
      <div className="btn-block">
        <Button
          className={`save-user-select-btn ${userMadeChanges() ? 'user-made-changes-btn' : ''}`}
          type="primary"
          style={{
            marginBottom: 16,
          }}
          disabled={!userMadeChanges()}
          onClick={handleSaveChanges}
        >
          Сохранить изменения
        </Button>
      </div>
    </div>
  );
}


export default SelectMultiple;
