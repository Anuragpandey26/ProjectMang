export class EmailTemplates {
  static verificationEmail(verificationLink, userName = "User") {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f4f4f4;
            border-radius: 10px;
            padding: 30px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #4a90e2;
            margin: 0;
        }
        .content {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4a90e2;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TaskHub</h1>
        </div>
        <div class="content">
            <h2>Welcome to TaskHub, ${userName}!</h2>
            <p>Thank you for signing up. Please verify your email address to get started.</p>
            <p>Click the button below to verify your email:</p>
            <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify Email</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4a90e2;">${verificationLink}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} TaskHub. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  static resetPasswordEmail(resetLink, userName = "User") {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f4f4f4;
            border-radius: 10px;
            padding: 30px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #e74c3c;
            margin: 0;
        }
        .content {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #e74c3c;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TaskHub</h1>
        </div>
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hi ${userName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #e74c3c;">${resetLink}</p>
            <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 15 minutes for security reasons.
            </div>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} TaskHub. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  static workspaceInviteEmail(inviteLink, workspaceName, inviterName, role) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workspace Invitation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f4f4f4;
            border-radius: 10px;
            padding: 30px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #27ae60;
            margin: 0;
        }
        .content {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #27ae60;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .info-box {
            background-color: #e8f5e9;
            border-left: 4px solid #27ae60;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TaskHub</h1>
        </div>
        <div class="content">
            <h2>You've Been Invited!</h2>
            <p><strong>${inviterName}</strong> has invited you to join the workspace:</p>
            <div class="info-box">
                <h3 style="margin: 0 0 10px 0;">${workspaceName}</h3>
                <p style="margin: 0;"><strong>Your Role:</strong> ${role}</p>
            </div>
            <p>Click the button below to accept the invitation:</p>
            <div style="text-align: center;">
                <a href="${inviteLink}" class="button">Accept Invitation</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #27ae60;">${inviteLink}</p>
            <p>If you don't want to join this workspace, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} TaskHub. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  static taskAssignedEmail(taskTitle, taskDescription, assignedBy, projectName, taskLink) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Task Assigned</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f4f4f4;
            border-radius: 10px;
            padding: 30px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #9b59b6;
            margin: 0;
        }
        .content {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #9b59b6;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .task-box {
            background-color: #f3e5f5;
            border-left: 4px solid #9b59b6;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TaskHub</h1>
        </div>
        <div class="content">
            <h2>New Task Assigned</h2>
            <p><strong>${assignedBy}</strong> has assigned you a new task in <strong>${projectName}</strong>:</p>
            <div class="task-box">
                <h3 style="margin: 0 0 10px 0;">${taskTitle}</h3>
                <p style="margin: 0;">${taskDescription || 'No description provided'}</p>
            </div>
            <div style="text-align: center;">
                <a href="${taskLink}" class="button">View Task</a>
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} TaskHub. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }
}
