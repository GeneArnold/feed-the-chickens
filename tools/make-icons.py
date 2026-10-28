# Makes the app icons: the cartoon hen on a flat square.
# Run from the project folder:  python3 tools/make-icons.py <big cut-out hen .png>
# (a hen from tools/swarm.py, cut out with tools/cutout.py at --height 600)
import sys

from PIL import Image

BACKGROUND = (183, 50, 44, 255)  # barn red

hen = Image.open(sys.argv[1]).convert("RGBA")
# The soft grey shadow under her feet survives the cut-out, so it goes: light grey pixels in the
# bottom fifth that join up with the clear outside. Her white belly is inside her black outline.
px = hen.load()
top = int(hen.height * 0.8)
grey = lambda x, y: px[x, y][3] and max(px[x, y][:3]) - min(px[x, y][:3]) < 20 and min(px[x, y][:3]) > 120
todo = [(x, y) for y in range(top, hen.height) for x in range(hen.width) if px[x, y][3] == 0]
while todo:
    x, y = todo.pop()
    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
        if 0 <= nx < hen.width and top <= ny < hen.height and grey(nx, ny):
            px[nx, ny] = (0, 0, 0, 0)
            todo.append((nx, ny))
hen = hen.crop(hen.getbbox())


def icon(size, margin, background=BACKGROUND):
    img = Image.new("RGBA", (size, size), background)
    fit = (size - 2 * margin) / max(hen.size)
    h = hen.resize((round(hen.width * fit), round(hen.height * fit)), Image.LANCZOS)
    img.alpha_composite(h, ((size - h.width) // 2, (size - h.height) // 2))
    return img


if __name__ == "__main__":
    icon(512, 40).save("icons/icon-512.png")
    icon(192, 15).save("icons/icon-192.png")
    icon(512, 110).save("icons/icon-maskable-512.png")
    print("icons written")
