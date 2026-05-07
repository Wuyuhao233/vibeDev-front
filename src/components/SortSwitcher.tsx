type SortValue = 'hot' | 'latest' | 'trending';

interface SortOption {
  value: SortValue;
  label: string;
}

const ALL_OPTIONS: SortOption[] = [
  { value: 'hot', label: '热门' },
  { value: 'latest', label: '最新' },
  { value: 'trending', label: '热榜' },
];

interface SortSwitcherProps {
  value: SortValue;
  onChange: (value: SortValue) => void;
  showTrending?: boolean;
}

export default function SortSwitcher({ value, onChange, showTrending }: SortSwitcherProps) {
  const options = showTrending ? ALL_OPTIONS : ALL_OPTIONS.filter((o) => o.value !== 'trending');

  return (
    <div className="sort-switcher inline-flex border border-gray-200 rounded-md overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`sort-switcher__item px-4 py-1.5 text-sm font-medium transition-colors duration-150 border-r border-gray-200 last:border-r-0 ${
            value === opt.value
              ? 'sort-switcher__item--active bg-primary-500 text-white'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
