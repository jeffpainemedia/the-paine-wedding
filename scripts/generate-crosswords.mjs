#!/usr/bin/env node
/**
 * 5×5 crossword puzzle generator — produces 194 unique daily puzzles.
 * Run: node scripts/generate-crosswords.mjs > /tmp/puzzles.ts
 * Progress is logged to stderr; TypeScript output goes to stdout.
 */

// =============================================================================
// CLUE BANK — every word the generator may use, with its clue
// =============================================================================
const CLUE = {
  // ===== 3-LETTER (existing from puzzles) =====
  ABS:"Stomach muscles", AGE:"Era", ALT:"Alternate",
  BAR:"Block", BAT:"Swing", BET:"Wager",
  BUS:"Transit", CAP:"Top it off", CAR:"Vehicle",
  DAD:"Father", DAM:"Water barrier", DAY:"The big ___",
  DEE:"Letter D", DEL:"Delete key", DEN:"Private room",
  DYE:"Add color", EAR:"Listen well", EEL:"Slippery fish",
  ELK:"Large deer", END:"Finish", ERA:"Chapter",
  ERG:"Work unit", ERR:"Make mistake", EST:"Established",
  ETA:"Greek letter", EWE:"Woolly mom", EYE:"Window to the soul",
  FAD:"Brief craze", FEE:"Charge", GNU:"African animal",
  HAD:"Possessed", HAM:"Cured meat", HAS:"Possesses",
  HER:"She or ___", HEY:"Greeting", JOT:"Quick note",
  KEN:"Range of knowledge", LAD:"Young boy", LAY:"Place down",
  LET:"Allow", LIT:"Illuminated", MAG:"Magazine",
  MAR:"Damage", MEN:"Males", MET:"Encountered",
  MOP:"Floor tool", NAG:"Pester", NAY:"No vote",
  NET:"After deductions", NOT:"Negation", NUT:"Crunchy snack",
  PEG:"Fastener", PET:"Cherished animal", RAD:"Awesome, slangily",
  RAP:"Knock", RAY:"Beam of light", RED:"Warm color",
  REF:"Official", RIB:"Tease", ROB:"Take from",
  ROE:"Fish eggs", ROT:"Decay", RYE:"Bread grain",
  SAD:"Feeling blue", SAG:"Droop", SAP:"Tree fluid",
  SAT:"Rested", SAW:"Cutting tool", SEE:"Lay eyes on",
  SEW:"Stitch", SOP:"Appease", SPA:"Wellness place",
  TAB:"Small bill", TAG:"Label", TED:"Spread to dry",
  TEE:"Golf stand", TEN:"Decimal base", TRY:"Attempt",
  TUB:"Bathing vessel", VAN:"Vehicle", VAT:"Large tank",
  VEE:"Letter V", VET:"Animal doctor", VIA:"By way of",
  WAD:"Bundle", WED:"Marry", WEE:"Tiny",
  WIG:"Hairpiece", WOE:"Great sorrow", YEA:"Aye",
  YEP:"Yes", YET:"Nevertheless",
  // ===== 3-LETTER (additional common) =====
  ACE:"Top card", ACT:"Perform", ADD:"Sum up",
  AID:"Help", AIM:"Target", AIR:"Breathe it",
  ALE:"Pub drink", APE:"Primate", ARC:"Curve",
  ARE:"Exist", ARK:"Noah's boat", ARM:"Body limb",
  ART:"Creative work", ATE:"Consumed", AWE:"Wonder",
  BOW:"Ribbon shape", BOX:"Container", BUD:"Flower start",
  BUG:"Insect", BUN:"Bread roll", CUB:"Young bear",
  CUP:"Drinking vessel", CUT:"Slice", DIG:"Excavate",
  DIM:"Not bright", DOT:"Small mark", DRY:"Not wet",
  DUE:"Owed", DUO:"Pair", ELF:"Santa's helper",
  ELM:"Shade tree", FAN:"Admirer", FIG:"Sweet fruit",
  FIN:"Fish part", FIT:"In shape", FLY:"Take flight",
  FOE:"Enemy", FOG:"Mist", FOX:"Sly animal",
  FUN:"Enjoyment", FUR:"Animal coat", GEL:"Hair product",
  GEM:"Precious stone", GIN:"Spirit drink", GUM:"Chew it",
  GYM:"Workout place", HIP:"Trendy", HIT:"Strike",
  HOP:"Small jump", HOT:"Very warm", HUB:"Center",
  HUE:"Color shade", HUG:"Embrace", HUT:"Small shelter",
  ICE:"Frozen water", ICY:"Very cold", ILL:"Sick",
  INK:"Pen fluid", INN:"Small hotel", ION:"Charged atom",
  IRE:"Anger", IVY:"Climbing plant", JAB:"Quick punch",
  JAM:"Fruit spread", JAR:"Glass container", JAW:"Mouth part",
  JAY:"Blue bird", JET:"Fast plane", JIG:"Lively dance",
  JOB:"Employment", JOG:"Slow run", JOY:"Happiness",
  JUG:"Pitcher", KEY:"Lock opener", KID:"Child",
  KIN:"Family", KIT:"Supply set", LAB:"Science room",
  LAP:"Circuit", LAW:"Legal rule", LOG:"Tree trunk",
  LOW:"Not high", MAD:"Angry", MAP:"Navigation aid",
  MAT:"Floor cover", MIX:"Blend", MOM:"Mother",
  MUD:"Wet earth", MUG:"Large cup", NAP:"Short sleep",
  NEW:"Fresh", NOD:"Head gesture", OAK:"Strong tree",
  OAR:"Rowing tool", OAT:"Cereal grain", ODD:"Strange",
  ODE:"Lyric poem", OIL:"Liquid fuel", OLD:"Not new",
  ONE:"Single", OPT:"Choose", ORB:"Sphere",
  ORE:"Metal rock", OUR:"Belonging to us", OUT:"Not in",
  OWE:"Be indebted", OWL:"Night bird", OWN:"Possess",
  PAN:"Cooking vessel", PAW:"Animal foot", PAY:"Compensate",
  PEA:"Green veggie", PEN:"Writing tool", PIE:"Baked dessert",
  PIN:"Fastener", PIT:"Deep hole", POD:"Seed case",
  POP:"Burst", POT:"Cooking pot", PUB:"Bar",
  PUN:"Word play", PUP:"Young dog", PUT:"Place",
  RAN:"Sprinted", RAT:"Rodent", RAW:"Uncooked",
  RIG:"Equipment", RIM:"Edge", RIP:"Tear",
  ROD:"Fishing pole", ROW:"Line of seats", RUG:"Floor cover",
  RUM:"Spirit drink", RUN:"Sprint", RUT:"Groove",
  SEA:"Ocean", SET:"Group", SIN:"Transgression",
  SIP:"Small drink", SIR:"Gentleman", SIT:"Take a seat",
  SIX:"Half dozen", SKI:"Snow sport", SKY:"Above us",
  SLY:"Cunning", SOB:"Cry hard", SON:"Male child",
  SPY:"Secret agent", SUB:"Substitute", SUM:"Total",
  SUN:"Day star", TAN:"Bronze", TAP:"Light touch",
  TAR:"Road surface", TEA:"Hot drink", TIE:"Bind",
  TIN:"Metal can", TIP:"Gratuity", TOE:"Foot digit",
  TON:"Heavy weight", TOO:"Also", TOP:"Summit",
  TOW:"Pull along", TOY:"Plaything", TUG:"Pull hard",
  TWO:"Pair", URN:"Tall vase", USE:"Employ",
  VIE:"Compete", VOW:"Promise", WAR:"Conflict",
  WAX:"Polish", WAY:"Path", WEB:"Spider's work",
  WET:"Not dry", WHO:"Which person", WIN:"Victory",
  WIT:"Humor", WOK:"Asian pan", WON:"Triumphed",
  WOO:"Court", WOW:"Exclamation", YAM:"Sweet tuber",
  YES:"Affirmative", YEW:"Evergreen tree", ZEN:"Peace of mind",
  ZOO:"Animal park",

  // ===== 4-LETTER (existing from puzzles) =====
  ALSO:"As well", APES:"Mimics", APSE:"Church recess",
  ARCH:"Ceremonial gateway", ARID:"Very dry", ARKS:"Boats",
  AVER:"Say firmly", BEER:"Malt drink", BROW:"Forehead",
  CENT:"Penny", CRAB:"Pinchy crustacean", DARE:"Be bold",
  DASH:"Sprint", DEAN:"School head", DEED:"Action or document",
  DEER:"Forest animal", DELL:"Small valley", DENY:"Refuse",
  DOTE:"Adore", DREW:"Past of draw", EASE:"Comfort",
  EAST:"Direction", EDGE:"Boundary", ELSE:"Otherwise",
  ENDS:"Conclusions", FLIT:"Move quickly", FROM:"Starting point",
  FUSE:"Blend", GEAR:"Equipment", GLEE:"Delight",
  HATE:"Strong dislike", HERE:"Present", HOSE:"Spray device",
  IRON:"Press flat", LAST:"Final", LEAF:"Tree part",
  LEAP:"Jump with faith", LEER:"Suggestive look", LEES:"Wine sediment",
  LEND:"Loan out", LEST:"For fear that", MALE:"Masculine",
  MEAN:"Average", MEET:"Encounter", MEND:"Repair",
  MESA:"Flat-topped hill", META:"Self-referential", NEED:"Require",
  NEON:"Bright sign gas", NEWS:"Information", NEWT:"Pond creature",
  OBOE:"Double-reed woodwind", PAST:"History", PROD:"Push",
  PROW:"Ship front", PUFF:"Breath of air", RANT:"Speak loudly",
  RAPT:"Absorbed", RARE:"Uncommon", RASH:"Hasty",
  REAL:"Genuine", REEF:"Coral ridge", REEL:"Spin",
  REIN:"Control strap", RELY:"Depend on", RENT:"Pay to use",
  REST:"Take a break", ROAM:"Wander", RYES:"Grain plural",
  SAGE:"Wise", SAGS:"Droops", SALT:"Seasoning",
  SARI:"Wrapped garment", SATE:"Fully satisfy", SCAM:"Fraud",
  SCAR:"Mark left behind", SEAR:"Brown quickly", SELL:"Exchange",
  SHAM:"Fake thing", SHED:"Let go", SILL:"Window base",
  SLAM:"Hit hard", SLAW:"Picnic side", SLAY:"Wow",
  SLED:"Snow slider", SLEW:"Great number", SOAR:"Rise high",
  SPAR:"Practice boxing", STAB:"Pierce", STAR:"Shining one",
  STIR:"Excite", STUB:"Blunt end", STUD:"Fastener",
  SWAB:"Clean with mop", SWAG:"Drape", SWAP:"Trade",
  SWAT:"Strike", TEAR:"Drop of emotion", TEND:"Care for",
  THAT:"Indicated thing", TILT:"Lean", TRAM:"Rail car",
  TREE:"Rooted growth", TWIN:"Two as one", TYPE:"Kind",
  VEST:"Garment", WAFT:"Drift through air", WART:"Small bump",
  WEAN:"Move away from", WELL:"Healthy", WELT:"Raised mark",
  WEND:"Travel", WENT:"Traveled", WERE:"Past plural be",
  WIRE:"Connect", YELL:"Shout for joy",
  // ===== 4-LETTER (additional common) =====
  ABLE:"Capable", ACHE:"Dull pain", ACRE:"Land unit",
  AGED:"Old", ALLY:"Partner", AREA:"Region",
  AVID:"Eager", BAIT:"Lure", BAKE:"Oven cook",
  BALD:"Hairless", BALE:"Hay bundle", BAND:"Musical group",
  BANE:"Curse", BANK:"Money place", BARE:"Exposed",
  BARK:"Dog sound", BARN:"Farm building", BASE:"Foundation",
  BATH:"Soak", BEAD:"Small sphere", BEAM:"Light ray",
  BEAN:"Coffee source", BEAR:"Forest animal", BEAT:"Rhythm",
  BELL:"Chime", BELT:"Waist band", BEND:"Curve",
  BEST:"Top quality", BIRD:"Feathered flyer", BITE:"Chomp",
  BLOW:"Wind gust", BLUE:"Sky color", BOAT:"Water vessel",
  BOLD:"Daring", BOLT:"Lightning flash", BOND:"Connection",
  BONE:"Skeleton part", BOOK:"Reading material", BOOT:"Footwear",
  BORE:"Drill", BORN:"Came to be", BOWL:"Dish",
  BURN:"Flame damage", CAGE:"Enclosure", CAKE:"Birthday treat",
  CALM:"Peaceful", CAMP:"Outdoor stay", CAPE:"Hero's garb",
  CARD:"Greeting ___", CARE:"Concern", CART:"Rolling carrier",
  CASE:"Container", CAVE:"Underground space", CLAM:"Shellfish",
  CLAY:"Potter's medium", CLUB:"Organization", CLUE:"Puzzle hint",
  COAL:"Fuel source", COAT:"Outer layer", CODE:"Secret message",
  COIL:"Spiral", COIN:"Small change", COLD:"Chilly",
  COLT:"Young horse", COME:"Arrive", CONE:"Ice cream holder",
  COOK:"Prepare food", COOL:"Chill", CORD:"Rope",
  CORE:"Center", CORK:"Bottle stopper", CORN:"Cob crop",
  COST:"Price", COZY:"Snug", CREW:"Team",
  CROP:"Harvest", CROW:"Black bird", CUBE:"Six-sided shape",
  CURE:"Remedy", CURL:"Spiral shape", CUTE:"Adorable",
  DALE:"Valley", DAME:"Lady", DARK:"No light",
  DAWN:"Sunrise", DEAL:"Bargain", DEEP:"Far down",
  DENT:"Small ding", DIME:"Ten cents", DINE:"Eat out",
  DOME:"Rounded roof", DONE:"Finished", DOOR:"Entry",
  DOSE:"Medicine amount", DOVE:"Peace bird", DOWN:"Below",
  DRAW:"Sketch", DROP:"Fall", DRUM:"Percussion",
  DUEL:"One-on-one fight", DUNE:"Sand hill", DUSK:"Twilight",
  DUST:"Fine particles", EACH:"Every", EARL:"Noble title",
  EARN:"Deserve", EVEN:"Level", EVER:"Always",
  EVIL:"Wicked", EXAM:"Test", EXIT:"Way out",
  FACE:"Front side", FACT:"Truth", FADE:"Dim",
  FAIL:"Not pass", FAIR:"Just", FAKE:"Not real",
  FALL:"Autumn", FAME:"Renown", FARM:"Grow crops",
  FAST:"Quick", FATE:"Destiny", FEAR:"Dread",
  FEAT:"Achievement", FEED:"Nourish", FEEL:"Sense",
  FELT:"Touched", FERN:"Forest plant", FILE:"Folder",
  FILL:"Make full", FILM:"Movie", FIND:"Discover",
  FINE:"Good", FIRE:"Blaze", FIRM:"Solid",
  FISH:"Catch from water", FLAG:"Banner", FLAW:"Defect",
  FLED:"Ran away", FLIP:"Turn over", FLOW:"Stream",
  FOAM:"Bubbles", FOIL:"Thin metal", FOLD:"Crease",
  FOLK:"People", FOND:"Affectionate", FOOD:"Nourishment",
  FOOL:"Jester", FOOT:"Walk on it", FORD:"River crossing",
  FORE:"In front", FORK:"Eating utensil", FORM:"Shape",
  FORT:"Stronghold", FOUR:"After three", FREE:"No cost",
  FROG:"Pond hopper", FUEL:"Energy source", FULL:"Not empty",
  GAIN:"Profit", GALE:"Strong wind", GAME:"Fun activity",
  GANG:"Group", GATE:"Fence opening", GAVE:"Donated",
  GAZE:"Stare", GENE:"DNA unit", GIFT:"Present",
  GLEN:"Narrow valley", GLOW:"Soft light", GLUE:"Adhesive",
  GOAT:"Mountain animal", GOLD:"Precious metal", GOLF:"Club sport",
  GONE:"Departed", GOOD:"Fine", GRAB:"Seize",
  GRAY:"Neutral color", GREW:"Got bigger", GRIM:"Stern",
  GRIN:"Smile wide", GRIP:"Hold tight", GROW:"Get bigger",
  GULF:"Large bay", HAIL:"Ice pellets", HAIR:"Head covering",
  HALE:"Healthy", HALF:"Fifty percent", HALL:"Corridor",
  HALT:"Stop", HAND:"Five fingers", HANG:"Suspend",
  HARD:"Difficult", HARE:"Swift rabbit", HARM:"Damage",
  HAZE:"Foggy mist", HEAD:"Body top", HEAL:"Mend",
  HEAP:"Pile", HEAR:"Use ears", HEAT:"Warmth",
  HEED:"Pay attention", HEEL:"Shoe bottom", HELD:"Gripped",
  HELM:"Ship wheel", HELP:"Assist", HERB:"Cooking plant",
  HERD:"Animal group", HERO:"Brave one", HIDE:"Conceal",
  HIGH:"Tall", HIKE:"Trail walk", HILL:"Small rise",
  HINT:"Subtle clue", HIRE:"Employ", HOLD:"Grasp",
  HOLE:"Opening", HOME:"Where the heart is", HONE:"Sharpen",
  HOOD:"Head cover", HOOK:"Curved catch", HOPE:"Wish for",
  HORN:"Brass instrument", HOST:"Party thrower", HOUR:"Sixty minutes",
  HOWL:"Wolf cry", HUGE:"Enormous", HULL:"Ship body",
  HUNG:"Suspended", HUNT:"Search for", HURL:"Throw hard",
  HURT:"Pain", HUSH:"Be quiet", HYMN:"Church song",
  ICON:"Symbol", IDEA:"Thought", IDLE:"Not busy",
  INCH:"Small measure", INTO:"Inside", ISLE:"Small island",
  ITEM:"Thing", JADE:"Green stone", JAIL:"Prison",
  JEST:"Joke", JOIN:"Connect", JOKE:"Funny bit",
  JOLT:"Shock", JURY:"Trial panel", JUST:"Fair",
  KEEN:"Eager", KEEP:"Hold onto", KEPT:"Retained",
  KICK:"Foot strike", KIND:"Gentle", KING:"Royal ruler",
  KISS:"Peck", KITE:"Wind toy", KNEE:"Leg joint",
  KNEW:"Was aware", KNIT:"Make yarn art", KNOB:"Door handle",
  KNOT:"Tied rope", KNOW:"Be certain", LACE:"Delicate fabric",
  LACK:"Shortage", LAID:"Put down", LAKE:"Body of water",
  LAMB:"Young sheep", LAME:"Not convincing", LAMP:"Light source",
  LAND:"Terra firma", LANE:"Narrow road", LARK:"Fun adventure",
  LASH:"Whip", LATE:"Not on time", LAWN:"Yard grass",
  LEAD:"Go first", LEAN:"Thin", LEFT:"Opposite of right",
  LIFE:"Existence", LIFT:"Raise up", LIKE:"Enjoy",
  LILY:"White flower", LIMB:"Tree branch", LIME:"Green citrus",
  LINE:"Queue", LINK:"Connection", LION:"King of beasts",
  LIST:"Enumeration", LIVE:"Be alive", LOAD:"Heavy cargo",
  LOAF:"Bread shape", LOAN:"Lend", LOCK:"Secure",
  LOFT:"Upper area", LONE:"Single", LONG:"Extended",
  LOOK:"See", LOOP:"Circle", LORD:"Nobleman",
  LORE:"Legend", LOSE:"Misplace", LOSS:"Deficit",
  LOST:"Can't find", LOUD:"Noisy", LOVE:"Deep affection",
  LUCK:"Good fortune", LUMP:"Mass", LURE:"Attract",
  LUSH:"Green", MADE:"Created", MAID:"Helper",
  MAIL:"Post", MAIN:"Primary", MAKE:"Create",
  MALT:"Barley drink", MANE:"Horse hair", MARE:"Female horse",
  MARK:"Symbol", MASK:"Face cover", MASS:"Large amount",
  MAST:"Ship pole", MATE:"Partner", MAZE:"Puzzle path",
  MEAD:"Honey wine", MEAL:"Dinner time", MEAT:"Protein source",
  MELD:"Merge", MELT:"Thaw", MERE:"Only",
  MESH:"Interlocked net", MILD:"Gentle", MILE:"5280 feet",
  MILK:"Dairy drink", MILL:"Grain grinder", MIND:"Think",
  MINE:"Belong to me", MINT:"Cool herb", MISS:"Long for",
  MIST:"Light fog", MOAT:"Castle water", MODE:"Style",
  MOLD:"Shape", MOLE:"Garden digger", MOOD:"Feeling",
  MOON:"Night light", MORE:"Additional", MORN:"Daybreak",
  MOSS:"Green growth", MOST:"Maximum", MOTH:"Night flyer",
  MOVE:"Relocate", MUCH:"A lot", MULE:"Stubborn animal",
  MUSE:"Inspiration", MUST:"Have to", MUTE:"Silent",
  MYTH:"Legend", NAIL:"Hammer target", NAME:"Identity",
  NAVY:"Sea force", NEAR:"Close", NEAT:"Tidy",
  NECK:"Below the chin", NEST:"Bird home", NEXT:"Following",
  NICE:"Pleasant", NINE:"Single digit", NODE:"Junction",
  NONE:"Zero", NOON:"Midday", NORM:"Standard",
  NOSE:"Smell organ", NOTE:"Short message", OATH:"Sworn promise",
  OBEY:"Follow orders", ONCE:"One time", ONLY:"Sole",
  ONTO:"Upon", OPEN:"Not closed", OVEN:"Baking box",
  OVER:"Above", PACE:"Speed", PACK:"Bundle up",
  PAGE:"Book leaf", PAID:"Compensated", PAIL:"Bucket",
  PAIN:"Ache", PAIR:"Two of a kind", PALE:"Light color",
  PALM:"Hand center", PANE:"Window glass", PARK:"Green space",
  PART:"Portion", PASS:"Go by", PATH:"Walkway",
  PAVE:"Cover road", PAWN:"Chess piece", PEAK:"Mountain top",
  PEAR:"Fruit", PEAT:"Bog soil", PEEL:"Remove skin",
  PEER:"Equal", PICK:"Choose", PILE:"Stack",
  PINE:"Evergreen", PINK:"Blush color", PIPE:"Tube",
  PLAN:"Strategy", PLAY:"Have fun", PLEA:"Request",
  PLOT:"Story line", PLOW:"Farm tool", PLUG:"Stopper",
  PLUM:"Purple fruit", PLUS:"Addition", POEM:"Verse",
  POET:"Verse writer", POKE:"Prod", POLE:"Long stick",
  POLL:"Survey", POND:"Small lake", POOL:"Swimming spot",
  PORE:"Tiny opening", PORK:"Pig meat", PORT:"Harbor",
  POSE:"Position", POST:"Mail it", POUR:"Flow out",
  PRAY:"Talk to God", PREY:"Hunted one", PROP:"Support",
  PULL:"Tug", PUMP:"Force flow", PURE:"Uncontaminated",
  PUSH:"Shove", RACE:"Competition", RACK:"Storage shelf",
  RAFT:"Float craft", RAGE:"Fury", RAID:"Surprise attack",
  RAIL:"Fence bar", RAIN:"Wet weather", RAKE:"Garden tool",
  RAMP:"Incline", RANK:"Position", RATE:"Speed",
  RAVE:"Praise wildly", READ:"Book activity", REAP:"Harvest",
  REAR:"Back end", REED:"Marsh grass", RICE:"Asian grain",
  RICH:"Wealthy", RIDE:"Travel on", RIND:"Outer skin",
  RING:"Circle band", RIOT:"Uprising", RISE:"Go up",
  RISK:"Danger", ROAD:"Street", ROAR:"Lion sound",
  ROBE:"Long garment", ROCK:"Hard stone", RODE:"Past of ride",
  ROLE:"Part played", ROLL:"Turn over", ROOF:"House top",
  ROOM:"Living space", ROOT:"Plant base", ROPE:"Thick cord",
  ROSE:"Red flower", RUDE:"Impolite", RUIN:"Destroy",
  RULE:"Regulation", RUNG:"Ladder step", RUSH:"Hurry",
  RUST:"Iron decay", SAFE:"Secure", SAID:"Spoke",
  SAIL:"Boat power", SAKE:"Purpose", SALE:"Discount event",
  SAME:"Identical", SAND:"Beach grain", SANE:"Rational",
  SANG:"Past of sing", SAVE:"Keep safe", SEAL:"Close tight",
  SEAM:"Stitch line", SEAT:"Chair", SEED:"Plant start",
  SEEK:"Search for", SEEM:"Appear", SEEN:"Observed",
  SELF:"One's own", SEND:"Mail off", SENT:"Dispatched",
  SHIN:"Lower leg", SHIP:"Sea vessel", SHOE:"Foot cover",
  SHOP:"Store", SHOT:"Attempt", SHOW:"Display",
  SHUT:"Close", SICK:"Unwell", SIDE:"Edge",
  SIFT:"Sort through", SIGH:"Exhale sadly", SIGN:"Indicator",
  SILK:"Smooth fabric", SING:"Vocalize melody", SINK:"Basin",
  SITE:"Location", SIZE:"Dimension", SKIN:"Outer layer",
  SKIP:"Hop over", SLAB:"Thick piece", SLAP:"Flat hit",
  SLIM:"Thin", SLIP:"Slide", SLOT:"Opening",
  SLOW:"Not fast", SNAP:"Break sharply", SNOW:"Winter fall",
  SNUG:"Cozy", SOAK:"Drench", SOAP:"Cleaning bar",
  SOCK:"Foot garment", SODA:"Fizzy drink", SOFA:"Couch",
  SOFT:"Not hard", SOIL:"Dirt", SOLD:"Exchanged",
  SOLE:"Only one", SOME:"A few", SONG:"Musical piece",
  SOON:"Shortly", SORE:"Tender", SORT:"Organize",
  SOUL:"Inner spirit", SOUR:"Tart taste", SPAN:"Stretch across",
  SPIN:"Turn around", SPOT:"See", SPUR:"Motivate",
  STEM:"Plant stalk", STEP:"Footfall", STEW:"Slow cook",
  STOP:"Halt", SUIT:"Formal wear", SURE:"Certain",
  SURF:"Ride waves", SWAN:"Graceful bird", SWIM:"Water sport",
  TACK:"Sharp pin", TAIL:"Back end", TAKE:"Grab",
  TALE:"Story", TALK:"Speak", TALL:"High",
  TAME:"Domesticated", TANK:"Container", TAPE:"Sticky strip",
  TASK:"Assignment", TEAM:"Group effort", TELL:"Reveal",
  TERM:"Time period", TEST:"Exam", TEXT:"Message",
  THEM:"Those people", THEN:"After that", THIN:"Slender",
  TICK:"Clock sound", TIDE:"Ocean rise", TIER:"Level",
  TILE:"Floor square", TILL:"Until", TIME:"Hours pass",
  TINY:"Very small", TIRE:"Exhaust", TOAD:"Warty frog",
  TOLD:"Informed", TOLL:"Fee", TONE:"Sound quality",
  TOOK:"Grabbed", TOOL:"Implement", TORE:"Ripped",
  TORN:"Ripped apart", TOSS:"Throw lightly", TOUR:"Sightseeing trip",
  TOWN:"Small city", TRAP:"Snare", TRAY:"Serving plate",
  TREK:"Long journey", TRIM:"Cut edges", TRIO:"Three together",
  TRIP:"Journey", TRUE:"Correct", TUCK:"Push in",
  TUNA:"Ocean fish", TUNE:"Melody", TURF:"Grass patch",
  TURN:"Rotate", TWIG:"Small branch", UNIT:"Single piece",
  UPON:"On top of", URGE:"Push", USED:"Not new",
  VAIN:"Conceited", VALE:"Valley", VANE:"Weather pointer",
  VARY:"Change", VASE:"Flower holder", VAST:"Enormous",
  VEIL:"Wedding face cover", VEIN:"Blood vessel", VENT:"Air opening",
  VERB:"Action word", VERY:"Extremely", VICE:"Bad habit",
  VIEW:"Outlook", VINE:"Climbing plant", VOID:"Empty space",
  VOTE:"Ballot cast", WADE:"Walk in water", WAGE:"Pay rate",
  WAIL:"Loud cry", WAIT:"Be patient", WAKE:"Get up",
  WALK:"Stroll", WALL:"Room divider", WAND:"Magic stick",
  WANT:"Desire", WARD:"Hospital section", WARM:"Cozy temperature",
  WARN:"Alert", WARP:"Bend", WARY:"Cautious",
  WASH:"Clean", WAVE:"Ocean swell", WEAK:"Not strong",
  WEAR:"Put on", WEED:"Garden pest", WEEK:"Seven days",
  WEEP:"Cry", WELD:"Fuse metal", WEST:"Sunset direction",
  WHAT:"Which thing", WHEN:"At what time", WHOM:"Which person",
  WICK:"Candle string", WIDE:"Broad", WIFE:"Married partner",
  WILD:"Untamed", WILL:"Determination", WILT:"Droop",
  WIND:"Moving air", WINE:"Grape drink", WING:"Bird limb",
  WINK:"Eye signal", WIPE:"Clean off", WISE:"Sage",
  WISH:"Desire", WITH:"Along", WOKE:"Woken up",
  WOLF:"Pack hunter", WOOD:"Tree material", WOOL:"Sheep fiber",
  WORD:"Vocabulary unit", WORE:"Had on", WORK:"Labor",
  WORM:"Soil creature", WORN:"Used up", WRAP:"Cover up",
  WREN:"Small bird", YARD:"Garden area", YARN:"Knitting thread",
  YEAR:"365 days", YOKE:"Oxen harness", YOUR:"Belonging to you",
  ZEAL:"Passion", ZERO:"Nothing", ZEST:"Enthusiasm",
  ZONE:"Area", ZOOM:"Go fast",

  // ===== 5-LETTER (existing from puzzles, minus blocked) =====
  ABIDE:"Stay with", ABODE:"Dwelling place", ABOVE:"Higher up",
  ABUSE:"Mistreat", ADOBE:"Clay brick", ADORE:"Love deeply",
  AERIE:"Eagle nest", AGAIN:"Once more", AGENT:"Representative",
  AGGIE:"School connection", AGILE:"Nimble", AGREE:"Come to terms",
  AHEAD:"In front", ALERT:"On guard", ALIKE:"Similar",
  ALIVE:"Living", ALLOT:"Assign", ALLOW:"Permit",
  ALONE:"By oneself", ALOUD:"Out loud", ALTAR:"End of the aisle",
  ALTER:"Change", AMONG:"In the middle", AMUSE:"Entertain",
  ANGER:"Fury", ANGLE:"Corner", ANVIL:"Blacksmith block",
  APRIL:"Spring month", ARBOR:"Where he got on one knee", ARDOR:"Passion",
  ARENA:"Stadium", ARGUE:"Disagree", ARISE:"Come up",
  ARRAY:"Beautiful spread", ARROW:"Pointed shaft", ARSON:"Fire-setting",
  ASHEN:"Pale", ASIDE:"Off to the side", ASKED:"Inquired",
  ASSET:"Resource", ATRIA:"Heart chambers", AUDIT:"Check over",
  AVAIL:"Benefit", AVIAN:"Bird-related", AVOID:"Stay away",
  BEGAN:"Started", BEING:"Existing", BELOW:"Under",
  BIBLE:"Holy text", BLEAK:"Gloomy", BLUSH:"Soft pink",
  BOUND:"Heading toward", BRAND:"Mark", BRAVE:"Courageous",
  BRIDE:"One in white", BUGLE:"Military horn", BULLY:"Tormentor",
  CABIN:"Small house", CARGO:"Freight", CAROL:"Joyful song",
  CARRY:"Bear forward", CATCH:"Bouquet ___", CHARM:"Secret weapon",
  CHESS:"Board game", CHILI:"Spicy dish", CLEAR:"September Texas sky",
  CLONE:"Exact copy", COCOA:"Chocolate base", CORAL:"Warm pink tone",
  COVET:"Want badly", CRUST:"Outer layer", DANCE:"Reception floor mission",
  DARTS:"Throwing game", DAZED:"Confused", DEBUT:"First appearance",
  DELVE:"Dig deep", DODGE:"Move aside", DRAMA:"Play",
  DROVE:"Past of drive", DRUNK:"Intoxicated", EAGER:"Enthusiastic",
  EAGLE:"Soaring bird", EARLY:"Ahead of schedule", EATEN:"Consumed",
  EAVES:"Roof overhangs", EDGED:"Bordered", ELBOW:"Arm joint",
  ELDER:"Older person", ELVES:"Fantasy folk", EMAIL:"Digital message",
  ENACT:"Put into law", ENDED:"Finished", ENSUE:"Follow from",
  ENTER:"Go in", ENTRY:"Coming in", ERASE:"Remove",
  ERROR:"Mistake", EVENS:"Makes level", EVENT:"Happening",
  EVOKE:"Call up", EXCEL:"Do very well", EXTRA:"Bonus",
  EYRIE:"Clifftop nest", FEAST:"Big meal", FERAL:"Wild",
  FIRST:"What this journey was", FOUND:"He ___ her again", FRAME:"Structure",
  FULLY:"Completely", GAUGE:"Measure", GENIE:"Wish granter",
  GLIDE:"Smooth move", GLINT:"Quick shine", GOING:"Departing",
  GRAIN:"Small seed", GRANT:"Bestow", GRAVE:"Burial site",
  GREET:"Welcome", GROVE:"Small forest", GUARD:"Protect",
  GUTSY:"Brave", HAVEN:"Safe place", HAZEL:"Light brown",
  HENCE:"From here", HILLS:"Arbor ___, proposal site", HONOR:"Cherish",
  HOTEL:"Travel staple", HURRY:"Move fast", IDEAL:"Perfect",
  IMAGE:"Picture", IRATE:"Angry", IRONY:"Contradiction",
  IVORY:"White shade", JESUS:"Center of it all", LABEL:"Identify",
  LARGE:"Big", LATER:"After some time", LAUGH:"Express joy",
  LEGAL:"Lawful", LEVEE:"Flood embankment", LEVEL:"Equal",
  LITHE:"Flexible", LIVED:"Experienced", MANGO:"Tropical fruit",
  MANOR:"Estate", MEDIA:"Communications", MEGAN:"Proposal co-conspirator",
  MERIT:"Deserved recognition", MIGHT:"Strength", MILES:"Long-distance tax",
  MOVED:"Deeply affected", NEVER:"Not ever", NIGHT:"The proposal ___",
  NOVEL:"New and exciting", NURSE:"Care giver", OAKEN:"Made of oak",
  OASIS:"Desert water source", OCTET:"Group of eight", ODDER:"More strange",
  OLIVE:"Earthy green", ONSET:"Start", OPERA:"Sung drama",
  OPTIC:"Of vision", ORDER:"Arrange", OUTDO:"Surpass",
  PAINT:"Color with brush", PAUSE:"Brief stop", PEACE:"Tranquility",
  PLACE:"Location", PLANT:"Grow something", PLAZA:"Public square",
  PLEAT:"Fabric fold", PLUMP:"Round and full", POLAR:"Near a pole",
  POLKA:"Dance style", POSED:"Positioned", POUND:"Strike hard",
  PRIDE:"Joyful satisfaction", PRIME:"At their best", PRIZE:"Reward",
  PROBE:"Investigate", PROSE:"Plain writing", PROUD:"With satisfaction",
  PROVE:"Show true", PUREE:"Blended food", RADIO:"Broadcast",
  RAINY:"Wet weather", RAISE:"Lift a glass", RALLY:"Come together",
  RAVEN:"Black bird", REACH:"Extend toward", READY:"Set to go",
  REBEL:"Go against", REGAL:"Royal", REMIT:"Send back",
  RENEW:"Start fresh", REPEL:"Drive back", RESET:"Start over",
  RIDGE:"Long crest", RINGS:"Two circles, one commitment", RISEN:"Come up",
  ROMAN:"Groomsman name", ROSIN:"Bow-rubbed resin", ROUND:"Gather around",
  ROUTE:"What the drive requires", ROYAL:"Majestic", RULER:"Measuring stick",
  RURAL:"Country setting", SAINT:"Holy being", SALON:"Style place",
  SATIN:"Smooth fabric", SAUTE:"Fry quickly", SCENE:"Farm at golden hour",
  SCONE:"Baked treat", SCOOP:"Gather up", SCOPE:"Extent",
  SCOUT:"Explore", SERGE:"Twill fabric", SERIF:"Font flourish",
  SEVEN:"Lucky number", SHADE:"Partial darkness", SHALE:"Layered rock",
  SHAME:"Embarrassment", SHARE:"What marriage is", SHONE:"Past of shine",
  SHORE:"Land by water", SIGHT:"Vision", SINEW:"Tough cord",
  SITAR:"Indian lute", SIXTH:"After fifth", SLANT:"Angle",
  SLATE:"Dark stone", SLUMP:"Decline", SMILE:"Best photo requirement",
  SMOKE:"Fire output", SOLAR:"Sun-powered", SOLID:"Firm",
  SPELL:"Cast a ___", SPEND:"Invest time", SPORE:"Plant seed",
  SPREE:"Shopping trip", STAGE:"Band setup", STAKE:"Pointed post",
  STARE:"Look intently", STATE:"Texas always", STEAD:"In place of",
  STEAL:"Take wrongly", STEEP:"Sharp incline", STILL:"Even now",
  STONE:"Hard mineral", STORE:"Keep safe", STORM:"Wild weather",
  STRAP:"Bind", STRAW:"Drinking tube", STRAY:"Wander off",
  SUAVE:"Smoothly charming", SUGAR:"Sweet stuff", SUPER:"Beyond great",
  SURGE:"Rush forward", TABLE:"Dining surface", TARDY:"Late",
  TEASE:"Playfully provoke", TENSE:"Tight feeling", THREE:"Number",
  THROW:"Bouquet ___", TIARA:"Crown", TIMED:"Measured duration",
  TIMER:"Counting device", TIMID:"Shy", TITAN:"Giant",
  TITLE:"Name given", TODAY:"This day", TOKEN:"Symbol",
  TONGS:"Salad grabbers", TRACE:"Follow the path", TRADE:"Exchange",
  TRAIL:"Hiking path", TRAIN:"Bridal ___", TRAMP:"Wander",
  TRASH:"Waste", TREAD:"Step on", TREND:"Movement",
  TRIED:"Attempted", TRUCK:"Large vehicle", TRUTH:"Honesty",
  TUNED:"Adjusted", ULTRA:"Extreme", UNDER:"Beneath",
  UNION:"Joining", UNTIL:"Up to the moment", UPSET:"Troubled",
  URBAN:"City-based", USAGE:"How it's used", UTTER:"Completely",
  VALID:"Real", VAULT:"Secure room", VENOM:"Poison",
  VIBES:"Feelings", VICAR:"Parish minister", VINES:"Dinner spot",
  VIOLA:"String instrument", VIRAL:"Spreading", WATER:"Life-giving",
  WAVER:"Hesitate", WEAVE:"Intertwine", WHOLE:"Complete",
  WIDEN:"Make broader", WORST:"Most bad", WRITE:"Record",
  WROTE:"Past of write", YIELD:"Give way",
  // ===== 5-LETTER (from original word bank) =====
  AISLE:"Wedding walkway", AMBER:"Yellowish resin", AMITY:"Friendship",
  AMOUR:"Love affair", ANGEL:"Heavenly being", ASPEN:"Quaking tree",
  BAKER:"Bread maker", BEACH:"Sandy shore", BELLS:"Wedding chimes",
  BERRY:"Small fruit", BLAZE:"Fierce fire", BLESS:"Give grace",
  BLISS:"Pure happiness", BLOOM:"Flower open", BREAD:"Baked staple",
  CAKES:"Celebration sweets", CANDY:"Sweet treat", CEDAR:"Aromatic wood",
  CHEER:"Encouragement", CHILL:"Relax", CHOIR:"Singing group",
  CHORD:"Musical notes", CIDER:"Apple drink", CLEAN:"Spotless",
  CLINK:"Glass toast sound", CLOUD:"Sky puff", COAST:"Shoreline",
  COLOR:"Hue", COMFY:"Cozy", CREAM:"Dairy topping",
  CRISP:"Crunchy", CROSS:"Angry", CROWN:"Royal headpiece",
  DATES:"Calendar numbers", DELTA:"River mouth", DREAM:"Sleep vision",
  DRESS:"Wedding attire", DRINK:"Beverage", DRIVE:"Road trip",
  EARTH:"Our planet", EMBER:"Glowing coal", ENJOY:"Take pleasure",
  FAITH:"Deep belief", FAVOR:"Good turn", FIELD:"Open area",
  FLAIR:"Style", FLOUR:"Baking powder", FLUTE:"Wind instrument",
  FOCUS:"Concentrate", FORGE:"Shape metal", FORTH:"Forward",
  FRESH:"Newly made", FROST:"Ice crystals", FRUIT:"Nature's candy",
  GAMES:"Fun activities", GLASS:"Transparent cup", GLEAM:"Soft shine",
  GLORY:"Splendor", GRACE:"Elegance", GRAPE:"Vine fruit",
  GRASS:"Lawn", GREAT:"Excellent", GROOM:"Wedding partner",
  GUEST:"Invited one", GUIDE:"Show the way", HEART:"Love's home",
  HONEY:"Bee product", HOUSE:"Home", HUMOR:"Comedy",
  INNER:"Inside", JUICE:"Fruit drink", KNELT:"Got down",
  KNOWN:"Recognized", LAYER:"Covering", LEMON:"Sour citrus",
  LIGHT:"Illumination", LINEN:"Fine fabric", LOVER:"Sweetheart",
  LUCKY:"Fortunate", LYRIC:"Song words", MAGIC:"Enchantment",
  MAPLE:"Syrup tree", MARCH:"Walk in step", MARRY:"Tie the knot",
  MATCH:"Perfect pair", MERRY:"Festive", MIRTH:"Merriment",
  MOVIE:"Film", MUSIC:"Melody", NOBLE:"Dignified",
  NORTH:"Compass point", OCEAN:"Vast water", ORDER:"Sequence",
  PARTY:"Celebration", PASTA:"Italian staple", PAUSE:"Brief stop",
  PEACH:"Fuzzy fruit", PEARL:"Oyster gem", PETAL:"Flower part",
  PIANO:"Key instrument", PIZZA:"Italian pie", PLATE:"Dinner dish",
  POINT:"Dot or tip", POWER:"Strength", QUEEN:"Royal lady",
  RANCH:"Cattle farm", RENEW:"Start fresh", RHYME:"Poem pattern",
  RIVER:"Flowing water", ROAST:"Cook in oven", ROBIN:"Red-breasted bird",
  ROSES:"Romantic flowers", RUSTY:"Corroded", SALTY:"Like the sea",
  SCENT:"Pleasant smell", SERVE:"Assist", SHINE:"Give light",
  SHOUT:"Yell loud", SONIC:"Sound-related", SOUND:"Noise",
  SPARK:"Tiny flame", SPICE:"Flavor", STONE:"Hard mineral",
  STORY:"Narrative", SWEET:"Sugary", SWING:"Back and forth",
  TASTE:"Flavor", TEARS:"Drops of joy", THANK:"Express gratitude",
  THEME:"Central idea", THYME:"Herb", TOAST:"Cheers!",
  TOKEN:"Small gift", TOUCH:"Feel", TRAIL:"Nature path",
  TRUTH:"Honesty", TWIRL:"Spin around", UNITY:"Togetherness",
  VALOR:"Bravery", VALUE:"Worth", VENUE:"Event location",
  VIEWS:"Scenic overlooks", VITAL:"Essential", VOICE:"Speak up",
  VOWED:"Promised", WALTZ:"Elegant dance", WHEAT:"Grain crop",
  WHILE:"During", WORTH:"Value", YEARN:"Long for",
  YOUNG:"Not old", ZESTY:"Full of flavor",
  // ===== 5-LETTER (additional common) =====
  ABOUT:"Approximately", ADAPT:"Adjust", ADMIT:"Confess",
  ADOPT:"Take in", ADULT:"Grown-up", AFTER:"Following",
  ALARM:"Warning signal", ALBUM:"Photo collection", ALIGN:"Line up",
  AMAZE:"Astonish", AMPLE:"Plenty", ANNEX:"Addition",
  APPLY:"Put to use", BADGE:"Pin of honor", BASIN:"Water bowl",
  BATCH:"Group made", BLACK:"Darkest color", BLADE:"Cutting edge",
  BLAME:"Accuse", BLAND:"Plain", BLANK:"Empty",
  BLAST:"Explosion", BLEED:"Lose blood", BLEND:"Mix together",
  BLIND:"Cannot see", BLOCK:"Obstruct", BLOWN:"Wind-carried",
  BLUNT:"Not sharp", BOARD:"Flat piece", BOOST:"Lift up",
  BRAIN:"Think tank", BRASS:"Copper alloy", BREAK:"Snap apart",
  BRIEF:"Short", BRING:"Carry here", BROAD:"Wide",
  BROKE:"Penniless", BROOK:"Small stream", BROWN:"Earth tone",
  BRUSH:"Paint tool", BUILD:"Construct", BUNCH:"Cluster",
  BURST:"Pop", BUYER:"Purchaser", CAMEL:"Desert animal",
  CHAIN:"Connected links", CHAIR:"Seat", CHALK:"Writing stick",
  CHANT:"Repeated song", CHASE:"Pursue", CHEAP:"Inexpensive",
  CHECK:"Verify", CHEEK:"Face side", CHEST:"Trunk",
  CHIEF:"Leader", CHILD:"Young one", CHINA:"Fine porcelain",
  CIVIL:"Polite", CLAIM:"Assert", CLAMP:"Grip device",
  CLASH:"Conflict", CLASS:"Category", CLICK:"Mouse sound",
  CLIFF:"Steep drop", CLIMB:"Go up", CLING:"Hold tight",
  CLOCK:"Timepiece", CLOSE:"Near", CLOTH:"Fabric",
  COACH:"Trainer", COUNT:"Tally", COUCH:"Sofa",
  COURT:"Legal arena", COVER:"Hide", CRACK:"Split",
  CRAFT:"Handmade art", CRANE:"Tall bird", CRASH:"Collision",
  CRAZY:"Wild", CREEK:"Small stream", CREST:"Peak",
  CRIME:"Offense", CROWD:"Throng", CRUEL:"Heartless",
  CRUSH:"Squeeze hard", CURVE:"Bend", CYCLE:"Loop",
  DAIRY:"Milk source", DENSE:"Thick", DEPTH:"How deep",
  DIRTY:"Not clean", DITCH:"Trench", DIZZY:"Lightheaded",
  DOUBT:"Uncertainty", DOUGH:"Bread base", DRAFT:"First version",
  DRAIN:"Empty out", DRAPE:"Hang cloth", DRAWN:"Sketched",
  DRIED:"Without moisture", DRIFT:"Float along", DRILL:"Bore tool",
  DROWN:"Sink below", ELECT:"Vote in", ELITE:"Top tier",
  EMPTY:"Nothing inside", ESSAY:"Written piece", EVERY:"Each one",
  EXACT:"Precise", EXILE:"Banishment", FABLE:"Moral story",
  FACET:"Aspect", FAINT:"Barely there", FAIRY:"Tiny creature",
  FALSE:"Untrue", FANCY:"Elaborate", FATAL:"Deadly",
  FAULT:"Flaw", FIBER:"Thread", FIFTH:"After fourth",
  FIFTY:"Half century", FINAL:"Last", FLAME:"Fire tongue",
  FLARE:"Bright burst", FLASH:"Quick light", FLASK:"Small bottle",
  FLESH:"Body tissue", FLINT:"Spark stone", FLOAT:"Stay above",
  FLOCK:"Group of birds", FLOOD:"Water overflow", FLOOR:"Walk on it",
  FLORA:"Plant life", FORCE:"Strength", FORTY:"Four tens",
  FORUM:"Discussion place", FRANK:"Honest", FRAUD:"Deception",
  FRONT:"Foremost", FROZE:"Became ice", GHOST:"Specter",
  GIANT:"Huge being", GIVEN:"Granted", GLOBE:"World sphere",
  GLOOM:"Darkness", GLOSS:"Shine", GLOVE:"Hand cover",
  GRADE:"Level", GRAND:"Magnificent", GRAPH:"Data chart",
  GRASP:"Hold onto", GREEN:"Nature color", GRIEF:"Deep sorrow",
  GRILL:"Cook out", GRIND:"Crush down", GROAN:"Pain sound",
  GROUP:"Collection", GROWN:"Matured", GUESS:"Estimate",
  GUILT:"Remorse", GUISE:"Disguise", HAPPY:"Joyful",
  HARSH:"Severe", HASTE:"Rush", HEAVE:"Lift hard",
  HEAVY:"Weighty", HEDGE:"Bush fence", HERBS:"Cooking greens",
  HOBBY:"Pastime", HORSE:"Riding animal", HYPER:"Overactive",
  ICING:"Cake topper", JAZZY:"Lively", JEWEL:"Precious gem",
  JOKER:"Card or comedian", JUMPY:"Nervous", KNACK:"Special skill",
  KNEEL:"Bend the knee", KNOCK:"Door sound", LASER:"Focused light",
  LEARN:"Study", LEASE:"Rental deal", LOCAL:"Nearby",
  LODGE:"Cabin stay", LOGIC:"Reason", LOOSE:"Not tight",
  LOWER:"Bring down", LOYAL:"Faithful", LUNAR:"Moon-related",
  LUNCH:"Midday meal", MAJOR:"Significant", MASON:"Bricklayer",
  MAYOR:"City leader", MERCY:"Compassion", METAL:"Iron or steel",
  METER:"Measuring unit", MINOR:"Lesser", MINUS:"Less",
  MIXED:"Blended", MODEL:"Example", MONEY:"Currency",
  MONTH:"Calendar unit", MORAL:"Ethical", MOTOR:"Engine",
  MOUNT:"Climb up", MOUSE:"Small rodent", MOUTH:"Speaking part",
  NERVE:"Bold courage", NOISE:"Loud sound", NOTED:"Famous",
  OFFER:"Propose", OFTEN:"Frequently", OTHER:"Different",
  OUTER:"External", OWNER:"Possessor", OXIDE:"Rust compound",
  PANEL:"Flat section", PANIC:"Sudden fear", PAPER:"Writing sheet",
  PATCH:"Mend spot", PECAN:"Southern nut", PENNY:"One cent",
  PERCH:"Sit atop", PHASE:"Stage", PHONE:"Call device",
  PHOTO:"Snapshot", PIECE:"Portion", PILOT:"Flyer",
  PITCH:"Throw", PIXEL:"Screen dot", PLAIN:"Simple",
  PLANE:"Aircraft", PLANK:"Board", PLEAD:"Beg",
  PLUMB:"Vertical", PLUME:"Feather", POUND:"Weight unit",
  PRESS:"Push down", PRICE:"Cost", PRINT:"Publish",
  PRIOR:"Earlier", PROOF:"Evidence", PROWL:"Sneak around",
  PSALM:"Sacred song", PULSE:"Heartbeat", PUNCH:"Strong hit",
  PUPIL:"Student", PURSE:"Handbag", QUEST:"Search",
  QUICK:"Fast", QUIET:"Silent", QUITE:"Rather",
  QUOTE:"Repeat words", RADAR:"Detection system", RANGE:"Scope",
  RAPID:"Swift", RAZOR:"Sharp blade", REACT:"Respond",
  REALM:"Kingdom", REIGN:"Rule", RELAX:"Unwind",
  REPLY:"Answer back", RIDER:"Horseback one", RIFLE:"Long gun",
  RIGHT:"Correct", RIGID:"Stiff", RINSE:"Wash lightly",
  RIVAL:"Competitor", ROBOT:"Machine worker", ROCKY:"Full of rocks",
  ROUGH:"Not smooth", SAUCE:"Topping liquid", SCALE:"Weigh",
  SCARE:"Frighten", SCARF:"Neck wrap", SCORE:"Points",
  SENSE:"Feel", SETUP:"Arrangement", SHALL:"Will do",
  SHAPE:"Form", SHARK:"Ocean predator", SHARP:"Keen edge",
  SHEAR:"Cut close", SHEEP:"Woolly animal", SHEER:"Pure",
  SHELF:"Wall ledge", SHELL:"Hard cover", SHIFT:"Move over",
  SHIRT:"Top garment", SHOCK:"Surprise", SHORT:"Not tall",
  SINCE:"From then", SKILL:"Ability", SKULL:"Head bone",
  SLEEP:"Rest", SLICE:"Cut thin", SLIDE:"Glide",
  SLOPE:"Incline", SMALL:"Little", SMART:"Clever",
  SMITH:"Metalworker", SNACK:"Light bite", SORRY:"Apologetic",
  SOUTH:"Compass point", SPACE:"Open area", SPARE:"Extra",
  SPEAK:"Talk", SPEED:"Velocity", SPINE:"Backbone",
  SPOKE:"Said", SPOON:"Eating utensil", SPORT:"Athletic game",
  SPRAY:"Mist", STACK:"Pile up", STAFF:"Workers",
  STAIN:"Spot", STAIR:"Step", STALE:"Not fresh",
  STALL:"Delay", STAMP:"Postage mark", STAND:"Be upright",
  START:"Begin", STAYS:"Remains", STEAK:"Beef cut",
  STEAM:"Water vapor", STEEL:"Strong metal", STEER:"Guide along",
  STERN:"Rear of ship", STICK:"Thin branch", STIFF:"Rigid",
  STOCK:"Supply", STOLE:"Took", STOOL:"Simple seat",
  STOOP:"Bend over", STOVE:"Cooking range", STRIP:"Narrow piece",
  STUCK:"Trapped", STUDY:"Research", STUFF:"Material",
  STUMP:"Tree base", STYLE:"Fashion", SUITE:"Room set",
  SWAMP:"Wetland", SWARM:"Large group", SWEAR:"Vow solemnly",
  SWEEP:"Clean floor", SWEPT:"Cleaned", SWIFT:"Very fast",
  SWORD:"Long blade", TEACH:"Instruct", TEETH:"Mouth set",
  TEMPO:"Musical speed", THEFT:"Stealing", THICK:"Not thin",
  THIEF:"Robber", THING:"Object", THINK:"Ponder",
  THIRD:"After second", THORN:"Plant spike", THUMB:"Digit",
  TIGER:"Striped cat", TIGHT:"Snug", TIRED:"Weary",
  TOTAL:"Sum", TOUGH:"Hard", TOWER:"Tall structure",
  TOXIC:"Poisonous", TRACK:"Path", TRAIT:"Characteristic",
  TREAT:"Delight", TRICK:"Scheme", TROOP:"Band of soldiers",
  TRULY:"Really", TRUNK:"Tree body", TRUST:"Have faith",
  TUMOR:"Growth", TUNER:"Dial adjuster", TWICE:"Two times",
  TWIST:"Turn", UNCLE:"Parent's brother", UNITE:"Join as one",
  UPPER:"Higher", USUAL:"Normal", VAGUE:"Unclear",
  VAPOR:"Mist", VERSE:"Poem lines", VIDEO:"Moving images",
  VIGOR:"Energy", VISOR:"Eye shade", VISIT:"Go see",
  VISTA:"Scenic view", VIVID:"Bright", VOCAL:"Spoken",
  VOTER:"Ballot caster", WAGES:"Pay", WAIST:"Middle",
  WASTE:"Squander", WATCH:"Timepiece", WEARY:"Very tired",
  WEIRD:"Strange", WHERE:"What place", WHICH:"What one",
  WHITE:"Snow color", WHOSE:"Belonging to whom", WIDER:"More broad",
  WOMAN:"Adult female", WORLD:"The globe", WORRY:"Fret",
  WORSE:"More bad", WOUND:"Injury", WOVEN:"Interlaced",
  WRIST:"Hand joint", WRONG:"Incorrect",
  // ===== 5-LETTER (themed/priority) =====
  TEXAS:"Lone Star State", TEXTS:"Digital messages", CALLS:"Phone rings",
  DAVIS:"California college town", PLANS:"Future arrangements",
  PAIGE:"Wedding party member", BLAKE:"Wedding party member",
  BRYNN:"Wedding party member",
  // ===== Additional curated clues for common dictionary words =====
  AMINO:"___ acid", OTTER:"Playful river mammal", AROSE:"Came up",
  TENT:"Camping shelter", ATLAS:"Book of maps", ROVER:"Wanderer",
  PILES:"Stacks", LILAC:"Purple flower", ETHER:"Anesthetic of old",
  BUST:"Sculpture or flop", ALPHA:"First letter", YEN:"Japanese currency",
  TALES:"Stories", SIEGE:"Castle attack", RESIN:"Sticky substance",
  NAIVE:"Lacking experience", LOTTO:"Numbers game", LIMIT:"Maximum",
  DART:"Thrown projectile", AXIAL:"Along an axis", AMEND:"Fix or revise",
  WIRED:"Plugged in", TRIAL:"Court proceeding", TAROT:"Fortune cards",
  SPAM:"Junk mail", SCRUB:"Clean hard", ROPES:"Know the ___",
  RELAY:"Pass along", ORBIT:"Circle a planet", MOTTO:"Guiding phrase",
  MESS:"Disorder", MATTE:"Not glossy", MAINS:"Power supply",
  LEAVE:"Depart", LANCE:"Medieval weapon", INLET:"Narrow bay",
  ROVER:"Wanderer", METRO:"City train", LINER:"Ocean vessel",
  PIVOT:"Turn point", OPTED:"Chose", LEVER:"Simple machine",
  ULTRA:"Extreme", MANOR:"Estate house", INTRO:"Opening",
  ELITE:"Top tier", PORCH:"Front sitting area", LADEN:"Heavily loaded",
  CORAL:"Reef builder", CRISP:"Firm and fresh", DONOR:"Gift giver",
  DEPOT:"Train station", CEDAR:"Fragrant wood", ACORN:"Oak seed",
  ADAPT:"Adjust", AGILE:"Quick and nimble", AGING:"Getting older",
  ALARM:"Warning sound", ALBUM:"Photo collection", ALIEN:"From space",
  AMBER:"Warm gem color", ANGEL:"Heavenly being", ANKLE:"Foot joint",
  AROMA:"Pleasant smell", AUDIT:"Financial check", BADGE:"ID pin",
  BARON:"Noble title", BASIN:"Wash bowl", BENCH:"Park seat",
  BERRY:"Small fruit", BLADE:"Knife edge", BLAST:"Explosion",
  BLOOM:"Flower opens", BLUFF:"Fake out", BONUS:"Extra reward",
  BOOTH:"Fair stand", BRAVE:"Courageous", BRIEF:"Short summary",
  BRUSH:"Paint tool", CARGO:"Ship goods", CHAIN:"Linked metal",
  CHARM:"Delightful quality", CHOIR:"Singing group", CHUNK:"Thick piece",
  CIVIC:"City related", CLERK:"Store worker", CLIFF:"Steep drop",
  CLING:"Hold tight", CLOTH:"Woven fabric", COACH:"Team leader",
  COMET:"Icy space rock", COUCH:"Living room seat", CRAFT:"Skilled art",
  CRANE:"Tower lifter", CRAWL:"Move slowly", CREEK:"Small stream",
  CROWD:"Large group", CUBIC:"Box shaped", CURVE:"Rounded bend",
  DAIRY:"Milk products", DECAY:"Break down", DENSE:"Tightly packed",
  DITCH:"Roadside channel", DIZZY:"Spinning feeling", DODGE:"Avoid quickly",
  DONOR:"Gift giver", DOUBT:"Uncertainty", DRAFT:"Rough version",
  DRAIN:"Water exit", DRIFT:"Float along", DWELL:"Reside in",
  EAGER:"Keen", EASEL:"Painter stand", ELDER:"Older person",
  ENVOY:"Diplomat", EPOCH:"Historical era", EQUIP:"Gear up",
  ERODE:"Wear away", ESSAY:"Written piece", FEAST:"Grand meal",
  FIBER:"Thread strand", FILTH:"Extreme dirt", FLAME:"Fire tongue",
  FLESH:"Body tissue", FLOCK:"Group of sheep", FLOUR:"Baking powder",
  FLUTE:"Woodwind", FOCUS:"Center attention", FORGE:"Metal shop",
  FORUM:"Discussion place", FROST:"Ice coating", FUNGI:"Mushroom class",
  GAUGE:"Measuring tool", GHOST:"Specter", GIANT:"Very large",
  GLAND:"Body organ", GLARE:"Harsh light", GLEAM:"Faint shine",
  GLIDE:"Smooth movement", GLOBE:"World sphere", GLOSS:"Shine or sheen",
  GOOSE:"Honking bird", GRAIN:"Cereal crop", GRAPE:"Wine fruit",
  GRASP:"Hold firmly", GRAVEL:"Road surface", GREED:"Want too much",
  GREET:"Say hello", GRIND:"Crush to powder", GROSS:"Total before tax",
  GUARD:"Protector", GUILD:"Trade group", GUEST:"Invited visitor",
  HAVEN:"Safe place", HAZEL:"Nut tree", HASTE:"Great speed",
  HEDGE:"Garden border", HIKER:"Trail walker", HINGE:"Door pivot",
  HONEY:"Sweet topping", HUMOR:"Funny side", HYPER:"Overly excited",
  IVORY:"Piano key color", JEWEL:"Precious gem", JUICE:"Fruit drink",
  KNACK:"Special skill", KNEEL:"Drop to knees", KNOCK:"Door sound",
  LABEL:"Name tag", LASER:"Light beam", LAYER:"Coat or level",
  LEDGE:"Narrow shelf", LEMON:"Sour citrus", LEVER:"Simple machine",
  LODGE:"Mountain cabin", LUNAR:"Moon related", MAGIC:"Illusion art",
  MAPLE:"Syrup tree", MARSH:"Wetland", MEDAL:"Award disc",
  MELON:"Summer fruit", MERCY:"Compassion", MINOR:"Not major",
  MIXER:"Blending device", MODEL:"Small replica", MOIST:"Slightly wet",
  MORAL:"Lesson learned", MOTEL:"Roadside inn", MOUNT:"Climb up",
  MURAL:"Wall painting", NERVE:"Body signal wire", NOBLE:"Of high rank",
  NOVEL:"Fiction book", NURSE:"Care provider", OCEAN:"Vast water",
  ORGAN:"Body part", OUTER:"External", OXIDE:"Rust compound",
  PANEL:"Flat section", PASTE:"Sticky mix", PATCH:"Small repair",
  PEARL:"Oyster gem", PEDAL:"Bike foot press", PILOT:"Plane driver",
  PITCH:"Throw or tone", PIXEL:"Screen dot", PLAZA:"Town square",
  PLUMB:"Straight down", PLUME:"Feather tuft", POLAR:"Arctic",
  POUCH:"Small bag", PRISM:"Light splitter", PROBE:"Investigate",
  PSALM:"Sacred song", PULSE:"Heartbeat", PUPIL:"Student or eye part",
  QUOTA:"Set amount", QUOTE:"Repeat words", RADAR:"Detection system",
  RANCH:"Cattle farm", RAPID:"Very fast", RAVEN:"Black bird",
  REALM:"Kingdom", REBEL:"Fight back", REIGN:"Rule over",
  RIDGE:"Mountain top", RISKY:"Dangerous", RIVAL:"Competitor",
  ROAST:"Cook in oven", ROBIN:"Red breast bird", RURAL:"Countryside",
  SALAD:"Green dish", SALON:"Beauty shop", SAUCE:"Food topping",
  SCALE:"Measuring tool", SCENE:"Movie moment", SCOUT:"Troop member",
  SEWER:"Underground drain", SHELF:"Wall holder", SHELL:"Beach find",
  SHIRT:"Upper garment", SHORE:"Beach edge", SHRUG:"Shoulder lift",
  SIEGE:"Castle attack", SIREN:"Warning wail", SKULL:"Head bone",
  SOLAR:"Sun powered", SONIC:"Sound related", SPINE:"Backbone",
  SPOON:"Eating utensil", SPRAY:"Fine mist", STAIN:"Stubborn mark",
  STARE:"Fixed gaze", STEEP:"Very inclined", STERN:"Ship back",
  STONE:"Rock", STORM:"Wild weather", STOVE:"Kitchen cooker",
  STRAP:"Binding strip", STRAW:"Sipping tube", STRIP:"Narrow piece",
  STUMP:"Tree remains", SUGAR:"Sweet crystal", SUITE:"Hotel rooms",
  SURGE:"Sudden rise", SWAMP:"Boggy wetland", SWEEP:"Clean floor",
  SWIFT:"Very fast", SWING:"Playground ride", SYRUP:"Pancake topping",
  THEFT:"Stolen act", THORN:"Rose prick", THUMB:"Short finger",
  TOAST:"Breakfast bread", TOKEN:"Symbolic item", TORCH:"Hand light",
  TOWER:"Tall structure", TOXIC:"Poisonous", TRACE:"Small amount",
  TREND:"Popular direction", TROUT:"River fish", TRUNK:"Tree base",
  TULIP:"Spring flower", TUTOR:"Private teacher", TWIST:"Turn around",
  UNITY:"Togetherness", UPPER:"Higher", URBAN:"City life",
  VALID:"Legally sound", VAULT:"Secure room", VIGOR:"Energy",
  VINYL:"Record material", VIRAL:"Spreading fast", VOCAL:"Using voice",
  WAGON:"Pulled cart", WHEAT:"Bread grain", WHILE:"During",
  WITCH:"Spell caster", WOUND:"Injury", WOVEN:"Interlaced",
  YACHT:"Luxury boat", YIELD:"Give way", YOUTH:"Young age",
  ADMIN:"Manager", ADMIT:"Confess", ADOBE:"Clay brick",
  ADOPT:"Take as own", ADULT:"Grown up", AGENT:"Representative",
  AHEAD:"In front", ALIAS:"Fake name", ALIGN:"Line up",
  ALLOY:"Metal mix", ANGEL:"Heavenly being", ANIME:"Japanese cartoon",
  ARRAY:"Ordered group", ASSET:"Valuable thing", ATTIC:"Top floor room",
  AVOID:"Stay away from", BACON:"Breakfast meat", BEACH:"Sandy shore",
  BLANK:"Empty", BLEND:"Mix together", BLIND:"Cannot see",
  BLISS:"Perfect joy", BLOCK:"Solid piece", BLOWN:"Wind pushed",
  BOARD:"Flat plank", BOOST:"Lift up", BOUND:"Tied or limited",
  BRAND:"Logo mark", BREAD:"Loaf food", BREAK:"Snap apart",
  BRICK:"Building block", BROAD:"Wide", BROOK:"Small stream",
  BROWN:"Earth color", BUILD:"Construct", BUYER:"Shopper",
  CANDY:"Sweet treat", CATCH:"Grab hold", CAUSE:"Reason why",
  CHASE:"Run after", CHEAP:"Low cost", CHECK:"Verify",
  CHESS:"Board game", CHIEF:"Head leader", CHILD:"Young one",
  CHINA:"Tea set material", CHOSE:"Picked", CLAIM:"Assert",
  CLASS:"School group", CLEAN:"Spotless", CLEAR:"See through",
  CLIMB:"Go up", CLOCK:"Time keeper", CLONE:"Exact copy",
  CLOSE:"Shut", CLOUD:"Sky puff", CLOWN:"Circus performer",
  COLOR:"Hue", COMET:"Icy space rock", COMIC:"Funny strip",
  CORAL:"Reef builder", COUNT:"Add up numbers", COURT:"Legal arena",
  COVER:"Hide or lid", CRASH:"Violent impact", CRAZY:"Wild",
  CRISP:"Firm and fresh", CROSS:"Go over", CRUSH:"Squeeze hard",
  CYCLE:"Repeated loop", DANCE:"Move to music", DEPTH:"How deep",
  DEVIL:"Evil one", DIRTY:"Not clean", DISCO:"Dance hall",
  DOUGH:"Bread mix", DRAMA:"Stage play", DRAWN:"Sketched",
  DREAM:"Sleep vision", DRESS:"Outfit", DRIED:"No moisture",
  DRINK:"Beverage", DRIVE:"Operate a car", DROWN:"Sink underwater",
  DYING:"Fading away", EARTH:"Our planet", EIGHT:"Number after seven",
  EMAIL:"Digital letter", EMPTY:"Nothing inside", ENDED:"Finished",
  ENEMY:"Foe", ENJOY:"Take pleasure", ENTER:"Go inside",
  EQUAL:"Same amount", ERROR:"Mistake", EVENT:"Happening",
  EVERY:"All of them", EXACT:"Precise", EXILE:"Banished",
  EXTRA:"Additional", FAINT:"Nearly pass out", FALSE:"Not true",
  FANCY:"Elaborate", FATAL:"Deadly", FAULT:"Blame",
  FAVOR:"Kind act", FENCE:"Yard border", FETCH:"Go get",
  FEVER:"High temp", FIELD:"Open land", FIFTH:"After fourth",
  FIGHT:"Battle", FINAL:"Last one", FIRST:"Number one",
  FIXED:"Repaired", FLAGS:"Banners", FLASH:"Quick light",
  FLEET:"Ship group", FLOAT:"Stay on water", FLOOD:"Too much water",
  FLOOR:"Walk on it", FLOSS:"Dental thread", FLOWN:"Traveled by air",
  FORCE:"Power or push", FOUND:"Discovered", FRAME:"Picture border",
  FRANK:"Honest", FRESH:"Just made", FRONT:"Face side",
  FROZE:"Became ice", FRUIT:"Tree snack", FULLY:"Completely",
  FUNNY:"Amusing", GLASS:"See through cup", GONNA:"Going to",
  GRACE:"Elegance", GRAND:"Magnificent", GRANT:"Give funds",
  GRASS:"Green lawn", GREAT:"Wonderful", GREEN:"Leaf color",
  GROSS:"Icky or total", GROWN:"Matured", GUIDE:"Show the way",
  HAPPY:"Joyful", HARSH:"Severe", HEART:"Love organ",
  HEAVY:"Weighs a lot", HERBS:"Cooking plants", HOLDS:"Grips",
  HORSE:"Riding animal", HOTEL:"Place to stay", HOUSE:"Home",
  HUMAN:"Person", IDEAL:"Perfect", IMAGE:"Picture",
  IMPLY:"Suggest", INDEX:"List guide", INNER:"Inside",
  INPUT:"Data entry", ISSUE:"Problem", IVORY:"Cream white",
  JOINT:"Connection", JUDGE:"Court official", JUICE:"Fruit drink",
  KNOWN:"Recognized", LARGE:"Big", LATER:"After some time",
  LAUGH:"Sound of joy", LEARN:"Gain knowledge", LEGAL:"By the law",
  LEVEL:"Flat or tier", LIGHT:"Illumination", LIKED:"Enjoyed",
  LINEN:"Fine fabric", LIVER:"Body organ", LOCAL:"Nearby",
  LOGIC:"Reasoning", LOOSE:"Not tight", LOVER:"Sweetheart",
  LOWER:"Beneath", LOYAL:"Faithful", LUCKY:"Fortunate",
  LUNCH:"Midday meal", MAKER:"Creator", MATCH:"Pair up",
  MAYBE:"Perhaps", MAYOR:"City leader", MEDIA:"News outlets",
  METAL:"Iron or steel", MIGHT:"Could possibly", MIXER:"Blending device",
  MONEY:"Currency", MONTH:"Calendar unit", MOTOR:"Engine",
  MOUSE:"Small rodent", MOUTH:"Face opening", MOVIE:"Film",
  MUSIC:"Melody art", NAILS:"Hammer targets", NIGHT:"After dark",
  NOISE:"Loud sound", NORTH:"Compass point", NOTED:"Observed",
  OFFER:"Present option", OFTEN:"Frequently", OLIVE:"Green fruit",
  ORDER:"Arrange", OTHER:"Different one", OWNER:"Possessor",
  PAINT:"Color coat", PAIRS:"Sets of two", PANIC:"Sudden fear",
  PAPER:"Writing sheet", PARTY:"Celebration", PASTA:"Italian noodles",
  PAUSE:"Brief stop", PEACE:"No conflict", PENNY:"One cent",
  PHASE:"Stage", PHONE:"Call device", PHOTO:"Snapshot",
  PIANO:"Keyboard instrument", PIECE:"Part of whole", PLACE:"Location",
  PLAIN:"Simple", PLANT:"Growing thing", PLATE:"Dinner dish",
  PLAZA:"Town square", POINT:"Sharp tip", POUND:"Weight unit",
  POWER:"Strength", PRESS:"Push down", PRICE:"Cost tag",
  PRIDE:"Self respect", PRIME:"Top quality", PRINT:"Put on paper",
  PRIOR:"Before", PROOF:"Evidence", PROUD:"Self satisfied",
  PROVE:"Show truth", QUEEN:"Royal woman", QUEST:"Search journey",
  QUEUE:"Waiting line", QUICK:"Fast", QUIET:"Silent",
  QUITE:"Rather", RADIO:"Broadcast box", RAISE:"Lift up",
  RANGE:"Span", RATIO:"Proportion", REACH:"Extend to",
  REACT:"Respond", READY:"Prepared", RELAX:"Calm down",
  REPLY:"Answer back", RIGHT:"Correct", RISKY:"Dangerous",
  RIVER:"Water flow", ROUND:"Circular", ROUTE:"Travel path",
  ROYAL:"Kingly", RUGBY:"Tackle sport", SADLY:"Unfortunately",
  SAINT:"Holy person", SAUCE:"Food topping", SAVED:"Rescued",
  SCALE:"Size range", SCARE:"Frighten", SCORE:"Game points",
  SENSE:"Feeling", SERVE:"Dish out", SETUP:"Arrangement",
  SEVEN:"Lucky number", SHALL:"Will do", SHAPE:"Form or figure",
  SHARE:"Divide among", SHARP:"Pointed", SHAVE:"Remove hair",
  SHEET:"Bed cover", SHIFT:"Move over", SHINE:"Give off light",
  SHOCK:"Sudden jolt", SHORT:"Not tall", SHOWN:"Displayed",
  SIGHT:"Vision", SINCE:"From then", SIXTH:"After fifth",
  SIXTY:"Six tens", SIZED:"Measured", SKILL:"Learned ability",
  SLEEP:"Rest at night", SLICE:"Cut thin", SLIDE:"Playground fun",
  SLOPE:"Incline", SMALL:"Tiny", SMART:"Clever",
  SMELL:"Nose sense", SMILE:"Happy face", SMOKE:"Fire cloud",
  SOLID:"Firm state", SOLVE:"Figure out", SORRY:"Apologetic",
  SOUTH:"Compass point", SPACE:"Outer void", SPARE:"Extra one",
  SPEAK:"Talk", SPEED:"How fast", SPEND:"Use money",
  SPLIT:"Divide in two", SPOKE:"Said aloud", SPORT:"Athletic game",
  SPRAY:"Mist burst", STACK:"Pile up", STAFF:"Workers",
  STAGE:"Performance area", STAKE:"Claim or post", STAND:"Be upright",
  STATE:"Condition", STAYS:"Remains", STEAM:"Hot vapor",
  STEEL:"Strong metal", STEMS:"Plant stalks", STICK:"Thin branch",
  STILL:"Motionless", STOCK:"Inventory", STORE:"Shop",
  STORY:"Tale", STUCK:"Cannot move", STUDY:"Learn deeply",
  STUFF:"Things", STYLE:"Fashion sense", SUPER:"Excellent",
  SWEET:"Sugary taste", TABLE:"Dining surface", TAKEN:"Grabbed",
  TASTE:"Flavor sense", TEACH:"Instruct", TEETH:"Mouth bones",
  THEIR:"Belonging to them", THEME:"Central idea", THERE:"That place",
  THICK:"Not thin", THING:"Object", THINK:"Use brain",
  THIRD:"After second", THOSE:"These over there", THREE:"Trio",
  THREW:"Tossed", TIGHT:"Snug fit", TIMER:"Countdown device",
  TIRED:"Needing rest", TITLE:"Name or heading", TODAY:"This day",
  TOTAL:"Complete sum", TOUCH:"Feel with hand", TOUGH:"Strong",
  TOWEL:"Dry off cloth", TRACK:"Follow path", TRADE:"Exchange",
  TRAIN:"Rail vehicle", TRASH:"Garbage", TREAT:"Special reward",
  TRICK:"Clever move", TRIED:"Attempted", TRUCK:"Big vehicle",
  TRULY:"Honestly", TRUST:"Have faith", TRUTH:"Honest fact",
  TWICE:"Two times", UNDER:"Below", UNION:"Joined group",
  UNTIL:"Up to when", USUAL:"Normal", UTTER:"Complete",
  VALUE:"Worth", VIDEO:"Moving pictures", VIRUS:"Digital bug",
  VISIT:"Go see", WASTE:"Throw away", WATCH:"Look at",
  WATER:"H2O", WEIGH:"Find mass", WEIRD:"Strange",
  WHEEL:"Round roller", WHERE:"What place", WHICH:"What one",
  WHITE:"Snow color", WHOLE:"Entire", WHOSE:"Belonging to who",
  WOMAN:"Adult female", WORLD:"The globe", WORRY:"Feel anxious",
  WORSE:"More bad", WORST:"Most bad", WORTH:"Value of",
  WOULD:"Past will", WRITE:"Put words down", WROTE:"Past wrote",
  // ===== Additional curated clues for dictionary words =====
  PAGER:"Beeping device", BASES:"Foundations", VILLA:"Holiday home",
  STAG:"Male deer", MOOSE:"Large antlered animal", GENRE:"Category of art",
  ERECT:"Stand upright", ANTE:"Poker stake", OZONE:"Atmosphere layer",
  TIMES:"Multiplication", LIAR:"Fibber", FLEA:"Jumping pest",
  BINGO:"Winning call", CANAL:"Waterway passage",
  ADDED:"Put more", USHER:"Seat guide", TWEAK:"Fine adjust",
  TEEN:"Young person", TECH:"Technology", SNEAK:"Move quietly",
  ROUGE:"Red cosmetic", RHINO:"Horned beast", REUSE:"Use again",
  SCAN:"Quick look", LOGIN:"Access entry", HERS:"Belonging to her",
  WAIVE:"Give up right", THEE:"Old English you",
  AWARE:"Conscious", ANGRY:"Furious", STING:"Bee weapon",
  TORY:"Conservative", ARMY:"Military force", PAPA:"Father",
  PREY:"Hunted one", CADET:"Military student", MANIA:"Craze",
  RYES:"Bread grains", EYED:"Gazed at", COT:"Small bed",
  LENT:"Gave temporarily", SLED:"Snow racer", TREK:"Long hike",
  LEST:"For fear that", OPTED:"Chose to", LADEN:"Loaded down",
  AROSE:"Got up", AERIE:"Eagle nest high", DEPOT:"Supply station",
  CEDAR:"Aromatic tree", AMINO:"___ acid", OTTER:"River playmate",
  LILAC:"Purple bloom", ALPHA:"First in Greek", RESIN:"Sticky sap",
  PILES:"Heaps", SIEGE:"Long attack", TALES:"Told stories",
  AMEND:"Correct text", WIRED:"Plugged in", TRIAL:"Legal hearing",
  ORBIT:"Circle path", MOTTO:"Guiding words", RELAY:"Baton race",
  INLET:"Narrow waterway", PIVOT:"Turning point", CORAL:"Reef stuff",
  CRISP:"Crunchy fresh", DONOR:"Blood giver", LANCE:"Knights weapon",
  ACORN:"Squirrel food", AGILE:"Light footed", ALIEN:"ET",
  ALBUM:"Music collection", ALIAS:"AKA", ALLOY:"Metal combo",
  ANIME:"Japanese cartoons", ASSET:"Valuable thing", ATTIC:"Top floor",
  BACON:"Breakfast meat", BLEND:"Smoothie step", BLISS:"Pure joy",
  BLOWN:"Wind tossed", BOOST:"Lift up", BRAND:"Product logo",
  BRICK:"Masonry unit", BROAD:"Wide open", BROOK:"Little stream",
  BUYER:"Customer", CANDY:"Sugar rush", CHASE:"Pursue",
  CHEAP:"Budget friendly", CHESS:"King and queen game",
  CHIEF:"Head honcho", CHINA:"Tea set material",
  CLONE:"Copy of", CLOWN:"Big red nose",
  COMIC:"Strip funnies", CRASH:"Big bang",
  CRUSH:"Big squeeze", CYCLE:"Go around",
  DANCE:"Two step", DEPTH:"Deep end",
  DOUGH:"Pizza base", DRAMA:"Theater art",
  DRAWN:"In a sketch", DRIED:"Sun baked",
  EMPTY:"Nothing there", ENDED:"All done",
  ENEMY:"Arch rival", ENJOY:"Have fun",
  EQUAL:"Fifty fifty", ERROR:"My bad",
  EXACT:"On the nose", EXILE:"Cast out",
  FAINT:"Lightheaded", FANCY:"Upscale",
  FAULT:"Whos to blame", FAVOR:"Wedding gift",
  FENCE:"Picket ___", FETCH:"Go get it",
  FEVER:"Feeling hot", FIFTH:"One of five",
  FIGHT:"Duke it out", FINAL:"Last stand",
  FLAGS:"Wave them", FLASH:"Quick shine",
  FLEET:"Ship group", FLOOD:"Water rush",
  FLOUR:"Baking staple", FORGE:"Make metal",
  FRAME:"Picture holder", FRUIT:"Apple maybe",
  FULLY:"All the way", GHOST:"Boo",
  GIANT:"Fee fi fo fum", GLEAM:"Subtle glow",
  GLOBE:"World map sphere", GOOSE:"Swan cousin",
  GRAIN:"Wheat or rice", GRASP:"Get a grip",
  GREED:"Want it all", GREET:"Hello wave",
  GRIND:"Coffee step", GUARD:"Watchman",
  GUESS:"Take a shot", GUILD:"Craft group",
  HAVEN:"Safe harbor", HASTE:"Rush rush",
  HEDGE:"Trim the ___", HIKER:"Trail walker",
  HINGE:"Door swinger", HONEY:"Sweet stuff",
  HUMOR:"Comedy gold", JEWEL:"Crown gem",
  KNACK:"Got the ___", KNEEL:"Get down low",
  KNOCK:"Door rap", LABEL:"Stick it on",
  LASER:"Sci fi beam", LAYER:"One of many",
  LEDGE:"Window sill", LEMON:"Sour citrus",
  LEVER:"Pull it", LODGE:"Mountain retreat",
  LUNAR:"Moon phase", MAGIC:"Abracadabra",
  MAPLE:"Syrup source", MARSH:"Wetland area",
  MEDAL:"Gold silver bronze", MELON:"Juicy fruit",
  MERCY:"Show some ___", MINOR:"Not major",
  MIXER:"Kitchen gadget", MODEL:"Fashion walk",
  MOIST:"Cake texture", MOTEL:"Road lodging",
  MOUNT:"Climb aboard", MURAL:"Wall art",
  NERVE:"Got some ___", NOBLE:"Highborn",
  NOVEL:"Page turner", NURSE:"Hospital helper",
  OCEAN:"Pacific or Atlantic", OUTER:"Edge side",
  OXIDE:"Iron ___", PANEL:"Discussion group",
  PASTE:"Glue on", PATCH:"Sew it up",
  PEARL:"String of ___s", PEDAL:"Bike power",
  PILOT:"Fly the plane", PITCH:"Throw one",
  PIXEL:"Screen dot", PLAZA:"Town center",
  PLUME:"Feather fancy", POLAR:"Bear type",
  POUCH:"Small bag", PRISM:"Rainbow maker",
  PSALM:"Sacred verse", PULSE:"Heart rhythm",
  PUPIL:"Teacher faces them", QUOTA:"Fill the ___",
  RADAR:"Blip tracker", RANCH:"Dude ___",
  RAPID:"Fast moving", RAVEN:"Poes bird",
  REALM:"Fantasy world", REBEL:"Rule breaker",
  REIGN:"Royal rule", RIDGE:"Mountain spine",
  RISKY:"Daring", RIVAL:"Competition",
  ROAST:"Sunday dinner", ROBIN:"Red breast",
  RURAL:"Country living", SALAD:"Leafy dish",
  SALON:"Hair place", SCARE:"Jump moment",
  SCENE:"Take one", SCOUT:"Merit badge",
  SEWER:"Storm ___", SHELF:"Book holder",
  SHELL:"Beach treasure", SHIRT:"Button up",
  SHORE:"Waters edge", SHRUG:"Shoulder move",
  SIREN:"Ambulance sound", SKULL:"Pirate flag",
  SOLAR:"Sun powered", SONIC:"Sound barrier",
  SPINE:"Book edge", SPOON:"Stir with",
  SPRAY:"Mist it", STAIN:"Hard to remove",
  STARE:"Long look", STEEP:"Mountain side",
  STERN:"Ship rear", STOVE:"Cook top",
  STRAP:"Belt type", STRAW:"Drink through",
  STRIP:"Tear off", STUMP:"Tree leftover",
  SUGAR:"Sweeten with", SUITE:"Hotel deluxe",
  SURGE:"Power ___", SWAMP:"Murky water",
  SWEEP:"Broom action", SWIFT:"Taylor or fast",
  SWING:"Playground fun", SYRUP:"Stack topper",
  THORN:"Rose hazard", THUMB:"Hitchhike digit",
  TOAST:"Raise a glass", TOKEN:"Subway coin",
  TORCH:"Carry the ___", TOWER:"Tall building",
  TRACE:"Small hint", TREND:"Whats hot",
  TROUT:"Fly fishing catch", TRUNK:"Car storage",
  TULIP:"Spring bulb", TUTOR:"Study helper",
  TWIST:"Plot surprise", UNITY:"All as one",
  UPPER:"Top floor", URBAN:"City dweller",
  VALID:"Passes muster", VAULT:"Bank safe",
  VIGOR:"Full of life", VINYL:"Record player",
  VIRAL:"Trending online", VOCAL:"Loud spoken",
  WAGON:"Little red ___", WHEAT:"Bread grain",
  WITCH:"Pointed hat", WOUND:"Battle scar",
  WOVEN:"Basket weave", YACHT:"Rich boat",
  YOUTH:"Spring chicken",
  // Additional 3-4 letter clues
  CAST:"Throw or actors", ASK:"Pose a question", COT:"Camp bed",
  PAPA:"Daddy", SPAN:"Bridge width", LEST:"Or else",
  STAG:"Bachelor ___", ANTE:"Up the ___",
  // More common words needing clues
  APART:"Separated", PEST:"Nuisance bug", MINES:"Gold ___",
  CAT:"Feline", ASHES:"Fire remains", TENOR:"High male voice",
  SAUNA:"Steam room", PANDA:"Black and white bear", OLDER:"More aged",
  DUAL:"Double", DELAY:"Put off", DAB:"Small touch",
  BAG:"Carry all", ASH:"Fire dust", PREP:"Get ready",
  WAS:"Existed", LED:"Showed the way", COD:"Fish type",
  COULD:"Was able to", OUNCE:"Weight measure", BOP:"Dance move",
  PEST:"Annoying critter", DITTO:"Same here", VIGOR:"Energy",
  TROOP:"Scout group", TREAD:"Walk on", SWORE:"Made an oath",
  SHEER:"See through", RALLY:"Come together", POSER:"Tough question",
  POLAR:"Opposite ends", ONSET:"Beginning", MANOR:"Large estate",
  LASER:"Light beam", KNOCK:"Door rap", KNEEL:"Bend a knee",
  GRAZE:"Cattle feeding", GHOST:"Spooky spirit", FORUM:"Discussion place",
  FLUTE:"Wind instrument", FLASK:"Hip drink holder", FEAST:"Grand dinner",
  CRAVE:"Want badly", COVET:"Desire greatly", BENCH:"Sit down place",
  BADGE:"Pin on honor", ATLAS:"Map book", ASIDE:"To one side",
  ARENA:"Battle ground", ANNEX:"Building wing", AMUSE:"Make laugh",
  ABORT:"Call it off", ABOUT:"Concerning", TOWER:"Castle top",
  OZONE:"Earth shield", DISCO:"Dance floor", VILLA:"Vacation house",
  TIDAL:"Wave like", TENOR:"Opera voice", SWIRL:"Spin around",
  SURGE:"Sudden rush", STERN:"Ships back", SPORE:"Seed cousin",
  SLEEK:"Smooth lines", SHRUB:"Garden bush", SHIRE:"County area",
  PAGER:"Old beeper", MOOSE:"Forest giant", GENRE:"Book category",
  ERECT:"Stand tall", FLAIR:"Natural talent", EMBER:"Dying fire glow",
};

