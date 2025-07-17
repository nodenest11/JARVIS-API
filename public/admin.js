document.addEventListener('DOMContentLoaded', () => {
  loadPanel();
  loadStatus();
  loadLogs();

  document.getElementById('refreshBtn').onclick = () => {
    loadPanel();
    loadStatus();
    loadLogs();
  };

  document.getElementById('providerForm').onsubmit = async (e) => {
    e.preventDefault();
    const activeProvider = document.getElementById('activeProvider').value;
    const activeOpenRouterModel = document.getElementById('openrouterModel').value;
    
    try {
      const response = await fetch('/admin/set-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          activeProvider, 
          activeOpenRouterModel,
          temperature: 0.7,
          maxTokens: 2000
        })
      });
      
      if (response.ok) {
        alert('Configuration updated successfully!');
        loadPanel();
        loadStatus();
      } else {
        alert('Failed to update configuration');
      }
    } catch (error) {
      console.error('Error updating config:', error);
      alert('Error updating configuration');
    }
  };

  document.getElementById('savePriority').onclick = savePriority;
  
  // Initialize sortable for priority list
  initializePriorityDragDrop();
});

async function loadPanel() {
  try {
    const res = await fetch('/admin/data');
    const data = await res.json();
    
    document.getElementById('activeProvider').value = data.config.activeProvider;
    
    const modelSelect = document.getElementById('openrouterModel');
    modelSelect.innerHTML = '';
    
    // Add all models in a simple list
    data.openrouterModels.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      if (data.config.activeOpenRouterModel === m.id) opt.selected = true;
      modelSelect.appendChild(opt);
    });
    
    // Load provider priority
    loadProviderPriority(data.config.providerPriority);
    
  } catch (error) {
    console.error('Error loading panel data:', error);
  }
}

async function loadStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    
    let html = `
      <div class="status-grid">
        <div class="status-item">
          <strong>Environment:</strong> 
          <span class="badge ${data.environment}">${data.environment}</span>
        </div>
        <div class="status-item">
          <strong>Version:</strong> ${data.version || '2.0.0'}
        </div>
        <div class="status-item">
          <strong>Available Services:</strong> 
          <span class="service-count">${data.available_services || 0} / ${data.total_services || 3}</span>
        </div>
        <div class="status-item">
          <strong>Last Updated:</strong> 
          <span class="timestamp">${new Date(data.timestamp).toLocaleString()}</span>
        </div>
      </div>
      <div class="provider-status">
        <h4>Provider Status:</h4>
        <div class="providers">
          <div class="provider ${data.providers?.google_gemini ? 'available' : 'unavailable'}">
            <i class="fas fa-${data.providers?.google_gemini ? 'check-circle' : 'times-circle'}"></i>
            Google Gemini
          </div>
          <div class="provider ${data.providers?.github_openai ? 'available' : 'unavailable'}">
            <i class="fas fa-${data.providers?.github_openai ? 'check-circle' : 'times-circle'}"></i>
            GitHub OpenAI
          </div>
          <div class="provider ${data.providers?.openrouter ? 'available' : 'unavailable'}">
            <i class="fas fa-${data.providers?.openrouter ? 'check-circle' : 'times-circle'}"></i>
            OpenRouter
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('statusBox').innerHTML = html;
  } catch (error) {
    console.error('Error loading status:', error);
    document.getElementById('statusBox').innerHTML = '<div class="error">Error loading status</div>';
  }
}

async function loadLogs() {
  try {
    const res = await fetch('/admin/logs');
    const data = await res.json();
    const logsDiv = document.getElementById('logsContainer');
    
    if (!data.logs || !data.logs.length) {
      logsDiv.innerHTML = '<div class="no-logs">No logs found.</div>';
      return;
    }
    
    let html = '<div class="logs-header">Recent API Requests</div>';
    
    data.logs.slice(-20).reverse().forEach(line => {
      try {
        const log = JSON.parse(line);
        const statusClass = log.status >= 200 && log.status < 300 ? 'success' : 
                           log.status >= 400 && log.status < 500 ? 'warning' : 'error';
        
        html += `
          <div class="log-entry">
            <div class="log-time">${new Date(log.time).toLocaleTimeString()}</div>
            <div class="log-method method-${log.method.toLowerCase()}">${log.method}</div>
            <div class="log-url">${log.url}</div>
            <div class="log-status status-${statusClass}">${log.status}</div>
            <div class="log-duration">${log.duration}ms</div>
          </div>
        `;
      } catch (e) {
        // Skip malformed log entries
      }
    });
    
    logsDiv.innerHTML = html;
  } catch (error) {
    console.error('Error loading logs:', error);
    document.getElementById('logsContainer').innerHTML = '<div class="error">Error loading logs</div>';
  }
}

function loadProviderPriority(priority) {
  const defaultPriority = [
    { name: 'gemini', label: 'Google Gemini', enabled: true },
    { name: 'github', label: 'GitHub OpenAI', enabled: true },
    { name: 'openrouter', label: 'OpenRouter', enabled: true }
  ];
  
  const priorityData = priority || defaultPriority;
  const container = document.getElementById('priorityList');
  container.innerHTML = '';
  
  priorityData.forEach((provider, index) => {
    const item = document.createElement('div');
    item.className = 'priority-item';
    item.draggable = true;
    item.dataset.provider = provider.name;
    
    item.innerHTML = `
      <div class="priority-item-info">
        <div class="priority-number">${index + 1}</div>
        <div class="priority-item-label">${provider.label}</div>
      </div>
      <div class="priority-toggle">
        <div class="toggle-switch ${provider.enabled ? 'active' : ''}" 
             onclick="toggleProvider('${provider.name}')"></div>
        <i class="fas fa-grip-vertical priority-drag-handle"></i>
      </div>
    `;
    
    container.appendChild(item);
  });
}

function toggleProvider(providerName) {
  const item = document.querySelector(`[data-provider="${providerName}"]`);
  const toggle = item.querySelector('.toggle-switch');
  toggle.classList.toggle('active');
}

function initializePriorityDragDrop() {
  let draggedElement = null;
  
  document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('priority-item')) {
      draggedElement = e.target;
      e.target.classList.add('dragging');
    }
  });
  
  document.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('priority-item')) {
      e.target.classList.remove('dragging');
      updatePriorityNumbers();
    }
  });
  
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    const container = document.getElementById('priorityList');
    const afterElement = getDragAfterElement(container, e.clientY);
    
    if (afterElement == null) {
      container.appendChild(draggedElement);
    } else {
      container.insertBefore(draggedElement, afterElement);
    }
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.priority-item:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updatePriorityNumbers() {
  const items = document.querySelectorAll('.priority-item');
  items.forEach((item, index) => {
    const numberElement = item.querySelector('.priority-number');
    numberElement.textContent = index + 1;
  });
}

async function savePriority() {
  try {
    const items = document.querySelectorAll('.priority-item');
    const priority = Array.from(items).map((item, index) => {
      const providerName = item.dataset.provider;
      const enabled = item.querySelector('.toggle-switch').classList.contains('active');
      const label = item.querySelector('.priority-item-label').textContent;
      
      return {
        name: providerName,
        label: label,
        enabled: enabled
      };
    });
    
    const response = await fetch('/admin/set-priority', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerPriority: priority })
    });
    
    if (response.ok) {
      alert('Provider priority updated successfully!');
      loadPanel();
      loadStatus();
    } else {
      alert('Failed to update provider priority');
    }
  } catch (error) {
    console.error('Error saving priority:', error);
    alert('Error saving provider priority');
  }
}
