import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_activation_email(email: str, password: str):
    """
    Envoie un email contenant le mot de passe automatique
    """

    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))

    if not smtp_email or not smtp_password:
        raise Exception("SMTP_EMAIL ou SMTP_PASSWORD manquant dans .env")

    # 📧 Message
    msg = MIMEMultipart()
    msg["From"] = smtp_email
    msg["To"] = email
    msg["Subject"] = "Votre compte a été créé – Plateforme PFE"

    html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background:#f9fafb; padding:20px;">
        <div style="max-width:600px; margin:auto; background:white; padding:24px; border-radius:8px;">
          
          <h2 style="color:#4f46e5;">Bienvenue 👋</h2>

          <p>Votre compte a été créé avec succès sur la <b>plateforme PFE</b>.</p>

          <p>Voici vos informations de connexion :</p>

          <div style="background:#f3f4f6; padding:16px; border-radius:6px;">
            <p><b>Email :</b> {email}</p>
            <p><b>Mot de passe :</b> {password}</p>
          </div>

          <p style="margin-top:16px;">
            🔐 Nous vous recommandons de changer votre mot de passe après la première connexion.
          </p>

          <p style="margin-top:24px;">
            — Équipe <b>PFE Platform</b>
          </p>
        </div>
      </body>
    </html>
    """

    msg.attach(MIMEText(html, "html"))

    # 🚀 Envoi
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.send_message(msg)
