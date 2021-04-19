import React, { useEffect, useState, useCallback, useContext } from 'react';
import { ModalBtn } from '../components/ModalBtn/ModalBtn';
import { useHttp } from '../hooks/http.hook';
import { useMessage } from '../hooks/message.hook';
import { AuthContext } from '../context/AuthContext';
import { Loader } from '../components/Loader/Loader';
import MultipleSelect from '../components/MultipleSelect/MultipleSelect';
import M from 'materialize-css';

import './RolesPage.css';

// Идентификаторы элементов и подэлементов в таблице должны быть уникальны в рамках
// всей таблицы!


/**
 * Возвращает компонент, представляющий собой страницу работы с ролями пользователей.
 */
export const RolesPage = () => {
  // Вся информация, которая должна быть отображена в таблице, включая
  // вложенную таблицу
  const [tData, setTData] = useState(null);

  // Массив объектов, каждый из которых содержит id и аббревиатуру приложения, а также вложенный
  // массив соответствующих объектов полномочий пользователей (id + аббревиатура полномочия)
  const [appCredAbbrs, setAppCredAbbrs] = useState(null);

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
  // (строки с информацией о роли)
  const [inEditMode, setInEditMode] = useState({
    status: false,
    rowKey: null
  });

  // Исходная информация, которая находилась в выделенной строке в таблице ролей
  // (до редактирования)
  const [initialSelectedRowData, setInitialSelectedRowData] = useState(null);
  // Информация, которая относится к выделенной строке в таблице ролей
  const [selectedRowData, setSelectedRowData] = useState(null);

  // Информация о новой роли (добавляемой)
  const [newRoleForm, setNewRoleForm] = useState({
    englAbbreviation: '',
    description: '',
    subAdminCanUse: false,
    apps: []
  });

  // Ошибки добавления информации о новой роли
  const [newEnglAbbreviationErr, setNewEnglAbbreviationErr] = useState(null);
  const [newDescriptionErr, setNewDescriptionErr] = useState(null);
  const [newSubAdminCanUseErr, setNewSubAdminCanUseErr] = useState(null);

  // Ошибки редактирования информации о роли
  const [editEnglAbbreviationErr, setEditEnglAbbreviationErr] = useState(null);
  const [editDescriptionErr, setEditDescriptionErr] = useState(null);
  const [editSubAdminCanUseErr, setEditSubAdminCanUseErr] = useState(null);


  /**
   * Для того чтобы input'ы стали активными при переходе на страницу
   */
  useEffect(() => {
    if (window.M) {
      window.M.AutoInit();
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
      // Делаем запрос на сервер с целью получения информации по ролям
      const res = await request('/api/roles/data', 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      const appsData = await request('/api/apps/abbrData', 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      // Не setTData(data), а именно setTData([...data]), иначе в некоторых
      // случаях может не сработать (в частности, метод onAdd)
      setTData([...res]);

      setAppCredAbbrs(appsData);

      setLoadDataErr(null);

    } catch (e) {
      setTData(null);
      setAppCredAbbrs(null);
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
   * Обрабатываем изменение в одном из текстовых полей ввода информации о новой роли.
   *
   * @param {object} event
   */
  const changeRoleFormFieldHandler = useCallback((event) => {
    setNewRoleForm({ ...newRoleForm, [event.target.name]: event.target.value });
  }, [newRoleForm]);


  /**
   * Обрабатываем изменение возможности использования роли администратором нижнего уровня.
   *
   * @param {object} event
   */
  const toggleSubAdminCanUse = useCallback((event) => {
    setNewRoleForm({ ...newRoleForm, subAdminCanUse: !newRoleForm.subAdminCanUse });
  }, [newRoleForm]);


  /**
   * Обрабатывает запрос на добавление в таблицу ролей новой записи.
   */
  const onAdd = useCallback(() => {
    // Обнуляем ошибки запроса на сервер
    setNewEnglAbbreviationErr(null);
    setNewDescriptionErr(null);
    setNewSubAdminCanUseErr(null);

    // Отправляем запрос на добавление записи о роли на сервер
    request('/api/roles/add', 'POST', { ...newRoleForm }, {
      Authorization: `Bearer ${auth.token}`
    })
      .then((res) => {
        // при успешном добавлении записи на сервере не запрашиваем заново всю информацию
        // обо всех ролях, а обновляем общий массив имеющимся объектом
        setTData([ ...tData, { _id: res.roleId, ...newRoleForm } ]);

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
              case 'subAdminCanUse':
                setNewSubAdminCanUseErr(e.msg);
                break;
              default:
                break;
            }
          });
        }
        // выводим общее сообщение об ошибке, переданное с сервера
        message(err.message);
      });
  }, [auth.token, message, newRoleForm, request, tData]);


  /**
   * Обрабатывает запрос на удаление записи из таблицы ролей.
   *
   * @param {object} param - объект с полем rowKey (id записи, которую необходимо удалить)
   */
  const onDelete = useCallback(({ rowKey }) => {
    // Отправляем запрос на удаление записи о роли на сервере
    request('/api/roles/del', 'POST', { roleId: rowKey }, {
      Authorization: `Bearer ${auth.token}`
    })
      .then((res) => {
        // при успешном удалении записи на сервере не запрашиваем заново всю информацию
        // обо всех ролях, а обновляем общий массив путем удаления из него объекта
        setTData([...tData.filter(item => String(item._id) !== String(rowKey))]);
        message(res.message);
      })
      .catch((err) => {
        message(err.message);
      });
  }, [auth.token, message, request, tData]);


  /**
   * Обрабатывает запрос на редактирование записи в таблице ролей.
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
   * Обрабатывает запрос на редактирование информации о роли.
   *
   * @param {object} param - объект с полями prevRowData (исходная информация о роли),
   *                         newRowData (отредактированная информация)
   */
  const updateRole = useCallback(({ prevRowData, newRowData }) => {
    // Обнуляем ошибки запроса на сервер
    setEditEnglAbbreviationErr(null);
    setEditDescriptionErr(null);
    setEditSubAdminCanUseErr(null);

    // Определяем вначале, какие данные изменились, и формируем объект лишь с измененными данными
    const objToSend = { roleId: newRowData._id };
    let changesCount = 0;

    if (prevRowData.englAbbreviation !== newRowData.englAbbreviation) {
      objToSend.englAbbreviation = newRowData.englAbbreviation;
      changesCount += 1;
    }
    if (prevRowData.description !== newRowData.description) {
      objToSend.description = newRowData.description;
      changesCount += 1;
    }
    if (prevRowData.subAdminCanUse !== newRowData.subAdminCanUse) {
      objToSend.subAdminCanUse = newRowData.subAdminCanUse;
      changesCount += 1;
    }

    if (changesCount === 0) {
      return;
    }

    // Отправляем запрос на редактирование записи о роли на сервере
    request('/api/roles/mod', 'POST', objToSend, {
      Authorization: `Bearer ${auth.token}`
    })
      .then((res) => {
        // при успешном редактировании записи на сервере не запрашиваем заново всю информацию
        // обо всех ролях, а обновляем общий массив путем обновления в нем соответствующего объекта
        setTData([...tData.filter(item => {
          if (String(item._id) === String(newRowData._id)) {
            item.englAbbreviation = newRowData.englAbbreviation;
            item.description = newRowData.description;
            item.subAdminCanUse = newRowData.subAdminCanUse;
            item.apps = newRowData.apps;
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
              case 'englAbbreviation':
                setEditEnglAbbreviationErr(e.msg);
                break;
              case 'description':
                setEditDescriptionErr(e.msg);
                break;
              case 'subAdminCanUse':
                setEditSubAdminCanUseErr(e.msg);
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
   * Обрабатывает запрос на сохранение отредактированной информации о роли.
   *
   * @param {object} param - объект с полями
   *                         prevRowData (исходная информация о роли),
   *                         newRowData (отредактированная приложении)
   */
  const onSave = useCallback(({ prevRowData, newRowData }) => {
    updateRole({ prevRowData, newRowData });
  }, [updateRole]);


  /**
   * Обрабатывает запрос на выход из режима редактирования записи о роли.
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
   * Возвращает компонент редактируемой ячейки таблицы.
   *
   * @param {object} param - объект с полями:
   *                         rowKey (ключ строки),
   *                         fieldName (название отображаемого поля),
   *                         initVal (исходное значение поля),
   *                         tdClassName (...),
   *                         errMess (...),
   *                         errClassName (...)
   */
  const editableTableCell = ({ rowKey,
                               fieldName,
                               initVal,
                               tdClassName = null,
                               errMess = null,
                               errClassName = null }) => {
    return (
      <td className={tdClassName}>
      {
        inEditMode.status && inEditMode.rowKey === rowKey ? (
          <React.Fragment>
            <input value={selectedRowData ? selectedRowData[fieldName] : null}
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
            <p className={errClassName}>{errMess}</p>
          </React.Fragment>
          ) : (
            initVal
          )
      }
      </td>
    )
  };


  /**
   * Возвращает компонент ячейки таблицы с checkbox для редактирования.
   *
   * @param {object} param - объект с полями:
   *                         rowKey (ключ строки),
   *                         fieldName (название отображаемого поля),
   *                         initVal (исходное значение поля),
   *                         tdClassName (...),
   *                         errMess (...),
   *                         errClassName (...)
   */
  const editableCheckboxTableCell = ({ rowKey,
                                       fieldName,
                                       initVal,
                                       tdClassName = null,
                                       errMess = null,
                                       errClassName = null }) => {
    return (
      <td className={tdClassName}>
      {
        inEditMode.status && inEditMode.rowKey === rowKey ? (
          <React.Fragment>
            <label>
              <input
                type="checkbox"
                checked={selectedRowData[fieldName]}
                onChange={(event) => {
                  setSelectedRowData({
                    ...selectedRowData,
                    [fieldName]: !selectedRowData[fieldName]
                  })
                }}
              />
              <span>Доступно администратору нижнего уровня</span>
            </label>
            <p className={errClassName}>{errMess}</p>
          </React.Fragment>
          ) : (
            <span>{initVal ? 'Да' : 'Нет'}</span>
          )
      }
      </td>
    )
  };


  /**
   * Возвращает компонент ячейки таблицы ролей с кнопками для выполнения
   * действий по редактированию соответствующего ряда.
   *
   * @param {object} param - объект с полями:
   *                         rowKey (ключ ряда таблицы),
   *                         currRowData (данные, находящиеся в данном ряду),
   *                         tdClassName (...)
   */
  const editTableCell = ({ rowKey, currRowData, tdClassName = null }) => {
    return (
      <td className={tdClassName}>{
          inEditMode.status && inEditMode.rowKey === rowKey ? (
            <React.Fragment>
              <button
                className="btn waves-effect waves-light blue"
                onClick={() => onSave({
                  prevRowData: initialSelectedRowData,
                  newRowData: selectedRowData
                })}
              >
                &#10004;
              </button>

              <button
                className="btn waves-effect waves-light orange secondBtn"
                onClick={() => onCancel()}
              >
                &#10008;
              </button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <button
                className="btn waves-effect waves-light yellow"
                onClick={() => onEdit({ currRowData })}
              >
                &#9998;
              </button>

              <ModalBtn
                id={`modal_${rowKey}`}
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
   * Обрабатываем нажатие клавиши Enter на поле ввода информации о новой сущности
   * (о роли):
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
   * Позволяет ряд таблицы ролей сделать выпадающим и "свернуть" его обратно.
   *
   * @param {string} rowId - идентификатор toggled-ряда таблицы ролей
   * @param {string} cellId - идентификатор ячейки, содержащей кнопку, изображение на которой
   *                          необходимо менять в зависимости от toggled-состояния ряда
   */
  const toggleRow = useCallback((rowId, cellId) => {
    const rowElement = document.getElementById(rowId);
    rowElement.style.display = (rowElement.style.display === 'none') ? '' : 'none';

    const cellElement = document.getElementById(cellId);
    cellElement.innerText = (cellElement.innerText === '►') ? '▼' : '►';
  }, []);


  /**
   * Обработчик события закрытия списка выбора полномочий приложения.
   *
   * @param {object} param - объект с полями:
   *                         roleId - id текущей роли,
   *                         appId - id приложения, к которому относится закрытый список полномочий,
   *                         credAbbrs - массив аббревиатур выбранных полномочий
   */
  const onChooseCreds = ({ roleId, appId, credIds }) => {
    if (!roleId || !appId || !credIds) {
      return;
    }

    // Вначале проверяем, были ли внесены изменения в список полномочий.
    // Извлекаем массив идентификаторов предыдущего списка полномочий:
    const role = tData.find(role => String(role._id) === String(roleId));
    const app = role.apps.find(app => String(app.appId) === String(appId));
    let prevCredIds;
    if (app) {
      prevCredIds = app.creds;
    }

    // Если предыдущего списка не было либо он был пуст и новый список тоже пуст, то ничего не делаем
    if ((!prevCredIds || !prevCredIds.length) && !credIds.length) {
      return;
    }

    // Сравниваем 2 массива идентификаторов.
    // Если длины массивов credIds и prevCredIds разные, то точно что-то изменилось.
    // Поэтому дополнительные проверки провожу только если длины массивов одинаковые.
    if (prevCredIds && (prevCredIds.length === credIds.length)) {
      let foundDiffrEl = false;
      for (let c of credIds) {
        if (!prevCredIds.includes(c)) {
          foundDiffrEl = true;
          break;
        }
      }
      // Если все элементы массивов совпадают, ничего делать не нужно
      if (!foundDiffrEl) {
        return;
      }
    }

    // Отправляем запрос об изменении списка полномочий на сервер
    request('/api/roles/changeCreds', 'POST', { roleId, appId, newCredIds: credIds }, {
      Authorization: `Bearer ${auth.token}`
    })
    .then((res) => {
      // при успешном сохранении информации на сервере не запрашиваем заново всю информацию
      // обо всех ролях, а обновляем общий массив имеющимся объектом
      const updatedArr = tData.map(role => {
        if (String(role._id) === String(roleId)) {
          let roleApp = role.apps.find(app => String(app.appId) === String(appId));
          if (!roleApp) {
            roleApp = { appId };
          }
          roleApp.creds = credIds;
        }
        return role;
      });
      setTData([ ...updatedArr ]);

      // выводим сообщение об успешном добавлении информации, пришедшее с сервера
      // (во всплывающем окне)
      message(res.message);
    })
    .catch((err) => {
      message(err.message);
    });
  }


  return (
    <div className="mainBlock">

    {/* Блок создания новой записи в таблице ролей */}

    <div className="newRoleBlock">

      <div className="card white">
        <div className="card-content">
          <span className="card-title cardTitle">Добавить роль</span>
          <div>

            <div className="input-field">
              <input
                placeholder="Введите аббревиатуру роли"
                type="text"
                className="input"
                name="englAbbreviation"
                id="englAbbreviation"
                autoComplete="off"
                onChange={changeRoleFormFieldHandler}
                onKeyUp={(event) => keyPressOnNewInstInputHandler(event.key, 'addRoleBtn')}
              />
              <label className="active" htmlFor="englAbbreviation">Аббревиатура роли</label>
              <p className="errMess">{newEnglAbbreviationErr}</p>
            </div>

            <div className="input-field">
              <input
                placeholder="Введите описание роли"
                type="text"
                className="input"
                id="description"
                name="description"
                autoComplete="off"
                onChange={changeRoleFormFieldHandler}
                onKeyUp={(event) => keyPressOnNewInstInputHandler(event.key, 'addRoleBtn')}
              />
              <label className="active" htmlFor="description">Описание роли</label>
              <p className="errMess">{newDescriptionErr}</p>
            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={newRoleForm.subAdminCanUse}
                  onChange={toggleSubAdminCanUse}
                />
                <span>Доступно администратору нижнего уровня</span>
                <p className="errMess">{newSubAdminCanUseErr}</p>
              </label>
            </div>

          </div>

          <br />

          <ModalBtn
            id="addRoleBtn"
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

    </div>

    {/* Блок таблицы с информацией о ролях */}

    <div className="container rolesTableBlock">

      <h2>Роли ГИД НЕМАН</h2>

      {
        !dataLoaded? <Loader /> :

        loadDataErr ? <p className="errMess">{loadDataErr}</p> :

        <table className="highlight responsive-table rolesTbl">
          <thead>
            <tr>
              <th></th>
              <th>Аббревиатура</th>
              <th>Описание</th>
              <th>Доступность администратору нижнего уровня</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {
              tData &&
              tData.map((item) => (
                <React.Fragment key={`fragm_${item._id}`}>
                  <tr key={item._id}
                      onDoubleClick={() => onEdit({ currRowData: item })}
                  >
                    <td className="expandCell">
                      <button id={`btn_${item._id}`}
                        className="btn waves-effect waves-light grey"
                        onClick={() => toggleRow(`row_${item._id}`, `btn_${item._id}`)}
                      >
                        &#9658;
                      </button>
                    </td>
                    {
                      editableTableCell({
                        rowKey: item._id,
                        fieldName: "englAbbreviation",
                        initVal: item.englAbbreviation,
                        tdClassName: "englAbbreviationCell",
                        errMess: editEnglAbbreviationErr,
                        errClassName: "errMess"
                      })
                    }
                    {
                      editableTableCell({
                        rowKey: item._id,
                        fieldName: "description",
                        initVal: item.description,
                        tdClassName: "descriptionCell",
                        errMess: editDescriptionErr,
                        errClassName: "errMess"
                      })
                    }
                    {
                      editableCheckboxTableCell({
                        rowKey: item._id,
                        fieldName: "subAdminCanUse",
                        initVal: item.subAdminCanUse,
                        tdClassName: "subAdminCanUseCell",
                        errMess: editSubAdminCanUseErr,
                        errClassName: "errMess"
                      })
                    }
                    {
                      editTableCell({
                        rowKey: item._id,
                        currRowData: item,
                        tdClassName: "actionsCell"
                      })
                    }
                  </tr>

                  <tr key={`row_${item._id}`}
                      id={`row_${item._id}`}
                      className="expanded-row-content hide-row"
                      style={{display: "none"}}
                  >
                    <td colSpan="4" className="d">
                      <h5>Полномочия в приложениях</h5>
                      {
                        appCredAbbrs &&
                        appCredAbbrs.map((app) => (
                          <MultipleSelect
                            labelClassName="multSelectLabel"
                            className="multSelect"
                            key={`MS${item._id}_${app._id}`}
                            id={`multSel${item._id}_${app._id}`}
                            lblText={`Полномочия в ${app.shortTitle}:`}

                            options={
                              (!app.credentials || !app.credentials.length) ?
                              [] :
                              app.credentials.map(cred => cred.englAbbreviation)
                            }

                            selectedOptions={
                              (!app.credentials || !app.credentials.length || !item.apps || !item.apps.length) ?
                              [] :
                              app.credentials.filter((cred) =>
                                item.apps.some(el =>
                                  (String(el.appId) === String(app._id)) &&
                                  el.creds.includes(cred._id)
                                )
                              ).map(cred => cred.englAbbreviation)
                            }

                            onCloseCallback={(selectedVals) => {
                              const credIds = app.credentials
                                .filter(cred => selectedVals.includes(cred.englAbbreviation))
                                .map(cred => cred._id);
                              onChooseCreds({
                                  roleId: item._id,
                                  appId: app._id,
                                  credIds
                              });
                            }}
                          />
                        ))
                      }
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