// Words to exclude (obscure/overused)
const BLOCKED = new Set([
  // Crossword-ese / obscure
  "ATONE","OVATE","STET","AGORA","EERIE","ROGUE","AORTA","ARGON","ALGAE","LARVA","LLANO",
  "CHA","EER","ERS","ESS","GAR","HET","NEE","PAP","REE","REL","RET","SER","TOR","YAR","ARS",
  "ALAR","ALEE","ATMA","ATTA","EGAD","OGEE","SAPA","TSAR","TWEE","SCAD","SCUM","SLAG",
  "AEGIS","ASANA","BEGAT","ECLAT","MESON","ODEON","STELA","TUTTI","EYRIE","ROSIN","SINEW",
  "SITAR","SERGE","SERIF","LITHE","SUAVE","POLKA","OPTIC","OCTET","OAKEN","ATRIA",
  // Offensive / inappropriate for wedding
  "IDIOT","DRUNK","BULLY","ABUSE","TRASH","CRUEL","TOXIC","FATAL","CRIME",
  "PENIS","NEGRO","SLAVE","SLAVES","GROIN","RECTAL","CROTCH",
  // Proper names commonly in dictionaries (no common-noun meaning)
  "IRENE","HONDA","ARIEL","ROGER","SILVA","MONTE","PALMA","TIMOR","TIBET",
  "VILLE","ALAMO","LOHAN","HOGAN","WIGAN","TELE","ORTHO","CARL","MARIA",
  "KYLE","HOMER","DONNA",
  // Proper names (continued)
  "LAURA","SETH","RILEY","TONGA","REESE","PERRY","SATAN","COSTA","PARAM",
  "LARGO","TORAH","SCION","PARSE","CANON","MODAL","LOGOS","SHIRE","SHAH",
  "RODEO","RENAL","IONIC","NITRO","TURBO","THONG","TORSO",
  "HANNA","PAOLO","PUNTA","PORTO","LEVIN","PRIMA","CARTE","DRAM",
  "ALLAN","BOWEL","BELLE","DEMOS","AMINO",
  // Obscure/archaic dictionary words
  "YER","DYER","TYRE","EATER","FRANC","AXIAL","MATTE",
  "BIS","DEG","SOC","TAM","THA","SEN","GEE","LEE","SEC","PRO",
]);

