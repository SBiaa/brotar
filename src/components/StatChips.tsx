export function StatChips({ items }: { items: { value: string | number; label: string }[] }) {
  return (
    <div className="stats-row">
      {items.map((item) => (
        <div className="stat-chip" key={item.label}>
          <div className="num">{item.value}</div>
          <div className="label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
