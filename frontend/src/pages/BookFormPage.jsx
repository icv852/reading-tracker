import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createBook, getBook, updateBook } from '../api';
import './BookFormPage.css';

const STATUS_OPTIONS = ['want_to_read', 'reading', 'finished'];
const STATUS_LABELS = { want_to_read: 'Want to Read', reading: 'Reading', finished: 'Finished' };

export default function BookFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', author: '', status: 'want_to_read', rating: '',
  });
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const book = await getBook(id);
        setForm({
          title: book.title || '',
          author: book.author || '',
          status: book.status || 'want_to_read',
          rating: book.rating ? String(book.rating) : '',
        });
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }

    const payload = { title: form.title.trim() };
    if (form.author.trim()) payload.author = form.author.trim();
    payload.status = form.status;
    if (form.rating !== '') {
      const r = Number(form.rating);
      if (r < 1 || r > 5) {
        setError('Rating must be between 1 and 5');
        return;
      }
      payload.rating = r;
    }

    setSubmitting(true);
    try {
      let book;
      if (isEdit) {
        book = await updateBook(id, payload);
      } else {
        book = await createBook(payload);
      }
      navigate(`/books/${book.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) return <p className="status-msg">Loading...</p>;
  if (fetchError) return <p className="status-msg error">{fetchError}</p>;

  return (
    <div className="form-page">
      <h1>{isEdit ? 'Edit Book' : 'Add Book'}</h1>
      <form className="book-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}
        <label>
          Title *
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            autoFocus
          />
        </label>
        <label>
          Author
          <input
            name="author"
            value={form.author}
            onChange={handleChange}
          />
        </label>
        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </label>
        <label>
          Rating
          <select name="rating" value={form.rating} onChange={handleChange}>
            <option value="">No rating</option>
            {[1, 2, 3, 4, 5].map((r) => (
              <option key={r} value={r}>{'★'.repeat(r)}</option>
            ))}
          </select>
        </label>
        <div className="form-actions">
          <button type="button" className="btn" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update Book' : 'Add Book'}
          </button>
        </div>
      </form>
    </div>
  );
}
