-- Structure follows the CTE pattern so generated serials/ids are used consistently.

\c healthcare_agent

WITH
pats AS (
  INSERT INTO patients (
    patient_serial_number, first_name, last_name, date_of_birth, gender, blood_type,
    email, phone, address, emergency_contact_name, emergency_contact_phone, allergies, chronic_conditions
  ) VALUES
    (generate_login_id('P'), 'John', 'Anderson', '1979-03-14', 'Male', 'O+', 'john.anderson@example.com', '+1-555-101-0001', '12 Elm Street, Boston, MA', 'Karen Anderson', '+1-555-201-0001', ARRAY['Penicillin'],ARRAY['Hypertension']),
    (generate_login_id('P'), 'Emma', 'Bell', '1992-07-22', 'Female', 'A+', 'emma.bell@example.com', '+1-555-101-0002', '45 Oak Avenue, Denver, CO', 'Mark Bell', '+1-555-201-0002', ARRAY['Peanuts'],ARRAY['Asthma']),
    (generate_login_id('P'), 'Michael', 'Cooper', '1980-11-05', 'Male', 'B-', 'michael.cooper@example.com', '+1-555-101-0003', '78 Pine Road, Seattle, WA', 'Laura Cooper', '+1-555-201-0003', ARRAY[]::text[],ARRAY['Type 2 diabetes']),
    (generate_login_id('P'), 'Sophie', 'Dawson', '2001-02-18', 'Female', 'O-', 'sophie.dawson@example.com', '+1-555-101-0004', '9 Maple Lane, Austin, TX', 'Daniel Dawson', '+1-555-201-0004', ARRAY['Dust'],ARRAY[]::text[]),
    (generate_login_id('P'), 'Robert', 'Edwards', '1965-09-10', 'Male', 'AB+', 'robert.edwards@example.com', '+1-555-101-0005', '101 Harbor Drive, Miami, FL', 'Anna Edwards', '+1-555-201-0005', ARRAY['Latex'],ARRAY['Coronary artery disease']),
    (generate_login_id('P'), 'Olivia', 'Foster', '1988-06-30', 'Female', 'A-', 'olivia.foster@example.com', '+1-555-101-0006', '33 Highland Road, Chicago, IL', 'Rachel Foster', '+1-555-201-0006', ARRAY['Shellfish'],ARRAY['Hypothyroidism']),
    (generate_login_id('P'), 'Daniel', 'Griffin', '1995-01-09', 'Male', 'B+', 'daniel.griffin@example.com', '+1-555-101-0007', '502 Lakeview St, Phoenix, AZ', 'Maria Griffin', '+1-555-201-0007', ARRAY[]::text[],ARRAY[]::text[]),
    (generate_login_id('P'), 'Ava', 'Harrison', '1972-10-11', 'Female', 'O+', 'ava.harrison@example.com', '+1-555-101-0008', '9 Sunset Blvd, Portland, OR', 'Jason Harrison', '+1-555-201-0008', ARRAY['Gluten'],ARRAY['Osteoarthritis']),
    (generate_login_id('P'), 'James', 'Irwin', '1982-04-07', 'Male', 'A+', 'james.irwin@example.com', '+1-555-101-0009', '12 Willow St, Nashville, TN', 'Karen Irwin', '+1-555-201-0009', ARRAY[]::text[],ARRAY['Hyperlipidemia']),
    (generate_login_id('P'), 'Lily', 'Johnson', '1999-12-25', 'Female', 'AB-', 'lily.johnson@example.com', '+1-555-101-0010', '612 Meadow Ln, San Jose, CA', 'Derek Johnson', '+1-555-201-0010', ARRAY['Strawberries'],ARRAY[]::text[])
  RETURNING patient_id, patient_serial_number, first_name, last_name
),

-- For doctor_serial_number, use generate_login_id('D')
docs AS (
  INSERT INTO doctors (
    doctor_serial_number, first_name, last_name, specialty, license_number, email, phone, created_at
  ) VALUES
    ('Dsn90mA2', 'Alan', 'Parker', 'Internal Medicine', 'IM-2025-0001', 'alan.parker@internal.example.com', '+1-555-900-0100', now() - INTERVAL '90 days')
  RETURNING doctor_id, doctor_serial_number, first_name, last_name
),

