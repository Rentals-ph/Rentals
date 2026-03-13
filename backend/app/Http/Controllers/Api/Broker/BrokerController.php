<?php

namespace App\Http\Controllers\Api\Broker;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\RequiresBroker;
use App\Models\Company;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Models\Property;
use App\Models\Message;
use App\Models\PropertyView;
use App\Models\BrokerPlan;
use App\Models\BrokerSubscription;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use OpenApi\Attributes as OA;

class BrokerController extends Controller
{
    use RequiresBroker;
    /**
     * Get broker dashboard data (subscription, usage stats).
     */
    public function dashboard(Request $request): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $subscription = $broker->activeSubscription;
        $plan = $subscription ? $subscription->plan : null;

        // Aggregate stats across broker + all managed agents
        $agentIds = $broker->managedAgents()->pluck('id')->push($broker->id)->unique()->values()->all();

        $propertiesQuery = Property::whereIn('agent_id', $agentIds);
        $propertiesCount = (int) $propertiesQuery->count();
        $totalViews = (int) $propertiesQuery->sum('views_count');
        $totalInquiries = (int) Message::whereIn('recipient_id', $agentIds)->count();

        // Simple 7-day timeseries per agent (for front-end team graphs)
        $days = collect(range(0, 6))->map(fn ($i) => now()->subDays(6 - $i));
        $teamSeries = [];
        foreach ($broker->teams()->with('members.agent')->get() as $team) {
            $memberIds = $team->members->pluck('agent_id')->push($broker->id)->unique()->values()->all();
            $teamSeries[] = [
                'team_id' => $team->id,
                'team_name' => $team->name,
                'daily_listings' => $days->map(function ($date) use ($memberIds) {
                    return Property::whereIn('agent_id', $memberIds)->whereDate('created_at', $date)->count();
                })->values()->all(),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'subscription' => $subscription ? [
                    'id' => $subscription->id,
                    'plan_name' => $plan->name ?? 'No Plan',
                    'listings_used' => $subscription->listings_used,
                    'listings_limit' => $plan->max_listings ?? 0,
                    'teams_used' => $subscription->teams_used,
                    'teams_limit' => $plan->max_teams ?? 0,
                    'agents_used' => $subscription->agents_used,
                    'agents_limit' => $plan->max_agents ?? 0,
                    'status' => $subscription->status,
                    'expires_at' => $subscription->expires_at,
                ] : null,
                'companies_count' => $broker->companies()->count(),
                'teams_count' => $broker->teams()->count(),
                'agents_count' => $broker->managedAgents()->count(),
                'properties_count' => $propertiesCount,
                'total_views' => $totalViews,
                'total_inquiries' => $totalInquiries,
                'timeseries' => [
                    'labels' => $days->map(fn ($d) => $d->format('M j'))->values()->all(),
                    'teams' => $teamSeries,
                ],
            ],
        ]);
    }

    /**
     * Show a single company by ID or slug (public endpoint).
     */
    public function showCompany($identifier): JsonResponse
    {
        $company = is_numeric($identifier)
            ? Company::findOrFail($identifier)
            : Company::where('slug', $identifier)->firstOrFail();

        return response()->json([
            'success' => true,
            'data'    => $company,
        ]);
    }

    /**
     * Create a new company.
     */
    public function createCompany(Request $request): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'slug'        => 'nullable|string|max:255|unique:companies,slug|regex:/^[a-z0-9-]+$/',
            'description' => 'nullable|string',
            'address'     => 'nullable|string|max:500',
            'phone'       => 'nullable|string|max:20',
            'email'       => 'nullable|email|max:255',
            'website'     => 'nullable|url|max:255',
        ]);

        $company = Company::create([
            'broker_id' => $broker->id,
            ...$validated,
            // HasSlug generates the slug automatically if not provided
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Company created successfully',
            'data'    => $company,
        ], 201);
    }

    /**
     * Update a company.
     */
    public function updateCompany(Request $request, $identifier): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $company = is_numeric($identifier)
            ? Company::where('broker_id', $broker->id)->findOrFail($identifier)
            : Company::where('broker_id', $broker->id)->where('slug', $identifier)->firstOrFail();

        if ($company->broker_id !== $broker->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You can only update your own companies.',
            ], 403);
        }

        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'slug'        => 'nullable|string|max:255|unique:companies,slug,' . $company->id . '|regex:/^[a-z0-9-]+$/',
            'description' => 'nullable|string',
            'address'     => 'nullable|string|max:500',
            'phone'       => 'nullable|string|max:20',
            'email'       => 'nullable|email|max:255',
            'website'     => 'nullable|url|max:255',
        ]);

        $company->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Company updated successfully',
            'data'    => $company->fresh(),
        ]);
    }

    /**
     * Get all companies for the broker.
     */
    public function getCompanies(Request $request): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $companies = $broker->companies()->get();

        return response()->json([
            'success' => true,
            'data' => $companies,
        ]);
    }

    /**
     * Create a new team.
     */
    public function createTeam(Request $request): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        // Check subscription limits
        $subscription = $broker->activeSubscription;
        if (!$subscription || !$subscription->canCreateTeam()) {
            return response()->json([
                'success' => false,
                'message' => 'Team limit reached. Please upgrade your plan.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'company_id' => 'nullable|exists:companies,id',
        ]);

        // Verify company belongs to broker
        if (isset($validated['company_id'])) {
            $company = Company::where('id', $validated['company_id'])
                ->where('broker_id', $broker->id)
                ->first();
            
            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company not found or access denied.',
                ], 404);
            }
        }

        DB::beginTransaction();
        try {
            $team = Team::create([
                'broker_id' => $broker->id,
                ...$validated,
            ]);

            // Update subscription usage
            $subscription->increment('teams_used');

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Team created successfully',
                'data' => $team,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating team: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create team',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Get all teams for the broker.
     */
    public function getTeams(Request $request): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $teams = $broker->teams()->with(['company', 'members.agent'])->get();

        return response()->json([
            'success' => true,
            'data' => $teams,
        ]);
    }

    /**
     * Update a team (name, description, company_id).
     */
    public function updateTeam(Request $request, $teamId): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $team = Team::where('id', $teamId)->where('broker_id', $broker->id)->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'company_id' => 'nullable|exists:companies,id',
        ]);

        if (isset($validated['company_id'])) {
            $company = Company::where('id', $validated['company_id'])->where('broker_id', $broker->id)->first();
            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company not found or access denied.',
                ], 404);
            }
        }

        $team->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Team updated successfully',
            'data' => $team->fresh(['company', 'members.agent']),
        ]);
    }

    /**
     * Delete a team (removes team and its memberships; agents remain in broker's pool).
     */
    public function deleteTeam(Request $request, $teamId): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $team = Team::where('id', $teamId)->where('broker_id', $broker->id)->firstOrFail();

        DB::beginTransaction();
        try {
            TeamMember::where('team_id', $team->id)->delete();
            $team->delete();
            $broker->activeSubscription?->decrement('teams_used');
            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Team deleted successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting team: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete team',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Assign an agent to a team.
     */
    public function assignAgentToTeam(Request $request, $teamId, $agentId): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $role = $request->input('role', 'member');

        // Verify team belongs to broker
        $team = Team::where('id', $teamId)
            ->where('broker_id', $broker->id)
            ->first();
        
        if (!$team) {
            return response()->json([
                'success' => false,
                'message' => 'Team not found or access denied.',
            ], 404);
        }

        // Verify agent is managed by broker (created by broker or in broker's teams)
        $agent = $broker->managedAgents()->where('id', $agentId)->first();
        
        if (!$agent) {
            return response()->json([
                'success' => false,
                'message' => 'Agent not found or access denied.',
            ], 404);
        }

        // Check if agent is already in the team (active member)
        $existingMember = TeamMember::where('team_id', $team->id)
            ->where('agent_id', $agent->id)
            ->where('is_active', true)
            ->first();
        
        if ($existingMember) {
            return response()->json([
                'success' => false,
                'message' => 'Agent is already a member of this team.',
            ], 422);
        }

        // Check if there's already a pending invitation for this team
        $pendingInvitation = TeamMember::where('team_id', $team->id)
            ->where('agent_id', $agent->id)
            ->where('invitation_status', 'pending')
            ->first();
        
        if ($pendingInvitation) {
            // Check if there's an unread invitation message
            if ($pendingInvitation->invitation_message_id) {
                $unreadMessage = \App\Models\Message::where('id', $pendingInvitation->invitation_message_id)
                    ->where('is_read', false)
                    ->first();
                
                if ($unreadMessage) {
                    return response()->json([
                        'success' => false,
                        'message' => 'A pending invitation has already been sent to this agent for this team. Please wait for their response.',
                    ], 422);
                }
            }
        }

        // If there's a rejected invitation, delete it so we can create a new one
        $rejectedInvitation = TeamMember::where('team_id', $team->id)
            ->where('agent_id', $agent->id)
            ->where('invitation_status', 'rejected')
            ->first();
        
        if ($rejectedInvitation) {
            // Delete the rejected invitation and its message if exists
            if ($rejectedInvitation->invitation_message_id) {
                \App\Models\Message::where('id', $rejectedInvitation->invitation_message_id)->delete();
            }
            $rejectedInvitation->delete();
        }

        DB::beginTransaction();
        try {
            // Create a pending team member invitation
            $teamMember = TeamMember::create([
                'team_id' => $team->id,
                'agent_id' => $agent->id,
                'role' => $role,
                'invitation_status' => 'pending',
                'is_active' => false, // Not active until accepted
            ]);

            // Create or find conversation for team invitations
            $conversation = \App\Models\InquiryConversation::firstOrCreate(
                [
                    'agent_id' => $agent->id,
                    'broker_id' => $broker->id,
                    'customer_email' => $agent->email,
                    'type' => 'general',
                ],
                [
                    'customer_name' => $agent->first_name . ' ' . $agent->last_name,
                    'subject' => 'Team Invitation',
                    'last_message_at' => now(),
                ]
            );

            // Check if there's already an unread team invitation message for this specific team
            $existingInvitationMessage = \App\Models\Message::where('conversation_id', $conversation->id)
                ->where('sender_id', $broker->id)
                ->where('recipient_id', $agent->id)
                ->where('type', 'team_invitation')
                ->where('is_read', false)
                ->get()
                ->filter(function ($msg) use ($team) {
                    $metadata = $msg->metadata ?? [];
                    return isset($metadata['team_id']) && $metadata['team_id'] == $team->id;
                })
                ->first();

            if ($existingInvitationMessage) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'A pending invitation for this team has already been sent. Please wait for the agent to respond.',
                ], 422);
            }

            // Create invitation message
            $invitationMessage = \App\Models\Message::create([
                'sender_id' => $broker->id,
                'recipient_id' => $agent->id,
                'conversation_id' => $conversation->id,
                'sender_name' => $broker->first_name . ' ' . $broker->last_name,
                'sender_email' => $broker->email,
                'subject' => "Team Invitation: {$team->name}",
                'message' => "You have been invited to join the team '{$team->name}' by {$broker->first_name} {$broker->last_name}. Please accept or reject this invitation.",
                'type' => 'team_invitation',
                'metadata' => [
                    'team_id' => $team->id,
                    'team_name' => $team->name,
                    'team_member_id' => $teamMember->id,
                    'role' => $role,
                    'broker_id' => $broker->id,
                    'broker_name' => $broker->first_name . ' ' . $broker->last_name,
                ],
                'is_read' => false,
            ]);

            // Update team member with invitation message ID
            $teamMember->update(['invitation_message_id' => $invitationMessage->id]);

            // Update conversation last message time
            $conversation->update(['last_message_at' => now()]);

            // Note: agents_used is incremented when creating agents, not when assigning to team

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Team invitation sent to agent successfully',
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error sending team invitation: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send team invitation',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Remove an agent from a team.
     */
    public function removeAgentFromTeam(Request $request, $teamId, $agentId): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        // Verify team belongs to broker
        $team = Team::where('id', $teamId)
            ->where('broker_id', $broker->id)
            ->first();
        
        if (!$team) {
            return response()->json([
                'success' => false,
                'message' => 'Team not found or access denied.',
            ], 404);
        }

        $member = TeamMember::where('team_id', $teamId)
            ->where('agent_id', $agentId)
            ->first();
        
        if (!$member) {
            return response()->json([
                'success' => false,
                'message' => 'Agent is not a member of this team.',
            ], 404);
        }

        DB::beginTransaction();
        try {
            $member->delete();

            // Note: agents_used is not decremented - agent still exists and is managed by broker

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Agent removed from team successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error removing agent from team: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove agent from team',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Create a new agent account (brokers create agents directly; no self-registration).
     */
    public function createAgent(Request $request): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        // Check subscription limits
        $subscription = $broker->activeSubscription;
        if (!$subscription || !$subscription->canAddAgent()) {
            return response()->json([
                'success' => false,
                'message' => 'Agent limit reached. Please upgrade your plan.',
            ], 403);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'company_id' => 'nullable|exists:companies,id',
        ]);

        // Verify company belongs to broker if provided
        $companyId = null;
        if (!empty($validated['company_id'])) {
            $company = Company::where('id', $validated['company_id'])
                ->where('broker_id', $broker->id)
                ->first();
            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company not found or access denied.',
                ], 404);
            }
            $companyId = $company->id;
        }

        DB::beginTransaction();
        try {
            $agentData = [
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'] ?? null,
                'role' => 'agent',
                'created_by_broker_id' => $broker->id,
                'status' => 'approved',
                'verified' => true,
                'is_active' => true,
            ];

            // Only include company_id if the column exists and value is not null
            if ($companyId !== null && Schema::hasColumn('users', 'company_id')) {
                $agentData['company_id'] = $companyId;
            }

            $agent = User::create($agentData);

            $subscription->increment('agents_used');

            DB::commit();

            // Load company relationship only if company_id column exists
            if (Schema::hasColumn('users', 'company_id')) {
                $agent->load('company');
            }

            return response()->json([
                'success' => true,
                'message' => 'Agent account created successfully',
                'data' => $agent,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating agent: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to create agent account',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Search for registered agents (platform-wide) that can be invited to the broker's pool.
     * Returns agents matching the query who are not already managed by this broker.
     */
    public function searchAgentsToInvite(Request $request): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $q = $request->input('q', '');
        $q = is_string($q) ? trim($q) : '';
        if (strlen($q) < 2) {
            return response()->json([
                'success' => true,
                'data' => [],
            ]);
        }

        $managedIds = $broker->managedAgents()->pluck('id')->all();

        $query = User::where('role', 'agent');
        if (!empty($managedIds)) {
            $query->whereNotIn('id', $managedIds);
        }
        $agents = $query
            ->where(function ($query) use ($q) {
                $query->where('first_name', 'like', '%' . $q . '%')
                    ->orWhere('last_name', 'like', '%' . $q . '%')
                    ->orWhere('email', 'like', '%' . $q . '%')
                    ->orWhereRaw("CONCAT(COALESCE(first_name,''), ' ', COALESCE(last_name,'')) LIKE ?", ['%' . $q . '%']);
            })
            ->orderBy('first_name')
            ->limit(20)
            ->get(['id', 'first_name', 'last_name', 'email', 'created_at', 'status']);

        return response()->json([
            'success' => true,
            'data' => $agents,
        ]);
    }

    /**
     * Invite an already-registered agent to the broker's pool (sends invitation that requires acceptance).
     */
    public function inviteAgent(Request $request): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $subscription = $broker->activeSubscription;
        if (!$subscription || !$subscription->canAddAgent()) {
            return response()->json([
                'success' => false,
                'message' => 'Agent limit reached. Please upgrade your plan.',
            ], 403);
        }

        $validated = $request->validate([
            'agent_id' => 'required|integer|exists:users,id',
        ]);

        $agent = User::where('id', $validated['agent_id'])->where('role', 'agent')->firstOrFail();

        // Check if agent is already in broker's pool (accepted invitation)
        if ($agent->created_by_broker_id === $broker->id) {
            return response()->json([
                'success' => false,
                'message' => 'This agent is already in your pool.',
            ], 422);
        }

        // Check if there's already a pending invitation (agent hasn't accepted yet)
        $existingInvitation = \App\Models\Message::where('sender_id', $broker->id)
            ->where('recipient_id', $agent->id)
            ->where('type', 'broker_invitation')
            ->where('is_read', false)
            ->latest()
            ->first();

        // If there's an unread invitation, check if agent has accepted
        if ($existingInvitation) {
            $agentCheck = User::find($agent->id);
            // If agent hasn't accepted (created_by_broker_id is not set), invitation is still pending
            if ($agentCheck->created_by_broker_id !== $broker->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'An invitation has already been sent to this agent. Please wait for their response.',
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            // Create or find conversation for broker invitations
            $conversation = \App\Models\InquiryConversation::firstOrCreate(
                [
                    'agent_id' => $agent->id,
                    'broker_id' => $broker->id,
                    'customer_email' => $agent->email,
                    'type' => 'general',
                ],
                [
                    'customer_name' => $agent->first_name . ' ' . $agent->last_name,
                    'subject' => 'Broker Invitation',
                    'last_message_at' => now(),
                ]
            );

            // Create invitation message
            $invitationMessage = \App\Models\Message::create([
                'sender_id' => $broker->id,
                'recipient_id' => $agent->id,
                'conversation_id' => $conversation->id,
                'sender_name' => $broker->first_name . ' ' . $broker->last_name,
                'sender_email' => $broker->email,
                'subject' => "Invitation to Join " . ($broker->company_name ?: $broker->first_name . ' ' . $broker->last_name) . "'s Team",
                'message' => "You have been invited to join " . ($broker->company_name ?: $broker->first_name . ' ' . $broker->last_name) . "'s agent pool. Please accept or reject this invitation.",
                'type' => 'broker_invitation',
                'metadata' => [
                    'broker_id' => $broker->id,
                    'broker_name' => $broker->first_name . ' ' . $broker->last_name,
                    'broker_company' => $broker->company_name,
                    'invitation_type' => 'broker_pool',
                ],
                'is_read' => false,
            ]);

            // Create notification for the agent
            UserNotification::notify(
                $agent->id,
                'broker_invitation',
                "Invitation from " . ($broker->company_name ?: $broker->first_name . ' ' . $broker->last_name),
                "You have been invited to join " . ($broker->company_name ?: $broker->first_name . ' ' . $broker->last_name) . "'s agent pool.",
                [
                    'broker_id' => $broker->id,
                    'broker_name' => $broker->first_name . ' ' . $broker->last_name,
                    'broker_company' => $broker->company_name,
                    'message_id' => $invitationMessage->id,
                    'conversation_id' => $conversation->id,
                    'invitation_type' => 'broker_pool',
                ]
            );

            // Update conversation last message time
            $conversation->update(['last_message_at' => now()]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Invitation sent to agent successfully. They will need to accept it before being added to your pool.',
                'data' => [
                    'agent' => $agent,
                    'invitation_message_id' => $invitationMessage->id,
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error sending broker invitation: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send invitation',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Get all agents managed by this broker (created by broker or in broker's teams).
     */
    public function getAgents(Request $request): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $agents = $broker->managedAgents()
            ->with(['teamMemberships.team', 'company'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $agents,
        ]);
    }

    /**
     * Get all properties for the broker.
     * Includes broker's own listings + all managed agents (created by broker or in broker's teams).
     * Supports per_page query param for team overview (e.g. per_page=1000 to get counts right).
     */
    public function getProperties(Request $request): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $agentIds = $broker->managedAgents()->pluck('id')->push($broker->id)->unique()->values()->all();

        $perPage = (int) $request->input('per_page', 12);
        $perPage = min(max(1, $perPage), 2000);

        $properties = Property::whereIn('agent_id', $agentIds)
            ->with('agent')
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $properties,
        ]);
    }

    /**
     * Update a property (broker can modify any property from them or their managed agents).
     */
    public function updateProperty(Request $request, $propertyId): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $agentIds = $broker->managedAgents()->pluck('id')->push($broker->id)->unique()->values()->all();

        $property = Property::whereIn('agent_id', $agentIds)
            ->findOrFail($propertyId);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'type' => 'sometimes|string|max:255',
            'price' => 'sometimes|numeric|min:0',
            'price_type' => 'sometimes|string|in:Monthly,Weekly,Daily,Yearly,monthly,weekly,daily,yearly',
            'bedrooms' => 'sometimes|integer|min:0',
            'bathrooms' => 'sometimes|integer|min:0',
            'garage' => 'sometimes|integer|min:0',
            'area' => 'sometimes|integer|min:0',
            'lot_area' => 'sometimes|integer|min:0',
            'floor_area_unit' => 'sometimes|string|in:Square Meters,Square Feet',
            'amenities' => 'sometimes|string',
            'furnishing' => 'sometimes|string|in:Fully Furnished,Semi Furnished,Unfurnished',
            'video_url' => 'sometimes|url|max:500',
            'latitude' => 'sometimes|string|max:50',
            'longitude' => 'sometimes|string|max:50',
            'country' => 'sometimes|string|max:100',
            'state_province' => 'sometimes|string|max:100',
            'city' => 'sometimes|string|max:100',
            'street_address' => 'sometimes|string',
            'is_featured' => 'sometimes|boolean',
        ]);

        // Parse amenities if it's a JSON string
        if (isset($validated['amenities']) && is_string($validated['amenities'])) {
            $validated['amenities'] = json_decode($validated['amenities'], true);
        }

        // Normalize price_type to capitalized format
        if (isset($validated['price_type'])) {
            $validated['price_type'] = ucfirst(strtolower($validated['price_type']));
        }

        $property->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Property updated successfully',
            'data' => $property->fresh(),
        ]);
    }

    /**
     * Subscribe to a broker plan.
     */
    public function subscribeToPlan(Request $request): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $validated = $request->validate([
            'plan_id' => 'required|exists:broker_plans,id',
        ]);

        $plan = BrokerPlan::findOrFail($validated['plan_id']);

        // Cancel existing active subscription
        $broker->subscriptions()
            ->where('status', 'active')
            ->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);

        // Create new subscription
        $subscription = BrokerSubscription::create([
            'broker_id' => $broker->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'expires_at' => $plan->billing_period === 'monthly' 
                ? now()->addMonth() 
                : now()->addYear(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Subscribed to plan successfully',
            'data' => $subscription->load('plan'),
        ], 201);
    }

    /**
     * Team productivity report: listings and inquiry counts per managed agent (and broker).
     */
    public function teamProductivityReport(Request $request): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $agentIds = $broker->managedAgents()->pluck('id')->push($broker->id)->unique()->values()->all();

        $users = User::whereIn('id', $agentIds)->get()->keyBy('id');
        $listingCounts = Property::whereIn('agent_id', $agentIds)->selectRaw('agent_id, count(*) as total')->groupBy('agent_id')->pluck('total', 'agent_id');
        $inquiryCounts = Message::whereIn('recipient_id', $agentIds)->selectRaw('recipient_id, count(*) as total')->groupBy('recipient_id')->pluck('total', 'recipient_id');

        $propertyIdsByAgent = Property::whereIn('agent_id', $agentIds)->get()->groupBy('agent_id')->map(fn ($props) => $props->pluck('id')->all());
        $allPropertyIds = Property::whereIn('agent_id', $agentIds)->pluck('id')->all();
        $inquiriesByProperty = empty($allPropertyIds) ? collect() : Message::whereIn('property_id', $allPropertyIds)->selectRaw('property_id, count(*) as total')->groupBy('property_id')->pluck('total', 'property_id');

        $mostPopularByAgent = [];
        foreach ($agentIds as $aid) {
            $pids = $propertyIdsByAgent->get($aid, []);
            $best = null;
            $bestCount = 0;
            foreach ($pids as $pid) {
                $cnt = $inquiriesByProperty->get($pid, 0);
                if ($cnt > $bestCount) {
                    $bestCount = $cnt;
                    $best = $pid;
                }
            }
            $mostPopularByAgent[$aid] = $best;
        }
        $popularTitles = $mostPopularByAgent ? Property::whereIn('id', array_filter(array_values($mostPopularByAgent)))->pluck('title', 'id') : collect();

        $rows = [];
        foreach ($agentIds as $agentId) {
            $user = $users->get($agentId);
            $name = $user ? trim($user->first_name . ' ' . $user->last_name) : 'Unknown';
            if ($user && $user->role === 'broker') {
                $name = $name ?: 'You';
            }
            $totalListings = (int) $listingCounts->get($agentId, 0);
            $totalInquiries = (int) $inquiryCounts->get($agentId, 0);
            $popularId = $mostPopularByAgent[$agentId] ?? null;
            $mostPopular = $popularId ? ($popularTitles->get($popularId) ?? '—') : '—';
            $ratio = $totalListings > 0 ? round($totalInquiries / $totalListings, 1) : 0;

            $rows[] = [
                'agent_id' => $agentId,
                'name' => $name,
                'total_listings' => $totalListings,
                'total_inquiries' => $totalInquiries,
                'most_popular_listing' => $mostPopular,
                'inquiry_to_listing_ratio' => $ratio,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $rows,
        ]);
    }

    /**
     * Get property type distribution for reports
     */
    public function getPropertyTypeDistribution(Request $request): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $agentIds = $broker->managedAgents()->pluck('id')->push($broker->id)->unique()->values()->all();

        // Get property type distribution
        $distribution = Property::whereIn('agent_id', $agentIds)
            ->selectRaw('type, count(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();

        $total = array_sum($distribution);
        
        // Normalize property types and calculate percentages
        $normalizedTypes = [
            'condo' => 0,
            'house' => 0,
            'studio' => 0,
            'apartment' => 0,
            'commercial' => 0,
        ];

        foreach ($distribution as $type => $count) {
            $normalizedType = strtolower($type ?? '');
            if (in_array($normalizedType, ['condo', 'condominium', 'condos'])) {
                $normalizedTypes['condo'] += $count;
            } elseif (in_array($normalizedType, ['house', 'houses', 'home', 'homes'])) {
                $normalizedTypes['house'] += $count;
            } elseif (in_array($normalizedType, ['studio', 'studios'])) {
                $normalizedTypes['studio'] += $count;
            } elseif (in_array($normalizedType, ['apartment', 'apartments'])) {
                $normalizedTypes['apartment'] += $count;
            } elseif (in_array($normalizedType, ['commercial', 'office', 'warehouse', 'shop'])) {
                $normalizedTypes['commercial'] += $count;
            }
        }

        // Calculate percentages
        $result = [];
        foreach ($normalizedTypes as $type => $count) {
            $percentage = $total > 0 ? ($count / $total) * 100 : 0;
            $result[] = [
                'type' => ucfirst($type === 'condo' ? 'condos' : ($type . 's')),
                'count' => $count,
                'percentage' => round($percentage, 2),
            ];
        }

        // Sort by count descending
        usort($result, fn($a, $b) => $b['count'] - $a['count']);

        return response()->json([
            'success' => true,
            'data' => $result,
            'total' => $total,
        ]);
    }

    /**
     * Get location performance for reports
     */
    public function getLocationPerformance(Request $request): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $agentIds = $broker->managedAgents()->pluck('id')->push($broker->id)->unique()->values()->all();

        // Get location performance (based on inquiries/views per city)
        $locationData = Property::whereIn('agent_id', $agentIds)
            ->selectRaw('city, count(*) as property_count, sum(views_count) as total_views')
            ->whereNotNull('city')
            ->where('city', '!=', '')
            ->groupBy('city')
            ->get()
            ->map(function ($item) {
                return [
                    'city' => $item->city,
                    'property_count' => (int) $item->property_count,
                    'total_views' => (int) $item->total_views,
                    'inquiry_count' => 0, // Will be calculated below
                ];
            })
            ->keyBy('city')
            ->toArray();

        // Get inquiry counts by city (from messages with property_id)
        $propertyIds = Property::whereIn('agent_id', $agentIds)->pluck('id')->all();
        if (!empty($propertyIds)) {
            $inquiriesByProperty = Message::whereIn('property_id', $propertyIds)
                ->selectRaw('property_id, count(*) as count')
                ->groupBy('property_id')
                ->pluck('count', 'property_id')
                ->toArray();

            $propertiesByCity = Property::whereIn('agent_id', $agentIds)
                ->whereIn('id', array_keys($inquiriesByProperty))
                ->select('id', 'city')
                ->get()
                ->groupBy('city');

            foreach ($propertiesByCity as $city => $properties) {
                $cityInquiries = 0;
                foreach ($properties as $property) {
                    $cityInquiries += $inquiriesByProperty[$property->id] ?? 0;
                }
                if (isset($locationData[$city])) {
                    $locationData[$city]['inquiry_count'] = $cityInquiries;
                }
            }
        }

        // Calculate performance score (combination of views and inquiries)
        $result = [];
        foreach ($locationData as $city => $data) {
            $performanceScore = $data['total_views'] + ($data['inquiry_count'] * 10); // Weight inquiries more
            $result[] = [
                'city' => $city,
                'property_count' => $data['property_count'],
                'total_views' => $data['total_views'],
                'inquiry_count' => $data['inquiry_count'],
                'performance_score' => $performanceScore,
            ];
        }

        // Sort by performance score descending and take top 10
        usort($result, fn($a, $b) => $b['performance_score'] - $a['performance_score']);
        $result = array_slice($result, 0, 10);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Get conversion rate and response time statistics
     */
    public function getConversionAndResponseStats(Request $request): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        $agentIds = $broker->managedAgents()->pluck('id')->push($broker->id)->unique()->values()->all();

        // Get total inquiries
        $totalInquiries = Message::whereIn('recipient_id', $agentIds)->count();

        // Get total conversions (properties that were rented/sold)
        // This is a simplified calculation - you might want to track actual conversions differently
        $totalConversions = Property::whereIn('agent_id', $agentIds)
            ->whereIn('status', ['rented', 'sold'])
            ->count();

        // Calculate conversion rate
        $conversionRate = $totalInquiries > 0 ? ($totalConversions / $totalInquiries) * 100 : 0;

        // Calculate average response time
        // Get messages and their replies to calculate response time
        $conversationIds = \App\Models\InquiryConversation::where(function($q) use ($broker) {
            if ($broker->isBroker()) {
                $q->where('broker_id', $broker->id);
            }
        })->orWhereIn('agent_id', $agentIds)->pluck('id')->all();

        $averageResponseTime = 0;
        if (!empty($conversationIds)) {
            $messages = Message::whereIn('conversation_id', $conversationIds)
                ->whereIn('recipient_id', $agentIds)
                ->orderBy('created_at', 'asc')
                ->get();

            $responseTimes = [];
            foreach ($messages as $message) {
                // Find the next message in the same conversation from the agent/broker
                $reply = Message::where('conversation_id', $message->conversation_id)
                    ->where('sender_id', $message->recipient_id)
                    ->where('created_at', '>', $message->created_at)
                    ->orderBy('created_at', 'asc')
                    ->first();

                if ($reply) {
                    $responseTime = $message->created_at->diffInMinutes($reply->created_at);
                    $responseTimes[] = $responseTime;
                }
            }

            if (!empty($responseTimes)) {
                $averageResponseTime = round(array_sum($responseTimes) / count($responseTimes), 1);
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'conversion_rate' => round($conversionRate, 2),
                'total_inquiries' => $totalInquiries,
                'total_conversions' => $totalConversions,
                'average_response_time_minutes' => $averageResponseTime,
                'average_response_time_display' => $averageResponseTime > 0 
                    ? ($averageResponseTime < 60 
                        ? round($averageResponseTime) + ' min' 
                        : round($averageResponseTime / 60, 1) + ' hrs')
                    : '—',
            ],
        ]);
    }
}
