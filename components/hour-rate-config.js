class HourRateConfig extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          label { 
            margin-bottom: 10px; 
            font-size: 14px; 
          }
          input[type="number"] {
            width: 100px;
            padding: 5px;
            font-size: 14px;
          }
        </style>
        <label for="hour-rate">Valor hora:</label>
        <input type="number" id="hour-rate" min="0" step="0.01" />
      `;
    }
  
    connectedCallback() {
      const storedRate = localStorage.getItem('hourRate');
      if (storedRate) {
        this.shadowRoot.querySelector('#hour-rate').value = storedRate;
      }
  
      this.shadowRoot.querySelector('#hour-rate').addEventListener('input', (e) => {
        const rate = parseFloat(e.target.value);
        if (!isNaN(rate) && rate >= 0) {
          localStorage.setItem('hourRate', rate);
        }
      });
    }
  }
  
  customElements.define('hour-rate-config', HourRateConfig);
  