visits AS (
  INSERT INTO visits (
    patient_serial_number, doctor_serial_number, visit_date, visit_type, chief_complaint, status, duration_minutes, location, created_at, updated_at
  ) VALUES
    ((SELECT patient_serial_number FROM pats WHERE first_name='John' AND last_name='Anderson'),
     (SELECT doctor_serial_number FROM docs),
     '2025-02-10 09:00', 'checkup', 'Routine physical and blood pressure check', 'completed', 30, 'Clinic A', '2025-02-10 09:00', '2025-02-10 09:00'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='John' AND last_name='Anderson'),
     (SELECT doctor_serial_number FROM docs),
     '2025-08-12 10:15', 'followup', 'Blood pressure follow-up', 'completed', 20, 'Clinic A', '2025-08-12 10:15', '2025-08-12 10:15'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Emma' AND last_name='Bell'),
     (SELECT doctor_serial_number FROM docs),
     '2025-03-05 11:20', 'emergency', 'Acute shortness of breath', 'completed', 45, 'Hospital Emergency', '2025-03-05 11:20', '2025-03-05 11:20'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Emma' AND last_name='Bell'),
     (SELECT doctor_serial_number FROM docs),
     '2025-06-18 14:00', 'followup', 'Asthma control review', 'completed', 25, 'Clinic A', '2025-06-18 14:00', '2025-06-18 14:00'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Emma' AND last_name='Bell'),
     (SELECT doctor_serial_number FROM docs),
     '2025-11-02 09:45', 'checkup', 'Annual wellness visit', 'completed', 30, 'Clinic A', '2025-11-02 09:45', '2025-11-02 09:45'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Michael' AND last_name='Cooper'),
     (SELECT doctor_serial_number FROM docs),
     '2025-01-20 08:30', 'checkup', 'Diabetes management and medication review', 'completed', 30, 'Clinic A', '2025-01-20 08:30', '2025-01-20 08:30'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Michael' AND last_name='Cooper'),
     (SELECT doctor_serial_number FROM docs),
     '2025-04-15 10:00', 'followup', 'Review A1c results', 'completed', 20, 'Clinic A', '2025-04-15 10:00', '2025-04-15 10:00'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Michael' AND last_name='Cooper'),
     (SELECT doctor_serial_number FROM docs),
     '2025-07-12 13:30', 'telehealth', 'Medication side effect discussion', 'completed', 15, 'Telehealth', '2025-07-12 13:30', '2025-07-12 13:30'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Michael' AND last_name='Cooper'),
     (SELECT doctor_serial_number FROM docs),
     '2025-10-04 09:10', 'followup', 'Routine diabetes follow-up', 'completed', 25, 'Clinic A', '2025-10-04 09:10', '2025-10-04 09:10'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Sophie' AND last_name='Dawson'),
     (SELECT doctor_serial_number FROM docs),
     '2025-05-22 15:00', 'urgent_care', 'Severe headache and photophobia', 'completed', 40, 'Clinic A', '2025-05-22 15:00', '2025-05-22 15:00'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Sophie' AND last_name='Dawson'),
     (SELECT doctor_serial_number FROM docs),
     '2025-09-10 10:30', 'checkup', 'Annual physical', 'completed', 30, 'Clinic A', '2025-09-10 10:30', '2025-09-10 10:30'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Robert' AND last_name='Edwards'),
     (SELECT doctor_serial_number FROM docs),
     '2025-02-28 08:45', 'checkup', 'Cardiac symptoms monitoring', 'completed', 35, 'Hospital Cardiology Unit', '2025-02-28 08:45', '2025-02-28 08:45'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Robert' AND last_name='Edwards'),
     (SELECT doctor_serial_number FROM docs),
     '2025-06-11 11:00', 'followup', 'Cholesterol and medication review', 'completed', 25, 'Clinic A', '2025-06-11 11:00', '2025-06-11 11:00'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Robert' AND last_name='Edwards'),
     (SELECT doctor_serial_number FROM docs),
     '2025-10-20 14:20', 'telehealth', 'Stable symptoms check', 'completed', 15, 'Telehealth', '2025-10-20 14:20', '2025-10-20 14:20'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Olivia' AND last_name='Foster'),
     (SELECT doctor_serial_number FROM docs),
     '2025-03-18 09:30', 'checkup', 'Thyroid function evaluation', 'completed', 30, 'Clinic A', '2025-03-18 09:30', '2025-03-18 09:30'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Olivia' AND last_name='Foster'),
     (SELECT doctor_serial_number FROM docs),
     '2025-08-05 13:00', 'followup', 'TSH result review', 'completed', 20, 'Clinic A', '2025-08-05 13:00', '2025-08-05 13:00'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Daniel' AND last_name='Griffin'),
     (SELECT doctor_serial_number FROM docs),
     '2025-01-10 10:00', 'checkup', 'General health check', 'completed', 25, 'Clinic A', '2025-01-10 10:00', '2025-01-10 10:00'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Daniel' AND last_name='Griffin'),
     (SELECT doctor_serial_number FROM docs),
     '2025-04-04 09:20', 'urgent_care', 'Upper respiratory infection', 'completed', 20, 'Clinic A', '2025-04-04 09:20', '2025-04-04 09:20'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Daniel' AND last_name='Griffin'),
     (SELECT doctor_serial_number FROM docs),
     '2025-07-21 15:40', 'telehealth', 'Follow-up cough', 'completed', 10, 'Telehealth', '2025-07-21 15:40', '2025-07-21 15:40'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Daniel' AND last_name='Griffin'),
     (SELECT doctor_serial_number FROM docs),
     '2025-11-12 11:10', 'checkup', 'Work physical', 'completed', 20, 'Clinic A', '2025-11-12 11:10', '2025-11-12 11:10'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Ava' AND last_name='Harrison'),
     (SELECT doctor_serial_number FROM docs),
     '2025-02-05 14:15', 'specialist', 'Knee pain flare-up', 'completed', 40, 'Ortho Clinic', '2025-02-05 14:15', '2025-02-05 14:15'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Ava' AND last_name='Harrison'),
     (SELECT doctor_serial_number FROM docs),
     '2025-06-23 09:40', 'followup', 'Pain management review', 'completed', 25, 'Clinic A', '2025-06-23 09:40', '2025-06-23 09:40'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Ava' AND last_name='Harrison'),
     (SELECT doctor_serial_number FROM docs),
     '2025-09-30 10:00', 'checkup', 'Routine chronic pain assessment', 'completed', 30, 'Clinic A', '2025-09-30 10:00', '2025-09-30 10:00'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='James' AND last_name='Irwin'),
     (SELECT doctor_serial_number FROM docs),
     '2025-04-01 08:50', 'checkup', 'Cholesterol screening', 'completed', 25, 'Clinic A', '2025-04-01 08:50', '2025-04-01 08:50'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='James' AND last_name='Irwin'),
     (SELECT doctor_serial_number FROM docs),
     '2025-10-09 13:30', 'followup', 'Lipid panel review', 'completed', 20, 'Clinic A', '2025-10-09 13:30', '2025-10-09 13:30'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Lily' AND last_name='Johnson'),
     (SELECT doctor_serial_number FROM docs),
     '2025-03-12 12:15', 'checkup', 'Annual physical', 'completed', 30, 'Clinic A', '2025-03-12 12:15', '2025-03-12 12:15'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Lily' AND last_name='Johnson'),
     (SELECT doctor_serial_number FROM docs),
     '2025-07-01 09:00', 'urgent_care', 'Gastrointestinal pain', 'completed', 35, 'Hospital Emergency', '2025-07-01 09:00', '2025-07-01 09:00'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Lily' AND last_name='Johnson'),
     (SELECT doctor_serial_number FROM docs),
     '2025-11-05 10:45', 'followup', 'GI symptom follow-up', 'completed', 20, 'Clinic A', '2025-11-05 10:45', '2025-11-05 10:45')
  RETURNING visit_id, patient_serial_number, doctor_serial_number, visit_date, visit_type, chief_complaint
),

