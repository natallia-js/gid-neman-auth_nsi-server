import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const Notes = () => {
  return (
    <>
      <Title level={3} id="help-notes">Примечание</Title>
      <p className="help-paragraph">
        Работа с таблицами системы "Администрирование аккаунтов и НСИ ГИД Неман" включает возможности
        сортировки и поиска по полям таблиц данных. Если в "шапке" столбца присутствует элемент двойной стрелки
        <span className="ant-table-column-sorter-inner" style={{textIndent:5}}>
          <span role="img" aria-label="caret-up" className="anticon anticon-caret-up ant-table-column-sorter-up">
            <svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-up" width="1em" height="1em" fill="currentColor" aria-hidden="true">
              <path d="M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z">
              </path>
            </svg>
          </span>
          <span role="img" aria-label="caret-down" className="anticon anticon-caret-down ant-table-column-sorter-down">
            <svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-down" width="1em" height="1em" fill="currentColor" aria-hidden="true">
              <path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z">
              </path>
            </svg>
          </span>
        </span>, то он позволяет отсортировать данные в соответствующем столбце в прямом и обратном порядке.
        Элемент
        <span role="img" aria-label="search" className="anticon anticon-search" style={{textIndent:5}}>
          <svg viewBox="64 64 896 896" focusable="false" data-icon="search" width="1em" height="1em" fill="currentColor" aria-hidden="true">
            <path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z">
            </path>
          </svg>
        </span>
        позволяет найти данные в таблице по частичному совпадению значений соответствующего столбца с введенным в поле поиска значением.
        Поиск ведется без учета регистра символов.
        Если к таблице была применена операция сортировки / поиска, то соответствующий элемент (значок) в "шапке" таблицы будет отображаться
        синим цветом до тех пор пока эта операция не будет отменена.
      </p>
    </>
  );
};

export default Notes;
