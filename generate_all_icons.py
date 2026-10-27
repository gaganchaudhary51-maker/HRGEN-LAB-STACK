import os
import struct

def generate_ico(filepath, primary_color_rgb, accent_color_rgb, symbol_type):
    """
    Generates a 32-bit RGBA 64x64 .ico file.
    primary_color_rgb: (R, G, B) - background/body
    accent_color_rgb: (R, G, B) - foreground symbol/glow
    symbol_type: 'CROSS' | 'FLASK' | 'SHIELD' | 'CADUCEUS'
    """
    width = 64
    height = 64

    ico_header = struct.pack('<HHH', 0, 1, 1)

    biSize = 40
    biWidth = width
    biHeight = height * 2
    biPlanes = 1
    biBitCount = 32
    biCompression = 0
    biSizeImage = width * height * 4
    biXPelsPerMeter = 0
    biYPelsPerMeter = 0
    biClrUsed = 0
    biClrImportant = 0

    bmp_header = struct.pack('<IIIHHIIIIII',
        biSize, biWidth, biHeight, biPlanes, biBitCount,
        biCompression, biSizeImage, biXPelsPerMeter, biYPelsPerMeter, biClrUsed, biClrImportant
    )

    pr, pg, pb = primary_color_rgb
    ar, ag, ab = accent_color_rgb

    pixels = bytearray()
    for y in range(height):
        for x in range(width):
            dx = x - 32
            dy = y - 32
            dist = (dx*dx + dy*dy) ** 0.5
            
            if dist > 30:
                # Transparent outside
                pixels.extend([0, 0, 0, 0])
            elif dist > 27:
                # Accent Glow Border (BGRA format)
                pixels.extend([ab, ag, ar, 255])
            else:
                # Inner emblem based on symbol_type
                is_symbol = False
                if symbol_type in ('CROSS', 'CADUCEUS'):
                    is_v = (27 <= x <= 36) and (14 <= y <= 49)
                    is_h = (14 <= x <= 49) and (27 <= y <= 36)
                    is_symbol = (is_v or is_h)
                elif symbol_type == 'FLASK':
                    # Conical flask shape
                    is_neck = (28 <= x <= 35) and (14 <= y <= 26)
                    is_base = (20 <= x <= 43) and (26 < y <= 48) and (abs(x - 32) <= (y - 18) * 0.7)
                    is_symbol = (is_neck or is_base)
                elif symbol_type == 'SHIELD':
                    # Shield shape
                    in_shield_x = (18 <= x <= 45)
                    in_shield_y = (15 <= y <= 38)
                    in_bottom_tip = (y > 38) and (abs(x - 32) <= (50 - y) * 1.8)
                    is_symbol = (in_shield_x and (in_shield_y or in_bottom_tip))

                if is_symbol:
                    pixels.extend([ab, ag, ar, 255])
                else:
                    pixels.extend([pb, pg, pr, 255])

    mask_bytes_per_row = ((width + 31) // 32) * 4
    mask = bytearray(mask_bytes_per_row * height)

    img_data = bmp_header + pixels + mask
    img_size = len(img_data)

    ico_dir = struct.pack('<BBBBHHII', width, height, 0, 0, 1, 32, img_size, 22)

    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'wb') as f:
        f.write(ico_header + ico_dir + img_data)
    print(f"Generated icon: {filepath}")

if __name__ == '__main__':
    desktop = r'C:\Users\pc\Desktop'
    master = os.path.join(desktop, 'HRGen_Diagnostic_Ecosystem')

    # 1. DSD Care: Deep Navy + Cyan Caduceus
    dsd_ico = os.path.join(master, '01_DSD_Patient_Booking', 'dsd_care.ico')
    generate_ico(dsd_ico, (3, 26, 51), (0, 210, 255), 'CADUCEUS')

    # 2. PhleboTrack: Deep Slate + Electric Orange
    phlebo_ico = os.path.join(master, '02_PhleboTrack_Workforce', 'phlebotrack.ico')
    generate_ico(phlebo_ico, (14, 19, 31), (255, 140, 0), 'CROSS')

    # 3. GIA LIMS: Obsidian + Laboratory Emerald
    lims_ico = os.path.join(master, '03_GIA_LIMS_Core', 'gia_lims.ico')
    generate_ico(lims_ico, (10, 14, 23), (16, 185, 129), 'FLASK')

    # 4. HRGERN Security Inspector: Midnight Navy + Cyber Cyan Shield
    sec_ico = os.path.join(master, '04_HRGERN_Security_Inspector', 'hrgern_inspector.ico')
    generate_ico(sec_ico, (6, 11, 24), (6, 182, 212), 'SHIELD')
