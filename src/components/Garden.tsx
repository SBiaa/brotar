import type { GardenDay } from "@/lib/types";
import { formatShort } from "@/server/dates";

export function Garden({ days }: { days: GardenDay[] }) {
  return (
    <section className="garden-card">
      <div className="garden-head">
        <h3>Seu jardim de hábitos</h3>
        <span>últimos {days.length} dias</span>
      </div>
      <div className="garden-grid">
        {days.map((day) => (
          <div
            key={day.date}
            className="seed"
            data-lvl={day.level}
            title={`${formatShort(day.date)} · ${day.done}/${day.total} ${
              day.total === 1 ? "hábito" : "hábitos"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
