import logging
import os

import google.auth.exceptions
import google.auth.transport.requests
from fastapi import HTTPException
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from db.database import db_manager

logger = logging.getLogger(__name__)


def get_credentials(doctor_serial: str) -> Credentials:
    with db_manager.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT google_access_token, google_refresh_token, google_token_expiry
                FROM doctors WHERE doctor_serial_number=%s
                """,
                (doctor_serial,),
            )

            row = cur.fetchone()

    if not row or row[1] is None:
        raise HTTPException(status_code=403, detail="Google Calendar not connected")

    access_token, refresh_token, expiry = row

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=["https://www.googleapis.com/auth/calendar"],
    )

    if expiry:
        creds.expiry = expiry.replace(tzinfo=None) if expiry.tzinfo else expiry

    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(google.auth.transport.requests.Request())
        except google.auth.exceptions.RefreshError:
            raise HTTPException(status_code=401, detail="Google token expired or revoked. Please reconnect.")
            
        try:
            with db_manager.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE doctors SET google_access_token=%s, google_token_expiry=%s,
                        google_refresh_token=%s WHERE doctor_serial_number=%s
                        """,
                        (creds.token, creds.expiry, creds.refresh_token, doctor_serial),
                    )

                    conn.commit()
        except Exception:
            logger.warning("Failed to persist refreshed Google token for doctor %s", doctor_serial)

    return creds


def create_event(
    doctor_serial: str,
    summary: str,
    start_time: str,
    end_time: str,
    description: str = "",
) -> dict:
    try:
        creds = get_credentials(doctor_serial)
        service = build("calendar", "v3", credentials=creds)

        event = {
            "summary": summary,
            "description": description,
            "start": {"dateTime": start_time},
            "end": {"dateTime": end_time},
        }

        created = service.events().insert(calendarId="primary", body=event).execute()
        
        return {"htmlLink": created.get("htmlLink"), "eventId": created.get("id")}
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error creating calendar event for doctor %s", doctor_serial)
        raise HTTPException(status_code=500, detail="Error creating calendar event")
