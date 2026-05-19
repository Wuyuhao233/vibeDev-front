import { useState, useRef, useEffect } from 'react';

const EMOJI_CATEGORIES = [
  {
    name: '常用',
    emojis: ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','😏','😒','🙄','😬','😌','😔','😪','😴','🤤','😷','🤒','🤕','🤢','🤮','😵','🤯','🤠','🥳','😎','🤓','🧐'],
  },
  {
    name: '手势',
    emojis: ['👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👋','🤝','🙏','💪','🤛','🤜','👏','🙌','👐','🤲','🤝'],
  },
  {
    name: '心情',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','💯','💢','💥','💫','💦','💨','🔥','⭐','🌟','✨','⚡','💥'],
  },
  {
    name: '物品',
    emojis: ['🎉','🎊','🎈','🎁','🏆','🥇','🎯','🎮','🎲','🎵','🎶','🎸','🎹','📸','📱','💻','⏰','📌','✏️','📝','📖','📚','💡','🔑','🔒','🏳️','🏴'],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-72 bg-card rounded-lg shadow-modal border border-border z-50 animate-fade-in overflow-hidden"
    >
      {/* Category tabs */}
      <div className="flex border-b border-border">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(i)}
            className={`flex-1 py-2 text-xs font-medium transition-colors duration-150 ${
              activeCategory === i
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="p-2 h-48 overflow-y-auto">
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => onSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-muted transition-colors duration-100"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
