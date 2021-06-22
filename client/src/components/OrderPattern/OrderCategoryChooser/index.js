import React, { useEffect, useState } from 'react';
import { Select, Radio, Space, Input } from 'antd';

export const OrderCategoryType = {
  EXISTING: 0,
  NEW: 1,
};

export const OrderCategoryChooser = ({
  orderCategoriesList = null,
  onChangeValue,
}) => {
  const [userChoice, setUserChoice] = useState(OrderCategoryType.EXISTING);
  const [selectValue, setSelectValue] = useState(null);
  const [inputValue, setInputValue] = useState(null);

  // при смене списка категорий распоряжений обнуляем выбор пользователя
  // в предыдущем списке категорий распоряжений
  useEffect(() => {
    setSelectValue(null);
    if (userChoice === OrderCategoryType.EXISTING) {
      onChangeValue(null);
    }
  // не менять список зависимостей!
  }, [orderCategoriesList]);

  // реакция на смену способа ввода категории распоряжения
  const onChangeUserChoice = (e) => {
    setUserChoice(e.target.value);
  };

  const onExistingOrderCategoryChange = (value) => {
    if (userChoice === OrderCategoryType.EXISTING) {
      setSelectValue(value);
      onChangeValue(value);
    }
  };

  const onNewOrderCategoryChange = (e) => {
    if (userChoice === OrderCategoryType.NEW) {
      setInputValue(e.target.value);
      onChangeValue(e.target.value);
    }
  };

  const onFocusSelect = () => {
    if (userChoice !== OrderCategoryType.EXISTING) {
      setUserChoice(OrderCategoryType.EXISTING);
    }
  };

  const onFocusInput = () => {
    if (userChoice !== OrderCategoryType.NEW) {
      setUserChoice(OrderCategoryType.NEW);
    }
  };

  return (
    <div>
      <Radio.Group onChange={onChangeUserChoice} value={userChoice} style={{ width: '100%' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Radio value={OrderCategoryType.EXISTING} style={{ width: '100%' }}>
            Выберите существующую категорию
          </Radio>
          <Select
            style={{ width: '100%' }}
            onChange={onExistingOrderCategoryChange}
            onFocus={onFocusSelect}
            options={
              !orderCategoriesList ? [] :
              Object.values(orderCategoriesList).map((category) => {
                return {
                  value: category,
                };
              })
            }
            value={selectValue}
          />
          <Radio value={OrderCategoryType.NEW} style={{ width: '100%' }}>
            Либо создайте новую
          </Radio>
          <Input
            style={{ width: '100%' }}
            onChange={onNewOrderCategoryChange}
            onFocus={onFocusInput}
            value={inputValue}
            allowClear
          />
        </Space>
      </Radio.Group>
    </div>
  );
};
