import React, { useEffect, useState } from 'react';
import { Typography, Popover, Row, Col, Space } from 'antd';
import { EditOrderPatternElement } from '../EditOrderPatternElement';
import { OrderPatternElementType } from '../constants';
import getOrderPatternElementView from '../getOrderPatternElementView';
import { ORDER_PATTERN_ELEMENT_FIELDS } from '../../../constants';

const { Title, Text } = Typography;


const Cursor = () => (
  <Col style={{ width: 'auto', margin: '0 10px 10px 0' }}>
    <div className="current-order-pattern-pos-block blink" />
  </Col>
);


export const EditOrderPattern = (props) => {
  const {
    orderPattern,
    insertOrderElementPos,
    orderPatternElRefs,
    setCursorBeforeElementCallback,
    setCursorAfterElementCallback,
    delPatternElementCallback,
    editPatternElementCallback,
    onNewOrderPatternElRef,
    onDelOrderPatternElRef,
  } = props;
  const [orderPatternArrays, setOrderPatternArrays] = useState([]);
  const [editedPatternElementId, setEditedPatternElementId] = useState(null);

  useEffect(() => {
    if (!orderPattern || !orderPattern.length) {
      setEditedPatternElementId(null);
      setOrderPatternArrays([]);
      return;
    }

    if (!orderPattern.find((el) => el[ORDER_PATTERN_ELEMENT_FIELDS.KEY] === editedPatternElementId)) {
      setEditedPatternElementId(null);
    }

    const linebreakElementsIndexes = [];
    const orderPatternForWork = [];
    orderPattern.forEach((element, index) => {
      if (element[ORDER_PATTERN_ELEMENT_FIELDS.TYPE] === OrderPatternElementType.LINEBREAK) {
        linebreakElementsIndexes.push(index);
      }
      orderPatternForWork.push({
        ...element,
        index,
      });
    });
    linebreakElementsIndexes.push(orderPattern.length);

    let prevLinebreakIndex = 0;
    const orderPatternToDraw = [];
    linebreakElementsIndexes.forEach((element) => {
      const arrayPart = orderPatternForWork.slice(prevLinebreakIndex, element + 1);
      prevLinebreakIndex = element + 1;
      if (arrayPart && arrayPart.length) {
        orderPatternToDraw.push(arrayPart);
      }
    });
    setOrderPatternArrays(orderPatternToDraw);
  }, [editedPatternElementId, orderPattern]);


  return (
    <>
      <Title level={4} className="center">Редактирование шаблона</Title>
      {
        orderPatternArrays.map((array, arraysIndex) => (
          <Row key={arraysIndex}>
          {
            array.map((patternElement, arrIndex) => (
              <React.Fragment key={patternElement[ORDER_PATTERN_ELEMENT_FIELDS.KEY]}>
                {
                  ((arraysIndex === 0 && arrIndex === 0 && insertOrderElementPos === -1) ||
                  (arrIndex === 0 && patternElement.index === insertOrderElementPos)) &&
                  <Cursor />
                }
                <Col
                  className={
                    patternElement[ORDER_PATTERN_ELEMENT_FIELDS.KEY] !== editedPatternElementId ?
                    'not-edited-order-pattern-element-block' :
                    'edited-order-pattern-element-block'
                  }
                  style={{
                    width: patternElement[ORDER_PATTERN_ELEMENT_FIELDS.TYPE] !== OrderPatternElementType.TEXT_AREA ? 'auto' : '100%',
                    margin: '0 10px 10px 0',
                  }}
                >
                  {
                    <Popover
                      placement="top"
                      content={
                        <div>
                          <p>
                            <a href="#!" onClick={() =>
                              patternElement[ORDER_PATTERN_ELEMENT_FIELDS.KEY] !== editedPatternElementId ?
                              setEditedPatternElementId(patternElement[ORDER_PATTERN_ELEMENT_FIELDS.KEY]) :
                              setEditedPatternElementId(null)}
                            >
                              {
                                patternElement[ORDER_PATTERN_ELEMENT_FIELDS.KEY] !== editedPatternElementId ?
                                'Редактировать' : 'Завершить редактирование'
                              }
                            </a>
                          </p>
                          <p>
                            <a href="#!" onClick={() => delPatternElementCallback(patternElement[ORDER_PATTERN_ELEMENT_FIELDS.KEY])}>
                              Удалить
                            </a>
                          </p>
                          <p>
                            <a href="#!" onClick={() => setCursorBeforeElementCallback(patternElement[ORDER_PATTERN_ELEMENT_FIELDS.KEY])}>
                              Вставить элемент перед
                            </a>
                          </p>
                          <p>
                            <a href="#!" onClick={() => setCursorAfterElementCallback(patternElement[ORDER_PATTERN_ELEMENT_FIELDS.KEY])}>
                              Вставить элемент после
                            </a>
                          </p>
                        </div>
                      }
                      trigger="click"
                    >
                      <Row>
                        <Col
                          style={{
                            width: patternElement[ORDER_PATTERN_ELEMENT_FIELDS.TYPE] !== OrderPatternElementType.TEXT_AREA ? 'auto' : '100%',
                          }}
                        >
                          {getOrderPatternElementView(patternElement)}
                        </Col>
                      </Row>
                    </Popover>
                  }
                </Col>
                {
                  (arrIndex !== array.length - 1 || arraysIndex === orderPatternArrays.length - 1) &&
                  (patternElement.index === insertOrderElementPos - 1) &&
                  <Cursor />
                }
              </React.Fragment>
            ))
          }
          </Row>
        ))
      }
      {
        editedPatternElementId &&
        <div className="order-pattern-border order-pattern-block" style={{ backgroundColor: 'var(--edit-order-pattern-element-block-color)' }}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Text strong>Редактирование элемента шаблона</Text>
            <EditOrderPatternElement
              element={orderPattern.find((el) => el[ORDER_PATTERN_ELEMENT_FIELDS.KEY] === editedPatternElementId)}
              orderPatternElRefs={orderPatternElRefs}
              submitOrderPatternElementCallback={
                (editedPatternElement) => editPatternElementCallback(editedPatternElementId, editedPatternElement)
              }
              okButtonText="Применить редактирование"
              onNewOrderPatternElRef={onNewOrderPatternElRef}
              onDelOrderPatternElRef={onDelOrderPatternElRef}
            />
          </Space>
        </div>
      }
    </>
  );
};
