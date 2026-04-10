import os
import re

directories_to_scan = ['components', 'hooks', 'src']  # Adjust based on project structure

# Regex to find unprotected map calls, e.g. arr.map(
# It looks for variable.map( or property.map( or even nested structures.
# We will just print them first to see.

pattern = re.compile(r'([a-zA-Z0-9_\.\[\]\']+)\.map\(')

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or 'dist' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            matches = pattern.findall(content)
            for m in matches:
                if not m.endswith('|| [])') and not '(' in m:
                    print(f'{filepath}: {m}.map')

