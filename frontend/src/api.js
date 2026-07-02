const BASE_URL = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// Auth
export const registerUser = (email, password) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });

export const loginUser = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const logoutUser = () =>
  request('/auth/logout', { method: 'POST' });

// Books
export const getBooks = (params = {}) => {
  const query = Object.entries(params)
    .filter(([, v]) => v !== '' && v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return request(`/books${query ? '?' + query : ''}`);
};

export const createBook = (data) =>
  request('/books', { method: 'POST', body: JSON.stringify(data) });

export const getBook = (id) =>
  request(`/books/${id}`);

export const updateBook = (id, data) =>
  request(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteBook = (id) =>
  request(`/books/${id}`, { method: 'DELETE' });

// Notes
export const getNotes = (bookId) =>
  request(`/books/${bookId}/notes`);

export const createNote = (bookId, data) =>
  request(`/books/${bookId}/notes`, { method: 'POST', body: JSON.stringify(data) });

export const updateNote = (bookId, noteId, data) =>
  request(`/books/${bookId}/notes/${noteId}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteNote = (bookId, noteId) =>
  request(`/books/${bookId}/notes/${noteId}`, { method: 'DELETE' });
