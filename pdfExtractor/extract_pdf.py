import fitz  # PyMuPDF
import pdfplumber
import json
import os

def extract_pdf_content(pdf_path, output_dir="output"):
    os.makedirs(output_dir, exist_ok=True)
    json_data = {"pages": []}

    # --- TEXT + PAGE IMAGE EXTRACTION ---
    doc = fitz.open(pdf_path)
    for i, page in enumerate(doc):
        page_text = page.get_text()
        image_path = os.path.join(output_dir, f"page_{i+1}.jpg")
        
        # Save page as image
        pix = page.get_pixmap(dpi=150)
        pix.save(image_path)

        json_data["pages"].append({
            "page_number": i + 1,
            "text": page_text,
            "image_file": os.path.basename(image_path)
        })

    # Save JSON
    json_path = os.path.join(output_dir, "content.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=2)

    # --- TABLE EXTRACTION (pdfplumber) ---
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            tables = page.extract_tables()
            for t_index, table in enumerate(tables):
                if table:
                    table_path = os.path.join(output_dir, f"table_p{i+1}_{t_index+1}.csv")
                    with open(table_path, "w", encoding="utf-8") as f:
                        for row in table:
                            f.write(",".join(cell or "" for cell in row) + "\n")

    print(f"✔ Extraction complete. Output in: {output_dir}")


if __name__ == "__main__":
    input_pdf = "input/Fast Flow Validation.pdf"  # Replace with your actual file name
    extract_pdf_content(input_pdf)
