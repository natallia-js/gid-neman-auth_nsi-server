import React from 'react';

import './HelpPage.css';

/**
 * Возвращает компонент, представляющий собой страницу руководства пользователя.
 */
export const HelpPage = () => {
  return (
    <div className="HelpBlock">
      <h4 className="HelpTitle">Руководство пользователя</h4>
      <h5>Chapter1</h5>
      <p className="flow-text helpData">I am Flow Text I am Flow Text I am Flow Text I am Flow Text I am Flow Text
      I am Flow Text I am Flow Text I am Flow Text I am Flow Text I am Flow Text I am Flow Text I am Flow Text
      </p>
      <h5>Chapter2</h5>
      <p className="flow-text helpData">I am Flow Text</p>
      <h5>Chapter3</h5>
      <p className="flow-text helpData">I am Flow Text</p>
      <h5>Chapter4</h5>
      <p className="flow-text helpData">I am Flow Text</p>
      <h5>Chapter5</h5>
      <p className="flow-text helpData">I am Flow Text</p>
    </div>
  )
}
