from pathlib import Path
import xml.etree.ElementTree as ET
import json

files_info_path = Path("./files_info.json")

with open(files_info_path, "r", encoding="utf-8") as f:
    files_info = json.load(f)

for col_index, collection in enumerate(files_info):
    collection_id = collection["path"]
    pages = collection["pages"]
    index_entries = []

    for page_index, filename in enumerate(pages):
        xml_path = Path(f"./files/{collection_id}/xml/{filename}.xml")
        if not xml_path.exists():
            print(f"Missing file: {xml_path}")
            continue

        tree = ET.parse(xml_path)
        root = tree.getroot()
        l_elements = root.findall(".//{*}l")

        for l in l_elements:
            text = "".join(l.itertext()).strip()
            if text:
                index_entries.append({
                    "text": text,
                    "facs": l.attrib.get("facs", ""),
                    "page": page_index+1,
                    "page_name": filename
                })

    out_path = Path(f"./files/{collection_id}/index.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(index_entries, f, ensure_ascii=False, indent=2)

print("Indexing complete.")