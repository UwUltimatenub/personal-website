import './styles.css';
import { initCadViewer } from './cad-viewer.js';

document.querySelector('#year').textContent = new Date().getFullYear();
initCadViewer();
