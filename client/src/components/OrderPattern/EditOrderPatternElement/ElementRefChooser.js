import React, { useEffect, useState } from 'react';
import { Form, Select } from 'antd';
import { ORDER_PATTERN_ELEMENT_REFS_FIELDS } from '../../../constants';

const chosenRefSelectName = 'chosenRefSelectName';


export const ElementRefChooser = (props) => {
  const { orderPatternElRefs, elementType, chosenRef, handleChangeRefCallback } = props;

  const [form] = Form.useForm();

  const handleChangeRef = (value) => {
    handleChangeRefCallback(value);
  };

  const [currentElementPossibleRefs, setCurrentElementPossibleRefs] = useState(null);

  useEffect(() => {
    if (!orderPatternElRefs || !orderPatternElRefs.length) {
      setCurrentElementPossibleRefs(null);
      return;
    }
    const elRefs = orderPatternElRefs.find((ref) => ref[ORDER_PATTERN_ELEMENT_REFS_FIELDS.ELEMENT_TYPE] === elementType);
    if (!elRefs) {
      setCurrentElementPossibleRefs(null);
      return;
    }
    setCurrentElementPossibleRefs(elRefs[ORDER_PATTERN_ELEMENT_REFS_FIELDS.REFS]);
  }, [orderPatternElRefs, elementType]);

  useEffect(() => {
    form.setFieldsValue({ [chosenRefSelectName]: chosenRef });
  }, [chosenRef, form]);

  return (
    <Form
      layout="horizontal"
      size='small'
      form={form}
      name="element-ref-form"
    >
      <Form.Item
        label="Смысловое значение"
        name={chosenRefSelectName}
      >
        <Select
          style={{ width: '100%' }}
          options={(currentElementPossibleRefs || []).map((ref) => {
            return {
              value: ref,
            };
          })}
          onChange={handleChangeRef}
        />
      </Form.Item>
    </Form>
  );
};
