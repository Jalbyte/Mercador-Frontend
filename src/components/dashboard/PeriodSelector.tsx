"use client";

interface PeriodSelectorProps {
  selectedPeriod: "7d" | "30d" | "90d";
  onPeriodChange: (period: "7d" | "30d" | "90d") => void;
}

export function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
}: PeriodSelectorProps) {
  const periods = [
    { value: "7d" as const, label: "7 días" },
    { value: "30d" as const, label: "30 días" },
    { value: "90d" as const, label: "90 días" },
  ];

  return (
    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onPeriodChange(period.value)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selectedPeriod === period.value
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