note_texts AS (
    SELECT ARRAY[
      'BP slightly elevated; patient asymptomatic',
      'BP improved on current regimen; patient tolerating medication well',
      'Patient reports fatigue and polydipsia; recommends labs for further evaluation',
      'Mild wheezing on exam; advised regular inhaler use',
      'Self-reported vitals due to telehealth; severe headache persists',
      'COPD baseline visit; breath sounds diminished but stable',
      'Severe dyspnea with accessory muscle use; treated urgently',
      'Respiratory status improved compared to prior ER visit',
      'Healthy exam; no adverse reactions following vaccination',
      'All vitals normal; cleared for employment requirements',
      'Hypertension uncontrolled; emphasized adherence and sodium reduction',
      'Joint pain limiting mobility; recommended rheumatology referral',
      'Epigastric burning after meals; started trial of PPI therapy',
      'Thyroid levels stable; patient reports good energy levels',
      'Increased anxiety and poor sleep; advised behavioral strategies',
      'Glucose logs stable; no complications noted',
      'Minor insulin adjustment made; patient understands dosing changes',
      'Observed tremors during hypoglycemia episode; patient recovered well',
      'Asthma controlled with current inhaler; no nocturnal symptoms',
      'Mild arm soreness post-vaccine; no systemic reactions',
      'Trace edema in ankles; reinforced daily weight monitoring',
      'Edema improved; patient compliant with diuretics',
      'Acute CHF flare; notable crackles and elevated work of breathing',
      'Joint swelling and stiffness; possible inflammatory arthritis',
      'Symptoms improving with DMARD; fewer morning flare-ups'
  ] AS notes
),

