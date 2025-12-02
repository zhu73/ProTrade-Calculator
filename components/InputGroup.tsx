import React from 'react';

interface InputGroupProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: 'number' | 'text';
  placeholder?: string;
  prefix?: React.ReactNode;
  suffix?: string;
  className?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({
  label,
  value,
  onChange,
  type = 'number',
  placeholder,
  prefix,
  suffix,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
        {label}
      </label>
      <div className="relative flex items-center bg-slate-800/50 rounded-xl border border-slate-700 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all duration-200">
        {prefix && <div className="pl-4 text-slate-400">{prefix}</div>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent py-3 px-4 text-white placeholder-slate-500 focus:outline-none font-mono text-lg"
        />
        {suffix && <div className="pr-4 text-slate-400 text-sm font-medium">{suffix}</div>}
      </div>
    </div>
  );
};
