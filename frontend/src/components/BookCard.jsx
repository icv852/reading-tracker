import { Link } from 'react-router-dom';
import './BookCard.css';

const STATUS_LABELS = {
  want_to_read: 'Want to Read',
  reading: 'Reading',
  finished: 'Finished',
};

export default function BookCard({ book }) {
  return (
    <Link to={`/books/${book.id}`} className="book-card">
      <div className="book-card-body">
        <h3 className="book-card-title">{book.title}</h3>
        {book.author && <p className="book-card-author">{book.author}</p>}
        <span className={`book-card-status status-${book.status}`}>
          {STATUS_LABELS[book.status]}
        </span>
        {book.rating && (
          <span className="book-card-rating">
            {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}
          </span>
        )}
      </div>
    </Link>
  );
}
