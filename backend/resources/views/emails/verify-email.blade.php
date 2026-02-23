<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Verify Your Email - Rentals.ph</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, sans-serif !important;}
    </style>
    <![endif]-->
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 16px;
            line-height: 1.6;
            color: #333333;
            background-color: #f4f4f4;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .email-container {
            padding: 40px 30px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
        }
        .header h1 {
            color: #FE8E0A;
            font-size: 28px;
            font-weight: 600;
            margin: 0 0 10px 0;
            line-height: 1.2;
        }
        .content {
            color: #333333;
            font-size: 16px;
            line-height: 1.6;
        }
        .content p {
            margin: 0 0 16px 0;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #2563EB;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            line-height: 1.5;
            text-align: center;
            border: none;
        }
        .button:hover {
            background-color: #1d4ed8;
        }
        .link-text {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 4px;
            word-break: break-all;
            font-size: 14px;
            color: #2563EB;
            line-height: 1.5;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 13px;
            color: #666666;
            text-align: center;
            line-height: 1.6;
        }
        .footer p {
            margin: 8px 0;
        }
        .security-note {
            margin-top: 20px;
            padding: 15px;
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            border-radius: 4px;
            font-size: 14px;
            color: #856404;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                padding: 30px 20px;
            }
            .header h1 {
                font-size: 24px;
            }
            .button {
                padding: 12px 24px;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <div class="header">
                <h1>Verify Your Email Address</h1>
            </div>
            
            <div class="content">
                <p>Hello,</p>
                
                <p>Thank you for registering with <strong>Rentals.ph</strong>! We're excited to have you join our community.</p>
                
                <p>To complete your registration and secure your account, please verify your email address by clicking the button below:</p>
                
                <div class="button-container">
                    <a href="{{ $verificationUrl }}" class="button" style="color: #ffffff;">Verify My Email Address</a>
                </div>
                
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                
                <div class="link-text">
                    {{ $verificationUrl }}
                </div>
                
                <div class="security-note">
                    <strong>Security Notice:</strong> This verification link will expire in 24 hours. If you did not create an account with Rentals.ph, please ignore this email. No action is required on your part.
                </div>
            </div>
            
            <div class="footer">
                <p><strong>Rentals.ph</strong></p>
                <p>Your trusted real estate platform</p>
                <p style="margin-top: 15px; font-size: 12px; color: #999999;">
                    This is an automated email. Please do not reply to this message.<br>
                    If you have questions, please contact our support team.
                </p>
                <p style="margin-top: 15px; font-size: 11px; color: #999999;">
                    &copy; {{ date('Y') }} Rentals.ph. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>

