<?php

/**
 * Quick Mail Configuration Checker
 * Run: php check-mail-config.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "\n=== Mail Configuration Check ===\n\n";

// Check required variables
$checks = [
    'MAIL_MAILER' => env('MAIL_MAILER'),
    'MAIL_HOST' => env('MAIL_HOST'),
    'MAIL_PORT' => env('MAIL_PORT'),
    'MAIL_USERNAME' => env('MAIL_USERNAME'),
    'MAIL_PASSWORD' => env('MAIL_PASSWORD') ? '***SET***' : null,
    'MAIL_ENCRYPTION' => env('MAIL_ENCRYPTION'),
    'MAIL_FROM_ADDRESS' => env('MAIL_FROM_ADDRESS'),
    'MAIL_FROM_NAME' => env('MAIL_FROM_NAME'),
    'FRONTEND_URL' => env('FRONTEND_URL'),
    'FRONTEND_URL_PRODUCTION' => env('FRONTEND_URL_PRODUCTION', env('FRONTEND_URL_PROD')),
];

$allGood = true;

foreach ($checks as $key => $value) {
    $status = $value ? '✅' : '❌';
    $display = $value ?: 'NOT SET';
    
    if (!$value && in_array($key, ['MAIL_MAILER', 'MAIL_HOST', 'MAIL_PORT', 'MAIL_USERNAME', 'MAIL_PASSWORD', 'MAIL_FROM_ADDRESS'])) {
        $allGood = false;
    }
    
    echo sprintf("%s %-20s: %s\n", $status, $key, $display);
}

echo "\n=== Configuration Status ===\n";

if ($allGood) {
    echo "✅ All required mail configuration variables are set!\n\n";
    
    // Additional checks
    $mailer = env('MAIL_MAILER');
    if ($mailer === 'log') {
        echo "⚠️  WARNING: MAIL_MAILER is set to 'log' - emails will be logged, not sent!\n";
        echo "   Change to 'smtp' to send real emails.\n\n";
    }
    
    $username = env('MAIL_USERNAME');
    $fromAddress = env('MAIL_FROM_ADDRESS');
    if ($username && $fromAddress && $username !== $fromAddress) {
        echo "⚠️  WARNING: MAIL_USERNAME and MAIL_FROM_ADDRESS don't match.\n";
        echo "   For Gmail, these should be the same address.\n\n";
    }
    
    $password = env('MAIL_PASSWORD');
    if ($password && (strlen($password) < 16 || strpos($password, ' ') !== false)) {
        echo "⚠️  WARNING: MAIL_PASSWORD might not be a valid Gmail App Password.\n";
        echo "   App Passwords are 16 characters with no spaces.\n\n";
    }
    
    $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
    $productionUrl = env('FRONTEND_URL_PRODUCTION', env('FRONTEND_URL_PROD'));
    $useLocalForEmails = env('USE_LOCAL_URL_FOR_EMAILS', false);
    $isLocalhost = strpos($frontendUrl, 'localhost') !== false || strpos($frontendUrl, '127.0.0.1') !== false;
    
    if ($isLocalhost && !$productionUrl && !$useLocalForEmails) {
        echo "⚠️  WARNING: FRONTEND_URL is set to localhost but FRONTEND_URL_PRODUCTION is not set!\n";
        echo "   Email verification links will not work on mobile devices or external access.\n";
        echo "   Options:\n";
        echo "   1. Set FRONTEND_URL_PRODUCTION=https://your-domain.com (recommended)\n";
        echo "   2. Use ngrok: FRONTEND_URL_PRODUCTION=https://your-ngrok-url.ngrok.io\n";
        echo "   3. Force localhost: USE_LOCAL_URL_FOR_EMAILS=true (not recommended)\n\n";
    } elseif ($productionUrl) {
        echo "✅ Production frontend URL is set - email links will work on mobile devices.\n";
        echo "   Local dev: {$frontendUrl}\n";
        echo "   Email links: {$productionUrl}\n\n";
    } elseif ($useLocalForEmails) {
        echo "⚠️  WARNING: Using localhost for email links (USE_LOCAL_URL_FOR_EMAILS=true)\n";
        echo "   Email links will NOT work on mobile devices or external networks!\n";
        echo "   Only use this for quick local testing.\n\n";
    }
    
    echo "Next steps:\n";
    echo "1. Clear config cache: php artisan config:clear\n";
    echo "2. Test email: php artisan tinker\n";
    echo "   Then run: Mail::raw('Test', function(\$m) { \$m->to('your-email@gmail.com')->subject('Test'); });\n";
} else {
    echo "❌ Some required mail configuration variables are missing!\n\n";
    echo "Please add the following to your .env file:\n\n";
    echo "MAIL_MAILER=smtp\n";
    echo "MAIL_HOST=smtp.gmail.com\n";
    echo "MAIL_PORT=587\n";
    echo "MAIL_USERNAME=your-email@gmail.com\n";
    echo "MAIL_PASSWORD=your-app-password\n";
    echo "MAIL_ENCRYPTION=tls\n";
    echo "MAIL_FROM_ADDRESS=your-email@gmail.com\n";
    echo "MAIL_FROM_NAME=\"Rentals.ph\"\n";
    echo "FRONTEND_URL=http://localhost:3000\n";
}

echo "\n";

