import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getBooks } from '../api';
import BookCard from '../components/BookCard';
import './BookListPage.css';

const STATUS_OPTIONS = ['', 'want_to_read', 'reading', 'finished'];
const STATUS_LABELS = { '': 'All', want_to_read: 'Want to Read', reading: 'Reading', finished: 'Finished' };

export default function BookListPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ title: '', author: '', status: '', rating: '' });

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filters.title) params.title = filters.title;
      if (filters.author) params.author = filters.author;
      if (filters.status) params.status = filters.status;
      if (filters.rating) params.rating = filters.rating;
      const data = await getBooks(params);
      setBooks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="book-list-page">
      <div className="book-list-header">
        <h1>My Books</h1>
        <Link to="/books/new" className="btn btn-primary">+ Add Book</Link>
      </div>

      <div className="book-filters">
        <input
          name="title"
          placeholder="Search by title..."
          value={filters.title}
          onChange={handleFilterChange}
        />
        <input
          name="author"
          placeholder="Search by author..."
          value={filters.author}
          onChange={handleFilterChange}
        />
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select name="rating" value={filters.rating} onChange={handleFilterChange}>
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{'★'.repeat(r)} (min)</option>
          ))}
        </select>
      </div>

      {loading && <p className="status-msg">Loading books...</p>}
      {error && <p className="status-msg error">{error}</p>}
      {!loading && !error && books.length === 0 && (
        <p className="status-msg">No books yet. <Link to="/books/new">Add your first book!</Link></p>
      )}
      {!loading && !error && books.length > 0 && (
        <div className="book-grid">
          {books.map((book) => <BookCard key={book.id} book={book} />)}
        </div>
      )}
    </div>
  );
}
