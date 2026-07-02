import { useState, useEffect } from 'react';

const EMPTY_FORM = { content: '', page: '' };

export default function NoteForm({ initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        content: initialData.content || '',
        page: initialData.page != null ? String(initialData.page) : '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.content.trim()) {
      setError('Content is required');
      return;
    }

    const payload = { content: form.content.trim() };
    if (form.page !== '') {
      const pageNum = Number(form.page);
      if (!Number.isInteger(pageNum) || pageNum < 1) {
        setError('Page must be a positive integer');
        return;
      }
      payload.page = pageNum;
    }

    try {
      await onSubmit(payload);
      if (!initialData) setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      {error && <p className="form-error">{error}</p>}
      <textarea
        name="content"
        placeholder="Write a note..."
        value={form.content}
        onChange={handleChange}
        rows={3}
      />
      <div className="note-form-footer">
        <input
          name="page"
          type="number"
          min="1"
          placeholder="Page (optional)"
          value={form.page}
          onChange={handleChange}
          className="input-page"
        />
        <div className="note-form-actions">
          {onCancel && (
            <button type="button" className="btn" onClick={onCancel}>Cancel</button>
          )}
          <button type="submit" className="btn btn-primary">
            {initialData ? 'Update' : 'Add'} Note
          </button>
        </div>
      </div>
    </form>
  );
}
