import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Radio, Row, Col, Input, Select, Button, DatePicker, TimePicker, Space } from 'antd';
import {
  DateFormat,
  TimeFormat,
  DateTimeFormat,
  OrderPatternElementType,
  PossibleElementSizes,
  ElementSizesCorrespondence,
} from '../constants';
import { ElementSizeChooser } from '../EditOrderPatternElement/ElementSizeChooser';
import { EnterOutlined } from '@ant-design/icons';

/**
 * Позволяет создать новый либо отредактировать существующий элемент шаблона распоряжения.
 *
 * @param {object} props - объект со свойствами:
 *   element - null (если необходимо создать новый элемент шаблона) либо объект
 * со свойствами type, width, ref, value;
 *   submitOrderPatternElementCallback - callback-функция для передачи созданного / отредактированного
 * элемента шаблона "наверх"
 */
export const EditOrderPatternElement = (props) => {
  const {
    element = null,
    submitOrderPatternElementCallback,
    okButtonText,
  } = props;
  // Исходный массив объектов допустимых элементов шаблона распоряжения. Все элементы, за исключением элемента такого
  // же типа, как у element (если он задан), принимают значения по умолчанию. Элемент же типа element
  // инициализируется значениями, взятыми у element
  const initialPatternElements = useMemo(() => {
    return Object.values(OrderPatternElementType).map((elType) => {
      let elementSize = null;
      if (element && element.size) {
        elementSize = element.size;
      } else if (elType === OrderPatternElementType.INPUT || elType === OrderPatternElementType.SELECT) {
        elementSize = PossibleElementSizes.SMALL;
      } else {
        elementSize = PossibleElementSizes.AUTO;
      }
      return {
        type: elType,
        size: elementSize,
        ref: element && element.ref ? element.ref : null,
        value: element && element.value ? element.value : null,
      };
    });
  }, [element]);

  // Массив объектов допустимых элементов шаблона распоряжения
  const [availablePatternElements, setAvailablePatternElements] = useState(initialPatternElements);

  const getSelectedPatternElement = useCallback(() => {
    if (!element || !element.type || !Object.values(OrderPatternElementType).includes(element.type)) {
      return initialPatternElements[0];
    } else {
      return initialPatternElements.find(el => el.type === element.type);
    }
  }, [element, initialPatternElements]);

  // Элемент шаблона, с которым работает пользователь (если element не задан, то выбирается первый допустимый элемент)
  const [selectedPatternElement, setSelectedPatternElement] = useState(getSelectedPatternElement());

  useEffect(() => {
    setSelectedPatternElement(getSelectedPatternElement());
  }, [element, getSelectedPatternElement]);


  /**
   * Реакция на изменение типа элемента шаблона: меняем выбранный элемент шаблона, запоминая
   * перед этим состояние текущего элемента шаблона.
   */
  const handleSelectPatternElementType = (e) => {
    setAvailablePatternElements((elements) => elements.map((el) => {
      if (el.type !== selectedPatternElement.type) {
        return el;
      }
      return {
        ...selectedPatternElement,
      };
    }));
    setSelectedPatternElement(availablePatternElements.find(el => el.type === e.target.value));
  };


  /**
   * Обрабатываем событие подтверждения окончания редактирования текущего элемента шаблона
   * (передаем данный элемент "наверх").
   */
  const handleSubmitOrderPatternElement = () => {
    if ((selectedPatternElement.type === OrderPatternElementType.TEXT) &&
        (!selectedPatternElement.value || selectedPatternElement.value.trim() === '')) {
      return;
    }
    if (selectedPatternElement.type !== OrderPatternElementType.TEXT) {
      selectedPatternElement.value = null;
    }
    submitOrderPatternElementCallback(selectedPatternElement);
  };


  /**
   * Обрабатываем событие смены значения элемента шаблона.
   */
  const changePatternElementValue = (e) => {
    setSelectedPatternElement((el) => {
      return {
        ...el,
        value: e.target.value,
      };
    });
  };


  /**
   * Обрабатываем событие смены размера элемента шаблона.
   */
  const changePatternElementSize = (newSize) => {
    setSelectedPatternElement((el) => {
      return {
        ...el,
        size: newSize,
      };
    });
  };


  /**
   * Возвращает внешний вид текущего (выбранного) элемента шаблона.
   */
  const getSelectedPatternElementView = () => {
    switch (selectedPatternElement.type) {
      case OrderPatternElementType.TEXT:
        return <Input
          style={{ width: '100%' }}
          value={selectedPatternElement.value}
          onChange={changePatternElementValue}
          size="small"
        />;
      case OrderPatternElementType.INPUT:
        return <Input
          style={{ width: ElementSizesCorrespondence[selectedPatternElement.size] }}
          size="small"
        />;
      case OrderPatternElementType.SELECT:
        return <Select
          open={false}
          style={{ width: ElementSizesCorrespondence[selectedPatternElement.size] }}
          size="small"
        />;
      case OrderPatternElementType.DATE:
        return <DatePicker format={DateFormat} size="small" />;
      case OrderPatternElementType.TIME:
        return <TimePicker format={TimeFormat} size="small" />;
      case OrderPatternElementType.DATETIME:
        return <DatePicker showTime format={DateTimeFormat} size="small" />;
      case OrderPatternElementType.LINEBREAK:
        return <EnterOutlined />;
      default:
        return null;
    }
  };


  return (
    <div>
      <Space direction="vertical" size={12}>
        {/* Типы элементов шаблона */}
        <Row>
          <Col>
            <Radio.Group
              onChange={handleSelectPatternElementType}
              value={selectedPatternElement.type}
            >
              <Radio.Button value={OrderPatternElementType.TEXT}>
                Текст
              </Radio.Button>
              <Radio.Button value={OrderPatternElementType.INPUT}>
                Поле ввода
              </Radio.Button>
              <Radio.Button value={OrderPatternElementType.SELECT}>
                Выпадающий список
              </Radio.Button>
              <Radio.Button value={OrderPatternElementType.DATE}>
                Дата
              </Radio.Button>
              <Radio.Button value={OrderPatternElementType.TIME}>
                Время
              </Radio.Button>
              <Radio.Button value={OrderPatternElementType.DATETIME}>
                Дата-время
              </Radio.Button>
              <Radio.Button value={OrderPatternElementType.LINEBREAK}>
                Перенос строки
              </Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
        {/* Вид выбранного элемента шаблона */}
        <div>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {selectedPatternElement.type === OrderPatternElementType.TEXT ?
              <span>Введите текст:</span> :
              <span>Образец:</span>}
              {getSelectedPatternElementView()}
            </Space>
        </div>
        {/* Свойства выбранного элемента шаблона */}
        {
          (selectedPatternElement.type === OrderPatternElementType.INPUT ||
           selectedPatternElement.type === OrderPatternElementType.SELECT) &&
          <Row>
            <Col>
              <ElementSizeChooser
                chosenSize={selectedPatternElement.size}
                handleChangeSizeCallback={(value) => changePatternElementSize(value)}
              />
            </Col>
          </Row>
        }
        <Row>
          <Col>
            <Button
              type="primary"
              size="small"
              style={{
                marginBottom: 16,
              }}
              onClick={handleSubmitOrderPatternElement}
            >
              {okButtonText}
            </Button>
          </Col>
        </Row>
      </Space>
    </div>
  );
};
