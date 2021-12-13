import React, { useState, useEffect } from 'react';
import { Button, Select } from 'antd';
import compareStrings from '../../sorters/compareStrings';

import './styles.scss';


/**
 * Компонент двух выпадающих списков (второй зависит от первого, т.е. выбор во втором зависит от
 * выбора в первом) с возможностью осуществления множественного выбора в каждом
 * и кнопкой сохранения сделанных в списках изменений.
 * Выбранные пользователем значения (в каждом из списков) не отображаются в списках выбора.
 * Значения во вложенных списках должны быть уникальны в рамках всех внешних элементов!
 *
 * @param {object} props
 */
const SavableSelectTwoMultiples = (props) => {
  const {
    placeholder1,
    placeholder2,
    options, // массив объектов, у которых обязательное поле - value; именно массив из value и отображается
             // в списке выбора № 1 (за исключением selectedItems); еще одно поле - subOptions, которое
             // также представляет собой массив объектов с обязательным полем value
    selectedItems, // имеет такую же структуру, как и options, и предназначен для отображения выбранных значений
    saveChangesCallback,
  } = props;

  // Выбранные значения в списках 1 и 2
  const [selectedVals, setSelectedVals] = useState([]);

  useEffect(() => {
    if (!selectedItems || !selectedItems.length) {
      if (selectedVals.length) {
        setSelectedVals([]);
      }
    }
    setSelectedVals([...selectedItems]);
  }, [selectedItems]);

  /**
   * Если в первом списке значение появилось, необходимо обновить второй список путем добавления значений.
   * Если в первом списке значение пропало, необходимо обновить второй список путем удаления значений.
   */
  function handleChange1(newSelectedOptionsValue) {
    if (newSelectedOptionsValue.length > selectedVals.length) {
      // Ищем добавленное значение
      const newVal = newSelectedOptionsValue.find((el) => !selectedVals.find((val) => val.value === el));
      setSelectedVals((value) => [
        ...value,
        {
          value: newVal,
          subOptions: [],
        },
      ]);
    } else if (newSelectedOptionsValue.length < selectedVals.length) {
      // Ищем удаленное значение
      const delVal = selectedVals.find((el) => !newSelectedOptionsValue.includes(el.value));
      setSelectedVals((value) => value.filter((el) => el.value !== delVal.value));
    }
  }

  /**
   * Если во втором списке значение появилось либо пропало, необходимо обновить общий список.
   */
  function handleChange2(newSelectedSubOptionsValue) {
    // Запоминаем текущие выбранные значения во втором списке в привязке к значением в первом списке
    const selectedSubOptions = [];
    selectedVals.forEach((val) => {
      if (val.subOptions && val.subOptions.length) {
        selectedSubOptions.push(...val.subOptions.map((el) => ({ option: val.value, subOption: el.value })));
      }
    });
    if (newSelectedSubOptionsValue.length > selectedSubOptions.length) {
      // Ищем добавленное значение
      const newVal = newSelectedSubOptionsValue.find((el) => !selectedSubOptions.find((val) => val.subOption === el));
      // Ищем объекты, соответствующие выбранным в первом списке значениям
      const selectedOptionsObjects = options
        .filter((option) => selectedVals.find((val) => val.value === option.value));
      // Ищем объект первого списка, соответствующий выбранному элементу во втором списке
      const desiredOption = selectedOptionsObjects.find((option) => option.subOptions && option.subOptions.find((el) => el.value === newVal));
      // Обновляем состояние
      setSelectedVals((value) => value.map((val) => {
        if (val.value !== desiredOption.value) {
          return val;
        }
        return {
          ...val,
          subOptions: !val.subOptions ? [{ value: newVal }] : [...val.subOptions, { value: newVal }],
        };
      }));
    } else if (newSelectedSubOptionsValue.length < selectedSubOptions.length) {
      // Ищем удаленное значение
      const delVal = selectedSubOptions.find((el) => !newSelectedSubOptionsValue.includes(el.subOption));
      // Обновляем состояние
      setSelectedVals((value) => value.map((val) => {
        if (val.value !== delVal.option) {
          return val;
        }
        return {
          ...val,
          subOptions: val.subOptions.filter((el) => el.value !== delVal.subOption),
        };
      }));
    }
  }

  function handleSaveChanges() {
    saveChangesCallback(selectedVals);
  }

  const subItemsAreTheSame = () => {
    // Предполагается, что все внешние элементы selectedVals и selectedItems одинаковы.
    // Сравниваются лишь вложенные элементы.
    const selectedValsSubitems = [];
    selectedVals.forEach((val) => {
      if (!val.subOptions || !val.subOptions.length) {
        return;
      }
      selectedValsSubitems.push(...val.subOptions.map((item) => item.value));
    });
    const selectedItemsSubitems = [];
    selectedItems.forEach((val) => {
      if (!val.subOptions || !val.subOptions.length) {
        return;
      }
      selectedItemsSubitems.push(...val.subOptions.map((item) => item.value));
    });
    if (selectedValsSubitems.length !== selectedItemsSubitems.length) {
      return false;
    }
    if (selectedValsSubitems.find((val) => !selectedItemsSubitems.includes(val))) {
      return false;
    }
    return true;
  };

  const userMadeChanges =
    (selectedVals && !selectedItems) ||
    (!selectedVals && selectedItems) ||
    (selectedVals.length !== selectedItems.length) ||
    selectedVals.find((val) => !selectedItems.find((item) => item.value === val.value)) ||
    !subItemsAreTheSame();

  const getSelectedSecondListOptions = () => {
    const selectedSubOptions = [];
    selectedVals.forEach((val) => {
      if (!val.subOptions || !val.subOptions.length) {
        return;
      }
      selectedSubOptions.push(...val.subOptions.map((option) => option.value));
    });
    return selectedSubOptions;
  };


  return (
    <div>
      <div className="savable-select-container">
        <div className="select-block">
          <Select
            mode="multiple"
            size="default"
            placeholder={placeholder1}
            showArrow
            style={{ width: '100%' }}
            bordered={false}
            value={selectedVals.map((val) => val.value)}
            options={
              options
                // убираю из списка те пункты, которые выбрал пользователь
                .filter((option) => !selectedVals.find((val) => val.value === option.value))
                // убираю лишние данные (иначе будет React warning)
                .map((option) => ({ value: option.value }))
                // оставшиеся сортирую в алфавитном порядке
                .sort((a, b) => compareStrings(a.value.toLowerCase(), b.value.toLowerCase()))
            }
            onChange={handleChange1}
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

      { selectedVals && selectedVals.length > 0 &&
        <div className="savable-select-container">
          <div className="select-block">
            <Select
              mode="multiple"
              size="default"
              placeholder={placeholder2}
              showArrow
              style={{ width: '100%' }}
              bordered={false}
              value={getSelectedSecondListOptions()}
              options={
                options
                  .filter((option) => selectedVals.find((val) => val.value === option.value))
                  .filter((option) => option.subOptions && option.subOptions.length)
                  .map((option) => option.subOptions)
                  .flat(1)
                  // убираю из списка те пункты, которые выбрал пользователь
                  .filter((subOption) => !getSelectedSecondListOptions().includes(subOption.value))
              }
              onChange={handleChange2}
            />
          </div>
          <div className="btn-block"></div>
        </div>
      }
    </div>
  );
}


export default SavableSelectTwoMultiples;
