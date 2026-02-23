<?php

/**
 * Quick diagnostic script to check if agent registration is set up correctly
 * Run this with: php check_registration_setup.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Agent Registration Setup Check ===\n\n";

$errors = [];
$warnings = [];

// Check 1: Database connection
echo "1. Checking database connection...\n";
try {
    \DB::connection()->getPdo();
    echo "   ✓ Database connection successful\n";
} catch (\Exception $e) {
    $errors[] = "Database connection failed: " . $e->getMessage();
    echo "   ✗ Database connection failed: " . $e->getMessage() . "\n";
}

// Check 2: Agents table exists
echo "\n2. Checking agents table...\n";
try {
    if (\Schema::hasTable('agents')) {
        echo "   ✓ Agents table exists\n";
        
        // Check columns
        $columns = \Schema::getColumnListing('agents');
        $requiredColumns = [
            'id', 'first_name', 'last_name', 'email', 'password',
            'prc_license_number', 'license_type', 'expiration_date', 'status'
        ];
        
        $missingColumns = array_diff($requiredColumns, $columns);
        if (empty($missingColumns)) {
            echo "   ✓ All required columns exist\n";
        } else {
            $warnings[] = "Missing columns: " . implode(', ', $missingColumns);
            echo "   ⚠ Missing columns: " . implode(', ', $missingColumns) . "\n";
        }
    } else {
        $errors[] = "Agents table does not exist. Run: php artisan migrate";
        echo "   ✗ Agents table does not exist\n";
        echo "   → Run: php artisan migrate\n";
    }
} catch (\Exception $e) {
    $errors[] = "Error checking agents table: " . $e->getMessage();
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Check 3: Storage link
echo "\n3. Checking storage link...\n";
$storageLink = __DIR__ . '/public/storage';
if (file_exists($storageLink) || is_link($storageLink)) {
    echo "   ✓ Storage link exists\n";
} else {
    $warnings[] = "Storage link not found. Run: php artisan storage:link";
    echo "   ⚠ Storage link not found\n";
    echo "   → Run: php artisan storage:link\n";
}

// Check 4: Storage directory permissions
echo "\n4. Checking storage directory...\n";
$storageDir = __DIR__ . '/storage/app/public/agents/licenses';
if (!file_exists($storageDir)) {
    if (mkdir($storageDir, 0755, true)) {
        echo "   ✓ Created storage directory\n";
    } else {
        $warnings[] = "Could not create storage directory. Check permissions.";
        echo "   ⚠ Could not create storage directory\n";
    }
} else {
    echo "   ✓ Storage directory exists\n";
    if (is_writable($storageDir)) {
        echo "   ✓ Storage directory is writable\n";
    } else {
        $warnings[] = "Storage directory is not writable. Check permissions.";
        echo "   ⚠ Storage directory is not writable\n";
    }
}

// Check 5: Agent model
echo "\n5. Checking Agent model...\n";
try {
    if (class_exists(\App\Models\Agent::class)) {
        echo "   ✓ Agent model exists\n";
    } else {
        $errors[] = "Agent model not found";
        echo "   ✗ Agent model not found\n";
    }
} catch (\Exception $e) {
    $errors[] = "Error loading Agent model: " . $e->getMessage();
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Check 6: Routes
echo "\n6. Checking API routes...\n";
try {
    $routes = \Route::getRoutes();
    $registerRoute = null;
    $loginRoute = null;
    foreach ($routes as $route) {
        if ($route->uri() === 'api/register' && in_array('POST', $route->methods())) {
            $registerRoute = $route;
        }
        if ($route->uri() === 'api/login' && in_array('POST', $route->methods())) {
            $loginRoute = $route;
        }
    }
    if ($registerRoute) {
        echo "   ✓ Registration route exists\n";
    } else {
        $errors[] = "Registration route not found";
        echo "   ✗ Registration route not found\n";
    }
    if ($loginRoute) {
        echo "   ✓ Login route exists\n";
    } else {
        $errors[] = "Login route not found";
        echo "   ✗ Login route not found\n";
    }
} catch (\Exception $e) {
    $warnings[] = "Could not check routes: " . $e->getMessage();
    echo "   ⚠ Could not check routes\n";
}

// Summary
echo "\n=== Summary ===\n";
if (empty($errors) && empty($warnings)) {
    echo "✓ All checks passed! Registration should work.\n";
} else {
    if (!empty($errors)) {
        echo "\n✗ Errors found:\n";
        foreach ($errors as $error) {
            echo "  - $error\n";
        }
    }
    if (!empty($warnings)) {
        echo "\n⚠ Warnings:\n";
        foreach ($warnings as $warning) {
            echo "  - $warning\n";
        }
    }
    echo "\nPlease fix the errors above and try again.\n";
}

echo "\n";

