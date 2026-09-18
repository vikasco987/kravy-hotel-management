import re

with open('src/app/globals.css', 'r') as f:
    css = f.read()

# Remove the old floor-card, room-card, legend, quick-actions, occupancy-card CSS
sections_to_remove = [
    r'\.floor-list \{[\s\S]*?\}',
    r'\.floor-card \{[\s\S]*?\}',
    r'\.floor-header \{[\s\S]*?\}',
    r'\.floor-info \{[\s\S]*?\}',
    r'\.floor-number \{[\s\S]*?\}',
    r'\.floor-summary \{[\s\S]*?\}',
    r'\.room-count \{[\s\S]*?\}',
    r'\.available-count \{[\s\S]*?\}',
    r'\.room-grid \{[\s\S]*?\}',
    r'\.room-card \{[\s\S]*?\}',
    r'\.room-number \{[\s\S]*?\}',
    r'\.legend \{[\s\S]*?\}',
    r'\.legend-item \{[\s\S]*?\}',
    r'\.legend-dot \{[\s\S]*?\}',
    r'\.right-column \{[\s\S]*?\}',
    r'\.occupancy-card \{[\s\S]*?\}',
    r'\.occupancy-header \{[\s\S]*?\}',
    r'\.circle-inner \{[\s\S]*?\}',
    r'\.occupancy-stats \{[\s\S]*?\}',
    r'\.mini-stat \{[\s\S]*?\}',
    r'\.quick-actions \{[\s\S]*?\}',
    r'\.quick-title \{[\s\S]*?\}',
    r'\.quick-icon \{[\s\S]*?\}',
    r'\.room-action \{[\s\S]*?\}',
    r'@media \(max-width: 1250px\) \{[\s\S]*?\}',
    r'@media \(max-width: 850px\) \{[\s\S]*?\}',
    r'@media \(max-width: 500px\) \{[\s\S]*?\}'
]

for section in sections_to_remove:
    css = re.sub(section, '', css)

# New CSS for the compact layout
new_css = """
/* ==============================
   COMPACT ROOM UI
============================== */

/* Layout */
.compact-dashboard {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 24px;
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;
  position: relative;
  overflow: hidden; /* For drawer */
}

/* Header & Filters */
.dash-header-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.filters-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: white;
  border: 1px solid #e1e8f0;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #556b82;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-pill:hover, .filter-pill.active {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #1e293b;
}

.filter-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* Floor Rows */
.floors-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: white;
  border: 1px solid #e1e8f0;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

.floor-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  transition: opacity 0.3s;
}

.floor-row.dimmed {
  opacity: 0.3;
}

.floor-label-box {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 12px;
  color: #475569;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
}

.floor-rooms {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

/* Room Tiles */
.room-tile {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s, opacity 0.2s;
  border: 2px solid transparent;
}

.room-tile:hover {
  transform: translateY(-2px) scale(1.05);
}

.room-tile.selected {
  transform: scale(1.08);
  box-shadow: 0 8px 16px rgba(0,0,0,0.15);
  border-color: rgba(0,0,0,0.1);
  z-index: 10;
}

/* Room Colors */
.bg-available { background: #e0f2f1; color: #00796b; }
.bg-occupied { background: #e3f2fd; color: #1565c0; }
.bg-dirty { background: #ffebee; color: #c62828; }
.bg-maintenance { background: #fff8e1; color: #f57f17; }
.bg-blocked { background: #eceff1; color: #455a64; }
.bg-reserved { background: #f3e5f5; color: #6a1b9a; }

/* Right Column Widgets */
.widget {
  background: white;
  border: 1px solid #e1e8f0;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  margin-bottom: 16px;
}

.widget-title {
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.occ-stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.occ-percent {
  font-size: 28px;
  font-weight: 900;
  color: #0f172a;
}

.mini-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
}

/* Drawer */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.2);
  z-index: 40;
  backdrop-filter: blur(2px);
  animation: fadeIn 0.2s ease-out forwards;
}

.room-drawer {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 340px;
  background: white;
  box-shadow: -10px 0 30px rgba(0,0,0,0.1);
  z-index: 50;
  transform: translateX(100%);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

.room-drawer.open {
  transform: translateX(0);
}

.drawer-header {
  padding: 20px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.drawer-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.action-btn {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 13px;
  text-align: center;
  transition: all 0.2s;
  margin-bottom: 8px;
  cursor: pointer;
}
.action-btn.primary { background: #0f172a; color: white; border: 1px solid #0f172a; }
.action-btn.secondary { background: white; color: #334155; border: 1px solid #cbd5e1; }
.action-btn.danger { background: #fef2f2; color: #ef4444; border: 1px solid #fca5a5; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 900px) {
  .compact-dashboard { grid-template-columns: 1fr; }
  .room-drawer { width: 100%; bottom: 0; top: auto; height: 80vh; transform: translateY(100%); border-radius: 20px 20px 0 0; }
  .room-drawer.open { transform: translateY(0); }
}
"""

with open('src/app/globals.css', 'w') as f:
    f.write(css + "\n" + new_css)
print("CSS Overhauled successfully.")