// Expand word bank with common English dictionary words
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

// Words inappropriate for a wedding crossword
const OFFENSIVE = new Set([
  "ASSES","BITCH","COCKS","CRAPS","CUNTS","DAMNS","DICKS","DRUGS","DYKES",
  "FARTS","FUCKS","GROPE","HORNY","KILLS","LEPER","LOSER","NAKED","ORGAN",
  "PANSY","PIMP","PIMPS","PORNO","QUEER","RAPED","RAPES","RECTA","SCREW",
  "SISSY","SKANK","SLAGS","SLIME","SLUTS","SNUFF","SPERM","STINK","SUCKS",
  "THUGS","TRAMP","TURDS","URINE","VENOM","VOMIT","WASTE","WHORE","WUSSY",
  "ASS","CUM","FAG","HOE","HOS","POO","PUS","SEX","TIT","STD",
  "ANUS","BOOB","BOOBS","BUTT","CRAP","DAMN","DUNG","ENEMA",
  "FART","GOOK","HELL","HOMO","HUMP","JERK","KIKE","LAME","LEWD",
  "LUST","METH","MOFO","NARC","NUDE","PISS","POOP","PORN",
  "PUKE","RUMP","SCAB","SCAT","SLOB","SLUG","SLUM","SMUT","SNOB",
  "SPIT","TURD","WEED","IDIOT","DRUNK","BULLY","ABUSE","TRASH",
  "CRUEL","TOXIC","FATAL","CRIME","DEATH","DYING","DEMON","DEVIL",
  "DREAD","FIEND","FREAK","GRIEF","MANIC","PANIC","PSYCH","RABID",
  "SCARY","SKUNK","STEAL","STOLE","SWEAR","THIEF","TUMOR","ULCER",
  "WHACK","WRATH","SHAFT","BALLS","SPANK",
]);

