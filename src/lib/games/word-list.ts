// 200 five-letter wedding words — themed, personal, and fun.
// The rotation starts at "bride" (2026-03-08). Words cycle sequentially through this list.
//
// IMPORTANT: server-only. This module must never be bundled into a client
// chunk — that would expose the entire daily-word rotation. All Painedle
// gameplay routes through /api/games/painedle/* on the server.
import "server-only";

const PAINEDLE_WORD_LIST = [
    // Wedding ceremony
    "abide", "adore", "agape", "aglow", "aisle", "altar", "amber", "amity",
    // Romance
    "amour", "angel", "arise", "aspen", "baker", "beach", "bells", "berry",
    // Faith
    "bible", "blaze", "bless", "bliss", "bloom", "blush", "bread", "bride",
    // Their story
    "cakes", "candy", "cedar", "charm", "cheer", "chill", "choir", "chord",
    // Celebration
    "cider", "clean", "clear", "clink", "cloud", "coast", "color", "comfy",
    // Floral / attire
    "coral", "cream", "crisp", "cross", "crown", "crust", "dance", "dates",
    // Travel & venue
    "delta", "dream", "dress", "drink", "drive", "earth", "ember", "enjoy",
    // Faith themes
    "faith", "favor", "feast", "field", "flair", "flour", "flute", "focus",
    // Moments
    "forge", "forth", "found", "frame", "fresh", "frost", "fruit", "games",
    // Venue & setting
    "glass", "gleam", "glory", "grace", "grain", "grape", "grass", "great",
    // Wedding party
    "groom", "guest", "guide", "heart", "hills", "honey", "honor", "house",
    // Personality
    "humor", "ideal", "image", "inner", "ivory", "juice", "knelt", "known",
    // Laughter
    "laugh", "layer", "lemon", "light", "linen", "lived", "loved", "lover",
    // Personal
    "lucky", "lyric", "magic", "mango", "maple", "march", "marry", "match",
    // Together
    "merit", "merry", "might", "mirth", "movie", "music", "noble", "north",
    // By the sea / outdoors
    "ocean", "olive", "order", "party", "pasta", "pause", "peace", "peach",
    // Beauty
    "pearl", "petal", "piano", "pizza", "plant", "plate", "point", "power",
    // Pride & joy
    "pride", "prime", "proud", "queen", "raise", "ranch", "ready", "renew",
    // Emotion
    "rhyme", "rings", "river", "roast", "robin", "roses", "rusty", "saint",
    // Flavor
    "salty", "scent", "serve", "share", "shine", "shore", "shout", "smile",
    // Their first date
    "sonic", "sound", "spark", "spice", "stone", "story", "sugar", "sweet",
    // Reception
    "swing", "table", "taste", "tears", "thank", "theme", "thyme", "toast",
    // The day
    "today", "token", "touch", "trace", "trail", "truth", "twirl", "unity",
    // Values
    "valor", "value", "venue", "views", "vital", "voice", "vowed", "waltz",
    // Home & future
    "water", "wheat", "while", "whole", "worth", "yearn", "young", "zesty",
] as const;

// Validate: no duplicates
const uniqueWordCount = new Set(PAINEDLE_WORD_LIST).size;
if (uniqueWordCount !== PAINEDLE_WORD_LIST.length) {
    throw new Error(`PAINEDLE_WORD_LIST has duplicates — expected ${PAINEDLE_WORD_LIST.length} unique, got ${uniqueWordCount}.`);
}

// Validate: minimum pool size
if (PAINEDLE_WORD_LIST.length < 200) {
    throw new Error(`PAINEDLE_WORD_LIST must contain at least 200 words (currently ${PAINEDLE_WORD_LIST.length}).`);
}

// Validate: all exactly 5 letters
const invalidWords = PAINEDLE_WORD_LIST.filter((w) => w.length !== 5);
if (invalidWords.length > 0) {
    throw new Error(`PAINEDLE_WORD_LIST contains non-5-letter words: ${invalidWords.join(", ")}`);
}

export const PAINEDLE_WORDS = PAINEDLE_WORD_LIST;
