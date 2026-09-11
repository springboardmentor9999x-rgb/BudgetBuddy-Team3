import os

import httpx
from dotenv import load_dotenv

load_dotenv()

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
MAIL_FROM = os.getenv("MAIL_FROM", "budgetbuddy1384@gmail.com")
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "BudgetBuddy")

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def send_email(
    to_email: str,
    subject: str,
    body: str
):
    """
    Send a plain-text email using the Brevo HTTPS API.
    """

    if not BREVO_API_KEY:
        raise RuntimeError(
            "BREVO_API_KEY is not configured."
        )

    if not MAIL_FROM:
        raise RuntimeError(
            "MAIL_FROM is not configured."
        )

    payload = {
        "sender": {
            "name": MAIL_FROM_NAME,
            "email": MAIL_FROM
        },
        "to": [
            {
                "email": to_email
            }
        ],
        "subject": subject,
        "textContent": body
    }

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }

    try:
        response = httpx.post(
            BREVO_API_URL,
            headers=headers,
            json=payload,
            timeout=20.0
        )

        response.raise_for_status()

    except httpx.HTTPStatusError as exc:
        raise RuntimeError(
            f"Brevo email API error: {exc.response.text}"
        ) from exc

    except httpx.RequestError as exc:
        raise RuntimeError(
            f"Unable to connect to Brevo: {exc}"
        ) from exc