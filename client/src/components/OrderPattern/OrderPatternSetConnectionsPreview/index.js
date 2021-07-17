import React, { useEffect, useState } from 'react';
import {
  OrderPatternElementType,
  GetOrderPatternElementTypeShortTitle
} from '../constants';
import { Popover } from 'antd';
import getOrderPatternElementView from '../getOrderPatternElementView';
import { ORDER_PATTERN_ELEMENT_FIELDS } from '../../../constants';


export const OrderPatternSetConnectionsPreview = (props) => {
  const {
    orderPattern,
    selectPatternElementCallback,
    basePattern = true,
    allowChoosePatternElement = false,
    nullSelectedElement = false,
  } = props;

  const [orderPatternArrays, setOrderPatternArrays] = useState([]);
  const [selectedPatternElement, setSelectedPatternElement] = useState(null);


  useEffect(() => {
    if (!orderPattern || !orderPattern.length) {
      setOrderPatternArrays([]);
      return;
    }

    const linebreakElementsIndexes = [];
    orderPattern.forEach((element, index) => {
      if (element[ORDER_PATTERN_ELEMENT_FIELDS.TYPE] === OrderPatternElementType.LINEBREAK) {
        linebreakElementsIndexes.push(index);
      }
    });
    linebreakElementsIndexes.push(orderPattern.length);

    let prevLinebreakIndex = 0;
    const orderPatternToDraw = [];
    linebreakElementsIndexes.forEach((element, index) => {
      const arrayPart = orderPattern.slice(prevLinebreakIndex, element);
      prevLinebreakIndex = element + 1;
      if (arrayPart) {
        if (arrayPart.length || index !== linebreakElementsIndexes.length - 1) {
          orderPatternToDraw.push(arrayPart);
        }
      }
    });
    setOrderPatternArrays(orderPatternToDraw);
  }, [orderPattern]);


  useEffect(() => {
    if (nullSelectedElement) {
      setSelectedPatternElement(null);
    }
  }, [nullSelectedElement]);


  const handleSelectPatternElement = (element) => {
    setSelectedPatternElement(element);
    selectPatternElementCallback(element);
  };


  return (
    <>
      {
        orderPatternArrays.map((array, index) => (
          <div key={index} className="order-pattern-text">
          {
            array.map((patternElement) => (
              patternElement[ORDER_PATTERN_ELEMENT_FIELDS.TYPE] === OrderPatternElementType.TEXT
              ?
              <span
                key={patternElement[ORDER_PATTERN_ELEMENT_FIELDS.KEY]}
                style={{ marginRight: 5, marginBottom: 5 }}
              >
                {getOrderPatternElementView(patternElement)}
              </span>
              :
              <Popover
                key={patternElement[ORDER_PATTERN_ELEMENT_FIELDS.KEY]}
                content={
                  <div>
                    <p>
                      { !allowChoosePatternElement ? 'Выбор элемента недоступен' :
                        <a href="#!" onClick={() => handleSelectPatternElement(patternElement)}
                        >
                          { basePattern ? 'Базовый элемент' : 'Дочерний элемент' }
                        </a>
                      }
                    </p>
                  </div>
                }
                trigger="click"
              >
                <div
                  style={{
                    width: 'auto',
                    marginRight: 5,
                    marginBottom: 2,
                  }}
                  className={
                    !selectedPatternElement ||
                    selectedPatternElement[ORDER_PATTERN_ELEMENT_FIELDS.KEY] !== patternElement[ORDER_PATTERN_ELEMENT_FIELDS.KEY] ?
                    'not-selected-order-pattern-element-block' :
                    'selected-order-pattern-element-block'}
                >
                  {getOrderPatternElementView(patternElement)}
                  <span style={{
                    position: 'absolute',
                    left: 2,
                    top: 0,
                  }}>
                    {GetOrderPatternElementTypeShortTitle(patternElement[ORDER_PATTERN_ELEMENT_FIELDS.TYPE])}
                  </span>
                </div>
              </Popover>
            ))
          }
          </div>
        ))
      }
    </>
  );
};