vitals AS (
  INSERT INTO vital_signs (
    visit_id, measurement_time, blood_pressure_systolic, blood_pressure_diastolic, heart_rate,
    temperature, respiratory_rate, oxygen_saturation, weight_kg, height_cm, pain_level, notes
  )
  SELECT
    v.visit_id,
    v.visit_date + INTERVAL '10 minutes' AS measurement_time,
    
    CASE
      WHEN v.chief_complaint ILIKE '%blood pressure%' OR v.chief_complaint ILIKE '%Hypertension%' 
        THEN FLOOR(RANDOM() * 6) + 140  -- 140-145
      WHEN v.chief_complaint ILIKE '%shortness of breath%' 
        THEN FLOOR(RANDOM() * 11) + 145  -- 145-155
      WHEN v.chief_complaint ILIKE '%knee pain%' 
        THEN FLOOR(RANDOM() * 6) + 130  -- 130-135
      ELSE FLOOR(RANDOM() * 46) + 115  -- 115-160
    END,
    
    CASE
      WHEN v.chief_complaint ILIKE '%blood pressure%' OR v.chief_complaint ILIKE '%Hypertension%' 
        THEN FLOOR(RANDOM() * 6) + 85  -- 85-90
      WHEN v.chief_complaint ILIKE '%shortness of breath%' 
        THEN FLOOR(RANDOM() * 6) + 90  -- 90-95
      WHEN v.chief_complaint ILIKE '%knee pain%' 
        THEN FLOOR(RANDOM() * 6) + 75  -- 75-80
      ELSE FLOOR(RANDOM() * 31) + 70  -- 70-100
    END,
    
    CASE
      WHEN v.chief_complaint ILIKE '%shortness of breath%' 
        THEN FLOOR(RANDOM() * 11) + 90  -- 90-100
      WHEN v.chief_complaint ILIKE '%fever%' 
        THEN FLOOR(RANDOM() * 11) + 95  -- 95-105
      ELSE FLOOR(RANDOM() * 41) + 60  -- 60-100
    END,
    
    CASE 
      WHEN v.chief_complaint ILIKE '%fever%' 
        THEN ROUND((RANDOM() * 3 + 38)::numeric, 1)  -- 38.0-41.0
      ELSE ROUND((RANDOM() * 1 + 36)::numeric, 1)    -- 36.0-37.0
    END,
    
    CASE 
      WHEN v.chief_complaint ILIKE '%shortness of breath%' 
        THEN FLOOR(RANDOM() * 5) + 21  -- 21-25
      ELSE FLOOR(RANDOM() * 9) + 12  -- 12-20
    END,
    
    ROUND((RANDOM() * 5 + 95)::numeric, 1),  -- 95.0-100.0
    
    ROUND((RANDOM() * 35 + 65)::numeric, 1),  -- 65.0-100.0 kg
    
    FLOOR(RANDOM() * 31) + 160,  -- 160-190 cm
    
    CASE
      WHEN v.chief_complaint ILIKE '%pain%' 
        THEN FLOOR(RANDOM() * 4) + 4  -- 4-7
      WHEN v.chief_complaint ILIKE '%abdominal%' 
        THEN FLOOR(RANDOM() * 4) + 3  -- 3-6
      ELSE 1
    END,
    
    nt.notes[FLOOR(RANDOM() * array_length(nt.notes, 1) + 1)::int]
    
  FROM visits v
  CROSS JOIN note_texts nt
  RETURNING vital_id, visit_id
),

