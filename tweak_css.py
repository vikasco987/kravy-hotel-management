import re

with open('src/app/globals.css', 'r') as f:
    css = f.read()

# 1. Reduce topbar height
css = re.sub(r'\.topbar \{\n  min-height: 92px;\n  padding: 0 42px;', '.topbar {\n  min-height: 70px;\n  padding: 0 24px;', css)

# 2. Reduce page-body padding
css = re.sub(r'\.page-body \{\n  max-width: 1700px;\n  margin: 0 auto;\n  padding: 32px 34px 50px;', '.page-body {\n  max-width: 1700px;\n  margin: 0 auto;\n  padding: 16px 20px 30px;', css)

# 3. Reduce floor-card padding
css = re.sub(r'\.floor-card \{\n  padding: 20px;', '.floor-card {\n  padding: 12px 16px;', css)

# 4. Reduce floor-header margin
css = re.sub(r'\.floor-header \{\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 18px;', '.floor-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 10px;', css)

# 5. Room card tweaks
css = re.sub(r'\.room-card \{\n  min-height: 148px;\n  position: relative;\n  padding: 16px;', '.room-card {\n  min-height: 110px;\n  position: relative;\n  padding: 12px;', css)

css = re.sub(r'\.room-number \{\n  margin-top: 13px;\n  color: #26384d;\n  font-family: Georgia, "Times New Roman", serif;\n  font-size: 25px;', '.room-number {\n  margin-top: 8px;\n  color: #26384d;\n  font-family: Georgia, "Times New Roman", serif;\n  font-size: 18px;', css)

css = re.sub(r'\.room-type \{\n  margin-top: 2px;\n  color: #8b9caf;\n  font-size: 12px;', '.room-type {\n  margin-top: 2px;\n  color: #8b9caf;\n  font-size: 10px;', css)

css = re.sub(r'\.room-bottom \{\n  position: absolute;\n  bottom: 13px;\n  left: 16px;\n  right: 16px;', '.room-bottom {\n  position: absolute;\n  bottom: 10px;\n  left: 12px;\n  right: 12px;', css)

css = re.sub(r'\.room-icon \{\n  width: 36px;\n  height: 36px;', '.room-icon {\n  width: 28px;\n  height: 28px;', css)

# 6. Occupancy card tweaks
css = re.sub(r'\.occupancy-card \{\n  padding: 23px;', '.occupancy-card {\n  padding: 16px;', css)
css = re.sub(r'\.circle-inner \{\n  width: 158px;\n  height: 158px;', '.circle-inner {\n  width: 130px;\n  height: 130px;', css)

# 7. Quick actions tweaks
css = re.sub(r'\.quick-actions \{\n  padding: 19px;', '.quick-actions {\n  padding: 16px;', css)
css = re.sub(r'\.quick-icon \{\n  width: 43px;\n  height: 43px;', '.quick-icon {\n  width: 36px;\n  height: 36px;', css)
css = re.sub(r'\.room-action \{\n  width: 100%;\n  height: 44px;', '.room-action {\n  width: 100%;\n  height: 38px;', css)

with open('src/app/globals.css', 'w') as f:
    f.write(css)

print("CSS tweaked for smaller sizes.")