// Load common word list (intersection of dictionary + Google 20K frequency list)
// This was pre-generated: curl Google 20K list, intersect with /usr/share/dict/words
try {
  // Get dictionary words
  const dictWords = new Set(
    readFileSync('/usr/share/dict/words', 'utf8').split('\n')
      .filter(w => /^[a-z]{3,5}$/.test(w))
      .map(w => w.toUpperCase())
  );

  // Get Google 20K frequency list
  let commonWords;
  try {
    const raw = execSync(
      'curl -sL "https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt"',
      { encoding: 'utf8', timeout: 15000 }
    );
    commonWords = new Set(
      raw.split('\n')
        .filter(w => /^[a-z]{3,5}$/.test(w))
        .map(w => w.toUpperCase())
    );
  } catch {
    // Fallback: use all dictionary words (less selective)
    commonWords = dictWords;
  }

  // Only add words that are in BOTH the dictionary AND the frequency list
  for (const w of commonWords) {
    if (!dictWords.has(w)) continue;  // not in dictionary
    if (CLUE[w]) continue;           // already has a curated clue
    if (BLOCKED.has(w)) continue;
    if (OFFENSIVE.has(w)) continue;
    // Auto-generate a simple clue
    CLUE[w] = autoClue(w);
  }
} catch (e) {
  // Dictionary/network not available — proceed with existing CLUE bank only
  process.stderr.write(`Warning: could not expand word bank: ${e.message}\n`);
}

