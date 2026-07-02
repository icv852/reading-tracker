import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBook, deleteBook, getNotes, createNote, updateNote, deleteNote } from '../api';
import NoteItem from '../components/NoteItem';
import NoteForm from '../components/NoteForm';
import './BookDetailPage.css';

const STATUS_LABELS = {
  want_to_read: 'Want to Read',
  reading: 'Reading',
  finished: 'Finished',
};

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notesLoading, setNotesLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null);

  const fetchNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      const data = await getNotes(id);
      setNotes(data);
    } catch {
      // Notes fetch failure is non-fatal
    } finally {
      setNotesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getBook(id);
        setBook(data);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setLoading(false);
    })();
    fetchNotes();
  }, [id, fetchNotes]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this book? This will also delete all notes.')) return;
    try {
      await deleteBook(id);
      navigate('/books');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddNote = async (data) => {
    const note = await createNote(id, data);
    setNotes((prev) => [...prev, note]);
  };

  const handleEditNote = async (data) => {
    const updated = await updateNote(id, editingNote.id, data);
    setNotes((prev) => prev.map((n) => n.id === updated.id ? updated : n));
    setEditingNote(null);
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    await deleteNote(id, noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  if (loading) return <p className="status-msg">Loading book...</p>;
  if (error) return <p className="status-msg error">{error}</p>;
  if (!book) return <p className="status-msg">Book not found.</p>;

  return (
    <div className="book-detail">
      <Link to="/books" className="back-link">&larr; Back to My Books</Link>

      <div className="book-detail-header">
        <h1>{book.title}</h1>
        <div className="book-detail-actions">
          <Link to={`/books/${book.id}/edit`} className="btn">Edit</Link>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      {book.author && <p className="book-detail-author">by {book.author}</p>}

      <div className="book-detail-meta">
        <span className={`book-card-status status-${book.status}`}>
          {STATUS_LABELS[book.status]}
        </span>
        {book.rating && (
          <span className="book-detail-rating">
            {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}
          </span>
        )}
        <span className="book-detail-date">
          Added {new Date(book.created_at).toLocaleDateString()}
        </span>
      </div>

      <section className="notes-section">
        <h2>Notes</h2>
        <NoteForm onSubmit={handleAddNote} />

        {notesLoading && <p className="status-msg">Loading notes...</p>}
        {!notesLoading && notes.length === 0 && (
          <p className="status-msg">No notes yet. Add one above!</p>
        )}

        {editingNote && (
          <div className="edit-note-form">
            <h3>Edit Note</h3>
            <NoteForm
              initialData={editingNote}
              onSubmit={handleEditNote}
              onCancel={() => setEditingNote(null)}
            />
          </div>
        )}

        <div className="notes-list">
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              onEdit={setEditingNote}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
