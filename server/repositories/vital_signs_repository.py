from psycopg import sql
from typing import Optional
from .base_repository import BaseRepository
from models.patients import VitalSignsResponse

class VitalSignsRepository(BaseRepository[VitalSignsResponse]):
    def __init__(self):
        super().__init__("vital_signs")
    
    def create_vital_signs(self, visit_id: str, **vitals) -> Optional[str]:
        """Create vital signs record"""
        with self.db_manager.get_connection() as conn:
            with conn.cursor() as cur:
                vital_data = {
                    'visit_id': visit_id,
                    'measurement_time': vitals.get('measurement_time', 'DATE_TRUNC(\'second\', now())'),
                    'blood_pressure_systolic': vitals.get('blood_pressure_systolic'),
                    'blood_pressure_diastolic': vitals.get('blood_pressure_diastolic'),
                    'heart_rate': vitals.get('heart_rate'),
                    'temperature': vitals.get('temperature'),
                    'respiratory_rate': vitals.get('respiratory_rate'),
                    'oxygen_saturation': vitals.get('oxygen_saturation'),
                    'weight_kg': vitals.get('weight_kg'),
                    'height_cm': vitals.get('height_cm'),
                    'bmi': vitals.get('bmi'),
                    'pain_level': vitals.get('pain_level', 0),
                    'notes': vitals.get('notes', '')
                }
                
                columns = []
                values = []
                placeholders = []
                
                for key, value in vital_data.items():
                    if value is not None and key not in ['measurement_time']:
                        columns.append(key)
                        placeholders.append('%s')
                        values.append(value)
                
                if 'measurement_time' in vital_data and vital_data['measurement_time'] == 'DATE_TRUNC(\'second\', now())':
                    columns.append('measurement_time')
                    placeholders.append("DATE_TRUNC('second', now())")
                
                if not columns:
                    return None
                
                query = sql.SQL("INSERT INTO vital_signs ({columns}) VALUES ({placeholders}) RETURNING vital_id").format(
                    columns=sql.SQL(', ').join(map(sql.Identifier, columns)),
                    placeholders=sql.SQL(', ').join(sql.SQL(p) for p in placeholders)
                )
                
                cur.execute(query, tuple(values))

                vital_id = cur.fetchone()[0]

                conn.commit()

                return str(vital_id)
            
vital_signs_repository = VitalSignsRepository()