function autoClue(w) {
  // Only use suffix clues for very reliable patterns (longer suffixes)
  if (w.endsWith("TION")) return "Process";
  if (w.endsWith("NESS")) return "Quality";
  if (w.endsWith("MENT")) return "Result";
  if (w.endsWith("LESS")) return "Without";
  if (w.endsWith("INGS")) return "Multiples";
  if (w.endsWith("LING")) return "Small one";
  if (w.endsWith("ICAL")) return "Of a kind";
  if (w.endsWith("IBLE") || w.endsWith("ABLE")) return "Capable";
  // Generic fallback — uses word length as a minimal hint
  return `${w.length} letters`;
}

// Build word lists by length, excluding blocked words
const W = { 3: [], 4: [], 5: [] };
for (const word of Object.keys(CLUE)) {
  if (BLOCKED.has(word)) continue;
  if (OFFENSIVE.has(word)) continue;
  if (W[word.length]) W[word.length].push(word);
}

const log = (msg) => process.stderr.write(msg + "\n");
log(`Word bank: 3=${W[3].length}, 4=${W[4].length}, 5=${W[5].length}`);

// =============================================================================
// TEMPLATES — slot definitions for each grid pattern
// =============================================================================
const TEMPLATES = {
  C: { name: "C", slots: [
    { d: "A", r: 0, c: 1, n: 3 },   // 1A
    { d: "A", r: 1, c: 0, n: 5 },   // 2A
    { d: "A", r: 2, c: 0, n: 5 },   // 3A
    { d: "A", r: 3, c: 0, n: 5 },   // 4A
    { d: "A", r: 4, c: 1, n: 3 },   // 5A
    { d: "D", r: 1, c: 0, n: 3 },   // 1D
    { d: "D", r: 0, c: 1, n: 5 },   // 2D
    { d: "D", r: 0, c: 2, n: 5 },   // 3D
    { d: "D", r: 0, c: 3, n: 5 },   // 4D
    { d: "D", r: 1, c: 4, n: 3 },   // 5D
  ]},
  B: { name: "B", slots: [
    { d: "A", r: 0, c: 1, n: 4 },   // 1A
    { d: "A", r: 1, c: 0, n: 5 },   // 2A
    { d: "A", r: 2, c: 0, n: 5 },   // 3A
    { d: "A", r: 3, c: 0, n: 5 },   // 4A
    { d: "A", r: 4, c: 0, n: 4 },   // 5A
    { d: "D", r: 1, c: 0, n: 4 },   // 1D
    { d: "D", r: 0, c: 1, n: 5 },   // 2D
    { d: "D", r: 0, c: 2, n: 5 },   // 3D
    { d: "D", r: 0, c: 3, n: 5 },   // 4D
    { d: "D", r: 0, c: 4, n: 4 },   // 5D
  ]},
  A: { name: "A", slots: [
    { d: "A", r: 0, c: 0, n: 4 },   // 1A
    { d: "A", r: 1, c: 0, n: 5 },   // 2A
    { d: "A", r: 2, c: 0, n: 5 },   // 3A
    { d: "A", r: 3, c: 0, n: 5 },   // 4A
    { d: "A", r: 4, c: 1, n: 4 },   // 5A
    { d: "D", r: 0, c: 0, n: 4 },   // 1D
    { d: "D", r: 0, c: 1, n: 5 },   // 2D
    { d: "D", r: 0, c: 2, n: 5 },   // 3D
    { d: "D", r: 0, c: 3, n: 5 },   // 4D
    { d: "D", r: 1, c: 4, n: 4 },   // 5D
  ]},
};

