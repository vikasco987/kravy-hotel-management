new_css = """

/* ==============================
   NEW ROOM STATUS PAGE LAYOUT
============================== */

.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fbfcfe 0%, #f7f8fb 100%);
}

.topbar {
  min-height: 92px;
  padding: 0 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-bottom: 1px solid #e8edf3;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 17px;
}

.title-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: linear-gradient(145deg, #7047ff, #8547f5);
  color: white;
  box-shadow: 0 10px 22px rgba(105, 71, 240, .25);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-row h1 {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 27px;
  color: #1f2f43;
}

.title-area p {
  margin: 4px 0 0;
  color: #8ca0b7;
  font-size: 14px;
}

.live-badge {
  padding: 4px 9px;
  border-radius: 999px;
  background: #eef0ff;
  color: #6b52e9;
  font-size: 11px;
  font-weight: 800;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.secondary-button,
.primary-button {
  height: 43px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 17px;
  border-radius: 13px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
}

.secondary-button {
  background: white;
  color: #405269;
  border: 1px solid #dce4ee;
  box-shadow: 0 3px 7px rgba(50, 70, 90, .04);
}

.primary-button {
  background: #162238;
  color: white;
  border: 1px solid #162238;
}

.page-body {
  max-width: 1700px;
  margin: 0 auto;
  padding: 32px 34px 50px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 26px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
}

.eyebrow {
  color: #8da0b8;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.7px;
}

.section-heading h2 {
  margin: 5px 0 4px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 27px;
  color: #24354a;
}

.section-heading p {
  margin: 0;
  color: #91a2b7;
  font-size: 14px;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #8aa0b6;
  font-size: 13px;
}

.live-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #14bd7a;
}

.floor-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.floor-card {
  padding: 20px;
  background: white;
  border: 1px solid #e7edf4;
  border-radius: 20px;
  box-shadow: 0 5px 18px rgba(46, 65, 90, .045);
}

.floor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.floor-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.floor-number {
  min-width: 60px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
  border-radius: 14px;
  background: linear-gradient(145deg, #162238, #263651);
  color: white;
  font-weight: 800;
  font-size: 17px;
  box-shadow: 0 7px 14px rgba(26, 38, 57, .14);
}

.floor-number span {
  color: #9daecc;
  font-size: 12px;
}

.floor-info h3 {
  margin: 0;
  color: #26384e;
  font-size: 18px;
  font-weight: 800;
}

.floor-info p {
  margin: 4px 0 0;
  color: #9aaabd;
  font-size: 13px;
}

.floor-summary {
  display: flex;
  align-items: center;
  gap: 16px;
}

.room-count {
  padding: 7px 11px;
  border-radius: 9px;
  background: #f3f6fa;
  color: #65778d;
  font-size: 12px;
  font-weight: 700;
}

.available-count {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #7c91a7;
  font-size: 12px;
  font-weight: 700;
}

.available-count i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #16be7c;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.room-card {
  min-height: 148px;
  position: relative;
  padding: 16px;
  text-align: left;
  border-radius: 16px;
  background: #fbfcfe;
  border: 1px solid #e7edf4;
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}

.room-card:hover {
  transform: translateY(-2px);
  border-color: #cfd9e7;
  box-shadow: 0 9px 20px rgba(45, 65, 90, .09);
}

.room-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.room-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: white;
  color: #71859b;
  border: 1px solid #e8edf3;
}

.room-status {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .5px;
}

.room-number {
  margin-top: 13px;
  color: #26384d;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 25px;
  font-weight: 700;
}

.room-type {
  margin-top: 2px;
  color: #8b9caf;
  font-size: 12px;
}

.room-bottom {
  position: absolute;
  bottom: 13px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #91a0b2;
  font-size: 11px;
}

.room-bottom span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.room-card.available .room-status { color: #12ad72; }
.room-card.occupied .room-status { color: #4389ef; }
.room-card.dirty .room-status { color: #ef5960; }
.room-card.maintenance .room-status { color: #ef9c22; }
.room-card.blocked .room-status { color: #75859a; }
.room-card.cleaning .room-status { color: #8b5cf6; }
.room-card.inspected .room-status { color: #10b981; }

.legend {
  margin-top: 17px;
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.legend-item {
  height: 39px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-radius: 999px;
  background: white;
  border: 1px solid #e1e8f0;
  color: #62748a;
  font-size: 12px;
  font-weight: 700;
}

.legend-item strong {
  padding: 3px 7px;
  border-radius: 7px;
  background: #f2f5f9;
  color: #65778c;
}

.legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.legend-dot.available { background: #16be7c; }
.legend-dot.occupied { background: #3e88f2; }
.legend-dot.dirty { background: #f05259; }
.legend-dot.maintenance { background: #f2a128; }
.legend-dot.blocked { background: #74859b; }
.legend-dot.cleaning { background: #8b5cf6; }
.legend-dot.inspected { background: #10b981; }

.right-column {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.occupancy-card {
  padding: 23px;
  border-radius: 20px;
  background: radial-gradient(circle at top right, rgba(98, 79, 210, .25), transparent 40%), linear-gradient(145deg, #17243a, #111c30);
  color: white;
  box-shadow: 0 12px 28px rgba(24, 36, 58, .16);
}

.occupancy-header {
  display: flex;
  justify-content: space-between;
  color: #aebcf4;
}

.occupancy-header h3 {
  margin: 0;
  font-size: 16px;
}

.occupancy-header p {
  margin: 4px 0 0;
  color: #8291aa;
  font-size: 12px;
}

.circle-inner {
  width: 158px;
  height: 158px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #111d31;
}

.circle-inner strong {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 43px;
}

.circle-inner span {
  margin-top: 2px;
  color: #8997ad;
  font-size: 12px;
  letter-spacing: 2px;
}

.occupancy-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 9px;
}

.mini-stat {
  padding: 13px;
  border-radius: 12px;
  background: rgba(67, 80, 105, .45);
}

.mini-stat span {
  display: block;
  color: #92a0b6;
  font-size: 12px;
}

.mini-stat strong {
  display: block;
  margin-top: 5px;
  font-size: 23px;
}

.mini-stat .available { color: #1fd39b; }
.mini-stat .occupied { color: #4e92f7; }
.mini-stat .dirty { color: #ff6268; }
.mini-stat .blocked { color: #d6dbe3; }

.quick-actions {
  padding: 19px;
  background: white;
  border: 1px solid #e4eaf2;
  border-radius: 18px;
}

.quick-title {
  display: flex;
  align-items: center;
  gap: 11px;
}

.quick-icon {
  width: 43px;
  height: 43px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  background: #e8edff;
  color: #6675ee;
}

.quick-title h3 {
  margin: 0;
  color: #2d3d52;
  font-size: 15px;
}

.quick-title p {
  margin: 3px 0 0;
  color: #9aaabd;
  font-size: 12px;
}

.room-action {
  width: 100%;
  height: 44px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: white;
  border: 1px solid #dfe6ef;
  border-radius: 11px;
  color: #617289;
  cursor: pointer;
}

@media (max-width: 1250px) {
  .page-body { grid-template-columns: 1fr; }
  .right-column { display: grid; grid-template-columns: 1fr 1fr; }
  .room-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 850px) {
  .topbar { padding: 15px 20px; align-items: flex-start; gap: 15px; flex-direction: column; }
  .header-actions { width: 100%; }
  .secondary-button, .primary-button { flex: 1; justify-content: center; }
  .page-body { padding: 25px 16px; }
  .right-column { grid-template-columns: 1fr; }
  .room-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .floor-header { align-items: flex-start; gap: 15px; flex-direction: column; }
  .floor-summary { width: 100%; }
}

@media (max-width: 500px) {
  .title-icon { width: 48px; height: 48px; }
  .title-row h1 { font-size: 23px; }
  .room-grid { grid-template-columns: 1fr; }
  .floor-card { padding: 14px; }
  .floor-number { min-width: 53px; }
  .legend { display: grid; grid-template-columns: repeat(2, 1fr); }
  .legend-item { justify-content: center; }
}

"""
with open('src/app/globals.css', 'a') as f:
    f.write(new_css)
print("CSS appended.")
