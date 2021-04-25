import React from 'react';
import { Spin } from 'antd';

import './styles.scss';

export const Loader = () => (
  <div className="loader-block">
    <Spin />
  </div>
);
