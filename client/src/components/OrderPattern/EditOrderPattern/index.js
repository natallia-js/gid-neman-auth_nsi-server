import React, { useEffect, useState } from 'react';
import { Typography, Popover, Row, Col, Space } from 'antd';
import { EditOrderPatternElement } from '../EditOrderPatternElement';
import { OrderPatternElementType } from '../constants';

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
    setCursorBeforeElementCallback,
    setCursorAfterElementCallback,
    delPatternElementCallback,
    editPatternElementCallback,
  } = props;
  const [orderPatternArrays, setOrderPatternArrays] = useState([]);
  const [editedPatternElementId, setEditedPatternElementId] = useState(null);

  useEffect(() => {
    if (!orderPattern || !orderPattern.length) {
      setEditedPatternElementId(null);
      setOrderPatternArrays([]);
      return;
    }

    if (!orderPattern.find((el) => el.id === editedPatternElementId)) {
      setEditedPatternElementId(null);
    }

    const linebreakElementsIndexes = [];
    const orderPatternForWork = [];
    orderPattern.forEach((element, index) => {
      if (element.type === OrderPatternElementType.LINEBREAK) {
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
            // arraysIndex === 0 && insertOrderElementPos === - 1 && <Cursor />
          }
          {
            array.map((patternElement, arrIndex) => (
              <React.Fragment key={patternElement.id}>
                {
                  ((arraysIndex === 0 && arrIndex === 0 && insertOrderElementPos === -1) ||
                  (arrIndex === 0 && patternElement.index === insertOrderElementPos)) &&
                  <Cursor />
                }
                <Col
                  className={
                    patternElement.id !== editedPatternElementId ?
                    'not-edited-order-pattern-element-block' :
                    'edited-order-pattern-element-block'
                  }
                  style={{ width: 'auto', margin: '0 10px 10px 0' }}
                >
                  {
                    <Popover
                      content={
                        <div>
                          <p>
                            <a href="#!" onClick={() =>
                              patternElement.id !== editedPatternElementId ?
                              setEditedPatternElementId(patternElement.id) :
                              setEditedPatternElementId(null)}
                            >
                              {patternElement.id !== editedPatternElementId ? 'Редактировать' : 'Отменить редактирование'}
                            </a>
                          </p>
                          <p><a href="#!" onClick={() => delPatternElementCallback(patternElement.id)}>Удалить</a></p>
                          <p><a href="#!" onClick={() => setCursorBeforeElementCallback(patternElement.id)}>Вставить элемент перед</a></p>
                          <p><a href="#!" onClick={() => setCursorAfterElementCallback(patternElement.id)}>Вставить элемент после</a></p>
                        </div>
                      }
                      trigger="click"
                    >
                      <Row>
                        <Col>
                          {patternElement.element}
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
        <div className="order-pattern-border order-pattern-block">
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Text>Редактирование элемента шаблона</Text>
            <EditOrderPatternElement
              element={orderPattern.find((el) => el.id === editedPatternElementId)}
              submitOrderPatternElementCallback={
                (editedPatternElement) => editPatternElementCallback(editedPatternElementId, editedPatternElement)
              }
              okButtonText="Применить редактирование"
            />
          </Space>
        </div>
      }
    </>
  );
};
