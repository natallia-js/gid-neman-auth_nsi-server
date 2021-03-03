import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App/App';
//import reportWebVitals from './reportWebVitals';

/*
  StrictMode is a tool for highlighting potential problems in an application.
  It activates additional checks and warnings for its descendants, such as:

  - Identifying components with unsafe lifecycles
  - Warning about legacy string ref API usage
  - Warning about deprecated findDOMNode usage
  - Detecting unexpected side effects
  - Detecting legacy context API
 */

ReactDOM.render(
  //<React.StrictMode>
    <App />
  //</React.StrictMode>
  ,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
