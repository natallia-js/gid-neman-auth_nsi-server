import React, { useEffect } from 'react';
import M from 'materialize-css';


/**
 * Кнопка, по нажатию на которую всплывает модальное окно.
 *
 * @param {object} props - объект со свойствами:
 *        id,
 *        modalBtnClassNames,
 *        cancelBtnClassNames,
 *        confirmBtnClassNames,
 *        modalBtnText,
 *        windowHeader,
 *        windowText,
 *        cancelBtnText,
 *        confirmBtnText,
 *        confirmCallback
 */
export const ModalBtn = (props) => {
  const { id,
          modalBtnClassNames,
          cancelBtnClassNames,
          confirmBtnClassNames,
          modalBtnText,
          windowHeader,
          windowText,
          cancelBtnText,
          confirmBtnText,
          confirmCallback } = props;

  const confirmBtnRef = React.createRef();


  useEffect(() => {
    const options = {
      inDuration: 250,    // скорость появления модального окна
      outDuration: 250,   // скорость исчезновения модального окна
      opacity: 0.5,
      //dismissible: false, // не дает модальному окну закрыться при нажатии на область экрана за пределами окна
      startingTop: "4%",
      endingTop: "10%"
    };

    // Инициализация модального окна
    const elem = document.getElementById(id);
    M.Modal.init(elem, options);

    confirmBtnRef.current.focus();

  }, [confirmBtnRef, id]);


  return (
    <React.Fragment key={`MBFragm_${id}`}>
      {/*-- Modal Trigger --*/}
      <a
        className={`${modalBtnClassNames} modal-trigger`}
        href={`#${id}`}>
        {modalBtnText}
      </a>

      {/*!-- Modal Structure --*/}
      <div id={id} className="modal">
        <div className="modal-content">
          <h4>{windowHeader}</h4>
          <p>{windowText}</p>
        </div>
        <div className="modal-footer">
          <a href="#!"
             className={`${cancelBtnClassNames} modal-close`}
             ref={confirmBtnRef}
          >
            {cancelBtnText}
          </a>
          <a href="#!"
             className={`${confirmBtnClassNames} modal-close`}
             onClick={confirmCallback}
          >
            {confirmBtnText}
          </a>
        </div>
      </div>
    </React.Fragment>
  );
}
