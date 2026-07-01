export type ScheduleTier = {
    id: string;
    slug: string;
    label: string;
    sort_order: number;
    is_public: boolean;
};

export type ScheduleEvent = {
    id: string;
    event_date: string;
    start_time: string;
    end_time: string | null;
    title: string;
    location: string | null;
    notes: string | null;
    sort_order: number;
};

export type ScheduleUser = {
    id: string;
    username: string;
    display_name: string;
    email: string | null;
    tier_id: string;
    role_label: string;
    game_player_id: string | null;
    last_login_at: string | null;
    login_count: number;
    created_at: string;
};

export type ScheduleSession = {
    id: string;
    user_id: string | null;
    username_snapshot: string;
    tier_snapshot: string;
    logged_in_at: string;
    ip: string | null;
    user_agent: string | null;
    country: string | null;
};

export type ScheduleAuthPayload = {
    userId: string;
    username: string;
    displayName: string;
    tierSlug: string;
    tierLabel: string;
    roleLabel: string;
    email: string | null;
    gamePlayerId: string | null;
    exp: number;
};

// Time-grouped events for the UI
export type ScheduleSection = {
    label: "Morning" | "Afternoon" | "Evening" | "Late Night";
    events: ScheduleEvent[];
};
