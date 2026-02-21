from PIL import Image
from collections import Counter
import json

# Open image
img = Image.open('frontend/logo/willy collection.png').convert('RGB')

# Get all pixels
pixels = list(img.getdata())

# Count colors and get top ones
color_counts = Counter(pixels)
top_colors = color_counts.most_common(15)

# Convert to hex and print
print("Top colors in the logo:")
for color, count in top_colors:
    hex_color = '#{:02x}{:02x}{:02x}'.format(color[0], color[1], color[2])
    percentage = (count / len(pixels)) * 100
    print(f'{hex_color} - {count} pixels ({percentage:.1f}%)')
