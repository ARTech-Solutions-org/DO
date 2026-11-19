import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# Load caricature sample
src = Image.open('public/artwork/web/caricature-sample-full.webp').convert('RGB')
arr = np.array(src)
h, w, _ = arr.shape

# Distance from background color [147, 102, 252]
bg_color = np.array([147, 102, 252], dtype=float)
diff = np.sqrt(np.sum((arr.astype(float) - bg_color) ** 2, axis=2))
subject_mask = diff > 25.0

# Create pure deep black canvas with subtle vignette
out = Image.new('RGB', (w, h), (5, 4, 10))
draw = ImageDraw.Draw(out)

# Find subject center
y_indices, x_indices = np.where(subject_mask)
center_y = int(np.mean(y_indices)) if len(y_indices) else h // 2
center_x = int(np.mean(x_indices)) if len(x_indices) else w // 2
max_radius = np.sqrt((w / 2) ** 2 + (h / 2) ** 2)

# Colors
# Near: Ultraviolet / Neon Purple (#966BFC -> #C34AFF)
# Mid: Magenta (#D946EF)
# Far: Amber / Gold (#FFB044 -> #E48D3D)
c_near = np.array([150, 107, 252], dtype=float)
c_mid = np.array([217, 70, 239], dtype=float)
c_far = np.array([255, 176, 68], dtype=float)
c_gold = np.array([228, 141, 61], dtype=float)

def get_lidar_color(dist_norm, intensity):
    # dist_norm: 0 at center of face, 1 at edge of subject
    if dist_norm < 0.4:
        t = dist_norm / 0.4
        col = (1 - t) * c_near + t * c_mid
    elif dist_norm < 0.8:
        t = (dist_norm - 0.4) / 0.4
        col = (1 - t) * c_mid + t * c_far
    else:
        t = (dist_norm - 0.8) / 0.2
        col = (1 - t) * c_far + t * c_gold
    
    # Scale with intensity
    col = np.clip(col * (0.65 + 0.35 * intensity), 0, 255)
    return tuple(col.astype(int))

# Draw faint scan lines
for angle in range(0, 360, 15):
    rad = np.deg2rad(angle)
    x2 = int(center_x + max_radius * np.cos(rad))
    y2 = int(center_y + max_radius * np.sin(rad))
    draw.line([(center_x, center_y), (x2, y2)], fill=(25, 20, 45), width=1)

# Sampling grid for points
step = 4
np.random.seed(42)

points = []
for y in range(0, h, step):
    for x in range(0, w, step):
        if subject_mask[y, x]:
            # Jitter slightly for realistic sensor scatter
            jx = x + np.random.randint(-1, 2)
            jy = y + np.random.randint(-1, 2)
            jx = max(0, min(w - 1, jx))
            jy = max(0, min(h - 1, jy))
            
            # Surface luminance / edge metric
            pixel = arr[jy, jx].astype(float)
            lum = (0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2]) / 255.0
            
            dist = np.sqrt((jx - center_x) ** 2 + ((jy - center_y) * 1.1) ** 2)
            dist_norm = min(1.0, dist / (0.42 * min(w, h)))
            
            color = get_lidar_color(dist_norm, lum)
            radius = 1 if lum < 0.5 else 2
            points.append((jx, jy, radius, color))

# Draw points
for px, py, r, col in points:
    if r == 1:
        draw.point((px, py), fill=col)
    else:
        draw.ellipse([(px - 1, py - 1), (px + 1, py + 1)], fill=col)

# Save full (1195x1316)
out.save('public/artwork/web/lidar-sample-full.webp', 'WEBP', quality=90)

# Save compact (540x595)
compact = out.resize((540, 595), Image.Resampling.LANCZOS)
compact.save('public/artwork/web/lidar-sample-compact.webp', 'WEBP', quality=88)

print("LiDAR samples successfully generated!")
