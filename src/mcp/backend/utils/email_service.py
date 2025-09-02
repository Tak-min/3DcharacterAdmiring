"""
Email Service for OTP and notifications
Implements email-based 2FA as specified in requirements
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import random
import string
from datetime import datetime, timedelta


class EmailService:
    """
    Email service for sending OTP codes and notifications
    Uses SMTP for email delivery
    """
    
    def __init__(self):
        # Email configuration from environment variables
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_username)
        self.from_name = os.getenv("FROM_NAME", "3D Character Admiring")
        
        # Development mode flag
        self.dev_mode = os.getenv("DEVELOPMENT_MODE", "true").lower() == "true"
        
        if self.dev_mode:
            print("Email service running in development mode - emails will be printed to console")


    def generate_otp_code(self) -> str:
        """
        Generate a 6-digit OTP code
        
        Returns:
            6-digit numeric string
        """
        return ''.join(random.choices(string.digits, k=6))


    async def send_otp_email(self, email: str, otp_code: str, action: str = "login") -> bool:
        """
        Send OTP code via email
        
        Args:
            email: Recipient email address
            otp_code: 6-digit OTP code
            action: Action type ("login" or "register")
        
        Returns:
            True if email sent successfully, False otherwise
        """
        subject = f"3D Character Admiring - 認証コード ({action})"
        
        # Create email content
        html_content = self._create_otp_email_template(otp_code, action)
        text_content = self._create_otp_text_template(otp_code, action)
        
        return await self._send_email(email, subject, text_content, html_content)


    def _create_otp_email_template(self, otp_code: str, action: str) -> str:
        """
        Create HTML email template for OTP
        """
        action_text = "ログイン" if action == "login" else "新規登録"
        
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>認証コード</title>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }}
                .otp-code {{
                    font-size: 32px;
                    font-weight: bold;
                    color: #667eea;
                    text-align: center;
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    letter-spacing: 8px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }}
                .warning {{
                    background: #fff3e0;
                    border-left: 4px solid #ff9800;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .footer {{
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                    margin-top: 30px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>3D Character Admiring</h1>
                <p>認証コードのお知らせ</p>
            </div>
            <div class="content">
                <h2>こんにちは！</h2>
                <p>{action_text}のための認証コードをお送りします。</p>
                
                <div class="otp-code">
                    {otp_code}
                </div>
                
                <p>上記の6桁のコードをアプリケーションで入力してください。</p>
                
                <div class="warning">
                    <strong>重要:</strong>
                    <ul>
                        <li>このコードは10分間有効です</li>
                        <li>他人と共有しないでください</li>
                        <li>このメールに心当たりがない場合は無視してください</li>
                    </ul>
                </div>
                
                <p>ご質問がございましたら、サポートまでお問い合わせください。</p>
            </div>
            <div class="footer">
                <p>このメールは自動送信されています。返信はできません。</p>
                <p>&copy; 2024 3D Character Admiring. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        return html_template


    def _create_otp_text_template(self, otp_code: str, action: str) -> str:
        """
        Create plain text email template for OTP
        """
        action_text = "ログイン" if action == "login" else "新規登録"
        
        text_template = f"""
3D Character Admiring - 認証コード

こんにちは！

{action_text}のための認証コードをお送りします。

認証コード: {otp_code}

上記の6桁のコードをアプリケーションで入力してください。

重要:
- このコードは10分間有効です
- 他人と共有しないでください
- このメールに心当たりがない場合は無視してください

ご質問がございましたら、サポートまでお問い合わせください。

このメールは自動送信されています。返信はできません。
© 2024 3D Character Admiring. All rights reserved.
        """
        
        return text_template


    async def _send_email(self, to_email: str, subject: str, text_content: str, html_content: str = None) -> bool:
        """
        Send email using SMTP
        
        Args:
            to_email: Recipient email
            subject: Email subject
            text_content: Plain text content
            html_content: HTML content (optional)
        
        Returns:
            True if successful, False otherwise
        """
        # Development mode: just print to console
        if self.dev_mode:
            print(f"\n=== EMAIL (Development Mode) ===")
            print(f"To: {to_email}")
            print(f"Subject: {subject}")
            print(f"Content:\n{text_content}")
            print(f"=== END EMAIL ===\n")
            return True
        
        # Production mode: send actual email
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add text content
            text_part = MIMEText(text_content, 'plain', 'utf-8')
            msg.attach(text_part)
            
            # Add HTML content if provided
            if html_content:
                html_part = MIMEText(html_content, 'html', 'utf-8')
                msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            print(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            print(f"Failed to send email to {to_email}: {str(e)}")
            return False


    async def send_welcome_email(self, email: str) -> bool:
        """
        Send welcome email for new users
        
        Args:
            email: New user email
        
        Returns:
            True if successful, False otherwise
        """
        subject = "3D Character Admiring へようこそ！"
        
        text_content = f"""
3D Character Admiring へようこそ！

{email} 様

この度は3D Character Admiringにご登録いただき、ありがとうございます！

このアプリでは以下の機能をお楽しみいただけます：
- 3Dキャラクターとのリアルタイム会話
- Three.jsとA-Frameによる美しい3D表示
- AI技術による自然な対話体験

今後のアップデートでは、音声対話機能やキャラクターアニメーション、
ゲーム要素なども追加予定です。

ご質問やご要望がございましたら、お気軽にお問い合わせください。

それでは、3Dキャラクターとの素敵な時間をお過ごしください！

3D Character Admiring チーム
        """
        
        return await self._send_email(email, subject, text_content)


# Singleton instance
email_service = EmailService()
