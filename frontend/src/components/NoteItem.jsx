export default function NoteItem({ note, onEdit, onDelete }) {
  return (
    <div className="note-item">
      <div className="note-item-body">
        <p className="note-item-content">{note.content}</p>
        {note.page && <span className="note-item-page">p. {note.page}</span>}
        <span className="note-item-date">
          {new Date(note.created_at).toLocaleDateString()}
        </span>
      </div>
      <div className="note-item-actions">
        <button className="btn-sm" onClick={() => onEdit(note)}>Edit</button>
        <button className="btn-sm btn-danger" onClick={() => onDelete(note.id)}>Delete</button>
      </div>
    </div>
  );
}
