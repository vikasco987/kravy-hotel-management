with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# Replace the incorrect final div fix
target1 = "    </div>\n      {/* Add Floor Modal */}"
replacement1 = "      {/* Add Floor Modal */}"
content = content.replace(target1, replacement1)

# Fix the dash-grid-2 closure
target2 = """              </div>
            </div>
          </div>

          <div className="compact-dashboard">"""

replacement2 = """              </div>
            </div>
          </div>
          </div>

          <div className="compact-dashboard">"""

content = content.replace(target2, replacement2)

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
