with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

missing_components = """
function Legend({ status, label, count }: any) {
  return (
    <div className="legend-item">
      <div className={`legend-dot ${status}`}></div>
      <div className="legend-label">{label} <span>({count})</span></div>
    </div>
  );
}

function MiniStat({ label, value }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="text-sm font-bold text-gray-900">{value}</div>
    </div>
  );
}

export default function RoomDashboard() {
"""

content = content.replace("export default function RoomDashboard() {", missing_components)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
