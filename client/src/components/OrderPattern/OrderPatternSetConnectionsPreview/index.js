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
    elementIdsToGetNotation = null,
    getElementNotationsByIdsCallback,
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


  const handleSelectPatternElement = (element, notation) => {
    setSelectedPatternElement(element);
    selectPatternElementCallback(element, notation);
  };


  const getPatternElementNotation = (patternElement, arrayIndex, elementIndex) => {
    return `${arrayIndex}${elementIndex} - \
      ${GetOrderPatternElementTypeShortTitle(patternElement[ORDER_PATTERN_ELEMENT_FIELDS.TYPE])}`;
  };


  const getPatternElementNotationById = (elementId) => {
    let foundElement;
    let arrayIndex;
    let elementIndex;
    orderPatternArrays.forEach((array, index) => {
      array.forEach((patternElement, elIndex) => {
        if (patternElement[ORDER_PATTERN_ELEMENT_FIELDS.KEY] === elementId) {
          foundElement = patternElement;
          arrayIndex = index;
          elementIndex = elIndex;
          return;
        }
      });
      if (foundElement) {
        return;
      }
    });
    if (foundElement) {
      return getPatternElementNotation(foundElement, arrayIndex, elementIndex);
    }
    return null;
  };


  useEffect(() => {
    if (!elementIdsToGetNotation || !elementIdsToGetNotation.length) {
      return;
    }
    getElementNotationsByIdsCallback(elementIdsToGetNotation.map((id) => {
      return {
        id,
        notation: getPatternElementNotationById(id),
      };
    }));
  }, [elementIdsToGetNotation]);


  return (
    <>
      {
        orderPatternArrays.map((array, index) => (
          <div key={index} className="order-pattern-text">
          {
            array.map((patternElement, elementIndex) => (
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
                        <a
                          href="#!"
                          onClick={() =>
                            handleSelectPatternElement(patternElement, getPatternElementNotation(patternElement, index, elementIndex))
                          }
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
                    {getPatternElementNotation(patternElement, index, elementIndex)}
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
