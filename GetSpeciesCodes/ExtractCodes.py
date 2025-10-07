import csv

input_file = "input.csv"

output_file = "bird_species_codes.csv"

with open(input_file, mode="r", encoding="utf-8") as infile, \
     open(output_file, mode="w", newline="", encoding="utf-8") as outfile:
    
    reader = csv.DictReader(infile)
    writer = csv.writer(outfile)

    writer.writerow(["English name", "species_code"])


    for row in reader:
       
        if row.get("category", "").strip().lower() == "species":
            english_name = row.get("English name", "").strip()
            species_code = row.get("species_code", "").strip()
            if english_name and species_code:
                writer.writerow([english_name, species_code])

print(f"Extracted species codes to '{output_file}'.")
