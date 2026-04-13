export type GamePlayerRecord = {
    id?: string;
    username: string;
    email: string;
    created_at?: string;
};

export type AdminGameScore = {
    id: string;
    game: "trivia" | "painedle" | "crossword" | "connections";
    puzzle_key: string;
    score: number;
    max_score: number | null;
    attempts: number | null;
    solved: boolean | null;
    metadata?: Record<string, string | number | boolean | null>;
    created_at: string;
    game_players: GamePlayerRecord | GamePlayerRecord[];
};
