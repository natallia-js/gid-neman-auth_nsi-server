import React, { useEffect, useState, useCallback, useContext } from 'react';
import { ModalBtn } from '../components/ModalBtn/ModalBtn';
import { useHttp } from '../hooks/http.hook';
import { useMessage } from '../hooks/message.hook';
import { AuthContext } from '../context/AuthContext';
import { Loader } from '../components/Loader/Loader';
import M from 'materialize-css';

import './UsersPage.css';

// Идентификаторы элементов и подэлементов в таблице должны быть уникальны в рамках
// всей таблицы!


/**
 * Возвращает компонент, представляющий собой страницу работы с аккаунтами пользователей.
 */
export const UsersPage = () => {
  // Вся информация, которая должна быть отображена в таблице, включая
  // вложенную таблицу
  const [tData, setTData] = useState(null);

  // Массив объектов, каждый из которых содержит id роли и ее аббревиатуру
  const [roleAbbrs, setRoleAbbrs] = useState(null);

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
  // (строки с информацией о пользователях)
  const [inEditMode, setInEditMode] = useState({
    status: false,
    rowKey: null
  });

  // Исходная информация, которая находилась в выделенной строке в таблице пользователей
  // (до редактирования)
  const [initialSelectedRowData, setInitialSelectedRowData] = useState(null);
  // Информация, которая относится к выделенной строке в таблице пользователей
  const [selectedRowData, setSelectedRowData] = useState(null);

  // Информация о новом юпользователе (добавляемом)
  const [newUserForm, setNewUserForm] = useState({
    login: '',
    password: '',
    name: '',
    fatherName: '',
    surname: '',
    sector: '',
    post: '',
    roles: []
  });

  // Ошибки добавления информации о новом пользователе
  const [newLoginErr, setNewLoginErr] = useState(null);
  const [newPasswordErr, setNewPasswordErr] = useState(null);
  const [newNameErr, setNewNameErr] = useState(null);
  const [newFatherNameErr, setNewFatherNameErr] = useState(null);
  const [newSurnameErr, setNewSurnameErr] = useState(null);
  const [newSectorErr, setNewSectorErr] = useState(null);
  const [newPostErr, setNewPostErr] = useState(null);

  // Ошибки редактирования информации о пользователе
  const [editLoginErr, setEditLoginErr] = useState(null);
  const [editPasswordErr, setEditPasswordErr] = useState(null);
  const [editNameErr, setEditNameErr] = useState(null);
  const [editFatherNameErr, setEditFatherNameErr] = useState(null);
  const [editSurnameErr, setEditSurnameErr] = useState(null);
  const [editSectorErr, setEditSectorErr] = useState(null);
  const [editPostErr, setEditPostErr] = useState(null);


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
      // Делаем запрос на сервер с целью получения информации по пользователям
      const res = await request('/api/auth/data', 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      // Делаем запрос на сервер с целью получения информации по ролям
      const resRoles = await request('/api/roles/abbrs', 'GET', null, {
        Authorization: `Bearer ${auth.token}`
      });

      // Не setTData(data), а именно setTData([...data]), иначе в некоторых
      // случаях может не сработать (в частности, метод onAdd)
      setTData([...res]);

      setRoleAbbrs([...resRoles]);

      setLoadDataErr(null);

    } catch (e) {
      setTData(null);
      setRoleAbbrs(null);
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
   * Обрабатываем изменение в одном из текстовых полей ввода информации о новом пользователе
   *
   * @param {object} event
   */
  const changeUserFormFieldHandler = useCallback((event) => {
    setNewUserForm({ ...newUserForm, [event.target.name]: event.target.value });
  }, [newUserForm]);


  /**
   * Обрабатывает запрос на добавление в таблицу пользователей новой записи.
   */
  const onAdd = useCallback(() => {
    // Обнуляем ошибки запроса на сервер
    setNewLoginErr(null);
    setNewPasswordErr(null);
    setNewNameErr(null);
    setNewFatherNameErr(null);
    setNewSurnameErr(null);
    setNewSectorErr(null);
    setNewPostErr(null);

    // Отправляем запрос на добавление записи о пользователе на сервер
    request('/api/auth/register', 'POST', { ...newUserForm }, {
      Authorization: `Bearer ${auth.token}`
    })
      .then((res) => {
        // при успешном добавлении записи на сервере не запрашиваем заново всю информацию
        // обо всех пользователях, а обновляем общий массив имеющимся объектом
        setTData([ ...tData, { _id: res.userId, ...newUserForm, password: res.hashedPassword } ]);

        // выводим сообщение об успешном добавлении информации, пришедшее с сервера
        // (во всплывающем окне)
        message(res.message);
      })
      .catch((err) => {
        // выводим частные сообщения об ошибке (если они есть)
        if (err.errors) {
          err.errors.forEach((e) => {
            switch (e.param) {
              case 'password':
                setNewPasswordErr(e.msg);
                break;
              case 'login':
                setNewLoginErr(e.msg);
                break;
              case 'name':
                setNewNameErr(e.msg);
                break;
              case 'fatherName':
                setNewFatherNameErr(e.msg);
                break;
              case 'surname':
                setNewSurnameErr(e.msg);
                break;
              case 'sector':
                setNewSectorErr(e.msg);
                break;
              case 'post':
                setNewPostErr(e.msg);
                break;
              default:
                break;
            }
          });
        }
        // выводим общее сообщение об ошибке, переданное с сервера
        message(err.message);
      });
  }, [auth.token, message, newUserForm, request, tData]);


  /**
   * Обрабатывает запрос на удаление записи из таблицы пользователей.
   *
   * @param {object} param - объект с полем rowKey (id записи, которую необходимо удалить)
   */
  const onDelete = useCallback(({ rowKey }) => {
    // Отправляем запрос на удаление записи о пользователе на сервере
    request('/api/auth/del', 'POST', { userId: rowKey }, {
      Authorization: `Bearer ${auth.token}`
    })
      .then((res) => {
        // при успешном удалении записи на сервере не запрашиваем заново всю информацию
        // обо всех пользователях, а обновляем общий массив путем удаления из него объекта
        setTData([...tData.filter(item => String(item._id) !== String(rowKey))]);
        message(res.message);
      })
      .catch((err) => {
        message(err.message);
      });
  }, [auth.token, message, request, tData]);


  /**
   * Обрабатывает запрос на редактирование записи в таблице пользователей.
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
   * Обрабатывает запрос на редактирование информации о пользователе.
   *
   * @param {object} param - объект с полями prevRowData (исходная информация о пользователе),
   *                         newRowData (отредактированная информация)
   */
  const updateUser = useCallback(({ prevRowData, newRowData }) => {
    // Обнуляем ошибки запроса на сервер
    setEditLoginErr(null);
    setEditPasswordErr(null);
    setEditNameErr(null);
    setEditFatherNameErr(null);
    setEditSurnameErr(null);
    setEditSectorErr(null);
    setEditPostErr(null);

    // Определяем вначале, какие данные изменились, и формируем объект лишь с измененными данными
    const objToSend = { userId: newRowData._id };
    let changesCount = 0;

    if (prevRowData.login !== newRowData.login) {
      objToSend.login = newRowData.login;
      changesCount += 1;
    }
    if (prevRowData.password !== newRowData.password) {
      objToSend.password = newRowData.password;
      changesCount += 1;
    }
    if (prevRowData.name !== newRowData.name) {
      objToSend.name = newRowData.name;
      changesCount += 1;
    }
    if (prevRowData.fatherName !== newRowData.fatherName) {
      objToSend.fatherName = newRowData.fatherName;
      changesCount += 1;
    }
    if (prevRowData.surname !== newRowData.surname) {
      objToSend.surname = newRowData.surname;
      changesCount += 1;
    }
    if (prevRowData.fatherName !== newRowData.fatherName) {
      objToSend.fatherName = newRowData.fatherName;
      changesCount += 1;
    }
    if (prevRowData.sector !== newRowData.sector) {
      objToSend.sector = newRowData.sector;
      changesCount += 1;
    }
    if (prevRowData.post !== newRowData.post) {
      objToSend.post = newRowData.post;
      changesCount += 1;
    }

    if (changesCount === 0) {
      return;
    }

    // Отправляем запрос на редактирование записи о пользователе на сервере
    request('/api/auth/mod', 'POST', objToSend, {
      Authorization: `Bearer ${auth.token}`
    })
      .then((res) => {
        // при успешном редактировании записи на сервере не запрашиваем заново всю информацию
        // обо всех пользователях, а обновляем общий массив путем обновления в нем соответствующего объекта
        setTData([...tData.filter(item => {
          if (String(item._id) === String(newRowData._id)) {
            item.login = newRowData.login;
            item.password = res.hashedPassword;
            item.name = newRowData.name;
            item.fatherName = newRowData.fatherName;
            item.surname = newRowData.surname;
            item.sector = newRowData.sector;
            item.post = newRowData.post;
            item.roles = newRowData.roles;
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
              case 'password':
                setEditPasswordErr(e.msg);
                break;
              case 'login':
                setEditLoginErr(e.msg);
                break;
              case 'name':
                setEditNameErr(e.msg);
                break;
              case 'fatherName':
                setEditFatherNameErr(e.msg);
                break;
              case 'surname':
                setEditSurnameErr(e.msg);
                break;
              case 'sector':
                setEditSectorErr(e.msg);
                break;
              case 'post':
                setEditPostErr(e.msg);
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
   * Обрабатывает запрос на сохранение отредактированной информации о пользователе.
   *
   * @param {object} param - объект с полями
   *                         prevRowData (исходная информация о пользователе),
   *                         newRowData (отредактированная приложении)
   */
  const onSave = useCallback(({ prevRowData, newRowData }) => {
    updateUser({ prevRowData, newRowData });
  }, [updateUser]);


  /**
   * Обрабатывает запрос на выход из режима редактирования записи о пользователе.
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
   * Обрабатывает запрос на добавление/удаление роли у конкретного пользователя.
   *
   * @param {object} param - объект с полями
   *                         parentId (id пользователя),
   *                         roleId (id роли добавляемой/удаляемой)
   */
  const onChangeRole = ({ parentId, roleId }) => {
    for (let user of tData) {
      // Ищем пользователя по его id
      if (String(user._id) === String(parentId)) {

        // Будем добавлять новую роль пользователю
        if (!user.roles.includes(roleId)) {

          request('/api/auth/addRole', 'POST', { userId: parentId,
                                                 roleId },
                                               {
                                                 Authorization: `Bearer ${auth.token}`
                                               })
            .then((res) => {
              // при успешном редактировании записи на сервере не запрашиваем заново всю информацию
              // обо всех пользователях, а обновляем общий массив путем обновления в нем соответствующего объекта
              setTData([...tData.filter(item => {
                if (String(item._id) === String(parentId)) {
                  item.roles.push(roleId);
                }
                return true;
              })]);
              message(res.message);
            })
            .catch((err) => {
              message(err.message);
            });

        } else {
          // Будем удалять роль у пользователя
          request('/api/auth/delRole', 'POST', { userId: parentId,
                                                 roleId },
                                               {
                                                 Authorization: `Bearer ${auth.token}`
                                               })
            .then((res) => {
              // при успешном редактировании записи на сервере не запрашиваем заново всю информацию
              // обо всех пользователях, а обновляем общий массив путем обновления в нем соответствующего объекта
              setTData([...tData.filter(item => {
                if (String(item._id) === String(parentId)) {
                  item.roles = item.roles.filter(role => String(role) !== String(roleId));
                }
                return true;
              })]);
              message(res.message);
            })
            .catch((err) => {
              message(err.message);
            });
        }
        break;
      }
    }
  }


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
      <td className={tdClassName}>{
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
   * Возвращает компонент ячейки таблицы пользователей с кнопками для выполнения
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
   * (о пользователе):
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


  return (
    <div className="mainBlock">

    {/* Блок создания новой записи в таблице пользователей */}

    <div className="newUserBlock">

      <div className="card white">
        <div className="card-content">
          <span className="card-title cardTitle">Добавить пользователя</span>
          <div>

            <div className="input-field">
              <input
                placeholder="Введите логин"
                type="text"
                className="input"
                name="login"
                id="login"
                onChange={changeUserFormFieldHandler}
                onKeyUp={(event) => keyPressOnNewInstInputHandler(event.key, 'addUserBtn')}
              />
              <label className="active" htmlFor="login">Логин</label>
              <p className="errMess">{newLoginErr}</p>
            </div>

            <div className="input-field">
              <input
                placeholder="Введите пароль"
                type="text"
                className="input"
                id="password"
                name="password"
                onChange={changeUserFormFieldHandler}
                onKeyUp={(event) => keyPressOnNewInstInputHandler(event.key, 'addUserBtn')}
              />
              <label className="active" htmlFor="password">Пароль</label>
              <p className="errMess">{newPasswordErr}</p>
            </div>

            <div className="input-field">
              <input
                placeholder="Введите имя"
                type="text"
                className="input"
                id="name"
                name="name"
                onChange={changeUserFormFieldHandler}
                onKeyUp={(event) => keyPressOnNewInstInputHandler(event.key, 'addUserBtn')}
              />
              <label className="active" htmlFor="name">Имя</label>
              <p className="errMess">{newNameErr}</p>
            </div>

            <div className="input-field">
              <input
                placeholder="Введите отчество"
                type="text"
                className="input"
                id="fatherName"
                name="fatherName"
                onChange={changeUserFormFieldHandler}
                onKeyUp={(event) => keyPressOnNewInstInputHandler(event.key, 'addUserBtn')}
              />
              <label className="active" htmlFor="fatherName">Отчество</label>
              <p className="errMess">{newFatherNameErr}</p>
            </div>

            <div className="input-field">
              <input
                placeholder="Введите фамилию"
                type="text"
                className="input"
                id="surname"
                name="surname"
                onChange={changeUserFormFieldHandler}
                onKeyUp={(event) => keyPressOnNewInstInputHandler(event.key, 'addUserBtn')}
              />
              <label className="active" htmlFor="surname">Фамилия</label>
              <p className="errMess">{newSurnameErr}</p>
            </div>

            <div className="input-field">
              <input
                placeholder="Введите должность"
                type="text"
                className="input"
                id="post"
                name="post"
                onChange={changeUserFormFieldHandler}
                onKeyUp={(event) => keyPressOnNewInstInputHandler(event.key, 'addUserBtn')}
              />
              <label className="active" htmlFor="post">Должность</label>
              <p className="errMess">{newPostErr}</p>
            </div>

            <div className="input-field">
              <input
                placeholder="Введите наименование участка"
                type="text"
                className="input"
                id="sector"
                name="sector"
                onChange={changeUserFormFieldHandler}
                onKeyUp={(event) => keyPressOnNewInstInputHandler(event.key, 'addUserBtn')}
              />
              <label className="active" htmlFor="sector">Участок</label>
              <p className="errMess">{newSectorErr}</p>
            </div>

          </div>

          <ModalBtn
            id="addUserBtn"
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

    {/* Блок таблицы с информацией о пользователях */}

    <div className="container usersTableBlock">

      <h2>Пользователи ГИД НЕМАН</h2>

      {
        !dataLoaded? <Loader /> :

        loadDataErr ? <p className="errMess">{loadDataErr}</p> :

        <table className="highlight responsive-table usersTbl">
          <thead>
            <tr>
              <th></th>
              <th>Логин</th>
              <th>Хеш пароля</th>
              <th>Имя</th>
              <th>Отчество</th>
              <th>Фамилия</th>
              <th>Должность</th>
              <th>Участок</th>
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
                        fieldName: "login",
                        initVal: item.login,
                        tdClassName: "loginCell",
                        errMess: editLoginErr,
                        errClassName: "errMess"
                      })
                    }
                    {
                      editableTableCell({
                        rowKey: item._id,
                        fieldName: "password",
                        initVal: item.password,
                        tdClassName: "passwordCell",
                        errMess: editPasswordErr,
                        errClassName: "errMess"
                      })
                    }
                    {
                      editableTableCell({
                        rowKey: item._id,
                        fieldName: "name",
                        initVal: item.name,
                        tdClassName: "nameCell",
                        errMess: editNameErr,
                        errClassName: "errMess"
                      })
                    }
                    {
                      editableTableCell({
                        rowKey: item._id,
                        fieldName: "fatherName",
                        initVal: item.fatherName,
                        tdClassName: "fatherNameCell",
                        errMess: editFatherNameErr,
                        errClassName: "errMess"
                      })
                    }
                    {
                      editableTableCell({
                        rowKey: item._id,
                        fieldName: "surname",
                        initVal: item.surname,
                        tdClassName: "surnameCell",
                        errMess: editSurnameErr,
                        errClassName: "errMess"
                      })
                    }
                    {
                      editableTableCell({
                        rowKey: item._id,
                        fieldName: "sector",
                        initVal: item.sector,
                        tdClassName: "sectorCell",
                        errMess: editSectorErr,
                        errClassName: "errMess"
                      })
                    }
                    {
                      editableTableCell({
                        rowKey: item._id,
                        fieldName: "post",
                        initVal: item.post,
                        tdClassName: "postCell",
                        errMess: editPostErr,
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
                    <td colSpan="9" className="d">
                      <h5>Роли</h5>
                      {
                        roleAbbrs &&
                        roleAbbrs.map((role) => (
                          <p key={`chb_${item._id}_${role._id}`}>
                            <label>
                              <input type="checkbox"
                                     className="filled-in"
                                     checked={
                                       item.roles &&
                                       item.roles.includes(role._id)
                                     }
                                     onChange={() => onChangeRole({ parentId: item._id,
                                                                    roleId: role._id })}
                              />
                              <span>{role.englAbbreviation}</span>
                            </label>
                          </p>
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