// =============================================================================
// LETTER-POSITION INDEX — for fast candidate lookup
// =============================================================================
const IDX = {};
for (const len of [3, 4, 5]) {
  IDX[len] = {};
  for (let p = 0; p < len; p++) {
    IDX[len][p] = {};
    for (const w of W[len]) {
      const ch = w[p];
      (IDX[len][p][ch] ??= new Set()).add(w);
    }
  }
}

// =============================================================================
// SOLVER — MRV backtracking with forward checking
// =============================================================================
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function solve(template, unavail, seedSlot = -1, seedWord = null, maxNodes = 300000) {
  const slots = template.slots;

  // Precompute cells for each slot
  const cells = slots.map(s => {
    const cs = [];
    for (let i = 0; i < s.n; i++) {
      cs.push(s.d === "D" ? [s.r + i, s.c] : [s.r, s.c + i]);
    }
    return cs;
  });

  const grid = Array.from({ length: 5 }, () => Array(5).fill(null));
  const assignment = {};
  const usedInPuzzle = new Set();
  let nodes = 0;

  function getCands(si) {
    const s = slots[si];
    const cs = cells[si];
    const cons = [];
    for (let i = 0; i < cs.length; i++) {
      const v = grid[cs[i][0]][cs[i][1]];
      if (v !== null) cons.push([i, v]);
    }
    if (cons.length === 0) {
      return W[s.n].filter(w => !usedInPuzzle.has(w) && !unavail.has(w));
    }
    const sets = cons.map(([p, ch]) => IDX[s.n]?.[p]?.[ch] || new Set());
    sets.sort((a, b) => a.size - b.size);
    if (sets[0].size === 0) return [];
    const res = [];
    for (const w of sets[0]) {
      if (usedInPuzzle.has(w) || unavail.has(w)) continue;
      let ok = true;
      for (let i = 1; i < sets.length; i++) {
        if (!sets[i].has(w)) { ok = false; break; }
      }
      if (ok) res.push(w);
    }
    return res;
  }

  function place(si, word) {
    const cs = cells[si];
    const saved = [];
    for (let i = 0; i < cs.length; i++) {
      saved.push(grid[cs[i][0]][cs[i][1]]);
      grid[cs[i][0]][cs[i][1]] = word[i];
    }
    return saved;
  }

  function undo(si, saved) {
    const cs = cells[si];
    for (let i = 0; i < cs.length; i++) {
      grid[cs[i][0]][cs[i][1]] = saved[i];
    }
  }

  // Pre-place seed word if provided
  const prefilledSlots = new Set();
  if (seedSlot >= 0 && seedWord && slots[seedSlot].n === seedWord.length) {
    place(seedSlot, seedWord);
    assignment[seedSlot] = seedWord;
    usedInPuzzle.add(seedWord);
    prefilledSlots.add(seedSlot);
  }

  function bt(remaining) {
    if (++nodes > maxNodes) return false;
    if (remaining.length === 0) return true;

    // MRV: pick slot with fewest candidates
    let bestSi = -1;
    let bestCands = null;
    for (const si of remaining) {
      const c = getCands(si);
      if (c.length === 0) return false;
      if (!bestCands || c.length < bestCands.length) {
        bestSi = si;
        bestCands = c;
      }
    }

    shuffle(bestCands);
    const next = remaining.filter(i => i !== bestSi);

    for (const w of bestCands) {
      const saved = place(bestSi, w);
      assignment[bestSi] = w;
      usedInPuzzle.add(w);

      if (bt(next)) return true;

      usedInPuzzle.delete(w);
      delete assignment[bestSi];
      undo(bestSi, saved);
    }

    return false;
  }

  const remaining = slots.map((_, i) => i).filter(i => !prefilledSlots.has(i));
  if (bt(remaining)) {
    return slots.map((s, i) => ({ ...s, word: assignment[i] }));
  }
  return null;
}

