import React, { useEffect, useState } from 'react';
import { Typography } from 'antd';
import { OrderPatternElementType, ElementSizesCorrespondence } from '../constants';
import getOrderPatternElementView from '../getOrderPatternElementView';
import { ORDER_PATTERN_ELEMENT_FIELDS } from '../../../constants';

const { Title } = Typography;


export const OrderPatternPreview = ({ orderPattern }) => {
  const [orderPatternArrays, setOrderPatternArrays] = useState([]);

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

  return (
    <>
      <Title level={4} className="center">Предварительный просмотр</Title>
      {
        orderPatternArrays.map((array, index) => (
          <div key={index} style={{ minHeight: '1.5rem' }}>
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
              <div
                key={patternElement[ORDER_PATTERN_ELEMENT_FIELDS.KEY]}
                style={{
                  width: ElementSizesCorrespondence[patternElement[ORDER_PATTERN_ELEMENT_FIELDS.SIZE]],
                  marginRight: 5,
                  marginBottom: 2,
                  display: 'inline-block',
                }}
              >
                {getOrderPatternElementView(patternElement)}
              </div>
            ))
          }
          </div>
        ))
      }
    </>
  );
};
