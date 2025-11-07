// Front‑end auth logic
async function loginUser(email, password) {
  const res = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const json = await res.json();
  if (json.success) {
    localStorage.setItem('token', json.token);
    return true;
  } else {
    alert('Login failed: ' + (json.error || ''));
    return false;
  }
}

function getAuthToken() {
  return localStorage.getItem('token');
}

async function fetchWithAuth(url, options = {}) {
  const token = getAuthToken();
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const resp = await fetch(url, { ...options, headers });
  const json = await resp.json();
  if (!json.success) throw new Error(json.error || 'Fetch failed');
  return json;
}
