import os
import smtplib

from dotenv import load_dotenv

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


# ==========================================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================================

load_dotenv()


# ==========================================================
# EMAIL SETTINGS
# ==========================================================

MAIL_USERNAME = os.getenv("MAIL_USERNAME")

MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

MAIL_FROM = os.getenv("MAIL_FROM")

MAIL_SERVER = os.getenv(
    "MAIL_SERVER",
    "smtp.gmail.com"
)

MAIL_PORT = int(
    os.getenv(
        "MAIL_PORT",
        587
    )
)

MAIL_STARTTLS = os.getenv(
    "MAIL_STARTTLS",
    "True"
).lower() == "true"


# ==========================================================
# SEND EMAIL
# ==========================================================

def send_email(
    to_email: str,
    subject: str,
    body: str
):
    """
    Send a plain-text email using SMTP.
    """

    # ------------------------------------------------------
    # CHECK EMAIL CONFIGURATION
    # ------------------------------------------------------

    if not MAIL_USERNAME:
        raise RuntimeError(
            "MAIL_USERNAME is not configured in .env"
        )

    if not MAIL_PASSWORD:
        raise RuntimeError(
            "MAIL_PASSWORD is not configured in .env"
        )

    if not MAIL_FROM:
        raise RuntimeError(
            "MAIL_FROM is not configured in .env"
        )

    # ------------------------------------------------------
    # CREATE EMAIL
    # ------------------------------------------------------

    message = MIMEMultipart()

    message["From"] = MAIL_FROM
    message["To"] = to_email
    message["Subject"] = subject

    message.attach(
        MIMEText(
            body,
            "plain"
        )
    )

    # ------------------------------------------------------
    # CONNECT TO SMTP SERVER
    # ------------------------------------------------------

    with smtplib.SMTP(
        MAIL_SERVER,
        MAIL_PORT
    ) as server:

        # --------------------------------------------------
        # START TLS
        # --------------------------------------------------

        if MAIL_STARTTLS:
            server.starttls()

        # --------------------------------------------------
        # LOGIN
        # --------------------------------------------------

        server.login(
            MAIL_USERNAME,
            MAIL_PASSWORD
        )

        # --------------------------------------------------
        # SEND EMAIL
        # --------------------------------------------------

        server.sendmail(
            MAIL_FROM,
            to_email,
            message.as_string()
        )