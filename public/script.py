import os
import json
import natsort

# Path to the top-level directory containing the folders
top_directory = './files'

# Function to process each subfolder
def process_folders(directory):
    result = []

    # Get sorted list of folders in natural sort order
    folders = natsort.natsorted([
        folder for folder in os.listdir(directory)
        if os.path.isdir(os.path.join(directory, folder))
    ])

    for folder in folders:
        folder_path = os.path.join(directory, folder)

        # Look for the xml folder
        xml_folder_path = os.path.join(folder_path, 'xml')

        if os.path.exists(xml_folder_path) and os.path.isdir(xml_folder_path):
            # Extract XML file names
            xml_files = natsort.natsorted([
                os.path.splitext(f)[0] for f in os.listdir(xml_folder_path)
                if os.path.isfile(os.path.join(xml_folder_path, f)) and f.lower().endswith('.xml')
            ])

            # Determine the metadata from meta.json or use folder name as fallback
            meta_file_path = os.path.join(folder_path, 'meta.json')
            if os.path.exists(meta_file_path):
                with open(meta_file_path, 'r') as meta_file:
                    metadata = json.load(meta_file)
                    collection_name = metadata.get("name", folder)
            else:
                collection_name = folder

            # Add to result
            result.append({
                "path": folder,
                "name": collection_name,
                "pages": xml_files
            })

    return result

# Process folders and save to JSON
files_info = process_folders(top_directory)

# Save to JSON file
with open('files_info.json', 'w') as json_file:
    json.dump(files_info, json_file, indent=4)

print("files_info.json has been created successfully.")