meds AS (
  INSERT INTO medications (
    patient_serial_number, doctor_serial_number, medication_name, generic_name, dosage, frequency, start_date, end_date, status, prescribed_for, instructions, created_at, updated_at
  ) VALUES
    ((SELECT patient_serial_number FROM pats WHERE first_name='John' AND last_name='Anderson'),
     (SELECT doctor_serial_number FROM docs),
     'Lisinopril', 'Lisinopril', '10mg', 'once daily', '2025-08-12', NULL, 'active', 'Hypertension', 'Take in morning', now() - INTERVAL '120 days', now() - INTERVAL '10 days'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='John' AND last_name='Anderson'),
     (SELECT doctor_serial_number FROM docs),
     'Amlodipine', 'Amlodipine', '5mg', 'once daily', '2024-11-01', NULL, 'active', 'Hypertension', 'Take at same time daily', now() - INTERVAL '400 days', now() - INTERVAL '30 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Emma' AND last_name='Bell'),
     (SELECT doctor_serial_number FROM docs),
     'Albuterol Inhaler', 'Salbutamol', '100mcg/act', '2 puffs PRN', '2025-03-05', NULL, 'active', 'Asthma', 'Use as needed', now() - INTERVAL '250 days', now() - INTERVAL '5 days'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Emma' AND last_name='Bell'),
     (SELECT doctor_serial_number FROM docs),
     'Fluticasone Inhaler', 'Fluticasone', '110mcg', '2 puffs daily', '2025-06-18', NULL, 'active', 'Asthma control', 'Use daily', now() - INTERVAL '180 days', now() - INTERVAL '5 days'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Emma' AND last_name='Bell'),
     (SELECT doctor_serial_number FROM docs),
     'Cetirizine', 'Cetirizine', '10mg', 'once daily', '2025-06-18', NULL, 'active', 'Allergic rhinitis', 'At bedtime', now() - INTERVAL '180 days', now() - INTERVAL '5 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Michael' AND last_name='Cooper'),
     (SELECT doctor_serial_number FROM docs),
     'Metformin', 'Metformin', '500mg', 'twice daily', '2021-09-01', NULL, 'active', 'Type 2 diabetes', 'Take with meals', now() - INTERVAL '1400 days', now() - INTERVAL '10 days'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Michael' AND last_name='Cooper'),
     (SELECT doctor_serial_number FROM docs),
     'Insulin Glargine', 'Insulin Glargine', '10 units', 'once daily', '2024-02-01', NULL, 'active', 'Diabetes', 'Inject at bedtime', now() - INTERVAL '700 days', now() - INTERVAL '5 days'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Michael' AND last_name='Cooper'),
     (SELECT doctor_serial_number FROM docs),
     'Atorvastatin', 'Atorvastatin', '20mg', 'once daily at night', '2023-03-01', NULL, 'active', 'Hyperlipidemia', 'Take at night', now() - INTERVAL '900 days', now() - INTERVAL '20 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Sophie' AND last_name='Dawson'),
     (SELECT doctor_serial_number FROM docs),
     'Sumatriptan', 'Sumatriptan', '50mg', 'as needed', '2025-05-22', NULL, 'active', 'Migraine', 'Take at onset', now() - INTERVAL '200 days', now() - INTERVAL '30 days'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Sophie' AND last_name='Dawson'),
     (SELECT doctor_serial_number FROM docs),
     'Ibuprofen', 'Ibuprofen', '400mg', 'as needed', '2025-05-22', NULL, 'active', 'Headache pain', 'Take with food', now() - INTERVAL '200 days', now() - INTERVAL '30 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Robert' AND last_name='Edwards'),
     (SELECT doctor_serial_number FROM docs),
     'Aspirin', 'Acetylsalicylic acid', '81mg', 'once daily', '2018-01-01', NULL, 'active', 'Cardiac prophylaxis', 'Take with food', now() - INTERVAL '3000 days', now() - INTERVAL '5 days'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Robert' AND last_name='Edwards'),
     (SELECT doctor_serial_number FROM docs),
     'Metoprolol', 'Metoprolol', '50mg', 'twice daily', '2022-05-01', NULL, 'active', 'Heart disease', 'Do not stop abruptly', now() - INTERVAL '1200 days', now() - INTERVAL '20 days'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Robert' AND last_name='Edwards'),
     (SELECT doctor_serial_number FROM docs),
     'Atorvastatin', 'Atorvastatin', '40mg', 'once nightly', '2020-03-01', NULL, 'active', 'Hyperlipidemia', 'Avoid grapefruit', now() - INTERVAL '2000 days', now() - INTERVAL '10 days'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Robert' AND last_name='Edwards'),
     (SELECT doctor_serial_number FROM docs),
     'Nitroglycerin SL', 'Nitroglycerin', '0.4mg', 'PRN', '2025-02-28', NULL, 'active', 'Angina', 'Use one tablet sublingually', now() - INTERVAL '100 days', now() - INTERVAL '5 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Olivia' AND last_name='Foster'),
     (SELECT doctor_serial_number FROM docs),
     'Levothyroxine', 'Levothyroxine', '75mcg', 'once daily', '2020-06-01', NULL, 'active', 'Hypothyroidism', 'Take on empty stomach', now() - INTERVAL '2000 days', now() - INTERVAL '3 days'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Olivia' AND last_name='Foster'),
     (SELECT doctor_serial_number FROM docs),
     'Calcium + Vitamin D', 'Calcium+D3', '600mg/400IU', 'once daily', '2024-01-01', NULL, 'active', 'Supplement', 'Take with meal', now() - INTERVAL '700 days', now() - INTERVAL '30 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Daniel' AND last_name='Griffin'),
     (SELECT doctor_serial_number FROM docs),
     'Amoxicillin', 'Amoxicillin', '500mg', 'three times daily', '2025-04-04', '2025-04-10', 'completed', 'Upper respiratory infection', 'Finish course', now() - INTERVAL '250 days', now() - INTERVAL '240 days'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Daniel' AND last_name='Griffin'),
     (SELECT doctor_serial_number FROM docs),
     'Ibuprofen', 'Ibuprofen', '200mg', 'as needed', '2025-04-04', NULL, 'active', 'Pain', 'Take with food', now() - INTERVAL '250 days', now() - INTERVAL '240 days'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Daniel' AND last_name='Griffin'),
     (SELECT doctor_serial_number FROM docs),
     'Vitamin C', 'Ascorbic acid', '500mg', 'once daily', '2025-01-10', NULL, 'active', 'Supplement', 'With food', now() - INTERVAL '300 days', now() - INTERVAL '60 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Ava' AND last_name='Harrison'),
     (SELECT doctor_serial_number FROM docs),
     'Naproxen', 'Naproxen', '500mg', 'twice daily', '2025-02-05', NULL, 'active', 'Osteoarthritis pain', 'Take with food', now() - INTERVAL '300 days', now() - INTERVAL '25 days'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Ava' AND last_name='Harrison'),
     (SELECT doctor_serial_number FROM docs),
     'Acetaminophen', 'Paracetamol', '500mg', 'as needed', '2025-02-05', NULL, 'active', 'Pain control', 'Do not exceed 3g/day', now() - INTERVAL '300 days', now() - INTERVAL '25 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='James' AND last_name='Irwin'),
     (SELECT doctor_serial_number FROM docs),
     'Atorvastatin', 'Atorvastatin', '20mg', 'once nightly', '2025-04-01', NULL, 'active', 'Hyperlipidemia', 'Take at night', now() - INTERVAL '220 days', now() - INTERVAL '15 days'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='James' AND last_name='Irwin'),
     (SELECT doctor_serial_number FROM docs),
     'Omega-3', 'Omega-3', '1000mg', 'once daily', '2025-04-01', NULL, 'active', 'Supplement', 'With meals', now() - INTERVAL '220 days', now() - INTERVAL '15 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Lily' AND last_name='Johnson'),
     (SELECT doctor_serial_number FROM docs),
     'Omeprazole', 'Omeprazole', '20mg', 'once daily', '2025-07-01', NULL, 'active', 'Gastric reflux', 'Take before food', now() - INTERVAL '140 days', now() - INTERVAL '30 days'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Lily' AND last_name='Johnson'),
     (SELECT doctor_serial_number FROM docs),
     'Dicyclomine', 'Dicyclomine', '20mg', 'as needed', '2025-07-01', NULL, 'active', 'GI cramping', 'As needed for cramps', now() - INTERVAL '140 days', now() - INTERVAL '30 days'),
    ((SELECT patient_serial_number FROM pats WHERE first_name='Lily' AND last_name='Johnson'),
     (SELECT doctor_serial_number FROM docs),
     'Probiotic', 'Probiotic', '1 capsule', 'once daily', '2025-07-01', NULL, 'active', 'Gut health', 'Take with food', now() - INTERVAL '140 days', now() - INTERVAL '30 days')
  RETURNING medication_id
),

