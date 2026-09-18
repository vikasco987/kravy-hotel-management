with open('src/app/globals.css', 'r') as f:
    css = f.read()

# Find the start of the junk
start_junk = css.find(".quick-title p {")
start_junk = css.find("}", start_junk) + 1

# Find the start of the new code
end_junk = css.find("/* ==============================\n   COMPACT ROOM UI")

if start_junk != 0 and end_junk != -1:
    css = css[:start_junk] + "\n\n" + css[end_junk:]
    
    with open('src/app/globals.css', 'w') as f:
        f.write(css)
    print("Fixed junk in CSS.")
else:
    print("Could not find boundaries.")
