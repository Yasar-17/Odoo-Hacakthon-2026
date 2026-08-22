interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "No data found",
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left py-3 px-4 font-medium text-surface-600 ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-surface-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, i) => (
              <tr key={i} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`py-3 px-4 ${col.className || ""}`}>
                    {col.render ? col.render(item) : String(item[col.key] ?? "-")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