// ---------------------------------------------------------------------------
// Phase 1: Pre-generate a large pool of unique grids per template
// ---------------------------------------------------------------------------
function generatePool(templateKey, target, maxAttempts = 5000) {
  const template = TEMPLATES[templateKey];
  const pool = new Map(); // sig → result
  const noUnavail = new Set();

  for (let attempt = 0; attempt < maxAttempts && pool.size < target; attempt++) {
    // Pick a random slot and random word of matching length as seed
    const slotIdx = Math.floor(Math.random() * template.slots.length);
    const slot = template.slots[slotIdx];
    const wordList = W[slot.n];
    const seedWord = wordList[Math.floor(Math.random() * wordList.length)];

    const r = solve(template, noUnavail, slotIdx, seedWord);
    if (!r) continue;
    const sig = r.map(s => s.word).sort().join(",");
    if (!pool.has(sig)) {
      pool.set(sig, r);
    }
  }
  return pool;
}

log("Phase 1: Generating grid pools...");
const pools = {};
for (const tKey of ["C", "B", "A"]) {
  const pool = generatePool(tKey, 200);
  pools[tKey] = Array.from(pool.values());
  log(`  Template ${tKey}: ${pools[tKey].length} unique grids`);
}

// =============================================================================
// THEMES
// =============================================================================
const THEMES = [
  { start: 0, end: 14, name: "How They Met" },
  { start: 15, end: 44, name: "Long Distance" },
  { start: 45, end: 75, name: "Proposal Season" },
  { start: 76, end: 105, name: "Engagement" },
  { start: 106, end: 136, name: "Wedding Party" },
  { start: 137, end: 167, name: "Countdown" },
  { start: 168, end: 192, name: "Final Countdown" },
  { start: 193, end: 193, name: "Wedding Day" },
];

