with open('src/app/components/RoomDashboard.tsx', 'r') as f:
    content = f.read()

# Revert fix_grid_div.py
content = content.replace("""              </div>
            </div>
          </div>
          </div>

          <div className="compact-dashboard">""", """              </div>
            </div>
          </div>

          <div className="compact-dashboard">""")

with open('src/app/components/RoomDashboard.tsx', 'w') as f:
    f.write(content)
