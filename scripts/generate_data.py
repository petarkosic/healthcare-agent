import os
import uuid
import random
import json
from datetime import datetime, timedelta
from typing import List
from faker import Faker
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

fake = Faker()
client = OpenAI(api_key=os.getenv("API_KEY"), base_url=os.getenv("BASE_URL"))

NUM_PATIENTS = 10
ENCOUNTERS_PER_PATIENT = (3, 6)
NOTES_PER_ENCOUNTER = (1, 3)

OUT_DIR = "synthetic_ehr_data"
os.makedirs(OUT_DIR, exist_ok=True)

COMMON_CONDITIONS = [
    "hypertension", "type 2 diabetes", "asthma", "hyperlipidemia",
    "upper respiratory infection", "back pain", "anxiety", "headache"
]

LAB_TEMPLATES = [
    ("CBC", {"WBC": (4.0, 10.0), "HGB": (12.0, 17.0), "PLT": (150, 400)}),
    ("BMP", {"Na": (135, 145), "K": (3.5, 5.0), "Creatinine": (0.6, 1.3)}),
]

MEDICATION_LIST = [
    "Lisinopril 10mg", "Metformin 500mg", "Atorvastatin 20mg",
    "Albuterol inhaler", "Sertraline 50mg", "Ibuprofen 400mg"
]

NOTE_TYPES = [
    "progress", "discharge", "radiology", "operative", "nursing"
]

def random_date_within(days=365):
    return datetime.now() - timedelta(days=random.randint(1, days))

def generate_lab_result(lab_name, ranges):
    results = {}
    for key, (low, high) in ranges.items():
        results[key] = round(random.uniform(low, high), 2)
    return results

def generate_clinical_note(condition, note_type):
    prompt = f"""
Generate a realistic clinical {note_type} note (200–350 words).
Include condition: {condition}.
Include: history, assessment, plan, and relevant findings.
Do NOT include patient-identifying information.
    """
    resp = client.chat.completions.create(
        model="gemini-2.0-flash",
        messages=[{"role": "user", "content": prompt}]
    )
    return resp.choices[0].message.content.strip()

patients = []
encounters = []
notes = []
labs = []
meds = []

for _ in range(NUM_PATIENTS):
    patient_id = str(uuid.uuid4())
    condition = random.choice(COMMON_CONDITIONS)

    patient = {
        "patient_id": patient_id,
        "first_name": fake.first_name(),
        "last_name": fake.last_name(),
        "dob": fake.date_of_birth(minimum_age=20, maximum_age=90).isoformat(),
        "gender": random.choice(["male", "female", "other"]),
        "phone": fake.phone_number(),
        "address": fake.address().replace("\n", ", ")
    }
    patients.append(patient)

    for med_name in random.sample(MEDICATION_LIST, random.randint(0, 3)):
        meds.append({
            "med_id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "drug": med_name,
            "sig": "Take once daily",
            "start_date": random_date_within(200).date().isoformat(),
            "end_date": None,
            "prescriber": fake.name()
        })

    for _ in range(random.randint(*ENCOUNTERS_PER_PATIENT)):
        encounter_id = str(uuid.uuid4())
        encounter_date = random_date_within(400).date().isoformat()

        encounter = {
            "encounter_id": encounter_id,
            "patient_id": patient_id,
            "date": encounter_date,
            "type": random.choice(["outpatient", "inpatient", "emergency"]),
            "reason": f"Follow-up for {condition}",
            "provider": fake.name()
        }
        encounters.append(encounter)

        if random.random() < 0.7:
            lab_name, ranges = random.choice(LAB_TEMPLATES)
            labs.append({
                "lab_id": str(uuid.uuid4()),
                "patient_id": patient_id,
                "encounter_id": encounter_id,
                "date": encounter_date,
                "test_name": lab_name,
                "results": generate_lab_result(lab_name, ranges),
                "interpretation": random.choice(["normal", "abnormal"]),
                "narrative": f"{lab_name} performed for {condition} evaluation."
            })

        for _ in range(random.randint(*NOTES_PER_ENCOUNTER)):
            note_type = random.choice(NOTE_TYPES)
            text = generate_clinical_note(condition, note_type)

            notes.append({
                "note_id": str(uuid.uuid4()),
                "patient_id": patient_id,
                "encounter_id": encounter_id,
                "date": encounter_date,
                "note_type": note_type,
                "text": text
            })

with open(f"{OUT_DIR}/patients.jsonl", "w") as f:
    for p in patients:
        f.write(json.dumps(p) + "\n")

with open(f"{OUT_DIR}/encounters.jsonl", "w") as f:
    for e in encounters:
        f.write(json.dumps(e) + "\n")

with open(f"{OUT_DIR}/notes.jsonl", "w") as f:
    for n in notes:
        f.write(json.dumps(n) + "\n")

with open(f"{OUT_DIR}/labs.jsonl", "w") as f:
    for l in labs:
        f.write(json.dumps(l) + "\n")

with open(f"{OUT_DIR}/meds.jsonl", "w") as f:
    for m in meds:
        f.write(json.dumps(m) + "\n")

print("Synthetic EHR dataset generated successfully!")
