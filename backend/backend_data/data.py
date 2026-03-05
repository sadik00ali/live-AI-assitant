import os
import json
from pymongo import MongoClient
from bson import ObjectId

# ---------------- CONFIG ----------------
DATA_FOLDER = r"backend_data\data_json"
DB_NAME = "hospital_db"

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client[DB_NAME]

# ---------------- FUNCTION TO LOAD JSON AND INSERT ----------------
def load_json_to_collection(file_path, collection_name):
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Convert string IDs to ObjectId where needed
    for item in data:
        if "assignedDoctor" in item and isinstance(item["assignedDoctor"], str):
            try:
                item["assignedDoctor"] = ObjectId(item["assignedDoctor"])
            except:
                pass

        if "labReports" in item:
            for report in item["labReports"]:
                if "_id" in report and isinstance(report["_id"], str):
                    try:
                        report["_id"] = ObjectId(report["_id"])
                    except:
                        pass

        if "prescriptions" in item:
            for pres in item["prescriptions"]:
                if "_id" in pres and isinstance(pres["_id"], str):
                    try:
                        pres["_id"] = ObjectId(pres["_id"])
                    except:
                        pass

    if data:
        result = db[collection_name].insert_many(data)
        print(f"{len(result.inserted_ids)} documents inserted into '{collection_name}'")
    else:
        print(f"No data found in {collection_name}")

# ---------------- LOOP THROUGH ALL JSON FILES ----------------
for file_name in os.listdir(DATA_FOLDER):
    if file_name.endswith(".json"):
        # Extract collection name from file name
        # e.g., hospital_db.patients.json -> patients
        collection_name = file_name.split(".")[1]
        file_path = os.path.join(DATA_FOLDER, file_name)
        load_json_to_collection(file_path, collection_name)
