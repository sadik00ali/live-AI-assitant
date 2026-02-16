from PIL import Image
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

img = Image.open(r"C:\Users\prave\OneDrive\Documents\hospital_expo_\clu_care\imagebot\example.png")
text = pytesseract.image_to_string(img)
print(text)
