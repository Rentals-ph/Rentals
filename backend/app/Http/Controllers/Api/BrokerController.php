<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\RequiresBroker;
use App\Models\Company;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Models\Property;
use App\Models\BrokerPlan;
use App\Models\BrokerSubscription;
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
                'properties_count' => Property::where('agent_id', $broker->id)->count(),
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

        // Check if agent is already in the team
        $existingMember = TeamMember::where('team_id', $team->id)
            ->where('agent_id', $agent->id)
            ->first();
        
        if ($existingMember) {
            return response()->json([
                'success' => false,
                'message' => 'Agent is already a member of this team.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            TeamMember::create([
                'team_id' => $team->id,
                'agent_id' => $agent->id,
                'role' => $role,
            ]);

            // Note: agents_used is incremented when creating agents, not when assigning to team

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Agent assigned to team successfully',
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error assigning agent to team: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign agent to team',
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
     */
    public function getProperties(Request $request): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        // Get properties created by broker or by agents in broker's teams
        $agentIds = TeamMember::whereHas('team', function($query) use ($broker) {
            $query->where('broker_id', $broker->id);
        })->pluck('agent_id')->push($broker->id);

        $properties = Property::whereIn('agent_id', $agentIds)
            ->with('agent')
            ->latest()
            ->paginate(12);

        return response()->json([
            'success' => true,
            'data' => $properties,
        ]);
    }

    /**
     * Update a property (broker can modify any property from their teams).
     */
    public function updateProperty(Request $request, $propertyId): JsonResponse
    {
        $broker = $this->ensureBroker($request);

        // Verify property belongs to broker or broker's agents
        $agentIds = TeamMember::whereHas('team', function($query) use ($broker) {
            $query->where('broker_id', $broker->id);
        })->pluck('agent_id')->push($broker->id);

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
}
