import React, { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import './EmojiPickerBtn.css';

/**
 * Reusable emoji picker button.
 * Props:
 *   onEmojiSelect(emoji: string) - called when user picks an emoji
 *   size - icon size (default 20)
 */
function EmojiPickerBtn({ onEmojiSelect, size = 20 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (emojiData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <div className="emoji-picker-wrapper" ref={ref}>
      <button
        type="button"
        className="emoji-trigger-btn"
        onClick={() => setOpen(v => !v)}
        title="Emoji"
      >
        <Smile size={size} />
      </button>
      {open && (
        <div className="emoji-picker-popup">
          <EmojiPicker
            onEmojiClick={handleSelect}
            skinTonesDisabled
            searchDisabled={false}
            height={350}
            width={300}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
}

export default EmojiPickerBtn;
