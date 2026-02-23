<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class FixAgentPassword extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'agent:fix-password {email} {--approve : Also approve the agent}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix agent password (hash plain text passwords) and optionally approve the agent';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $approve = $this->option('approve');

        $agent = User::where('email', $email)
            ->where('role', 'agent')
            ->first();

        if (!$agent) {
            $this->error("Agent with email {$email} not found.");
            return 1;
        }

        $this->info("Found agent: {$agent->first_name} {$agent->last_name}");

        // Check if password is already hashed
        if (!Hash::needsRehash($agent->password) && strlen($agent->password) > 60) {
            $this->info("Password is already hashed.");
        } else {
            // Re-hash the password (will be auto-hashed by model cast)
            $agent->password = $agent->password;
            $agent->save();
            $this->info("Password has been hashed.");
        }

        if ($approve) {
            $agent->status = 'approved';
            $agent->verified = true;
            $agent->save();
            $this->info("Agent has been approved and verified.");
        } else {
            $this->info("Current status: {$agent->status}");
            $this->info("Current verified: " . ($agent->verified ? 'true' : 'false'));
            $this->warn("Use --approve flag to approve and verify the agent.");
        }

        $this->info("Done!");
        return 0;
    }
}
