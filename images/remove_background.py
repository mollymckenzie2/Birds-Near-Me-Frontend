import os
from rembg import remove
from PIL import Image


input_folder = "input"
output_folder = "output"

PIXEL_SIZE = 64

SCALE = 4

os.makedirs(output_folder, exist_ok=True)
os.makedirs(input_folder, exist_ok=True)  


if not os.listdir(input_folder):
    print(f"📁 Input folder is empty. Put your bird images in '{input_folder}' and run again.")
    exit()


for filename in os.listdir(input_folder):
    if not filename.lower().endswith((".png", ".jpg", ".jpeg")):
        continue

    input_path = os.path.join(input_folder, filename)
    
    base_name = os.path.splitext(filename)[0]
    output_path = os.path.join(output_folder, base_name + '.png')

    print(f"Processing {filename}...")

    with open(input_path, "rb") as inp_file:
        input_data = inp_file.read()
        output_data = remove(input_data)

    with open("temp.png", "wb") as temp_file:
        temp_file.write(output_data)

    img = Image.open("temp.png")
   
    if img.mode != 'RGBA':
        img = img.convert('RGBA')


    w, h = img.size
    if w >= h:
        new_w = PIXEL_SIZE
        new_h = max(1, round(h * (PIXEL_SIZE / w)))
    else:
        new_h = PIXEL_SIZE
        new_w = max(1, round(w * (PIXEL_SIZE / h)))

    img_small = img.resize((new_w, new_h), resample=Image.NEAREST)
    img_pixelated = img_small.resize((new_w * SCALE, new_h * SCALE), Image.NEAREST)

  
    img_pixelated.save(output_path, format='PNG')

if os.path.exists("temp.png"):
    os.remove("temp.png")

print(f"Pixelated images saved in '{output_folder}'")
