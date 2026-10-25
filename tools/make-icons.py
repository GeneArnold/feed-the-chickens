# Draws placeholder app icons: a hen on a barn-red square.
# Run from the project folder:  python3 tools/make-icons.py
from PIL import Image, ImageDraw


def hen(size, margin):
    img = Image.new("RGBA", (size, size), (183, 50, 44, 255))
    d = ImageDraw.Draw(img)
    s = (size - 2 * margin) / 100  # draw on a 100-unit grid inside the margin

    def box(x0, y0, x1, y1):
        return [margin + x0 * s, margin + y0 * s, margin + x1 * s, margin + y1 * s]

    def pts(*xy):
        return [(margin + x * s, margin + y * s) for x, y in xy]

    d.ellipse(box(10, 82, 90, 96), fill=(120, 30, 26))
    d.line(pts((44, 76), (42, 90)), fill=(224, 138, 30), width=round(4 * s))
    d.line(pts((58, 76), (60, 90)), fill=(224, 138, 30), width=round(4 * s))
    d.polygon(pts((70, 46), (94, 18), (88, 56)), fill=(243, 240, 232))
    d.ellipse(box(18, 38, 86, 84), fill=(255, 255, 255))
    d.ellipse(box(42, 52, 74, 70), fill=(230, 225, 214))
    d.ellipse(box(14, 14, 44, 44), fill=(255, 255, 255))
    for x, y, r in [(20, 12, 6), (28, 9, 7), (36, 12, 5)]:
        d.ellipse(box(x - r, y - r, x + r, y + r), fill=(224, 49, 49))
    d.ellipse(box(14, 38, 22, 50), fill=(224, 49, 49))
    d.polygon(pts((15, 24), (15, 34), (3, 29)), fill=(245, 184, 46))
    d.ellipse(box(21, 22, 27, 28), fill=(34, 34, 34))
    return img


hen(512, 40).save("icons/icon-512.png")
hen(192, 15).save("icons/icon-192.png")
hen(512, 110).save("icons/icon-maskable-512.png")
print("icons written")
