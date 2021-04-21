import React, { useEffect, useState, useCallback, useContext } from 'react';
import { ModalBtn } from '../components/ModalBtn/ModalBtn';
import { useHttp } from '../hooks/http.hook';
import { useMessage } from '../hooks/message.hook';
import { AuthContext } from '../context/AuthContext';
import { Loader } from '../components/Loader/Loader';
import { ServerAPI } from '../constants';
import M from 'materialize-css';

import './AppsPage.css';

// Идентификаторы элементов и подэлементов в таблице должны быть уникальны в рамках
// всей таблицы!


/**
 * Возвращает компонент, представляющий собой страницу работы с приложениями.
 */
export const AppsPage = () => {
  // Вся информация, которая должна быть отображена в таблице, включая
  // вложенную таблицу
  const [tData, setTData] = useState(null);

  // Ошибка загрузки данных
  const [loadDataErr, setLoadDataErr] = useState(null);

  // Флаг загрузки информации
  const [dataLoaded, setDataLoaded] = useState(true);

  // Пользовательский хук для получения информации от сервера
  const { request } = useHttp();

  // Получаем доступ к контекстным данным авторизации пользователя
  const auth = useContext(AuthContext);

  // Для вывода всплывающих сообщений
  const message = useMessage();

  // Для установки режима редактирования строки в основной таблице
  // (строки с информацией о приложении)
  const [inEditMode, setInEditMode] = useState({
    status: false,
    rowKey: null
  });

  // Для установки режима редактирования строки во вложенной таблице
  // (строки с информацией о полномочиях пользователей в конкретном приложении)
  const [subTblInEditMode, setSubTblInEditMode] = useState({
    status: false,
    parentId: null,
    rowKey: null
  });

  // Исходная информация, которая находилась в выделенной строке в таблице приложений
  // (до редактирования)
  const [initialSelectedRowData, setInitialSelectedRowData] = useState(null);
  // Информация, которая относится к выделенной строке в таблице приложений
  const [selectedRowData, setSelectedRowData] = useState(null);

  // Исходная информация, которая находилась в выделенной строке в таблице полномочий
  // (до редактирования)
  const [initialSelectedSubRowData, setInitialSelectedSubRowData] = useState(null);
  // Информация, которая относится к выделенной строке в таблице полномочий
  // пользователей (вложенная таблица в таблицу приложений)
  const [selectedSubRowData, setSelectedSubRowData] = useState(null);

  // Информация о новом приложении (добавляемом)
  const [newAppForm, setNewAppForm] = useState({
    shortTitle: '',
    title: '',
    credentials: []
  });

  // Id приложения (для случая добавления записи в таблицу полномочий)
  const [activeAppId, setActiveAppId] = useState(null);

  // Ошибки добавления информации о новом приложении
  const [newShortTitleErr, setNewShortTitleErr] = useState(null);
  const [newTitleErr, setNewTitleErr] = useState(null);

  // Ошибки редактирования информации о приложении
  const [editShortTitleErr, setEditShortTitleErr] = useState(null);
  const [editTitleErr, setEditTitleErr] = useState(null);

  // Ошибки добавления информации о новом полномочии
  const [newEnglAbbreviationErr, setNewEnglAbbreviationErr] = useState(null);
  const [newDescriptionErr, setNewDescriptionErr] = useState(null);

  // Ошибки редактирования информации о полномочии
  const [editEnglAbbreviationErr, setEditEnglAbbreviationErr] = useState(null);
  const [editDescriptionErr, setEditDescriptionErr] = useState(null);


  /**
   * Для того чтобы input'ы стали активными при переходе на страницу
   */
  useEffect(() => {
    if (window.M) {
      window.M.updateTextFields();
    }
  }, []);


  /**
   * Извлекает информацию, которая должна быть отображена в таблице, из первоисточника
   * и устанавливает ее в локальное состояние
   */
  const fetchData = useCallback(async () => {
    setDataLoaded(false);

    try {
      // Делаем запрос на сервер с целью получения информации по приложениям
      const res = await request(ServerAPI.GET_APPS_DATA, 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      // Не setTData(data), а именно setTData([...data]), иначе в некоторых
      // случаях может не сработать (в частности, метод onAdd)
      setTData([...res]);
      setLoadDataErr(null);

    } catch (e) {
      setTData(null);
      setLoadDataErr(e.message);
    }

    setDataLoaded(true);

  }, [auth.token, request]);


  /**
   * При рендере компонента подгружает информацию для отображения в таблице из БД
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);


  /**
   * Обрабатываем изменение в одном из текстовых полей ввода информации о новом
   * приложении
   *
   * @param {object} event
   */
  const changeAppFormFieldHandler = useCallback((event) => {
    setNewAppForm({ ...newAppForm, [event.target.name]: event.target.value });
  }, [newAppForm]);


  /**
   * Обрабатывает запрос на добавление в таблицу приложений новой записи.
   */
  const onAdd = useCallback(() => {
    // Обнуляем ошибки запроса на сервер
    setNewShortTitleErr(null);
    setNewTitleErr(null);

    // Отправляем запрос на добавление записи о приложении на сервер
    request(ServerAPI.ADD_APP_DATA, 'POST', { ...newAppForm }, {
      Authorization: `Bearer ${auth.token}`
    })
      .then((res) => {
        // при успешном добавлении записи на сервере не запрашиваем заново всю информацию
        // обо всех приложениях, а обновляем общий массив имеющимся объектом
        // (сервер возвращает id добавленной записи)
        setTData([ ...tData, { _id: res.appId, ...newAppForm } ]);

        // выводим сообщение об успешном добавлении информации, пришедшее с сервера
        // (во всплывающем окне)
        message(res.message);
      })
      .catch((err) => {
        // выводим частные сообщения об ошибке (если они есть)
        if (err.errors) {
          err.errors.forEach((e) => {
            switch (e.param) {
              case 'shortTitle':
                setNewShortTitleErr(e.msg);
                break;
              case 'title':
                setNewTitleErr(e.msg);
                break;
              default:
                break;
            }
          });
        }
        // выводим общее сообщение об ошибке, переданное с сервера
        message(err.message);
      });
  }, [auth.token, message, newAppForm, request, tData]);


  /**
   * Обрабатывает запрос на добавление в таблицу полномочий пользователей в приложении новой записи.
   *
   * @param {object} param - объект с полями
   *                         parentId - идентификатор родительской записи,
   *                         englAbbreviation - аббревиатура полномочия,
   *                         description - описание полномочия
   */
  const onAddSubTbl = useCallback(({ parentId, englAbbreviation, description }) => {
    // Обнуляем ошибки запроса на сервер
    setNewEnglAbbreviationErr(null);
    setNewDescriptionErr(null);

    // Запоминаем id приложения
    setActiveAppId(parentId);

    // Отправляем запрос на добавление записи о полномочии в приложении на сервер
    request(ServerAPI.ADD_APP_CRED_DATA, 'POST',
      {
        appId: parentId,
        englAbbreviation,
        description
      },
      {
        Authorization: `Bearer ${auth.token}`
      })
      .then((res) => {
        // при успешном добавлении записи на сервере не запрашиваем заново всю информацию
        // обо всех приложениях, а обновляем общий массив имеющимся объектом
        setTData([ ...tData.filter(item => {
          if (String(item._id) === String(parentId)) {
            item.credentials.push({ _id: res.credId, englAbbreviation, description });
          }
          return true;
        })]);

        // выводим сообщение об успешном добавлении информации, пришедшее с сервера
        // (во всплывающем окне)
        message(res.message);
      })
      .catch((err) => {
        // выводим частные сообщения об ошибке (если они есть)
        if (err.errors) {
          err.errors.forEach((e) => {
            switch (e.param) {
              case 'englAbbreviation':
                setNewEnglAbbreviationErr(e.msg);
                break;
              case 'description':
                setNewDescriptionErr(e.msg);
                break;
              default:
                break;
            }
          });
        }
        // выводим общее сообщение об ошибке, переданное с сервера
        message(err.message);
      });
  }, [auth.token, message, request, tData]);


  /**
   * Обрабатывает запрос на удаление записи из таблицы приложений.
   *
   * @param {object} param - объект с полем rowKey (id записи, которую необходимо удалить)
   */
  const onDelete = useCallback(({ rowKey }) => {
    // Отправляем запрос на удаление записи о приложении на сервере
    request(ServerAPI.DEL_APP_DATA, 'POST', { appId: rowKey }, {
      Authorization: `Bearer ${auth.token}`
    })
      .then((res) => {
        // при успешном удалении записи на сервере не запрашиваем заново всю информацию
        // обо всех приложениях, а обновляем общий массив путем удаления из него объекта
        setTData([...tData.filter(item => String(item._id) !== String(rowKey))]);
        message(res.message);
      })
      .catch((err) => {
        message(err.message);
      });
  }, [auth.token, message, request, tData]);


  /**
   * Обрабатывает запрос на удаление записи из таблицы полномочий приложения.
   *
   * @param {object} param - объект с полями parentId (id записи о приложении),
   *                         rowKey (id записи о полномочии, которую необходимо удалить)
   */
  const onDeleteSubTbl = useCallback(({ parentId, rowKey }) => {
    request(ServerAPI.DEL_APP_CRED_DATA, 'POST',
      {
        appId: parentId,
        credId: rowKey
      },
      {
        Authorization: `Bearer ${auth.token}`
      })
      .then((res) => {
        // при успешном удалении записи на сервере не запрашиваем заново всю информацию
        // обо всех приложениях, а обновляем общий массив путем удаления из него объекта
        setTData([ ...tData.filter(item => {
          if (String(item._id) === String(parentId)) {
            item.credentials = item.credentials.filter((cred) => cred._id !== rowKey);
          }
          return true;
        })]);
        message(res.message);
      })
      .catch((err) => {
        message(err.message);
      });
  }, [auth.token, message, request, tData]);


  /**
   * Обрабатывает запрос на редактирование записи в таблице приложений.
   *
   * @param {object} param - объект с полем currRowData (информация, относящаяся в строке,
   *                         которую необходимо отредактировать)
   */
  const onEdit = useCallback(({ currRowData }) => {
    setInEditMode({
      status: true,
      rowKey: currRowData._id
    });
    setInitialSelectedRowData(currRowData);
    setSelectedRowData(currRowData);
  }, []);


  /**
   * Обрабатывает запрос на редактирование записи в таблице полномочий приложения.
   *
   * @param {object} param - объект с полями
   *                         parentId (id приложения),
   *                         currRowData (информация, относящаяся к строке,
   *                         которую необходимо отредактировать)
   */
  const onEditSubTbl = useCallback(({ parentId, currRowData }) => {
    setSubTblInEditMode({
      status: true,
      parentId,
      rowKey: currRowData._id
    });
    setInitialSelectedSubRowData(currRowData);
    setSelectedSubRowData(currRowData);
  }, []);


  /**
   * Обрабатывает запрос на редактирование информации о приложении.
   *
   * @param {object} param - объект с полями prevRowData (исходная информация о приложении),
   *                         newRowData (отредактированная информация)
   */
  const updateApp = useCallback(({ prevRowData, newRowData }) => {
    // Обнуляем ошибки запроса на сервер
    setEditShortTitleErr(null);
    setEditTitleErr(null);

    // Определяем вначале, какие данные изменились, и формируем объект лишь с измененными данными
    const objToSend = { appId: newRowData._id };
    let changesCount = 0;

    if (prevRowData.shortTitle !== newRowData.shortTitle) {
      objToSend.shortTitle = newRowData.shortTitle;
      changesCount += 1;
    }
    if (prevRowData.title !== newRowData.title) {
      objToSend.title = newRowData.title;
      changesCount += 1;
    }

    if (changesCount === 0) {
      return;
    }

    // Отправляем запрос на редактирование записи о приложении на сервере
    request(ServerAPI.MOD_APP_DATA, 'POST', objToSend, {
      Authorization: `Bearer ${auth.token}`
    })
      .then((res) => {
        // при успешном редактировании записи на сервере не запрашиваем заново всю информацию
        // обо всех приложениях, а обновляем общий массив путем обновления в нем соответствующего объекта
        setTData([...tData.filter(item => {
          if (String(item._id) === String(newRowData._id)) {
            item.shortTitle = newRowData.shortTitle;
            item.title = newRowData.title;
            item.credentials = newRowData.credentials;
          }
          return true;
        })]);
        message(res.message);
        onCancel();
      })
      .catch((err) => {
        // выводим частные сообщения об ошибке (если они есть)
        if (err.errors) {
          err.errors.forEach((e) => {
            switch (e.param) {
              case 'shortTitle':
                setEditShortTitleErr(e.msg);
                break;
              case 'title':
                setEditTitleErr(e.msg);
                break;
              default:
                break;
            }
          });
        }
        // выводим общее сообщение об ошибке
        message(err.message);
      });
  }, [auth.token, message, request, tData]);


  /**
   * Обрабатывает запрос на редактирование информации о полномочии.
   *
   * @param {object} param - объект с полями parentId (id приложения),
   *                         prevRowData (исходная информация о полномочии),
   *                         newRowData (отредактированная информация)
   */
  const updateAppSubData = useCallback(({ parentId, prevRowData, newRowData }) => {
    // Обнуляем ошибки запроса на сервер
    setEditEnglAbbreviationErr(null);
    setEditDescriptionErr(null);

    // Определяем вначале, какие данные изменились, и формируем объект лишь с измененными данными
    const objToSend = { credId: newRowData._id };
    let changesCount = 0;

    if (prevRowData.englAbbreviation !== newRowData.englAbbreviation) {
      objToSend.englAbbreviation = newRowData.englAbbreviation;
      changesCount += 1;
    }
    if (prevRowData.description !== newRowData.description) {
      objToSend.description = newRowData.description;
      changesCount += 1;
    }

    if (changesCount === 0) {
      return;
    }

    request(ServerAPI.MOD_APP_CRED_DATA, 'POST',
      {
        appId: parentId,
        ...objToSend,
      },
      {
        Authorization: `Bearer ${auth.token}`
      })
      .then((res) => {
        // при успешном редактировании записи на сервере не запрашиваем заново всю информацию
        // обо всех приложениях, а обновляем общий массив путем обновления в нем соответствующего объекта
        setTData([...tData.filter(item => {
          if (String(item._id) === String(parentId)) {
            item.credentials = item.credentials.filter(cred => {
              if (String(cred._id) === String(newRowData._id)) {
                cred.englAbbreviation = newRowData.englAbbreviation;
                cred.description = newRowData.description;
              }
              return true;
            });
          }
          return true;
        })]);
        message(res.message);
        onCancelSubTbl();
      })
      .catch((err) => {
        // выводим частные сообщения об ошибке (если они есть)
        if (err.errors) {
          err.errors.forEach((e) => {
            switch (e.param) {
              case 'englAbbreviation':
                setEditEnglAbbreviationErr(e.msg);
                break;
              case 'description':
                setEditDescriptionErr(e.msg);
                break;
              default:
                break;
            }
          });
        }
        // выводим общее сообщение об ошибке
        message(err.message);
      });
  }, [auth.token, message, request, tData]);


  /**
   * Обрабатывает запрос на сохранение отредактированной информации о приложении.
   *
   * @param {object} param - объект с полями
   *                         prevRowData (исходная информация о приложении),
   *                         newRowData (отредактированная приложении)
   */
  const onSave = useCallback(({ prevRowData, newRowData }) => {
    updateApp({ prevRowData, newRowData });
  }, [updateApp]);


  /**
   * Обрабатывает запрос на сохранение отредактированной информации о полномочии.
   *
   * @param {object} param - объект с полями parentId (id приложения),
   *                         prevRowData (исходная информация о полномочии),
   *                         newRowData (отредактированная информация)
   */
  const onSaveSubTbl = useCallback(({ parentId, prevRowData, newRowData }) => {
    updateAppSubData({ parentId, prevRowData, newRowData });
  }, [updateAppSubData]);


  /**
   * Обрабатывает запрос на выход из режима редактирования записи о приложении.
   */
  const onCancel = () => {
    setInEditMode({
      status: false,
      rowKey: null
    });
    setInitialSelectedRowData(null);
    setSelectedRowData(null);
  };


  /**
   * Обрабатывает запрос на выход из режима редактирования записи о полномочии.
   */
  const onCancelSubTbl = () => {
    setSubTblInEditMode({
      status: false,
      rowKey: null
    });
    setInitialSelectedSubRowData(null);
    setSelectedSubRowData(null);
  };


  /**
   * Возвращает компонент редактируемой ячейки таблицы.
   *
   * @param {object} param - объект с полями:
   *                         commonCellId - начальные символы в свойстве key всех вложенных элементов,
   *                         rowKey (ключ строки),
   *                         fieldName (название отображаемого поля),
   *                         initVal (исходное значение поля),
   *                         tdClassName (...),
   *                         errMess (...),
   *                         errClassName (...)
   */
  const editableTableCell = ({ commonCellId,
                               rowKey,
                               fieldName,
                               initVal,
                               tdClassName = null,
                               errMess = null,
                               errClassName = null }) => {
    return (
      <td key={commonCellId}
          className={tdClassName}>
      {
        inEditMode.status && inEditMode.rowKey === rowKey ? (
          <React.Fragment key={`fr${commonCellId}${fieldName}`}>
            <input key={`fr_inp${commonCellId}${fieldName}`}
                   value={selectedRowData ? selectedRowData[fieldName] : null}
                   onChange={(event) => {
                     setSelectedRowData({
                       ...selectedRowData,
                       [fieldName]: event.target.value
                     })
                   }}
                   onKeyUp={(event) => {
                     if (event.key === 'Enter') {
                       onSave({
                         prevRowData: initialSelectedRowData,
                         newRowData: selectedRowData
                       })
                     }
                   }}
            />
            <p key={`fr_p${commonCellId}${fieldName}`}
               className={errClassName}>
              {errMess}
            </p>
          </React.Fragment>
          ) : (
            initVal
          )
        }
      </td>
    )
  };


  /**
   * Возвращает компонент редактируемой ячейки вложенной таблицы.
   *
   * @param {object} param - объект с полями:
   *                         commonCellId - начальные символы в свойстве key всех вложенных элементов,
   *                         parentId (ключ родительской строки),
   *                         rowKey (ключ строки вложенной таблицы),
   *                         fieldName (название отображаемого поля),
   *                         initVal (исходное значение поля)
   */
  const editableSubTableCell = ({ commonCellId,
                                  parentId,
                                  rowKey,
                                  fieldName,
                                  initVal,
                                  tdClassName = null,
                                  errMess = null,
                                  errClassName = null }) => {
    return (
      <td key={commonCellId}
          className={tdClassName}>
      {
        subTblInEditMode.status && subTblInEditMode.rowKey === rowKey ? (
          <React.Fragment key={`fr${commonCellId}${fieldName}`}>
            <input key={`fr_inp${commonCellId}${fieldName}`}
                   value={selectedSubRowData ? selectedSubRowData[fieldName] : null}
                   onChange={(event) => {
                     setSelectedSubRowData({
                       ...selectedSubRowData,
                       [fieldName]: event.target.value
                     })
                   }}
                   onKeyUp={(event) => {
                     if (event.key === 'Enter') {
                       onSaveSubTbl({
                         parentId,
                         prevRowData: initialSelectedSubRowData,
                         newRowData: selectedSubRowData
                       })
                     }
                   }}
            />
            <p key={`fr_p${commonCellId}${fieldName}`}
               className={errClassName}>
              {
                String(subTblInEditMode.parentId) === String(parentId) ?
                errMess :
                null
              }
            </p>
          </React.Fragment>
          ) : (
            initVal
          )
        }
      </td>
    )
  };


  /**
   * Возвращает компонент ячейки таблицы приложений с кнопками для выполнения
   * действий по редактированию соответствующего ряда.
   *
   * @param {object} param - объект с полями:
   *                         commonCellId - начальные символы в свойстве key всех вложенных элементов,
   *                         rowKey (ключ ряда таблицы),
   *                         currRowData (данные, находящиеся в данном ряду),
   *                         tdClassName (...)
   */
  const editTableCell = ({ commonCellId,
                           rowKey,
                           currRowData,
                           tdClassName = null }) => {
    return (
      <td key={commonCellId}
          className={tdClassName}>
      {
          inEditMode.status && inEditMode.rowKey === rowKey ? (
            <React.Fragment key={`fr${commonCellId}`}>
              <button
                key={`fr_saveBtn${commonCellId}`}
                className="btn waves-effect waves-light blue"
                onClick={() => onSave({
                  prevRowData: initialSelectedRowData,
                  newRowData: selectedRowData
                })}
              >
                &#10004;
              </button>

              <button
                key={`fr_cancelBtn${commonCellId}`}
                className="btn waves-effect waves-light orange secondBtn"
                onClick={() => onCancel()}
              >
                &#10008;
              </button>
            </React.Fragment>
          ) : (
            <React.Fragment key={`fr2${commonCellId}`}>
              <button
                key={`fr2_editBtn${commonCellId}`}
                className="btn waves-effect waves-light yellow"
                onClick={() => onEdit({ currRowData })}
              >
                &#9998;
              </button>

              <ModalBtn
                id={`fr2_delBtn${commonCellId}`}
                modalBtnClassNames="btn waves-effect waves-light red secondBtn"
                modalBtnText="&#128465;"
                windowHeader="Удалить запись?"
                windowText="Подтвердите или отмените свое действие"
                cancelBtnClassNames="waves-effect waves-green btn-flat"
                confirmBtnClassNames="waves-effect waves-green btn-flat"
                cancelBtnText="Отмена"
                confirmBtnText="OK"
                confirmCallback={() => onDelete({ rowKey })}
              />
            </React.Fragment>
          )
        }
      </td>
    )
  };


  /**
   * Возвращает компонент ячейки вложенной таблицы с кнопками для выполнения
   * действий по редактированию соответствующего ряда.
   *
   * @param {object} param - объект с полями:
   *                         commonCellId - начальные символы в свойстве key всех вложенных элементов,
   *                         rowKey (ключ соответствующего ряда родительской таблицы),
   *                         subRowKey (ключ ряда вложенной таблицы),
   *                         currRowData (данные, находящиеся в данном ряду вложенной таблицы),
   *                         tdClassName (...)
   */
  const editSubTableCell = ({ commonCellId,
                              rowKey,
                              subRowKey,
                              currRowData,
                              tdClassName = null }) => {
    return (
      <td key={commonCellId}
          className={tdClassName}>
      {
          subTblInEditMode.status && subTblInEditMode.rowKey === subRowKey ? (
            <React.Fragment key={`fr${commonCellId}`}>
              <button
                key={`fr_saveBtn${commonCellId}`}
                className="btn-small waves-effect waves-light blue"
                onClick={() => onSaveSubTbl({
                  parentId: rowKey,
                  prevRowData: initialSelectedSubRowData,
                  newRowData: selectedSubRowData
                })}
              >
                &#10004;
              </button>

              <button
                key={`fr_cancelBtn${commonCellId}`}
                className="btn-small waves-effect waves-light orange secondBtn"
                onClick={() => onCancelSubTbl()}
              >
                &#10008;
              </button>
            </React.Fragment>
          ) : (
            <React.Fragment key={`fr2${commonCellId}`}>
              <button
                key={`fr2_editBtn${commonCellId}`}
                className="btn-small waves-effect waves-light yellow"
                onClick={() => onEditSubTbl({ parentId: rowKey, currRowData })}
              >
                &#9998;
              </button>
              <ModalBtn
                key={`fr2_delBtn${commonCellId}`}
                id={`modal_${subRowKey}`}
                modalBtnClassNames="btn waves-effect waves-light red secondBtn"
                modalBtnText="&#128465;"
                windowHeader="Удалить запись?"
                windowText="Подтвердите или отмените свое действие"
                cancelBtnClassNames="waves-effect waves-green btn-flat"
                confirmBtnClassNames="waves-effect waves-green btn-flat"
                cancelBtnText="Отмена"
                confirmBtnText="OK"
                confirmCallback={() => onDeleteSubTbl({
                  parentId: rowKey,
                  rowKey: subRowKey
                })}
              />
            </React.Fragment>
          )
        }
      </td>
    )
  };


  /**
   * Обрабатываем нажатие клавиши Enter на поле ввода информации о новой сущности
   * (о приложении или о полномочии):
   * нажатие данной клавиши приводит к неявному нажатию на модальную кнопку добавления
   * новой сущности.
   *
   * @param {string} eventKey
   * @param {string} modalBtnId
   */
  const keyPressOnNewInstInputHandler = async (eventKey, modalBtnId) => {
    if (eventKey === 'Enter') {
      const modalBtnElem = document.getElementById(modalBtnId);
      if (modalBtnElem) {
        const instance = M.Modal.getInstance(modalBtnElem);
        instance.open();
      }
    }
  }


  /**
   * Блок с полями для ввода информации о новом приложении
   */
  const newAppCard = () => {
    return (
      <div className="card white">
        <div className="card-content">
          <span className="card-title cardTitle">Добавить приложение</span>
          <div>

            <div className="input-field">
              <input
                placeholder="Введите аббревиатуру приложения"
                type="text"
                className="input"
                name="shortTitle"
                id="shortTitle"
                autoComplete="off"
                onChange={changeAppFormFieldHandler}
                onKeyUp={(event) => keyPressOnNewInstInputHandler(event.key, 'addAppBtn')}
              />
              <label className="active" htmlFor="shortTitle">Аббревиатура приложения</label>
              <p className="errMess">{newShortTitleErr}</p>
            </div>

            <div className="input-field">
              <input
                placeholder="Введите полное название приложения"
                type="text"
                className="input"
                id="title"
                name="title"
                autoComplete="off"
                onChange={changeAppFormFieldHandler}
                onKeyUp={(event) => keyPressOnNewInstInputHandler(event.key, 'addAppBtn')}
              />
              <label className="active" htmlFor="title">Полное название приложения</label>
              <p className="errMess">{newTitleErr}</p>
            </div>

          </div>

          <ModalBtn
            id="addAppBtn"
            modalBtnClassNames="btn waves-effect waves-light green"
            modalBtnText="&#10010;"
            windowHeader="Добавить запись?"
            windowText="Подтвердите или отмените свое действие"
            cancelBtnClassNames="waves-effect waves-green btn-flat"
            confirmBtnClassNames="waves-effect waves-green btn-flat"
            cancelBtnText="Отмена"
            confirmBtnText="OK"
            confirmCallback={() => onAdd()}
          />
        </div>
      </div>
    );
  }


  /**
   * Позволяет ряд таблицы приложений сделать выпадающим и "свернуть" его обратно.
   *
   * @param {string} rowId - идентификатор toggled-ряда таблицы приложений
   * @param {string} cellId - идентификатор ячейки, содержащей кнопку, изображение на которой
   *                          необходимо менять в зависимости от toggled-состояния ряда
   */
  const toggleRow = useCallback((rowId, cellId) => {
    const rowElement = document.getElementById(rowId);
    rowElement.style.display = (rowElement.style.display === 'none') ? '' : 'none';

    const cellElement = document.getElementById(cellId);
    cellElement.innerText = (cellElement.innerText === '►') ? '▼' : '►';
  }, []);


  return (
    <div className="mainBlock">

      {/* Блок создания новой записи в таблице приложений */}

      <div className="newAppBlock">
        {
          newAppCard()
        }
      </div>

      {/* Блок таблицы с информацией о приложениях */}

      <div className="container appsTableBlock">

        <h2>Приложения ГИД НЕМАН</h2>

        {
          !dataLoaded? <Loader /> :

          loadDataErr ? <p className="errMess">{loadDataErr}</p> :

          <table className="highlight responsive-table appsTbl">
            <thead>
              <tr>
                <th></th>
                <th>Краткое наименование</th>
                <th>Полное наименование</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {
                tData &&
                tData.map((item) => (
                  <React.Fragment key={`appsTbl_fr${item._id}`}>
                    <tr key={`appsTbl_fr_tr${item._id}`}
                        onDoubleClick={() => onEdit({ currRowData: item })}
                    >
                      <td key={`appsTbl_fr_tr_td${item._id}`}
                          className="expandCell">
                        <button
                          key={`appsTbl_fr_tr_td_toggleBtn${item._id}`}
                          id={`appsTbl_fr_tr_td_toggleBtn${item._id}`}
                          className="btn waves-effect waves-light grey"
                          onClick={() => toggleRow(`appsTbl_fr_expRow${item._id}`, `appsTbl_fr_tr_td_toggleBtn${item._id}`)}
                        >
                          &#9658;
                        </button>
                      </td>
                      {
                        editableTableCell({
                          commonCellId: `ebltd${item._id}1`,
                          rowKey: item._id,
                          fieldName: "shortTitle",
                          initVal: item.shortTitle,
                          tdClassName: "shortTitleCell",
                          errMess: editShortTitleErr,
                          errClassName: "errMess"
                        })
                      }
                      {
                        editableTableCell({
                          commonCellId: `ebltd${item._id}2`,
                          rowKey: item._id,
                          fieldName: "title",
                          initVal: item.title,
                          tdClassName: "titleCell",
                          errMess: editTitleErr,
                          errClassName: "errMess"
                        })
                      }
                      {
                        editTableCell({
                          commonCellId: `ettd${item._id}`,
                          rowKey: item._id,
                          currRowData: item,
                          tdClassName: "actionsCell"
                        })
                      }
                    </tr>

                    <tr key={`appsTbl_fr_expRow${item._id}`}
                        id={`appsTbl_fr_expRow${item._id}`}
                        className="expanded-row-content hide-row"
                        style={{display: "none"}}
                    >
                      <td key={`appsTbl_fr_expRow_td${item._id}`}
                          colSpan="4"
                          className="d">
                        <div key={`appsTbl_fr_expRow_credsBlock${item._id}`}
                             className="credsBlock">

                          <div key={`appsTbl_fr_expRow_credsBlock_newCred${item._id}`}
                               className="newCredBlock">
                            <div className="card white">
                              <div className="card-content">
                                <span className="card-title cardTitle">Добавить полномочие</span>
                                <div>

                                  <div className="input-field">
                                    <input
                                      placeholder="Введите аббревиатуру полномочия"
                                      type="text"
                                      className="input"
                                      id={`englAbbreviation${item._id}`}
                                      name="englAbbreviation"
                                      autoComplete="off"
                                      onKeyUp={(event) => keyPressOnNewInstInputHandler(event.key, `addAppCredBtn_${item._id}`)}
                                    />
                                    <label className="active" htmlFor={`englAbbreviation${item._id}`}>Аббревиатура полномочия</label>
                                    <p className="errMess">
                                      {
                                        String(activeAppId) === String(item._id) ?
                                        newEnglAbbreviationErr :
                                        null
                                      }
                                    </p>
                                  </div>

                                  <div className="input-field">
                                    <input
                                      placeholder="Введите описание полномочия"
                                      type="text"
                                      className="input"
                                      id={`description${item._id}`}
                                      name="description"
                                      autoComplete="off"
                                      onKeyUp={(event) => keyPressOnNewInstInputHandler(event.key, `addAppCredBtn_${item._id}`)}
                                    />
                                    <label className="active" htmlFor={`description${item._id}`}>Описание полномочия</label>
                                    <p className="errMess">
                                      {
                                        String(activeAppId) === String(item._id) ?
                                        newDescriptionErr :
                                        null
                                      }
                                    </p>
                                  </div>

                                  <ModalBtn
                                    id={`addAppCredBtn_${item._id}`}
                                    modalBtnClassNames="btn-small waves-effect waves-light green"
                                    modalBtnText="&#10010;"
                                    windowHeader="Добавить запись?"
                                    windowText="Подтвердите или отмените свое действие"
                                    cancelBtnClassNames="waves-effect waves-green btn-flat"
                                    confirmBtnClassNames="waves-effect waves-green btn-flat"
                                    cancelBtnText="Отмена"
                                    confirmBtnText="OK"
                                    confirmCallback={() => {
                                      onAddSubTbl({
                                        parentId: item._id,
                                        englAbbreviation: document.getElementById(`englAbbreviation${item._id}`).value,
                                        description: document.getElementById(`description${item._id}`).value
                                      })
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div key={`appsTbl_fr_expRow_credsBlock_tblBlock${item._id}`}
                               className="credsTableBlock">

                            <h5>Полномочия пользователей</h5>

                            <table key={`appsTbl_fr_expRow_credsBlock_tbl${item._id}`}
                                   className="highlight responsive-table credsTbl">
                              <thead>
                                <tr>
                                  <th>Аббревиатура</th>
                                  <th>Описание</th>
                                  <th>Действие</th>
                                </tr>
                              </thead>
                              <tbody key={`appsTbl_fr_expRow_credsBlock_tblbody${item._id}`}
                                     className="collapse">
                                {
                                  item.credentials &&
                                  item.credentials.map((subItem) => (
                                    <tr key={`${item._id}${subItem._id}`}
                                        onDoubleClick={() => onEditSubTbl({ parentId: item._id, currRowData: subItem })}
                                    >
                                      {
                                        editableSubTableCell({
                                          commonCellId: `eblsttd${item._id}${subItem._id}1`,
                                          parentId: item._id,
                                          rowKey: subItem._id,
                                          fieldName: "englAbbreviation",
                                          initVal: subItem.englAbbreviation,
                                          tdClassName: "englAbbreviationCell",
                                          errMess: editEnglAbbreviationErr,
                                          errClassName: "errMess"
                                        })
                                      }
                                      {
                                        editableSubTableCell({
                                          commonCellId: `eblsttd${item._id}${subItem._id}2`,
                                          parentId: item._id,
                                          rowKey: subItem._id,
                                          fieldName: "description",
                                          initVal: subItem.description,
                                          tdClassName: "descriptionCell",
                                          errMess: editDescriptionErr,
                                          errClassName: "errMess"
                                        })
                                      }
                                      {
                                        editSubTableCell({
                                          commonCellId: `esttd${item._id}${subItem._id}`,
                                          rowKey: item._id,
                                          subRowKey: subItem._id,
                                          currRowData: subItem,
                                          tdClassName: "actionsCell"
                                        })
                                      }
                                    </tr>
                                  ))
                                }
                              </tbody>
                            </table>

                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  )
};
