# app/utils/email_service.py
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))


def send_activation_email(email: str, link: str):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise Exception("SMTP credentials missing in .env")

    if not email or "@" not in email:
        raise Exception("Invalid recipient email")

    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_EMAIL
    msg["To"] = email
    msg["Subject"] = "Activation de votre compte – Plateforme PFE"

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background:#f9fafb; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#ffffff; padding:24px; border-radius:8px;">
          <h2 style="color:#111827;">Bienvenue 👋</h2>

          <p>Votre compte a été créé sur la plateforme <strong>PFE</strong>.</p>

          <p>Cliquez sur le bouton ci-dessous pour définir votre mot de passe :</p>

          <p style="text-align:center;">
            <a href="{link}"
               style="
                 background:#4f46e5;
                 color:white;
                 padding:12px 24px;
                 text-decoration:none;
                 border-radius:6px;
                 display:inline-block;
                 font-weight:bold;
               ">
              Activer mon compte
            </a>
          </p>

          <p style="font-size:13px; color:#6b7280;">
            Ce lien est personnel et sécurisé.  
            Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.
          </p>

          <p style="margin-top:24px;">— Équipe PFE</p>
        </div>
      </body>
    </html>
    """

    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        raise Exception(f"Email sending failed: {str(e)}")
