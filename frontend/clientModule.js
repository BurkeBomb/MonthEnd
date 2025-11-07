// Module to manage clients from front end
async function loadClients() {
  const json = await fetchWithAuth('http://localhost:4000/api/clients');
  const list = document.getElementById('clientList');
  list.innerHTML = '';
  json.clients.forEach(c => {
    const row = document.createElement('div');
    row.className = 'flex justify-between p-2 border-b';
    row.innerHTML = `
      <div>${c.practice_number} – ${c.first_name} ${c.last_name} (${c.email}) Rate: ${c.rate}</div>
      <div>
        <button onclick='editClient(${JSON.stringify(c)})'>✏️</button>
        <button onclick='deleteClient(${c.id})'>🗑️</button>
      </div>
    `;
    list.appendChild(row);
  });
}

async function createClientFront() {
  const payload = {
    practiceNumber: document.getElementById('clientPractice').value,
    firstName: document.getElementById('clientFirst').value,
    lastName: document.getElementById('clientLast').value,
    email: document.getElementById('clientEmail').value,
    rate: parseFloat(document.getElementById('clientRate').value)
  };
  await fetchWithAuth('http://localhost:4000/api/clients', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  alert('Client created');
  loadClients();
}

async function deleteClient(id) {
  if (!confirm('Delete this client?')) return;
  await fetchWithAuth(`http://localhost:4000/api/clients/${id}`, { method: 'DELETE' });
  alert('Deleted');
  loadClients();
}

let editingClientId = null;
function editClient(c) {
  editingClientId = c.id;
  document.getElementById('clientPractice').value = c.practice_number;
  document.getElementById('clientFirst').value = c.first_name;
  document.getElementById('clientLast').value = c.last_name;
  document.getElementById('clientEmail').value = c.email;
  document.getElementById('clientRate').value = c.rate;
}

async function saveClientFront() {
  const payload = {
    firstName: document.getElementById('clientFirst').value,
    lastName: document.getElementById('clientLast').value,
    email: document.getElementById('clientEmail').value,
    rate: parseFloat(document.getElementById('clientRate').value)
  };
  await fetchWithAuth(`http://localhost:4000/api/clients/${editingClientId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  alert('Client updated');
  editingClientId = null;
  loadClients();
}
