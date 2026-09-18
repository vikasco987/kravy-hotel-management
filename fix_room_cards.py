import re

with open('src/app/globals.css', 'r') as f:
    css = f.read()

# Replace .room-card styles
new_room_card_css = """
.room-card {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  background: #fbfcfe;
  border: 1px solid #e7edf4;
  cursor: pointer;
  transition: transform .1s ease, box-shadow .1s ease, border-color .1s ease;
}

.room-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(45, 65, 90, .08);
}

.room-number {
  color: inherit;
  font-family: Inter, sans-serif;
  font-size: 14px;
  font-weight: 700;
  margin: 0;
}

.room-card.available { background: #e6f6f0; color: #12ad72; border-color: #bce5d3; }
.room-card.occupied { background: #eaf1fa; color: #4389ef; border-color: #c9dcf6; }
.room-card.dirty { background: #fcebeb; color: #ef5960; border-color: #f8c9cb; }
.room-card.maintenance { background: #fdf5e8; color: #ef9c22; border-color: #fae1bb; }
.room-card.blocked { background: #f0f2f4; color: #75859a; border-color: #d1d8df; }
.room-card.cleaning { background: #f3effe; color: #8b5cf6; border-color: #dcd1fb; }
.room-card.inspected { background: #e7f8f2; color: #10b981; border-color: #bdf0db; }
.room-card.reserved { background: #fef4ea; color: #f97316; border-color: #fce2c9; }
"""

# Regex to remove old room-card related styles
css = re.sub(r'\.room-card \{[\s\S]*?\}', '', css)
css = re.sub(r'\.room-card:hover \{[\s\S]*?\}', '', css)
css = re.sub(r'\.room-top \{[\s\S]*?\}', '', css)
css = re.sub(r'\.room-icon \{[\s\S]*?\}', '', css)
css = re.sub(r'\.room-status \{[\s\S]*?\}', '', css)
css = re.sub(r'\.room-number \{[\s\S]*?\}', '', css)
css = re.sub(r'\.room-type \{[\s\S]*?\}', '', css)
css = re.sub(r'\.room-bottom \{[\s\S]*?\}', '', css)
css = re.sub(r'\.room-bottom span \{[\s\S]*?\}', '', css)
css = re.sub(r'\.room-card\.available \.room-status \{[\s\S]*?\}', '', css)
css = re.sub(r'\.room-card\.occupied \.room-status \{[\s\S]*?\}', '', css)
css = re.sub(r'\.room-card\.dirty \.room-status \{[\s\S]*?\}', '', css)
css = re.sub(r'\.room-card\.maintenance \.room-status \{[\s\S]*?\}', '', css)
css = re.sub(r'\.room-card\.blocked \.room-status \{[\s\S]*?\}', '', css)
css = re.sub(r'\.room-card\.cleaning \.room-status \{[\s\S]*?\}', '', css)
css = re.sub(r'\.room-card\.inspected \.room-status \{[\s\S]*?\}', '', css)

# Make the grid for rooms tighter since cards are small
css = re.sub(r'\.room-grid \{\n  display: grid;\n  grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);\n  gap: 12px;\n\}', '.room-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(65px, 1fr));\n  gap: 8px;\n}', css)

with open('src/app/globals.css', 'w') as f:
    f.write(css + "\n" + new_room_card_css)

print("Globals updated")
