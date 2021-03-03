import React, { useState } from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import Chip from '@material-ui/core/Chip';
import { makeStyles } from '@material-ui/core/styles';


const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
    maxWidth: 300,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 2,
  },
  noLabel: {
    marginTop: theme.spacing(3),
  },
}));


/**
 * Компонент выпадающего списка с возможностью осуществления множественного выбора.
 *
 * @param {object} props - объект свойства компонента с полями:
 *                         labelClassName - className-свойство для элемента с текстом подписи
 *                                          элемента множественного выбора,
 *                         className - className-свойство для элемента множественного выбора,
 *                         id - уникальный id компонента,
 *                         lblText - текст подписи элемента множественного выбора,
 *                         options - массив отображаемых в компоненте строк (строки не
 *                                   должны повторяться!),
 *                         selectedOptions - массив строк (подмассив options), которые должны
 *                                           быть отмечены как выбранные при загрузке компонента,
 *                         onOpenCallback - callback-функция, которая вызывается при открытии выпадающего
 *                                          списка; данной функции передается массив selectedOptions
 *                         onChangeCallback - callback-функция, которая вызывается при изменении
 *                                            состояния checked chekbox-элемента
 *                         onCloseCallback - callback-функция, которая вызывается при закрытии
 *                                           выпадающего списка
 */
const MultipleSelect = (props) => {
  const { labelClassName,
          className,
          id,
          lblText,
          options,
          selectedOptions,
          onCloseCallback } = props;

  const classes = useStyles();

  const [selectedVals, setSelectedVals] = useState(selectedOptions);


  return (
    <React.Fragment key={id}>
      <InputLabel className={labelClassName}
                  id={`lbl${id}`}>
        {lblText}
      </InputLabel>
      <Select
        className={className}
        key={`sel${id}`}
        labelId={`lbl${id}`}
        multiple
        value={selectedVals}
        renderValue={(selected) => (
          <div className={classes.chips}>
            {selected.map((value, index) => (
              <Chip key={`chip${id}${index}`} label={value} className={classes.chip} />
            ))}
          </div>
        )}
        onChange={(event) => setSelectedVals(event.target.value)}
        onClose={() => onCloseCallback(selectedVals)}
      >
        {
          options &&
          options.map((opt, index) => (
            <MenuItem key={`mi${id}_${index}`}
                      value={opt}>
              <Checkbox checked={selectedVals && selectedVals.indexOf(opt) > -1} />
              <ListItemText primary={opt} />
            </MenuItem>
          ))
        }
      </Select>
    </React.Fragment>
  );
}


export default MultipleSelect;
