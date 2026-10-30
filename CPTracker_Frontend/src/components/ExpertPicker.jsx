// experts: active experts. value: selected ids. onChange(newIds)
export function ExpertPicker({ experts, value, onChange }) {
  if (experts.length === 0) {
    return <p className="text-sm text-muted">No active experts yet. Create an expert first.</p>;
  }
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {experts.map((e) => (
        <label
          key={e.id}
          className="flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm hover:bg-surface-2"
        >
          <input type="checkbox" checked={value.includes(e.id)} onChange={() => toggle(e.id)} />
          {e.name}
          <span className="ml-auto truncate font-mono text-xs text-muted">{e.email}</span>
        </label>
      ))}
    </div>
  );
}