// ==========================================================================
// PC-CORE - MANUAL DE MANTENIMIENTO PREVENTIVO Y CORRECTIVO (HW & SW)
// Lógica de interacción, Doctor PC, Checklist y Búsqueda en tiempo real
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // 2. Inicializar Fondo de Circuito / Partículas en Canvas
  initCanvasBackground();

  // 3. Inicializar Filtros y Búsqueda Global
  initFiltersAndSearch();

  // 4. Inicializar Doctor PC (Triaje Interactivo)
  initDoctorPC();

  // 5. Inicializar Checklist con LocalStorage
  initChecklist();

  // 6. Navegación Móvil
  initMobileMenu();
});

// --------------------------------------------------------------------------
// 1. Fondo Dinámico Canvas (Partículas y Nodos Tecnológicos)
// --------------------------------------------------------------------------
function initCanvasBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = Math.min(Math.floor(width / 35), 45);

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Dibujar conexiones entre partículas cercanas
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 130) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.15 * (1 - dist / 130)})`;
          ctx.lineWidth = 0.8;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Dibujar y mover partículas
    for (let p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.fill();
    }

    requestAnimationFrame(render);
  }

  render();
}

// --------------------------------------------------------------------------
// 2. Filtros y Búsqueda en Tiempo Real
// --------------------------------------------------------------------------
let activeFilter = 'all'; // all | preventivo | correctivo
let activeSubfilter = 'all'; // all | hw | sw
let searchQuery = '';

function initFiltersAndSearch() {
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const searchFeedback = document.getElementById('search-feedback');
  const searchQueryText = document.getElementById('search-query-text');

  // Input de búsqueda
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      if (searchQuery.length > 0) {
        clearSearchBtn.classList.remove('hidden');
        searchFeedback.classList.remove('hidden');
        searchQueryText.textContent = `"${e.target.value}"`;
      } else {
        clearSearchBtn.classList.add('hidden');
        searchFeedback.classList.add('hidden');
      }
      applyFilters();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      searchFeedback.classList.add('hidden');
      applyFilters();
      searchInput.focus();
    });
  }

  // Botones de filtro principal (Preventivo / Correctivo)
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => {
        b.classList.remove('active', 'bg-cyan-600', 'text-white');
        b.classList.add('bg-slate-800', 'text-slate-300');
      });
      btn.classList.add('active', 'bg-cyan-600', 'text-white');
      btn.classList.remove('bg-slate-800', 'text-slate-300');
      activeFilter = btn.dataset.filter;
      applyFilters();
    });
  });

  // Botones de subfiltro (HW / SW)
  const subfilterBtns = document.querySelectorAll('.subfilter-btn');
  subfilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      subfilterBtns.forEach((b) => {
        b.classList.remove('active', 'bg-slate-700', 'text-cyan-300', 'border-cyan-500/40');
        b.classList.add('bg-slate-800', 'text-slate-300', 'border-transparent');
      });
      btn.classList.add('active', 'bg-slate-700', 'text-cyan-300', 'border-cyan-500/40');
      btn.classList.remove('bg-slate-800', 'text-slate-300', 'border-transparent');
      activeSubfilter = btn.dataset.subfilter;
      applyFilters();
    });
  });
}

function applyFilters() {
  const sections = document.querySelectorAll('.guide-section');
  const cards = document.querySelectorAll('.card-item');

  // Filtrar Secciones Generales
  sections.forEach((sec) => {
    const secCategory = sec.dataset.category;
    let showSection = true;

    if (activeFilter !== 'all' && secCategory !== activeFilter) {
      showSection = false;
    }

    sec.style.display = showSection ? 'block' : 'none';
  });

  // Filtrar Bloques HW / SW dentro de las secciones
  const contentBlocks = document.querySelectorAll('.content-block');
  contentBlocks.forEach((block) => {
    const blockType = block.dataset.type;
    let showBlock = true;

    if (activeSubfilter !== 'all' && blockType !== activeSubfilter) {
      showBlock = false;
    }

    block.style.display = showBlock ? 'block' : 'none';
  });

  // Filtrar Tarjetas Individuales por Búsqueda
  cards.forEach((card) => {
    if (!searchQuery) {
      card.style.display = 'flex';
      return;
    }

    const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
    const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
    const keywords = card.dataset.keywords?.toLowerCase() || '';
    const textContent = card.textContent.toLowerCase();

    const matches =
      title.includes(searchQuery) ||
      desc.includes(searchQuery) ||
      keywords.includes(searchQuery) ||
      textContent.includes(searchQuery);

    card.style.display = matches ? 'flex' : 'none';
  });
}

// --------------------------------------------------------------------------
// 3. Base de Datos Técnica y Lógica de "Doctor PC"
// --------------------------------------------------------------------------
const triageData = {
  hw: [
    {
      id: 'no-power',
      name: 'El equipo no enciende en lo absoluto (cero luces / ventiladores)',
      title: 'Falla en Suministro de Poder o Cortocircuito en Placa Madre',
      probability: '95% Probabilidad',
      risk: 'Crítico / Riesgo Eléctrico',
      cause: 'Fuente de poder dañada, cable de poder suelto/dañado, conector de 24 pines flojo, o cortocircuito de protección en la tarjeta madre.',
      steps: [
        '1. Probar en otra toma eléctrica de pared sin reguladores intermedios.',
        '2. Desconectar todos los periféricos USB (memorias, ratones, cables) para descartar cortocircuitos externos.',
        '3. Probar el botón de encendido del gabinete: puentear momentáneamente los dos pines de POWER SW en la tarjeta madre con un destornillador plano.',
        '4. Si no arranca, realizar la "prueba del clip de papel" en la fuente de poder desconectada de la motherboard.',
      ],
      command: null,
    },
    {
      id: 'no-video',
      name: 'Encienden las luces y ventiladores, pero la pantalla queda en negro',
      title: 'Falla en Inicialización de POST (Memoria RAM o BIOS)',
      probability: '90% Probabilidad',
      risk: 'Moderado',
      cause: 'Contactos dorados de la RAM con suciedad/sulfato, módulo de memoria averiado, BIOS desconfigurado o tarjeta gráfica mal asentada.',
      steps: [
        '1. Desconectar la PC de la corriente, retirar los módulos de memoria RAM.',
        '2. Limpiar los contactos dorados suavemente con una goma de borrar blanca y alcohol isopropílico.',
        '3. Insertar un único módulo de RAM en el Slot 2 (DDR4/DDR5) y probar.',
        '4. Efectuar un Clear CMOS retirando la pila de botón CR2032 durante 5 a 10 minutos.',
      ],
      command: 'mdsched.exe (al iniciar Windows)',
    },
    {
      id: 'high-temp',
      name: 'La PC se apaga sola de repente al jugar o abrir programas pesados',
      title: 'Apagado por Sobrecalentamiento Crítico (Thermal Throttling / Cut-off)',
      probability: '92% Probabilidad',
      risk: 'Alto (Riesgo de degradación de silicio)',
      cause: 'Pasta térmica seca o pulverizada, disipador desajustado, bomba de enfriamiento líquido AIO trabada o exceso de polvo en los radiadores.',
      steps: [
        '1. Verificar en BIOS las temperaturas en reposo (normal: 35°-48°C; si marca >70°C en BIOS, hay falla de montaje).',
        '2. Desmontar el disipador, limpiar a fondo con alcohol isopropílico y aplicar pasta térmica fresca de alta calidad.',
        '3. Verificar que el conector de 4 pines del CPU_FAN esté debidamente enchufado a la placa madre.',
        '4. En sistemas con AIO líquida: tocar las dos mangueras; una debe estar más tibia que la otra. Si una vibra y la otra quema, la bomba falló.',
      ],
      command: null,
    },
    {
      id: 'disk-noise',
      name: 'Ruidos metálicos o "clics" repetitivos y congelamiento constante',
      title: 'Falla Mecánica Inminente de Disco Duro (Click of Death)',
      probability: '98% Probabilidad',
      risk: 'Extremo (Pérdida Inminente de Archivos)',
      cause: 'Cabezal de lectura/escritura golpeando los platos magnéticos por desgaste físico o caída del equipo.',
      steps: [
        '1. ¡URGENTE! NO intentar desfragmentar ni someter el disco a pruebas de estrés.',
        '2. Conectar un disco externo o almacenamiento en la nube y respaldar los documentos más cruciales primero.',
        '3. Reemplazar de inmediato el HDD mecánico dañado por una unidad de estado sólido (SSD NVMe o SATA).',
      ],
      command: 'wmic diskdrive get status,model',
    },
  ],
  sw: [
    {
      id: 'bsod',
      name: 'Pantallazos azules frecuentes (BSOD) con códigos de error',
      title: 'Conflicto de Kernel / Controlador Corrupto o Falla de Memoria',
      probability: '88% Probabilidad',
      risk: 'Medio a Alto',
      cause: 'Controlador de gráficos o chipset desactualizado o en conflicto, archivos del núcleo de Windows corruptos o sectores dañados.',
      steps: [
        '1. Anotar el código de parada (ej: DRIVER_IRQL_NOT_LESS_OR_EQUAL o MEMORY_MANAGEMENT).',
        '2. Iniciar en Modo Seguro y ejecutar la herramienta de diagnóstico de memoria de Windows.',
        '3. Usar Display Driver Uninstaller (DDU) para reinstalar en limpio el controlador de video.',
        '4. Reparar el almacén del sistema ejecutando SFC y DISM como Administrador.',
      ],
      command: 'sfc /scannow',
    },
    {
      id: 'high-cpu-disk',
      name: 'La PC está insoportablemente lenta y el Administrador muestra CPU o Disco al 100%',
      title: 'Sobrecarga de I/O, Bucle de Actualizaciones o Malware Minero',
      probability: '91% Probabilidad',
      risk: 'Moderado',
      cause: 'Bucle en Windows Update / SysMain (SuperFetch), indexación descontrolada de archivos o procesos en segundo plano no autorizados.',
      steps: [
        '1. Abrir el Administrador de Tareas (Ctrl + Shift + Esc) y ordenar la columna CPU y Disco de mayor a menor.',
        '2. Deshabilitar programas pesados en la pestaña "Aplicaciones de inicio".',
        '3. En servicios (services.msc), detener temporalmente "Windows Search" y "SysMain" para verificar si baja la carga de disco.',
        '4. Ejecutar un escaneo completo con Windows Defender Offline.',
      ],
      command: 'DISM /Online /Cleanup-Image /RestoreHealth',
    },
    {
      id: 'no-internet',
      name: 'Conectado a la red Wi-Fi / Cable pero aparece "Sin acceso a Internet"',
      title: 'Pila de Red Corrupta, Conflicto de IP o Caché DNS Vencida',
      probability: '85% Probabilidad',
      risk: 'Bajo',
      cause: 'Caché DNS saturada, configuración IP manual desfasada, o adaptador de red bloqueado por antivirus/VPN.',
      steps: [
        '1. Reiniciar el router/módem (desconectar 30 segundos de la corriente).',
        '2. Vaciar la caché DNS y renovar la concesión de dirección IP.',
        '3. Restablecer el catálogo de Winsock y la pila TCP/IP.',
        '4. Probar configurando temporalmente los servidores DNS públicos de Google (8.8.8.8 y 8.8.4.4) o Cloudflare (1.1.1.1).',
      ],
      command: 'ipconfig /flushdns',
    },
    {
      id: 'boot-loop',
      name: 'Windows entra en bucle infinito de "Reparación automática"',
      title: 'Corrupción del Registro de Arranque (BCD / MBR / EFI)',
      probability: '94% Probabilidad',
      risk: 'Alto',
      cause: 'Corte de energía durante una actualización de Windows, apagado forzado o corrupción del sistema de archivos NTFS.',
      steps: [
        '1. Desde la pantalla azul de WinRE, seleccionar "Opciones avanzadas" -> "Símbolo del sistema".',
        '2. Ejecutar comandos para reparar la tabla de particiones y el BCD.',
        '3. Ejecutar chkdsk para reparar sectores lógicos.',
        '4. Si no inicia, seleccionar "Restaurar sistema" a un punto anterior.',
      ],
      command: 'bootrec /rebuildbcd',
    },
  ],
};

function initDoctorPC() {
  const areaSelect = document.getElementById('doctor-area');
  const symptomSelect = document.getElementById('doctor-symptom');
  if (!areaSelect || !symptomSelect) return;

  function populateSymptoms(areaKey) {
    symptomSelect.innerHTML = '';
    const items = triageData[areaKey] || [];
    items.forEach((item, index) => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.name;
      symptomSelect.appendChild(option);
    });
    renderTriageResult(areaKey, symptomSelect.value);
  }

  areaSelect.addEventListener('change', (e) => {
    populateSymptoms(e.target.value);
  });

  symptomSelect.addEventListener('change', (e) => {
    renderTriageResult(areaSelect.value, e.target.value);
  });

  // Inicializar con la primera opción
  populateSymptoms('hw');
}

function renderTriageResult(areaKey, symptomId) {
  const list = triageData[areaKey] || [];
  const current = list.find((i) => i.id === symptomId) || list[0];
  if (!current) return;

  const titleEl = document.getElementById('doctor-result-title');
  const probEl = document.getElementById('doctor-result-prob');
  const levelEl = document.getElementById('doctor-result-level');
  const causeEl = document.getElementById('doctor-result-cause');
  const stepsEl = document.getElementById('doctor-result-steps');
  const cmdBox = document.getElementById('doctor-result-command-box');
  const cmdEl = document.getElementById('doctor-result-command');
  const copyBtn = document.getElementById('doctor-copy-btn');

  titleEl.textContent = current.title;
  probEl.textContent = current.probability;
  levelEl.textContent = `Nivel: ${current.risk}`;
  causeEl.textContent = current.cause;

  // Renderizar Pasos
  stepsEl.innerHTML = '';
  current.steps.forEach((step) => {
    const p = document.createElement('p');
    p.className = 'py-1 border-b border-slate-800/60 last:border-0';
    p.textContent = step;
    stepsEl.appendChild(p);
  });

  // Comando
  if (current.command) {
    cmdBox.classList.remove('hidden');
    cmdEl.textContent = current.command;
    copyBtn.onclick = () => copyCommand(current.command, copyBtn);
  } else {
    cmdBox.classList.add('hidden');
  }

  // Refrescar iconos Lucide si es necesario
  if (window.lucide) {
    lucide.createIcons();
  }
}

// --------------------------------------------------------------------------
// 4. Checklist Técnico Interactivo con LocalStorage
// --------------------------------------------------------------------------
const checklistData = {
  mensual: [
    { id: 'm1', text: 'Limpieza superficial de teclado, pantalla y gabinete exterior con paño microfibra' },
    { id: 'm2', text: 'Ejecutar Liberador de Espacio en disco (cleanmgr) o limpiar archivos temporales (%temp%)' },
    { id: 'm3', text: 'Revisión y ejecución de Windows Update para parches de seguridad críticos' },
    { id: 'm4', text: 'Verificación del estado del antivirus y escaneo rápido de rutina' },
  ],
  trimestral: [
    { id: 't1', text: 'Limpieza con aire comprimido de ventiladores y rejillas disipadoras de calor' },
    { id: 't2', text: 'Lavado y secado completo de filtros antipolvo magnéticos del gabinete' },
    { id: 't3', text: 'Revisión del estado de salud de discos SSD/HDD mediante comando S.M.A.R.T.' },
    { id: 't4', text: 'Creación y verificación de un punto de restauración del sistema' },
  ],
  semestral: [
    { id: 's1', text: 'Inspección de pasta térmica de CPU/GPU (reemplazar si supera 1-2 años)' },
    { id: 's2', text: 'Limpieza de contactos dorados de memorias RAM con alcohol isopropílico 99%' },
    { id: 's3', text: 'Prueba de respaldo total 3-2-1 y verificación de restauración de archivos' },
    { id: 's4', text: 'Prueba de carga del sistema UPS / No-Break y calibración de baterías' },
  ],
};

function initChecklist() {
  const containerM = document.getElementById('tasks-mensual');
  const containerT = document.getElementById('tasks-trimestral');
  const containerS = document.getElementById('tasks-semestral');
  const resetBtn = document.getElementById('reset-checklist-btn');

  if (!containerM || !containerT || !containerS) return;

  const savedState = JSON.parse(localStorage.getItem('pccore_checklist') || '{}');

  function renderGroup(tasks, container) {
    container.innerHTML = '';
    tasks.forEach((task) => {
      const isChecked = !!savedState[task.id];
      const div = document.createElement('div');
      div.className =
        'flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs hover:border-slate-700 transition-colors cursor-pointer';
      div.innerHTML = `
        <input type="checkbox" id="${task.id}" class="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer" ${
        isChecked ? 'checked' : ''
      }>
        <label for="${task.id}" class="text-slate-300 cursor-pointer select-none leading-relaxed ${
        isChecked ? 'line-through text-slate-500' : ''
      }">
          ${task.text}
        </label>
      `;

      const input = div.querySelector('input');
      const label = div.querySelector('label');

      div.addEventListener('click', (e) => {
        if (e.target !== input) {
          input.checked = !input.checked;
        }
        savedState[task.id] = input.checked;
        localStorage.setItem('pccore_checklist', JSON.stringify(savedState));
        if (input.checked) {
          label.classList.add('line-through', 'text-slate-500');
        } else {
          label.classList.remove('line-through', 'text-slate-500');
        }
        updateProgress();
      });

      container.appendChild(div);
    });
  }

  renderGroup(checklistData.mensual, containerM);
  renderGroup(checklistData.trimestral, containerT);
  renderGroup(checklistData.semestral, containerS);

  function updateProgress() {
    const allTasks = [
      ...checklistData.mensual,
      ...checklistData.trimestral,
      ...checklistData.semestral,
    ];
    const total = allTasks.length;
    let completed = 0;
    allTasks.forEach((t) => {
      if (savedState[t.id]) completed++;
    });

    const percent = Math.round((completed / total) * 100);
    const bar = document.getElementById('checklist-progress-bar');
    const text = document.getElementById('checklist-progress-text');
    if (bar) bar.style.width = `${percent}%`;
    if (text) text.textContent = `${percent}% (${completed}/${total})`;
  }

  updateProgress();

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('¿Deseas reiniciar todas las casillas del checklist?')) {
        localStorage.removeItem('pccore_checklist');
        for (let key in savedState) delete savedState[key];
        initChecklist();
      }
    });
  }
}

// --------------------------------------------------------------------------
// 5. Sistema de Modales y Guías Detalladas
// --------------------------------------------------------------------------
const detailedGuides = {
  'limpieza-hw': {
    title: 'Protocolo Maestro: Limpieza Profunda de Gabinete y Componentes',
    badge: 'Mantenimiento Preventivo HW',
    icon: 'fan',
    body: `
      <div class="space-y-4">
        <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
          <strong>Advertencia de Seguridad:</strong> Siempre desconecta el cable de poder de la fuente y presiona el botón de encendido 3 veces con el equipo desconectado para drenar los capacitores antes de abrir el chasis.
        </div>
        <h4 class="font-bold text-white text-sm">Herramientas Necesarias:</h4>
        <ul class="list-disc list-inside text-xs space-y-1 text-slate-300">
          <li>Lata de aire comprimido o soplador electrónico antiestático.</li>
          <li>Brocha de cerdas de nylon antiestáticas.</li>
          <li>Alcohol isopropílico al 99% (no medicinal ni etílico).</li>
          <li>Paños de microfibra de alta densidad sin pelusa.</li>
        </ul>
        <h4 class="font-bold text-white text-sm">Pasos de Ejecución:</h4>
        <ol class="list-decimal list-inside text-xs space-y-2 text-slate-300">
          <li><strong>Inmovilizar aspas:</strong> Al soplar ventiladores (gabinete, CPU o GPU), sujeta físicamente las aspas con el dedo o un palillo. Si giran a altas revoluciones por el aire comprimido, actuarán como dínamos generando corriente inversa que puede quemar la placa madre.</li>
          <li><strong>Limpiar disipador:</strong> Dirige ráfagas cortas de aire seco a través de las aletas de aluminio del disipador de adentro hacia afuera.</li>
          <li><strong>Filtros antipolvo:</strong> Retira los filtros magnéticos del chasis y lávalos con agua tibia. Deja secar totalmente por 2 horas al aire libre antes de volver a instalarlos.</li>
        </ol>
      </div>
    `,
  },
  'pasta-termica': {
    title: 'Procedimiento de Sustitución de Pasta Térmica (CPU / GPU)',
    badge: 'Mantenimiento Preventivo & Correctivo HW',
    icon: 'flame',
    body: `
      <div class="space-y-4">
        <h4 class="font-bold text-white text-sm">¿Cuándo se debe cambiar?</h4>
        <p class="text-xs text-slate-300">Cada 12 a 24 meses, o cuando las temperaturas superen los 85°C en pruebas de estrés sostenidas.</p>
        <h4 class="font-bold text-white text-sm">Pasos de Aplicación Impecable:</h4>
        <ol class="list-decimal list-inside text-xs space-y-2 text-slate-300">
          <li><strong>Precalentar ligeramente:</strong> Si la pasta vieja está muy seca, enciende la PC 5 minutos antes para que el calor la ablande y el disipador no se pegue al procesador.</li>
          <li><strong>Girar, no tirar:</strong> Al retirar el disipador, haz movimientos suaves de rotación izquierda-derecha antes de levantarlo para evitar arrancar el CPU de su socket (especialmente en sockets AMD PGA como AM4).</li>
          <li><strong>Limpieza:</strong> Remoja un paño con alcohol isopropílico 99% y limpia el IHS metálico del procesador y la base del disipador hasta que queden como un espejo.</li>
          <li><strong>Aplicación:</strong> Coloca un punto del tamaño de un guisante (pea method) o una "X" delgada en el centro. El montaje del disipador con tornillos cruzados distribuirá la pasta de forma homogénea sin burbujas.</li>
        </ol>
      </div>
    `,
  },
  'energia-prev': {
    title: 'Guía de Acondicionamiento Eléctrico y Protección de Hardware',
    badge: 'Mantenimiento Preventivo HW',
    icon: 'zap',
    body: `
      <div class="space-y-4">
        <p class="text-xs text-slate-300">Las anomalías eléctricas causan degradación silenciosa en capacitores electrolíticos y componentes MOSFET.</p>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <span class="font-bold text-cyan-400 block mb-1">Regulador de Voltaje:</span>
            Mantiene los 120V / 220V estables compensando caídas de tensión (brownouts).
          </div>
          <div class="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <span class="font-bold text-emerald-400 block mb-1">UPS / No-Break:</span>
            Regulador + Batería de emergencia que otorga 10-20 min para guardar trabajo y apagar seguro.
          </div>
        </div>
        <h4 class="font-bold text-white text-sm">Regla de la Tierra Física:</h4>
        <p class="text-xs text-slate-300">Si sientes una ligera vibración o cosquilleo al pasar los dedos por el chasis metálico de la computadora, tu instalación eléctrica carece de tierra física o tiene fase invertida. Llama a un electricista certificado.</p>
      </div>
    `,
  },
  'backup-321': {
    title: 'Implementación Práctica de la Estrategia de Respaldo 3-2-1',
    badge: 'Mantenimiento Preventivo SW',
    icon: 'hard-drive-download',
    body: `
      <div class="space-y-4">
        <p class="text-xs text-slate-300">La única cura 100% efectiva contra el secuestro de datos por Ransomware o la rotura súbita de un SSD es un respaldo aislado e inmutable.</p>
        <div class="space-y-2 text-xs">
          <div class="p-3 bg-slate-900 border-l-4 border-cyan-500 rounded-r-xl">
            <strong>3 Copias:</strong> Datos originales en tu PC + Copia local + Copia remota.
          </div>
          <div class="p-3 bg-slate-900 border-l-4 border-emerald-500 rounded-r-xl">
            <strong>2 Medios diferentes:</strong> Tu SSD interno principal y un disco externo o NAS conectado por red local.
          </div>
          <div class="p-3 bg-slate-900 border-l-4 border-indigo-500 rounded-r-xl">
            <strong>1 Copia fuera del sitio (Off-Site):</strong> En la nube (OneDrive, Google Drive, Backblaze B2, AWS S3) con autenticación en dos factores (2FA).
          </div>
        </div>
      </div>
    `,
  },
  'ssd-opt': {
    title: 'Optimización y Salud de Unidades de Estado Sólido (SSD)',
    badge: 'Mantenimiento Preventivo SW',
    icon: 'database',
    body: `
      <div class="space-y-4">
        <div class="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
          <strong>¡PROHIBIDO DESFRAGMENTAR UN SSD!:</strong> La memoria NAND Flash no tiene cabezales mecánicos. Desfragmentar consume ciclos de vida TBW (Terabytes Written) inútilmente.
        </div>
        <h4 class="font-bold text-white text-sm">Prácticas Correctas para SSDs:</h4>
        <ul class="list-disc list-inside text-xs space-y-1.5 text-slate-300">
          <li><strong>Habilitar comando TRIM:</strong> Permite que el sistema operativo informe al SSD qué bloques de datos ya no se usan para que se borren internamente.</li>
          <li><strong>Mantener 20% libre:</strong> Si un SSD se llena por encima del 85-90%, su rendimiento cae dramáticamente por falta de espacio para el algoritmo de recolección de basura (Garbage Collection).</li>
        </ul>
        <div class="p-2.5 bg-black rounded font-mono text-xs text-emerald-400">
          fsutil behavior query DisableDeleteNotify
        </div>
        <span class="text-[11px] text-slate-400">Si devuelve 0, TRIM está correctamente activo en Windows.</span>
      </div>
    `,
  },
  'seguridad-sw': {
    title: 'Puesta a Punto de Seguridad y Control de Inicio en Windows',
    badge: 'Mantenimiento Preventivo SW',
    icon: 'shield-alert',
    body: `
      <div class="space-y-4">
        <h4 class="font-bold text-white text-sm">1. Depurar Programas de Inicio</h4>
        <p class="text-xs text-slate-300">Presiona <code class="text-cyan-400">Ctrl + Shift + Esc</code>, ve a la pestaña "Aplicaciones de arranque" y deshabilita aplicaciones pesadas como lanzadores de juegos, clientes de mensajería innecesarios o utilidades de fabricantes.</p>
        <h4 class="font-bold text-white text-sm">2. Limpieza de Temporales</h4>
        <p class="text-xs text-slate-300">Presiona <code class="text-cyan-400">Win + R</code>, escribe <code class="text-cyan-400">%temp%</code> y borra los archivos acumulados de instalaciones viejas y restos de caché.</p>
        <h4 class="font-bold text-white text-sm">3. Puntos de Restauración</h4>
        <p class="text-xs text-slate-300">Escribe en el menú inicio: "Crear un punto de restauración". Asegúrate de que la unidad C: tenga la protección "Activada" con al menos un 5% de espacio asignado.</p>
      </div>
    `,
  },
  'falla-no-enciende': {
    title: 'Diagnóstico Quirúrgico: Equipo Totalmente Muerto',
    badge: 'Mantenimiento Correctivo HW',
    icon: 'power-off',
    body: `
      <div class="space-y-4">
        <h4 class="font-bold text-white text-sm">Prueba del Clip de Papel (Paperclip PSU Test):</h4>
        <ol class="list-decimal list-inside text-xs space-y-2 text-slate-300">
          <li>Desconectar la fuente de poder de todos los componentes de la computadora (motherboard, GPU, discos).</li>
          <li>En el conector principal de 24 pines, localiza el único <strong class="text-emerald-400">cable verde (PS_ON#)</strong> y cualquier <strong class="text-slate-100">cable negro (GND)</strong>.</li>
          <li>Doble un clip de papel de metal en forma de U e inserta un extremo en el pin verde y el otro en el pin negro.</li>
          <li>Conecta la fuente a la corriente y enciende el interruptor I/O. Si el ventilador de la fuente NO gira, la fuente está completamente averiada y debe sustituirse.</li>
        </ol>
      </div>
    `,
  },
  'falla-no-video': {
    title: 'Resolución: Enciende sin Video / Pantalla Negra',
    badge: 'Mantenimiento Correctivo HW',
    icon: 'monitor-x',
    body: `
      <div class="space-y-4">
        <h4 class="font-bold text-white text-sm">El 80% de los casos se debe a la Memoria RAM:</h4>
        <ol class="list-decimal list-inside text-xs space-y-2 text-slate-300">
          <li>Desconecta el cable de energía y retira ambos módulos de RAM abriendo los clips de las ranuras.</li>
          <li>Usa una goma de borrar escolar suave sobre los pines dorados de contacto en ambas caras para eliminar la película microscópica de óxido o sulfato.</li>
          <li>Limpia los residuos con una brocha seca y alcohol isopropílico.</li>
          <li>Inserta un solo módulo firmemente hasta escuchar un "clic" limpio de ambos seguros. Enciende el equipo.</li>
          <li>Si sigue sin dar video, cambia el módulo de ranura o prueba con el segundo módulo.</li>
        </ol>
      </div>
    `,
  },
  'falla-temperatura': {
    title: 'Solución a Falla por Estrangulamiento Térmico (Overheating)',
    badge: 'Mantenimiento Correctivo HW',
    icon: 'thermometer-snowflake',
    body: `
      <div class="space-y-4">
        <h4 class="font-bold text-white text-sm">Puntos de Inspección Clave:</h4>
        <ul class="list-disc list-inside text-xs space-y-2 text-slate-300">
          <li><strong>¿Disipador flojo?</strong> Verifica que los cuatro anclajes o tornillos tengan tensión firme. Si una pata plástica de Intel push-pin está rota, el disipador no hace contacto plano.</li>
          <li><strong>¿Plástico de fábrica olvidado?</strong> Muchos disipadores y bloques de agua vienen con una pegatina transparente que dice "WARNING: REMOVE BEFORE INSTALLING". Si no se retiró, el procesador se sobrecalentará en menos de 2 minutos.</li>
          <li><strong>Curva de ventilación en BIOS:</strong> Entra al BIOS/UEFI y configura el perfil de ventiladores de "Silencioso" a "Estándar" o "Agresivo".</li>
        </ul>
      </div>
    `,
  },
  'falla-bsod': {
    title: 'Metodología para Diagnosticar Pantallas Azules (BSOD)',
    badge: 'Mantenimiento Correctivo SW',
    icon: 'alert-octagon',
    body: `
      <div class="space-y-4">
        <h4 class="font-bold text-white text-sm">Herramienta Gratuita: BlueScreenView</h4>
        <p class="text-xs text-slate-300">Descarga BlueScreenView (de NirSoft). La herramienta leerá automáticamente los archivos <code class="text-cyan-400">.dmp</code> almacenados en <code class="text-cyan-400">C:\\Windows\\Minidump</code> y resaltará en color rojo el archivo <code class="text-rose-400">.sys</code> o controlador causante del bloqueo.</p>
        <h4 class="font-bold text-white text-sm">Protocolo de Limpieza de Drivers:</h4>
        <p class="text-xs text-slate-300">Si el error apunta a <code class="text-amber-400">nvlddmkm.sys</code> (Nvidia) o <code class="text-amber-400">amdkmdag.sys</code> (AMD), desinstala el controlador por completo usando DDU (Display Driver Uninstaller) en Modo Seguro y reinstala la versión más reciente y estable.</p>
      </div>
    `,
  },
  'falla-malware': {
    title: 'Protocolo de Rescate y Desinfección contra Malware y Ransomware',
    badge: 'Mantenimiento Correctivo SW',
    icon: 'skull',
    body: `
      <div class="space-y-4">
        <h4 class="font-bold text-white text-sm">Fase 1: Cuarentena y Aislamiento de Red</h4>
        <p class="text-xs text-slate-300">Desconecta inmediatamente el cable de red Ethernet y apaga el Wi-Fi. Esto evita que el malware contacte servidores de comando y control (C2) o cifre computadoras vecinas en tu red local.</p>
        <h4 class="font-bold text-white text-sm">Fase 2: Modo Seguro y Escaneo Offline</h4>
        <ol class="list-decimal list-inside text-xs space-y-1.5 text-slate-300">
          <li>Mantén presionada la tecla <code class="text-cyan-400">Shift</code> mientras haces clic en "Reiniciar" en Windows.</li>
          <li>Ve a: Solucionar problemas -> Opciones avanzadas -> Configuración de inicio -> Reiniciar -> Elige opción 4 (Modo Seguro).</li>
          <li>Ejecuta un análisis sin conexión con <strong class="text-slate-100">Microsoft Defender Offline</strong> o un USB de rescate (Kaspersky Rescue Disk).</li>
        </ol>
      </div>
    `,
  },
  'falla-boot': {
    title: 'Reparación del Gestor de Arranque de Windows (BCD / EFI)',
    badge: 'Mantenimiento Correctivo SW',
    icon: 'refresh-cw',
    body: `
      <div class="space-y-4">
        <p class="text-xs text-slate-300">Cuando Windows no encuentra la partición de arranque o el BCD está corrupto, usa estos comandos en Símbolo del Sistema desde un USB de instalación de Windows:</p>
        <div class="bg-black/90 p-3 rounded-lg font-mono text-xs text-emerald-400 space-y-1.5">
          <p>bootrec /fixmbr</p>
          <p>bootrec /fixboot</p>
          <p>bootrec /scanos</p>
          <p>bootrec /rebuildbcd</p>
        </div>
        <p class="text-xs text-slate-400">Si indica "Acceso denegado" en fixboot en sistemas UEFI, repara la partición EFI montándola con Diskpart y ejecutando <code class="text-cyan-400">bcdboot C:\\Windows /s S: /f UEFI</code>.</p>
      </div>
    `,
  },
};

window.openModal = function (guideKey) {
  const guide = detailedGuides[guideKey];
  if (!guide) return;

  const modal = document.getElementById('guide-modal');
  const title = document.getElementById('modal-title');
  const badge = document.getElementById('modal-badge');
  const body = document.getElementById('modal-body');

  title.textContent = guide.title;
  badge.textContent = guide.badge;
  body.innerHTML = guide.body;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (window.lucide) {
    lucide.createIcons();
  }
};

window.closeModal = function () {
  const modal = document.getElementById('guide-modal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
};

// Cerrar modal con tecla Escape
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// Cerrar modal al hacer clic en el backdrop
document.getElementById('guide-modal')?.addEventListener('click', (e) => {
  if (e.target.id === 'guide-modal') {
    closeModal();
  }
});

// --------------------------------------------------------------------------
// 6. Portapapeles y Notificaciones Toast
// --------------------------------------------------------------------------
window.copyCommand = function (text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Comando copiado: "${text}"`);
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = '¡Copiado!';
      btn.classList.add('text-emerald-400');
      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('text-emerald-400');
      }, 1500);
    }
  });
};

function showToast(message) {
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  if (!toast || !toastText) return;

  toastText.textContent = message;
  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 2500);
}

// --------------------------------------------------------------------------
// 7. Menú Móvil
// --------------------------------------------------------------------------
function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
    });
  });
}
