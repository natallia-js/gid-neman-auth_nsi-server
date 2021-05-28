import React, { useEffect } from 'react';
import { Form, Select } from 'antd';
import { PossibleElementSizes } from '../constants';

const chosedSizeSelectName = 'chosedSizeSelectName';


export const ElementSizeChooser = ({ chosenSize, handleChangeSizeCallback }) => {
  const [form] = Form.useForm();

  const handleChangeSize = (value) => {
    handleChangeSizeCallback(value);
  };

  useEffect(() => {
    form.setFieldsValue({ [chosedSizeSelectName]: chosenSize });
  }, [chosenSize, form]);

  return (
    <Form
      layout="horizontal"
      size='small'
      form={form}
      name="element-size-form"
    >
      <Form.Item
        label="Размер"
        name={chosedSizeSelectName}
      >
        <Select
          style={{ width: 120 }}
          options={
            Object.values(PossibleElementSizes).map((size) => {
              return {
                value: size,
              };
            })
          }
          onChange={handleChangeSize}
        />
      </Form.Item>
    </Form>
  );
};