labs AS (
  INSERT INTO lab_results (
    patient_serial_number, visit_id, test_name, result_value, unit, reference_range, result_status, tested_date, received_date, ordering_doctors_serial_number, created_at
  ) VALUES
    ((SELECT patient_serial_number FROM pats WHERE first_name='John' AND last_name='Anderson'),
     (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='John' AND last_name='Anderson') ORDER BY v.visit_date ASC LIMIT 1),
     'Lipid Panel - LDL', '160', 'mg/dL', '<100', 'abnormal', '2025-02-10 10:00', '2025-02-10 13:00', (SELECT doctor_serial_number FROM docs), now() - INTERVAL '200 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Emma' AND last_name='Bell'),
     (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='Emma' AND last_name='Bell') ORDER BY v.visit_date ASC LIMIT 1),
     'Spirometry', 'Mild obstruction', NULL, 'Normal range varies', 'abnormal', '2025-03-05 12:00', '2025-03-05 16:00', (SELECT doctor_serial_number FROM docs), now() - INTERVAL '160 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Michael' AND last_name='Cooper'),
     (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='Michael' AND last_name='Cooper') ORDER BY v.visit_date ASC LIMIT 1),
     'HbA1c', '8.1', '%', '4.0-5.6', 'abnormal', '2025-01-20 09:00', '2025-01-20 12:00', (SELECT doctor_serial_number FROM docs), now() - INTERVAL '300 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Sophie' AND last_name='Dawson'),
     (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='Sophie' AND last_name='Dawson') ORDER BY v.visit_date ASC LIMIT 1),
     'CT Head (no contrast)', 'No acute intracranial abnormality', NULL, 'N/A', 'normal', '2025-05-22 16:00', '2025-05-22 19:00', (SELECT doctor_serial_number FROM docs), now() - INTERVAL '120 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Robert' AND last_name='Edwards'),
     (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='Robert' AND last_name='Edwards') ORDER BY v.visit_date ASC LIMIT 1),
     'Troponin I', '0.03', 'ng/mL', '0.00-0.04', 'normal', '2025-02-28 09:30', '2025-02-28 12:00', (SELECT doctor_serial_number FROM docs), now() - INTERVAL '300 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Olivia' AND last_name='Foster'),
     (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='Olivia' AND last_name='Foster') ORDER BY v.visit_date ASC LIMIT 1),
     'TSH', '3.2', 'mIU/L', '0.4-4.0', 'normal', '2025-03-18 10:00', '2025-03-18 13:00', (SELECT doctor_serial_number FROM docs), now() - INTERVAL '250 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Daniel' AND last_name='Griffin'),
     (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='Daniel' AND last_name='Griffin') ORDER BY v.visit_date ASC LIMIT 1),
     'CBC - WBC', '9.2', 'x10^9/L', '4.0-11.0', 'normal', '2025-01-10 10:30', '2025-01-10 13:00', (SELECT doctor_serial_number FROM docs), now() - INTERVAL '320 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Ava' AND last_name='Harrison'),
     (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='Ava' AND last_name='Harrison') ORDER BY v.visit_date ASC LIMIT 1),
     'X-Ray Knee', 'Mild joint space narrowing', NULL, 'N/A', 'abnormal', '2025-02-05 15:00', '2025-02-05 17:00', (SELECT doctor_serial_number FROM docs), now() - INTERVAL '260 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='James' AND last_name='Irwin'),
     (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='James' AND last_name='Irwin') ORDER BY v.visit_date ASC LIMIT 1),
     'Lipid Panel - LDL', '150', 'mg/dL', '<100', 'abnormal', '2025-04-01 09:30', '2025-04-01 12:00', (SELECT doctor_serial_number FROM docs), now() - INTERVAL '200 days'),

    ((SELECT patient_serial_number FROM pats WHERE first_name='Lily' AND last_name='Johnson'),
     (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='Lily' AND last_name='Johnson') ORDER BY v.visit_date ASC LIMIT 1),
     'Urinalysis', 'Normal', NULL, 'Normal', 'normal', '2025-03-12 12:30', '2025-03-12 15:00', (SELECT doctor_serial_number FROM docs), now() - INTERVAL '220 days')
  RETURNING lab_id
),

