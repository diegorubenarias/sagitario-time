class TimeTracker extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          #container { 
            font-family: Arial, sans-serif; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            padding: 20px;
          }
          .content-wrapper { 
            display: flex; 
            justify-content: space-between; 
            width: 100%; 
            max-width: 900px;
          }
          .left-column { 
            width: 70%; 
            display: flex; 
            flex-direction: column; 
            gap: 10px; 
          }
          .right-column { 
            width: 28%; 
            display: flex; 
            flex-direction: column; 
            gap: 20px; 
          }
          .day-entry { 
            margin-bottom: 10px; 
            display: flex; 
            align-items: center; 
            gap: 10px;
          }
          .disabled { 
            color: grey; 
            opacity: 0.6; 
            pointer-events: none; 
          }
          input[type="time"] { 
            padding: 5px; 
            font-size: 14px; 
          }
          button { 
            padding: 10px 20px; 
            background-color: #4CAF50; 
            color: white; 
            border: none; 
            cursor: pointer;
            font-size: 16px;
          }
          button:hover { 
            background-color: #45a049; 
          }
          .total { 
            font-weight: bold; 
            font-size: 18px; 
          }
          .total-salary { 
            font-size: 20px; 
            color: green; 
          }
          .download-btn {
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #2196F3;
            color: white;
            border: none;
            cursor: pointer;
            font-size: 16px;
          }
          .download-btn:hover {
            background-color: #1976D2;
          }
        </style>
        <div id="container">
          <h2>Registro de Horas</h2>
          <div class="content-wrapper">
            <!-- Left Column -->
            <div class="left-column">
              <label for="month">Selecciona el mes:</label>
              <input type="month" id="month" />
              <button id="generate">Generar Días</button>
              <div id="days-container"></div>
            </div>
  
            <!-- Right Column -->
            <div class="right-column">
              <hour-rate-config></hour-rate-config>
              <div id="total-hours" class="total">Total de horas: 00:00</div>
              <div id="total-salary" class="total-salary">Sueldo total: $0.00</div>
              <button class="download-btn" id="download">Descargar Reporte</button>
            </div>
          </div>
        </div>
      `;
    }
  
    connectedCallback() {
      this.shadowRoot.querySelector('#generate').addEventListener('click', () => this.generateDays());
      this.shadowRoot.querySelector('#download').addEventListener('click', () => this.downloadReport());
    }
  
    generateDays() {
      const monthInput = this.shadowRoot.querySelector('#month').value;
      const daysContainer = this.shadowRoot.querySelector('#days-container');
      daysContainer.innerHTML = ''; // Limpiar la lista anterior
      
      if (!monthInput) return;
  
      const [year, month] = monthInput.split('-');
      const daysInMonth = new Date(year, month, 0).getDate();
  
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const isSunday = date.getDay() === 0;
  
        const dayEntry = document.createElement('div');
        dayEntry.classList.add('day-entry');
        if (isSunday) dayEntry.classList.add('disabled');
  
        dayEntry.innerHTML = `
          <span>${day}/${month}/${year}</span>
          <input type="time" class="start-time" ${isSunday ? 'disabled' : ''} />
          <input type="time" class="end-time" ${isSunday ? 'disabled' : ''} />
          <span class="daily-hours">00:00</span>
        `;
        daysContainer.appendChild(dayEntry);
      }
  
      this.shadowRoot.querySelectorAll('.start-time, .end-time').forEach(input => {
        input.addEventListener('change', () => this.calculateHours());
      });
    }
  
    calculateHours() {
      let totalMinutes = 0;
      const dayEntries = this.shadowRoot.querySelectorAll('.day-entry');
  
      dayEntries.forEach(entry => {
        const startTime = entry.querySelector('.start-time').value;
        const endTime = entry.querySelector('.end-time').value;
        const dailyHoursSpan = entry.querySelector('.daily-hours');
  
        if (startTime && endTime) {
          const start = new Date(`1970-01-01T${startTime}`);
          const end = new Date(`1970-01-01T${endTime}`);
          let diffMinutes = (end - start) / (1000 * 60); // Convertir ms a minutos
          
          if (diffMinutes > 0) {
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;
            dailyHoursSpan.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            totalMinutes += diffMinutes;
          } else {
            dailyHoursSpan.textContent = '00:00';
          }
        } else {
          dailyHoursSpan.textContent = '00:00';
        }
      });
  
      // Calcular y mostrar el total de horas
      const totalHours = Math.floor(totalMinutes / 60);
      const totalRemainingMinutes = totalMinutes % 60;
      this.shadowRoot.querySelector('#total-hours').textContent = `Total de horas: ${String(totalHours).padStart(2, '0')}:${String(totalRemainingMinutes).padStart(2, '0')}`;
  
      // Calcular y mostrar el sueldo total
      this.calculateSalary(totalMinutes);
    }
  
    calculateSalary(totalMinutes) {
      const hourRate = parseFloat(localStorage.getItem('hourRate')) || 0;
      const totalHoursDecimal = totalMinutes / 60;
      const totalSalary = totalHoursDecimal * hourRate;
  
      this.shadowRoot.querySelector('#total-salary').textContent = `Sueldo total: $${totalSalary.toFixed(2)}`;
    }
  
    downloadReport() {
      const monthInput = this.shadowRoot.querySelector('#month').value;
      const totalHours = this.shadowRoot.querySelector('#total-hours').textContent;
      const totalSalary = this.shadowRoot.querySelector('#total-salary').textContent;
      let reportText = `Reporte de horas - Mes: ${monthInput}\n\n`;
  
      // Agregar las horas diarias
      const dayEntries = this.shadowRoot.querySelectorAll('.day-entry');
      dayEntries.forEach(entry => {
        const date = entry.querySelector('span').textContent;
        const dailyHours = entry.querySelector('.daily-hours').textContent;
        reportText += `Fecha: ${date} - Horas trabajadas: ${dailyHours}\n`;
      });
  
      reportText += `\n${totalHours}\n${totalSalary}`;
  
      // Crear un blob y generar el enlace de descarga
      const blob = new Blob([reportText], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reporte_horas_${monthInput}.txt`;
      link.click();
    }
  }
  
  customElements.define('time-tracker', TimeTracker);
  