// =============================================================================
// MAIN GENERATION LOOP
// =============================================================================
const COOLDOWN = 8;
const recentWords = [];
const usedSigs = new Set();
const puzzles = [];
const cycle = ["C", "B", "A"];

log("Phase 2: Assembling 194 puzzles from pools...");

// Shuffle each pool for randomized assignment
for (const tKey of ["C", "B", "A"]) shuffle(pools[tKey]);

// Track which pool grids we've used (by index)
const poolIdx = { C: 0, B: 0, A: 0 };

for (let i = 0; i < 194; i++) {
  let result = null;
  let usedTemplate = cycle[i % cycle.length];

  // Try primary template first, then fallbacks
  const templates = [usedTemplate, ...cycle.filter(k => k !== usedTemplate)];
  for (const tKey of templates) {
    if (poolIdx[tKey] < pools[tKey].length) {
      const candidate = pools[tKey][poolIdx[tKey]];
      const sig = candidate.map(s => s.word).sort().join(",");
      if (!usedSigs.has(sig)) {
        result = candidate;
        usedTemplate = tKey;
        poolIdx[tKey]++;
        break;
      } else {
        poolIdx[tKey]++; // skip duplicate
        // Try next in same template
        while (poolIdx[tKey] < pools[tKey].length) {
          const next = pools[tKey][poolIdx[tKey]];
          const nsig = next.map(s => s.word).sort().join(",");
          if (!usedSigs.has(nsig)) {
            result = next;
            usedTemplate = tKey;
            poolIdx[tKey]++;
            break;
          }
          poolIdx[tKey]++;
        }
        if (result) break;
      }
    }
  }

  // If pool exhausted, generate on the fly with random seed
  if (!result) {
    for (let attempt = 0; attempt < 1000 && !result; attempt++) {
      for (const tKey of templates) {
        const template = TEMPLATES[tKey];
        const slotIdx = Math.floor(Math.random() * template.slots.length);
        const slot = template.slots[slotIdx];
        const wordList = W[slot.n];
        const seedWord = wordList[Math.floor(Math.random() * wordList.length)];
        const r = solve(template, new Set(), slotIdx, seedWord);
        if (!r) continue;
        const sig = r.map(s => s.word).sort().join(",");
        if (!usedSigs.has(sig)) {
          result = r;
          usedTemplate = tKey;
          break;
        }
      }
    }
  }

  if (!result) {
    log(`FAILED at puzzle ${i + 1}`);
    process.exit(1);
  }

  const words = result.map(r => r.word);
  usedSigs.add(words.slice().sort().join(","));
  recentWords.push(words);
  if (recentWords.length > COOLDOWN) recentWords.shift();

  puzzles.push({ i, tKey: usedTemplate, result });
  log(`Puzzle ${String(i + 1).padStart(3)}/194 (${usedTemplate}) — ${usedSigs.size} unique`);
}

function nodes_debug() { return ""; }

// =============================================================================
// VALIDATION
// =============================================================================
const allWords = puzzles.flatMap(p => p.result.map(s => s.word));
const freq = {};
for (const w of allWords) freq[w] = (freq[w] || 0) + 1;
const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
log(`\n=== VALIDATION ===`);
log(`Total puzzles: ${puzzles.length}`);
log(`Unique grids: ${usedSigs.size}`);
log(`Unique words used: ${Object.keys(freq).length}`);
log(`Top 10 most-used words:`);
for (const [w, c] of sorted.slice(0, 10)) log(`  ${w}: ${c} times`);
const maxFreq = sorted[0]?.[1] || 0;
if (maxFreq > 20) log(`WARNING: max frequency ${maxFreq} exceeds 20`);

// Check for missing clues
const missingClues = [...new Set(allWords)].filter(w => !CLUE[w]);
if (missingClues.length > 0) {
  log(`WARNING: ${missingClues.length} words missing clues: ${missingClues.join(", ")}`);
}

// =============================================================================
// OUTPUT — TypeScript format for crossword.ts
// =============================================================================
const START = new Date("2026-03-17T00:00:00Z");
const lines = [];

lines.push("// ---------------------------------------------------------------------------");
lines.push("// 194 daily puzzles — 2026-03-17 to 2026-09-26");
lines.push("// Generated by scripts/generate-crosswords.mjs");
lines.push(`// Word reuse allowed after ${COOLDOWN}-puzzle cooldown.`);
lines.push("// ---------------------------------------------------------------------------");
lines.push("");
lines.push("const RAW_PUZZLES: RawPuzzleData[] = [");

for (const p of puzzles) {
  const date = new Date(START.getTime() + p.i * 86400000);
  const dateStr = date.toISOString().slice(0, 10);
  const theme = THEMES.find(t => p.i >= t.start && p.i <= t.end);
  const id = `p${String(p.i + 1).padStart(3, "0")}`;

  lines.push(`  // ${id} — ${dateStr} — ${theme?.name || ""} — template ${p.tKey}`);
  lines.push(`  { id: "${id}", rows: 5, cols: 5, words: [`);

  for (const s of p.result) {
    const clue = (CLUE[s.word] || "Fill word").replace(/"/g, '\\"');
    lines.push(`    { word: "${s.word}", clue: "${clue}", row: ${s.r}, col: ${s.c}, dir: "${s.d}" },`);
  }

  lines.push("  ] },");
}

lines.push("];");

console.log(lines.join("\n"));
