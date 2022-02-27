import React from 'react';
import ReactDOM from 'react-dom';
import * as serviceWorker from './serviceWorker';
import { initAmplitude } from './utils/amplitude';

/* Fonts */
import 'typeface-roboto/index.css';
import 'typeface-lato/index.css';
import 'typeface-montserrat/index.css';
import 'typeface-open-sans/index.css';
import 'typeface-oswald/index.css';
import 'typeface-playfair-display/index.css';
import 'typeface-poppins/index.css';
import 'typeface-raleway/index.css';
import 'typeface-source-sans-pro/index.css';

/* Styles */
import 'font-awesome/css/font-awesome.min.css';
import 'react-datasheet/lib/react-datasheet.css';
import 'react-virtualized/styles.css';
import 'react-perfect-scrollbar/dist/css/styles.css';
import 'jexcel/dist/jexcel.css';
import 'react-resizable/css/styles.css';
import './styles/react-data-grid.scss';
import 'react-sortable-tree/style.css';
import './styles/main.scss';

import App from './App';

initAmplitude();

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