notes AS (
  INSERT INTO clinical_notes (
    visit_id, doctor_serial_number, note_type, note_text, summary, created_at, updated_at
  )
  SELECT
    v.visit_id,
    v.doctor_serial_number,
    CASE
      WHEN v.visit_type IN ('checkup','followup') THEN 'progress_note'
      WHEN v.visit_type IN ('emergency','urgent_care') THEN 'soap_assessment'
      WHEN v.visit_type = 'telehealth' THEN 'consult_note'
      WHEN v.visit_type = 'specialist' THEN 'procedure_note'
      ELSE 'progress_note'
    END,
    CONCAT('Visit for: ', v.chief_complaint, '. Exam documented; plan recorded.'),
    CONCAT('Summary: ', LEFT(v.chief_complaint, 100)),
    v.visit_date + INTERVAL '15 minutes',
    v.visit_date + INTERVAL '20 minutes'
  FROM visits v
  RETURNING note_id
),

diags AS (
  INSERT INTO diagnoses (
    patient_serial_number, visit_id, diagnosis_code, diagnosis_name, diagnosis_type, status, diagnosed_date, resolved_date, diagnosing_doctors_serial_number, created_at
  )
  VALUES
    (
      (SELECT patient_serial_number FROM pats WHERE first_name='John' AND last_name='Anderson'),
      (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='John' AND last_name='Anderson') ORDER BY v.visit_date ASC LIMIT 1),
      'I10', 'Essential (primary) hypertension', 'chronic', 'active', '2024-08-12', NULL, (SELECT doctor_serial_number FROM docs), now() - INTERVAL '120 days'
    ),
    (
      (SELECT patient_serial_number FROM pats WHERE first_name='Emma' AND last_name='Bell'),
      (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='Emma' AND last_name='Bell') ORDER BY v.visit_date ASC LIMIT 1),
      'J45.909', 'Asthma, unspecified', 'chronic', 'active', '2023-06-18', NULL, (SELECT doctor_serial_number FROM docs), now() - INTERVAL '400 days'
    ),
    (
      (SELECT patient_serial_number FROM pats WHERE first_name='Michael' AND last_name='Cooper'),
      (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='Michael' AND last_name='Cooper') ORDER BY v.visit_date ASC LIMIT 1),
      'E11', 'Type 2 diabetes mellitus', 'chronic', 'active', '2020-09-01', NULL, (SELECT doctor_serial_number FROM docs), now() - INTERVAL '1800 days'
    ),
    (
      (SELECT patient_serial_number FROM pats WHERE first_name='Sophie' AND last_name='Dawson'),
      (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='Sophie' AND last_name='Dawson') ORDER BY v.visit_date ASC LIMIT 1),
      'G43.909', 'Migraine, unspecified', 'chronic', 'active', '2024-05-22', NULL, (SELECT doctor_serial_number FROM docs), now() - INTERVAL '300 days'
    ),
    (
      (SELECT patient_serial_number FROM pats WHERE first_name='Robert' AND last_name='Edwards'),
      (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='Robert' AND last_name='Edwards') ORDER BY v.visit_date ASC LIMIT 1),
      'I25.10', 'Atherosclerotic heart disease', 'chronic', 'active', '2018-02-28', NULL, (SELECT doctor_serial_number FROM docs), now() - INTERVAL '2500 days'
    ),
    (
      (SELECT patient_serial_number FROM pats WHERE first_name='Olivia' AND last_name='Foster'),
      (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='Olivia' AND last_name='Foster') ORDER BY v.visit_date ASC LIMIT 1),
      'E03.9', 'Hypothyroidism, unspecified', 'chronic', 'active', '2020-06-01', NULL, (SELECT doctor_serial_number FROM docs), now() - INTERVAL '1800 days'
    ),
    (
      (SELECT patient_serial_number FROM pats WHERE first_name='Daniel' AND last_name='Griffin'),
      (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='Daniel' AND last_name='Griffin') ORDER BY v.visit_date ASC LIMIT 1),
      'J06.9', 'Acute upper respiratory infection', 'primary', 'resolved', '2025-04-04', '2025-04-14', (SELECT doctor_serial_number FROM docs), now() - INTERVAL '220 days'
    ),
    (
      (SELECT patient_serial_number FROM pats WHERE first_name='Ava' AND last_name='Harrison'),
      (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='Ava' AND last_name='Harrison') ORDER BY v.visit_date ASC LIMIT 1),
      'M17.9', 'Knee osteoarthritis, unspecified', 'chronic', 'active', '2024-02-05', NULL, (SELECT doctor_serial_number FROM docs), now() - INTERVAL '500 days'
    ),
    (
      (SELECT patient_serial_number FROM pats WHERE first_name='James' AND last_name='Irwin'),
      (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='James' AND last_name='Irwin') ORDER BY v.visit_date ASC LIMIT 1),
      'E78.5', 'Hyperlipidemia, unspecified', 'chronic', 'active', '2025-04-01', NULL, (SELECT doctor_serial_number FROM docs), now() - INTERVAL '200 days'
    ),
    (
      (SELECT patient_serial_number FROM pats WHERE first_name='Lily' AND last_name='Johnson'),
      (SELECT visit_id FROM visits v WHERE v.patient_serial_number = (SELECT patient_serial_number FROM pats WHERE first_name='Lily' AND last_name='Johnson') ORDER BY v.visit_date ASC LIMIT 1),
      'R10.9', 'Abdominal pain, unspecified', 'primary', 'active', '2025-07-01', NULL, (SELECT doctor_serial_number FROM docs), now() - INTERVAL '140 days'
    )
  RETURNING diagnosis_id
)

-- Verify inserts
SELECT
  (SELECT count(*) FROM pats) AS patients_inserted,
  (SELECT count(*) FROM docs) AS doctors_inserted,
  (SELECT count(*) FROM visits) AS visits_inserted,
  (SELECT count(*) FROM vitals) AS vitals_inserted,
  (SELECT count(*) FROM meds) AS medications_inserted,
  (SELECT count(*) FROM labs) AS lab_results_inserted,
  (SELECT count(*) FROM notes) AS clinical_notes_inserted,
  (SELECT count(*) FROM diags) AS diagnoses_inserted;
