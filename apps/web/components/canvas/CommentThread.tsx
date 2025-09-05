import { useState } from 'react';

interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: Date;
}

interface CommentThreadProps {
  comments: Comment[];
  onAdd?: (text: string) => void;
}

export function CommentThread({ comments, onAdd }: CommentThreadProps) {
  const [text, setText] = useState('');

  const handleAdd = () => {
    if (!text.trim()) return;
    onAdd?.(text);
    setText('');
  };

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="text-sm">
            <span className="font-medium">{c.author}</span>: {c.text}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded px-2 py-1"
        />
        <button type="button" onClick={handleAdd}>
          Add
        </button>
      </div>
    </div>
  );
}
