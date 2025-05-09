import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import ReactDOM from 'react-dom/client';
import './assets/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { HashRouter } from 'react-router-dom';
import {MetaProvider} from "./components/MetaContext";


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    // Using hash router because of GitHub Pages errors. Used to use BrowserRouter
    <MetaProvider>
        <HashRouter>
            <App />
        </HashRouter>
    </MetaProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
