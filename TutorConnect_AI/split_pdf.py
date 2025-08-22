# split_pdf.py
# Usage: python split_pdf.py <input_pdf> <pages_per_split>
# Example: python split_pdf.py data/docs/PYTHON\ PROGRAMMING\ 1.pdf 20

import sys
from pathlib import Path
from PyPDF2 import PdfReader, PdfWriter

def split_pdf(input_pdf, pages_per_split):
    input_pdf = Path(input_pdf)
    reader = PdfReader(str(input_pdf))
    total_pages = len(reader.pages)
    part = 1
    for start in range(0, total_pages, pages_per_split):
        writer = PdfWriter()
        end = min(start + pages_per_split, total_pages)
        for i in range(start, end):
            writer.add_page(reader.pages[i])
        out_path = f"{input_pdf.parent}/PP1_{part}.pdf"
        with open(out_path, "wb") as f:
            writer.write(f)
        print(f"Created {out_path} with pages {start+1}-{end}")
        part += 1

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python split_pdf.py <input_pdf> <pages_per_split>")
        sys.exit(1)
    input_pdf = sys.argv[1]
    pages_per_split = int(sys.argv[2])
    split_pdf(input_pdf, pages_per_split)
