import React from "react";

export interface TableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  width?: string;
  render: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyText?: string;
  emptyAction?: React.ReactNode;
}

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyText = "No data found.",
  emptyAction,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">{emptyText}</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b-2 border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                style={
                  col.width
                    ? { width: col.width, minWidth: col.width }
                    : undefined
                }
                className={`
                  px-4 py-3
                  text-xs font-bold text-muted-foreground
                  uppercase tracking-wider
                  whitespace-nowrap
                  ${alignClass[col.align ?? "left"]}
                `}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={keyExtractor(row)}
              className={`
                border-b border-border last:border-0
                hover:bg-primary/[0.03] transition-colors
                ${index % 2 === 0 ? "bg-card" : "bg-muted/20"}
              `}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={
                    col.width
                      ? { width: col.width, minWidth: col.width }
                      : undefined
                  }
                  className={`
                    px-4 py-3.5
                    ${alignClass[col.align ?? "left"]}
                  `}
                >
                  {col.render(row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
