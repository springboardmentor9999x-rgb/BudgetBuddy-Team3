from app.core.email import send_email


try:
    send_email(
        to_email="YOUR_PERSONAL_EMAIL@gmail.com",
        subject="BudgetBuddy SMTP Test",
        body="""
Hello,

This is a test email from BudgetBuddy.

If you received this email, Gmail SMTP is working correctly.

BudgetBuddy Team
"""
    )

    print("EMAIL SENT SUCCESSFULLY")

except Exception as e:
    print("EMAIL SENDING FAILED")
    print("ERROR:", repr(e))