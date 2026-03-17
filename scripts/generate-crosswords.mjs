#!/usr/bin/env node
/**
 * generate-crosswords.mjs
 * Generates 194 unique mini-crossword puzzles for ThePaineWedding site.
 * Run: node scripts/generate-crosswords.mjs > /tmp/puzzles-output.ts
 *
 * Grid: 5×5 (stored 5×7), 3 ACROSS + 3 DOWN, all 5-letter words.
 * Intersections:
 *   A1[0]=D1[0]  A1[2]=D2[0]  A1[4]=D3[0]
 *   A2[0]=D1[2]  A2[2]=D2[2]  A2[4]=D3[2]
 *   A3[0]=D1[4]  A3[2]=D2[4]  A3[4]=D3[4]
 */

const TIER1 = [
  "SONIC","ARBOR","HILLS","VINES","DAVIS","GRACE","AGGIE","TEXAS",
  "BRYNN","BLAKE","PAIGE","MEGAN","ROMAN","NOLAN",
];

const TIER2 = [
  "AISLE","ALTAR","BRIDE","GROOM","VOWED","RINGS","DANCE","TOAST",
  "DRESS","VENUE","GUEST","PHOTO","MUSIC","STAGE","HEART","UNITY",
  "FAITH","JESUS","KNEEL","SMILE","PARTY","HOUSE","HOTEL","STORY",
  "DRIVE","MILES","TEXTS","CALLS","VISIT","ROUTE","PLANS","READY",
  "SWEET","HONEY","CHARM","MAGIC","SPARK","LIGHT","DREAM","FIRST",
  "WORTH","WHOLE","NORTH","SOUTH","HAPPY","BLUSH","PEARL","OLIVE",
  "SATIN","TULLE","PIZZA","SAUCE","CRUST","SLICE","GLASS","COUCH",
  "FIELD","FARMS","TREES","HONOR","CLEAN","LUCKY","SUGAR","LINEN",
  "GRAIN","WHEAT","CREAM","EMBER","AMBER","IVORY","MARCH","THYME",
  "TRAIL","BLOOM","KNELT","RANCH","CHOIR","COAST","AMITY","THEME",
  "CEDAR","RHYME","ROAST","NOBLE","SERVE","SWING","AGAPE","FLAIR",
  "FEAST","GREAT","MATCH","COLOR","MERIT","MIGHT","VALOR","LOYAL",
  "CHEER","SHINE","SHARE","GUIDE","WALTZ","ZESTY","BAKER","DATES",
];

const TIER3 = [
  "BRAVE","BRING","BUILT","CARRY","CATCH","CAUSE","CHAIR","CHECK",
  "CHIEF","CHOSE","CLAIM","CLASS","CLEAR","CLIFF","CLOCK","CLOSE",
  "CLOUD","COMES","CORAL","COUNT","COVER","CRASH","CROSS","CROWD",
  "CURVE","DAILY","DEPTH","DOING","EARLY","EARTH","EIGHT","ELDER",
  "EVERY","EXACT","FAINT","FAVOR","FLAME","FLOOR","FOCUS","FOUND",
  "FRONT","GIANT","GIVEN","GLOBE","GLOOM","GLOSS","GRAND","GRANT",
  "GREEN","GREET","GRIND","GUARD","HARSH","HEAVY","IDEAL","IMAGE",
  "INDEX","INNER","JOINT","JUDGE","KNOWN","LARGE","LASER","LATER",
  "LAUGH","LAYER","LEARN","LEAVE","LEVEL","LIVED","LOCAL","MONEY",
  "MONTH","MORAL","MOVED","NAVAL","NEVER","NIGHT","NOVEL","OPENS",
  "ORDER","OTHER","OUTER","PEACE","PLAIN","PLANE","PLANT","POINT",
  "POWER","PRESS","PRIDE","PRIME","PRIOR","PROOF","PROUD","QUEEN",
  "QUICK","QUIET","RAISE","RANGE","REACH","RELAX","REPLY","RIDER",
  "RIGHT","RISEN","RIVER","ROUGH","ROUND","ROYAL","RURAL","SCENE",
  "SCORE","SEVEN","SHARP","SHORT","SIGHT","SINCE","SKILL","SLEEP",
  "SMALL","SOUND","SPEED","SPELL","SPEND","SPLIT","SPOKE","STAND",
  "STATE","STEAM","STEEL","STERN","STILL","STORE","STUDY","STYLE",
  "SUPER","SWIFT","TABLE","THICK","THING","THINK","THIRD","THOSE",
  "THREE","THROW","TOTAL","TOUCH","TOUGH","TRACE","TRACK","TRADE",
  "TRAIN","TREAT","TREND","TRUST","TRUTH","TWICE","UNDER","UNION",
  "UNTIL","UPPER","UPSET","VALID","VALUE","VOICE","VOTED","WATCH",
  "WATER","WEAVE","WHERE","WHITE","WIDER","WOMAN","WORLD","WORRY",
  "WRITE","WRONG","YIELD","YOUNG","YOURS","FLOWN","SCOPE","FORTE",
  "CRISP","CLING","SCOUT","PLUCK","STEEP","BRISK","TROVE","VERGE",
  "INSET","ONSET","FRANK","ADORE","ETHOS","VISTA","GUSTO","REIGN",
  "BLEND","DRIFT","FORGE","CRAFT","SHONE","SPIRE","TOWER","PERCH",
  "SWELL","BRACE","TRYST","EMOTE","TRICE","STRUM","GRAFT","GLOBE",
];

const WORD_BANK = [...new Set([...TIER1, ...TIER2, ...TIER3])].filter(w => w.length === 5);

// ---------------------------------------------------------------------------
// Clue bank
// ---------------------------------------------------------------------------
const CLUES = {
  SONIC:  ["First date stop","Drive-in chain, their date night shorthand","Where it all started — drive-in style"],
  ARBOR:  ["Where he got on one knee","Nature park, proposal setting","___ Hills — where she said yes"],
  HILLS:  ["Arbor ___, the proposal site","Second word of where she said yes","The nature preserve backdrop"],
  VINES:  ["Post-proposal dinner spot","60 ___ — the engagement dinner","Where the evening got even better"],
  DAVIS:  ["Half the venue name","Farm name starter","___ & Grey Farms"],
  GRACE:  ["What the timing needed","Gift from God, in five letters","Spiritual favor — and a prayer before dinner"],
  AGGIE:  ["School connection","A&M vibe word","Texas college answer"],
  TEXAS:  ["State of this whole operation","Where love is big","Lone Star state"],
  BRYNN:  ["Cousin bridesmaid","Five-letter bridesmaid","In the wedding party"],
  BLAKE:  ["Ashlyn's brother in the party","Groomsman with the bride's last name","Wedding party member"],
  PAIGE:  ["Maid of honor","Ashlyn's sister in the party","First one she called with the news"],
  MEGAN:  ["Proposal day co-conspirator","Friend who kept the secret","She knew — and didn't tell"],
  ROMAN:  ["Groomsman name","One of Jeff's guys","In the wedding party"],
  NOLAN:  ["Director of a favorite film","Inception auteur","Christopher ___"],
  AISLE:  ["Big walk, bigger moment","Wedding runway","Path to forever"],
  ALTAR:  ["End of the aisle","Where the vows happen","The destination of the walk"],
  BRIDE:  ["One in white","Bouquet holder","Ashlyn on September 26"],
  GROOM:  ["One adjusting his jacket","Jeff on wedding day","Suit at center stage"],
  VOWED:  ["Made promises, past tense","Said 'I do'","Pledged — and meant it"],
  RINGS:  ["Two circles, one commitment","The yes accessories","Exchanged September 26, 2026"],
  DANCE:  ["Reception floor mission","Reason to wear good shoes","What the first song was for"],
  TOAST:  ["Speech with a raised glass","Cheers plus a microphone","Raised at the reception"],
  DRESS:  ["What Ashlyn spent months perfecting","Bridal wardrobe piece","The one worth the wait"],
  VENUE:  ["Davis & Grey Farms, in one word","Wedding website must","Where it all happens"],
  GUEST:  ["RSVP page person","Anyone with a seat card","You, probably"],
  PHOTO:  ["Wedding gallery material","What the photographer captures","Memory, frozen"],
  MUSIC:  ["First dance ingredient","Reception soundtrack","The song she memorized first"],
  STAGE:  ["Where the band sets up","Where toasts happen","The spotlight spot"],
  HEART:  ["What they wear on their sleeves","Worn openly, always","The romantic answer"],
  UNITY:  ["Two becoming one","Marriage ceremony word","The candle, the vow, the point"],
  FAITH:  ["Relationship foundation","What guided the reunion","Center of their ceremony"],
  JESUS:  ["Center of it all","Name above every plan","Foundation of the whole thing"],
  KNEEL:  ["Proposal posture","What Jeff did before the yes","One knee, ring in hand"],
  SMILE:  ["Proposal photo requirement","What the yes produced","The reaction — immediate"],
  PARTY:  ["How the proposal night ended","Big post-yes celebration","The surprise back at his parents' house"],
  HOUSE:  ["Where the surprise party was","Post-proposal location","Jeff's parents' place"],
  HOTEL:  ["Travel page staple","Where out-of-towners land","Home base for the weekend"],
  STORY:  ["Yours is a very good one","Website page title","The whole beautiful thing"],
  DRIVE:  ["Long-distance specialty","Hours in the car, basically","4.5 hours to Houston — worth it"],
  MILES:  ["Long-distance tax","What 4.5 hours creates","Every one worth it"],
  TEXTS:  ["How the door reopened","Monthly check-in material","The first reconnection"],
  CALLS:  ["Long-distance lifeline","FaceTime from hundreds of miles","How they closed the gap"],
  VISIT:  ["Every-other-weekend mission","Long-distance payoff","The reward for the drive"],
  ROUTE:  ["What the drive requires","Long-distance GPS entry","The path back to each other"],
  PLANS:  ["The entire season of life right now","What the binder holds","Wedding prep, in one word"],
  READY:  ["Wedding planning goal by September","How they both feel","Prepared — finally"],
  SWEET:  ["Vibe word for the whole thing","Opposite of bitter","What the whole year tasted like"],
  HONEY:  ["Endearment answer","What September tastes like","Sweet — like the whole thing"],
  CHARM:  ["Jeff's secret weapon at the social","What he walked in with","What he had — immediately"],
  MAGIC:  ["The evening had it","Unexplainable good feeling","Davis & Grey Farms at sunset"],
  SPARK:  ["What ignited in Commerce, 2021","Starting point of everything","The ice cream social moment"],
  LIGHT:  ["What the ring caught","Golden hour quality","The last hour of the ceremony"],
  DREAM:  ["What the whole day felt like","Vision made real","Ashlyn's word for it"],
  FIRST:  ["What this whole journey was","How she'd describe him","The one who found her twice"],
  WORTH:  ["What every mile was","What waiting turned out to be","Every bit of it"],
  WHOLE:  ["What they make each other","Complete, in one word","Together — fully"],
  NORTH:  ["True ___, what they are to each other","Direction of the wedding","Their compass point"],
  SOUTH:  ["Texas compass word","Below the Mason-Dixon","Lone Star direction"],
  HAPPY:  ["State of everyone September 26","The default setting","The whole vibe"],
  BLUSH:  ["Soft pink in the florals","What she did at the proposal","Rosy cheek moment"],
  PEARL:  ["Classic bridal accent","Jewelry staple at the wedding","Something borrowed, maybe"],
  OLIVE:  ["Branch of peace","Elegant garnish on the big night","The tone of the reception linens"],
  SATIN:  ["Dress fabric choice","Smooth bridal material","What it felt like to finally be there"],
  TULLE:  ["Veil material","Skirt layer for the full look","Dreamy fabric of the day"],
  PIZZA:  ["Late-night reception snack","Pie at the party","Comfort food, wedding edition"],
  SAUCE:  ["Goes with the pizza","The marinara at cocktail hour","What makes it better"],
  CRUST:  ["The base of the late-night pizza","Crispy wedding snack","First thing you reach for"],
  SLICE:  ["A piece of the cake, the pizza, the day","What everyone wanted more of","Best unit of dessert"],
  GLASS:  ["Raised high during the toasts","Full of something celebratory","Clink, please"],
  COUCH:  ["Where the dress was laid out the night before","Home base for two","The debrief location"],
  FIELD:  ["Open land at Davis & Grey Farms","Texan and wide","Where the ceremony backdrop stretches"],
  FARMS:  ["Davis & Grey ___","Last word of the venue","The setting, simply"],
  TREES:  ["What Arbor Hills is full of","The canopy above the proposal","Nature's cathedral"],
  HONOR:  ["What guests did by showing up","What the vows declared","The highest compliment"],
  CLEAN:  ["The fresh start they gave each other","A new chapter, blank page","October 2024 reset"],
  LUCKY:  ["What they both are","How everyone in the room felt","The word for finding each other twice"],
  SUGAR:  ["Sunday baking staple","Ashlyn's kitchen ingredient","Sweet — literally"],
  LINEN:  ["Reception table fabric","What was draped across every surface","Elegant and simple"],
  GRAIN:  ["Texas wheat fields at the farm","The texture of the wooden beams","Earthy and warm"],
  WHEAT:  ["Golden fields beyond the farm","What the landscape looks like in September","The color of the evening"],
  CREAM:  ["Warm neutral in the florals","Soft color of the linens","The tone throughout"],
  EMBER:  ["What never fully went out","The low glow between 2021 and 2024","Still warm, always"],
  AMBER:  ["Warm honey-gold of sunset","The color of the hour","Golden Texas light"],
  IVORY:  ["The shade of Ashlyn's gown","Classic, timeless, perfect","Bridal white, elegantly"],
  MARCH:  ["Processional pace","Steady and intentional","The walk down the aisle"],
  THYME:  ["Herbal garnish on the charcuterie","Fragrant herb in the centerpieces","Tucked into every arrangement"],
  TRAIL:  ["Path at Arbor Hills where he waited","The walk that led to the yes","Nature preserve route"],
  BLOOM:  ["What the florals do","What their love did in 2024","Spring feeling in September"],
  KNELT:  ["How Jeffrey proposed","Past tense of the moment","One knee, ring out"],
  RANCH:  ["Davis & Grey Farms style","Rustic, wide, Texan","The land's personality"],
  CHOIR:  ["Voices lifted in the ceremony","Musical worship element","The sound of the celebration"],
  COAST:  ["What they did when apart — kept moving","Drifting toward each other","The long arc toward reunion"],
  AMITY:  ["Warm friendship at the root of it","The foundation before love","What they had first"],
  THEME:  ["Found, lost, found — their running theme","The aesthetic of the evening","Rustic autumn elegance"],
  CEDAR:  ["Fragrant wood of the barn beams","The scent of the farm","Warm and woody"],
  RHYME:  ["Their story has one — it all comes around","The poetic structure of their life","Met, parted, returned"],
  ROAST:  ["The affectionate speech","Made everyone laugh and tear up","The best man's moment"],
  NOBLE:  ["The quality both families brought","Dignified and warm","The tone of the room"],
  SERVE:  ["What they pledged for each other","The vow underneath the vow","Every day — in sickness and in health"],
  SWING:  ["The porch fixture at the farm","Where they sat after","A quiet end to a big night"],
  AGAPE:  ["Wide-open unconditional love","The Greek word for what this is","What they have"],
  FLAIR:  ["Ashlyn's signature quality","Effortless and unmistakable","She has it — always has"],
  FEAST:  ["The reception dinner","Abundant and warm","Pasta, bread, all the good things"],
  GREAT:  ["The only word for September 26","Best possible outcome","What it turned out to be"],
  MATCH:  ["What everyone knew they were","The word for it","Said it first — they took longer"],
  COLOR:  ["Amber, cream, cedar, rust","The warm autumn palette","What the evening looked like"],
  MERIT:  ["What their love earned through patience","Through distance and return","Deserved — all of it"],
  MIGHT:  ["The strength to drive 4.5 hours","Quiet and determined","What it took — he had it"],
  VALOR:  ["Courage to try again","What the second chapter took","The brave part of the love story"],
  LOYAL:  ["What they are to each other","Steady through everything","Never wavered"],
  CHEER:  ["What erupted at 'husband and wife'","The sound of the whole room","Loud, real, joyful"],
  SHINE:  ["What the rings did","What Ashlyn did walking down the aisle","The quality of the whole evening"],
  SHARE:  ["What marriage is — one long act of ___","The whole point","Together always"],
  GUIDE:  ["What faith does","What they've been for each other","True north"],
  WALTZ:  ["Tempo of the first dance","Slow and sweeping","The ballroom move of the night"],
  ZESTY:  ["The lemon-herb vinaigrette","Unexpected hit at the salad course","A little kick"],
  BAKER:  ["Ashlyn's Sunday morning role","She makes the good things","Kitchen title, earned"],
  DATES:  ["Sonic, Houston, Arbor Hills — all of these","What they kept going on","Documented in memories"],
  BRAVE:  ["What it takes to start over","Courageous","What the second try required"],
  BRING:  ["What you do with joy to a wedding","Carry forward","Contribute to the celebration"],
  BUILT:  ["What they ___ — slowly, together","Constructed with care","The life they made"],
  CARRY:  ["What vows do","Bear forward","To hold and move through"],
  CATCH:  ["What the bouquet toss produces","A lucky grab","Snag"],
  CAUSE:  ["What they stood for","The reason behind the day","Why it matters"],
  CHAIR:  ["Where you sit at the reception","Seat at the table","Reserved for guests"],
  CHECK:  ["Crossword tool — use sparingly","Verify","Make sure"],
  CHIEF:  ["Top of the list","Primary","Most important"],
  CHOSE:  ["Each other — that's what they did","Selected","Made the call"],
  CLAIM:  ["What vows do to a person","Declare","Stake"],
  CLASS:  ["The couple has it","Elegance","Style"],
  CLEAR:  ["September Texas sky","Obvious — they're meant to be","Unobstructed"],
  CLIFF:  ["Edge of something great","High point","The moment before the jump"],
  CLOCK:  ["What slowed down when they danced","Time piece","The thing they forgot was running"],
  CLOSE:  ["What they became","Near","Almost there — and then there"],
  CLOUD:  ["What the worries became after the yes","Lifted","Floating away"],
  COMES:  ["What the big day does — eventually","Arrives","September 26 finally did"],
  CORAL:  ["Warm pink tone in the florals","Wedding color note","Soft and warm"],
  COUNT:  ["Every mile counted","Tally","Number up"],
  COVER:  ["What the stars did over the farm","Overhead canopy","The sky's role"],
  CRASH:  ["Into each other — at the A&M game","Collide — gently","Unexpected reunion"],
  CROSS:  ["Symbol at the center of their faith","The emblem of the ceremony","What they did — the threshold"],
  CROWD:  ["100,000 people at Kyle Field","The stadium that couldn't hide them","Many, but two stood out"],
  CURVE:  ["The path at Arbor Hills","Bend in the trail","Where he was waiting"],
  DAILY:  ["How they showed up for each other","Every single day","The rhythm of it"],
  DEPTH:  ["How deep their history goes","The whole story","Not shallow — ever"],
  DOING:  ["What they kept ___ — showing up","In motion","Active"],
  EARLY:  ["Getting there before the nerves hit","Ahead of time","Not late — never for this"],
  EARTH:  ["Down to ____","Grounded","Real and solid"],
  EIGHT:  ["Number of months from reunion to yes","Count it","One less than nine"],
  ELDER:  ["Honored guest at the head table","Seasoned","Wise and there for it"],
  EVERY:  ["___ single mile was worth it","Each one","All of them"],
  EXACT:  ["Precisely what they wanted","On the mark","Spot on"],
  FAINT:  ["Almost lost nerve — almost","Barely there","The hesitation before the yes"],
  FAVOR:  ["Guest take-home from the reception","Small keepsake","A little piece of the day"],
  FLAME:  ["What the candle represents","Fire of commitment","Lit and kept burning"],
  FLOOR:  ["Dance ___ at the reception","Where the magic happened","The place they took over"],
  FOCUS:  ["What Jeffrey kept on Ashlyn","Center of attention","Locked in"],
  FOUND:  ["Each other — twice","Discovered","The ending of the search"],
  FRONT:  ["Row at Kyle Field — practically","The front of the aisle","Leading position"],
  GIANT:  ["The feeling of the day","Larger than life","Enormous"],
  GIVEN:  ["What they have been to each other","Granted","Freely — always"],
  GLOBE:  ["The world that couldn't keep them apart","Sphere","All of it"],
  GLOOM:  ["What the years apart had — sometimes","Darkness that passed","Before the light"],
  GLOSS:  ["The shine on the day","Finish","Polish"],
  GRAND:  ["The scale of it all","Magnificent","Worthy of the moment"],
  GRANT:  ["What God did — twice","Allow","Give freely"],
  GREEN:  ["The fields at the farm in early September","Color of growth","Fresh and alive"],
  GREET:  ["What the couple did at every table","Welcome","The warmth they brought"],
  GRIND:  ["The long distance wasn't glamorous","Work through it","Persist"],
  GUARD:  ["What they do for each other","Protect","Keep safe"],
  HARSH:  ["What the years apart felt like — sometimes","Difficult","Not easy"],
  HEAVY:  ["The goodbye after every visit","Weighty","Hard — but worth carrying"],
  IDEAL:  ["What they are to each other","Perfect vision","The one you imagined"],
  IMAGE:  ["Photo from the A&M game","Picture","The one captured"],
  INDEX:  ["The puzzle number","Reference","Order"],
  INNER:  ["What they know about each other","Inside","Deep knowing"],
  JOINT:  ["Together — as one","Combined","Shared"],
  JUDGE:  ["Not what this day is about","Evaluate","Leave it at the door"],
  KNOWN:  ["Each other — fully","Understood","Recognized completely"],
  LARGE:  ["The love — in scale","Big","Expansive"],
  LASER:  ["Focus — Jeff's when he decided","Precision","Sharp and certain"],
  LATER:  ["Better ___ than never — but also right on time","After","Eventually — perfectly"],
  LAUGH:  ["The sound of the reception","Joy, out loud","What the best speech produced"],
  LAYER:  ["The depth of their story","Level","One thing on top of another"],
  LEARN:  ["What they do from each other","Absorb","Grow through"],
  LEAVE:  ["What the years did — and so did they — and came back","Depart","Go, then return"],
  LEVEL:  ["Where they both operate — above average","Even","Matched"],
  LIVED:  ["They have ___ their story — not just told it","Experienced","Real, not imagined"],
  LOCAL:  ["Celeste, Texas — their home now","From the area","Near"],
  MONEY:  ["Not why — ever","Currency","Not the point"],
  MONTH:  ["October — when they officially started again","Calendar unit","The one it all changed"],
  MORAL:  ["Of the story: try again","Ethical core","The lesson"],
  MOVED:  ["Both of them — emotionally and literally","Relocated and felt deeply","Stirred"],
  NAVAL:  ["Not in the plan — just a word","Maritime","Of the navy"],
  NEVER:  ["What giving up looked like — not an option","Not ever","Ruled out"],
  NIGHT:  ["When the proposal happened","Evening","After the sun set at the farm"],
  NOVEL:  ["Their story — it reads like one","Book","New and compelling"],
  OPENS:  ["What the day does — wide","Begins","Start of everything"],
  ORDER:  ["Of the ceremony — practiced, then perfect","Sequence","How it all went"],
  OTHER:  ["The ___ person — always them","Second one","The half"],
  OUTER:  ["The world outside — irrelevant that night","External","Beyond the bubble"],
  PEACE:  ["What they found — in each other","Calm","The feeling after the yes"],
  PLAIN:  ["The Texas landscape","Simple and beautiful","Nothing to hide"],
  PLANE:  ["How guests traveled in","Flight","Mode of arrival"],
  PLANT:  ["Roots — what they set down","Establish","Put down and grow"],
  POINT:  ["The purpose of the day","Reason","To commit — for real"],
  POWER:  ["What vows carry","Force","Real and binding"],
  PRESS:  ["Forward — what they did","Push on","Continue"],
  PRIDE:  ["What both families felt","Satisfaction","The chest-swelling kind"],
  PRIME:  ["Best years — ahead of them","Peak","The good stuff coming"],
  PRIOR:  ["Before the reunion — the gap","Earlier","Previous chapter"],
  PROOF:  ["The whole day was ___","Evidence","What you see"],
  PROUD:  ["How Jeffrey looked at the altar","Feeling deeply satisfied","The look on his face"],
  QUEEN:  ["Ashlyn — simply","Royalty","The obvious answer"],
  QUICK:  ["How fast the day went — too fast","Fast","Blink and it was over"],
  QUIET:  ["The years between — not silent, just still","Hushed","The pause before the return"],
  RAISE:  ["A glass — for them","Lift","Toast"],
  RANGE:  ["The Texas landscape","Spread","Wide open"],
  REACH:  ["What they did — across the miles","Extend","Grasp toward"],
  RELAX:  ["What the honeymoon is for","Unwind","Rest — finally"],
  REPLY:  ["To the RSVP","Respond","Say yes"],
  RIDER:  ["Along for the whole story","Participant","Came along"],
  RIGHT:  ["What it felt like — immediately","Correct","The feeling of the yes"],
  RISEN:  ["What their love did","Came up from the quiet","Like the sun"],
  RIVER:  ["What time is","Flow","Moving forward"],
  ROUGH:  ["Parts of the long distance","Difficult","Not always easy"],
  ROUND:  ["The shape of the rings","Circular","Like a vow — no end"],
  ROYAL:  ["The treatment — all evening","Regal","As it should be"],
  RURAL:  ["Celeste, Texas — the setting","Country","Wide open and Texan"],
  SCENE:  ["The farm at golden hour","View","What it looked like"],
  SCORE:  ["How well they did — perfect","Result","The final number"],
  SEVEN:  ["Lucky number","Count","One more than six"],
  SHARP:  ["How Jeffrey looked in his suit","Precise","Well dressed"],
  SHORT:  ["How fast it all felt","Brief","Not long enough"],
  SIGHT:  ["The first look","What took his breath","The view from the altar"],
  SINCE:  ["___ 2021 — they've known","From that point","After the social"],
  SKILL:  ["What long distance takes","Ability","Hard-won"],
  SLEEP:  ["What no one got the night before","Rest","Hard to do with excitement"],
  SMALL:  ["The detail that made it perfect","Tiny but real","The little things"],
  SOUND:  ["The vows, the cheers, the first dance","What filled the evening","Audio memory"],
  SPEED:  ["How fast it came together once they decided","Pace","Quick when certain"],
  SPELL:  ["What the evening cast","Enchantment","Under its ___"],
  SPEND:  ["The rest of their lives — together","Use","Invest"],
  SPLIT:  ["What they refused to do — permanently","Separate","Not the ending"],
  SPOKE:  ["Vows — he said them clearly","Said","Uttered with certainty"],
  STAND:  ["At the altar","Be present","Not leave"],
  STATE:  ["Texas — always","Condition","Where they are"],
  STEAM:  ["The energy of the dance floor","Drive","Momentum"],
  STEEL:  ["The strength of the commitment","Hard and lasting","Unbending"],
  STERN:  ["The look before the happy tears","Firm","Serious before soft"],
  STILL:  ["What the air was at the moment of the yes","Unmoving","Quiet and perfect"],
  STORE:  ["What memories do","Hold","Keep forever"],
  STUDY:  ["What Jeff did — her, always","Learn about","Pay attention to"],
  STYLE:  ["Ashlyn has it","Aesthetic sense","What the whole evening had"],
  SUPER:  ["How the day felt","Above and beyond","More than enough"],
  SWIFT:  ["How the decision came — once made","Fast","No hesitation"],
  TABLE:  ["Where families gathered","Reception surface","Draped in linen"],
  THICK:  ["Through thin and ___","Dense","The good times and the hard ones"],
  THING:  ["The whole ___","It","Everything"],
  THINK:  ["What they did for three years — about each other","Consider","Recall"],
  THIRD:  ["The third time's the story worth telling","Number three","Not the first try"],
  THOSE:  ["___ three years apart","Those particular","The ones in the middle"],
  THREE:  ["Years between first goodbye and reunion","Count","The gap — worth it"],
  THROW:  ["The bouquet","Toss","Send out"],
  TOTAL:  ["Commitment — that's the vow","Complete","All of it"],
  TOUCH:  ["The first hand-hold at the reunion","Contact","What distance denies"],
  TOUGH:  ["Long distance — sometimes","Hard","Not easy — worth it"],
  TRACE:  ["What remained of them between 2021 and 2024","Thread","The connection that held"],
  TRACK:  ["What they kept — of each other","Follow","Record"],
  TRADE:  ["What they did — miles for memories","Exchange","Give to get"],
  TRAIN:  ["Of thought — always back to each other","Sequence","The consistent return"],
  TREAT:  ["How they treat each other","Special thing","A kindness"],
  TREND:  ["Coming back around — their pattern","Pattern","Direction"],
  TRUST:  ["The foundation after everything","Reliance","Built over time"],
  TRUTH:  ["What the vows were","Reality","No pretending"],
  TWICE:  ["They found each other ___","Two times","Once more"],
  UNDER:  ["The altar canopy","Beneath","Below the stars"],
  UNION:  ["What the ceremony created","Joining","The legal and sacred binding"],
  UNTIL:  ["___ September 26","Up to","The countdown"],
  UPPER:  ["Hand — love has it over everything else","Higher","On top"],
  UPSET:  ["Not the word for this day — at all","Disturb","Nope — just joy"],
  VALID:  ["Their love — completely","Real","Legitimately true"],
  VALUE:  ["What they see in each other","Worth","The estimation"],
  VOICE:  ["What wavered when he read his vows","Speaking instrument","Said with feeling"],
  VOTED:  ["Best couple — by everyone","Elected","The obvious choice"],
  WATCH:  ["What the room did — in awe","Observe","Witness"],
  WATER:  ["What eyes became during the vows","H2O","Tears — the good kind"],
  WEAVE:  ["How their lives came together","Interlace","Thread through"],
  WHERE:  ["___ it all started: A&M Commerce","Location","The place"],
  WHITE:  ["The dress — or close to it","Color of the day","Bridal"],
  WIDER:  ["The smile — the whole time","Broader","Expanding"],
  WOMAN:  ["The one he drove 4.5 hours for","Her","Ashlyn"],
  WORLD:  ["The one they're building together","Everything","All of it"],
  WORRY:  ["What they gave up after the yes","Concern","Left at the door"],
  WRITE:  ["What the vows were before they were spoken","Put to paper","Compose"],
  WRONG:  ["Timing — at first. Not them.","Incorrect","The original goodbye"],
  YIELD:  ["What distance finally did — gave way","Give","Produce the good thing"],
  YOUNG:  ["How they feel","Age quality","Still ahead of them"],
  YOURS:  ["What they are to each other","Belonging","The answer"],
  FLOWN:  ["Time — how it felt","Past tense of fly","Gone in the best way"],
  SCOPE:  ["The size of this love","Range","Broad and clear"],
  FORTE:  ["What they do well — love each other","Strong suit","Their specialty"],
  CRISP:  ["September Texas air","Clean and clear","Autumn sharpness"],
  CLING:  ["What they do — to each other","Hold tight","The embrace that lasted"],
  SCOUT:  ["What Jeff did — found her again","Seek","Reconnaissance, romantic edition"],
  PLUCK:  ["The courage to try again","Bravery","What it took"],
  STEEP:  ["The odds — but they beat them","High","Difficult — worth it"],
  BRISK:  ["Fall air in Celeste","Lively","Moving with energy"],
  TROVE:  ["Of memories — what they have","Collection","A ___ of good ones"],
  VERGE:  ["On the ___ of forever","Edge","About to"],
  INSET:  ["The ring — set into the band","Embedded","Placed within"],
  ONSET:  ["Of the best chapter","Beginning","The start"],
  FRANK:  ["Honest — what their vows were","Direct","Clear and true"],
  ADORE:  ["What Jeffrey does — daily","Deeply love","No question"],
  ETHOS:  ["The spirit of their whole relationship","Character","What they stand for"],
  VISTA:  ["The view from the farm at sunset","Panorama","Wide and beautiful"],
  GUSTO:  ["How they celebrated","Enthusiasm","Full energy"],
  REIGN:  ["Of love — it does","Rule","Prevail"],
  BLEND:  ["Of families, now one","Mix","Come together"],
  DRIFT:  ["What they refused to do permanently","Float away","The gap — closed"],
  FORGE:  ["What distance did to their bond — made it stronger","Create under pressure","Built through fire"],
  CRAFT:  ["What the evening was — carefully made","Make with skill","The design of it all"],
  SHONE:  ["What Ashlyn did — all evening","Past tense of shine","Glowed"],
  SPIRE:  ["Of the church where the ceremony was","Tower","Rising point"],
  TOWER:  ["Above it all — their love does","Rise","Stand tall"],
  PERCH:  ["High point — what they reached","Seat above","The view from here"],
  SWELL:  ["How the music built","Rise in volume","The feeling growing"],
  BRACE:  ["For the best day of your life","Support","Hold on"],
  TRYST:  ["Secret meeting — the proposal setup","Rendezvous","Planned surprise"],
  EMOTE:  ["What everyone did — openly","Express","Feel publicly"],
  TRICE:  ["In a ___ — how fast the yes came","Instant","No hesitation"],
  STRUM:  ["The guitar at the reception","Play strings","Musical note"],
  GRAFT:  ["Two becoming one — literally","Join","Attach permanently"],
};

function getClue(word, useCount) {
  const clues = CLUES[word];
  if (clues && clues.length > 0) return clues[useCount % clues.length];
  return `Five-letter answer: ${word.toLowerCase()}`;
}

// ---------------------------------------------------------------------------
// Build pattern index
// ---------------------------------------------------------------------------
const patternIndex = new Map();
for (const word of WORD_BANK) {
  const key = word[0] + word[2] + word[4];
  if (!patternIndex.has(key)) patternIndex.set(key, []);
  patternIndex.get(key).push(word);
}

// ---------------------------------------------------------------------------
// Search for valid puzzles
// ---------------------------------------------------------------------------
const validPuzzles = [];
const MAX_PUZZLES = 800;

// Priority pool for down words: tier1 first, then tier2, then start of tier3
const downPool = [...TIER1, ...TIER2, ...TIER3.slice(0, 100)];

for (let i = 0; i < downPool.length && validPuzzles.length < MAX_PUZZLES; i++) {
  const d1 = downPool[i];
  for (let j = 0; j < downPool.length && validPuzzles.length < MAX_PUZZLES; j++) {
    if (j === i) continue;
    const d2 = downPool[j];
    for (let k = 0; k < downPool.length && validPuzzles.length < MAX_PUZZLES; k++) {
      if (k === i || k === j) continue;
      const d3 = downPool[k];

      const a1key = d1[0] + d2[0] + d3[0];
      const a2key = d1[2] + d2[2] + d3[2];
      const a3key = d1[4] + d2[4] + d3[4];

      const a1c = patternIndex.get(a1key);
      if (!a1c) continue;
      const a2c = patternIndex.get(a2key);
      if (!a2c) continue;
      const a3c = patternIndex.get(a3key);
      if (!a3c) continue;

      for (const a1 of a1c) {
        if (a1 === d1 || a1 === d2 || a1 === d3) continue;
        for (const a2 of a2c) {
          if (a2 === d1 || a2 === d2 || a2 === d3 || a2 === a1) continue;
          for (const a3 of a3c) {
            if (a3 === d1 || a3 === d2 || a3 === d3 || a3 === a1 || a3 === a2) continue;
            validPuzzles.push({ a1, a2, a3, d1, d2, d3 });
            if (validPuzzles.length >= MAX_PUZZLES) break;
          }
          if (validPuzzles.length >= MAX_PUZZLES) break;
        }
        if (validPuzzles.length >= MAX_PUZZLES) break;
      }
    }
  }
}

process.stderr.write(`Found ${validPuzzles.length} valid puzzle candidates.\n`);
if (validPuzzles.length < 194) {
  process.stderr.write(`ERROR: Not enough puzzles. Need 194, found ${validPuzzles.length}.\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Theme assignment
// ---------------------------------------------------------------------------
const THEMES = [
  { start: 0,   end: 14,  name: "How They Met",       priority: ["SONIC","AGGIE","TEXAS","SPARK","STORY","CHARM","FIRST","CLEAN","MAGIC","SMILE"] },
  { start: 15,  end: 44,  name: "Long Distance Era",  priority: ["DRIVE","MILES","TEXTS","CALLS","VISIT","ROUTE","WORTH","LOYAL","TOUGH","REACH"] },
  { start: 45,  end: 75,  name: "Proposal Season",    priority: ["ARBOR","HILLS","KNEEL","RINGS","SMILE","TRAIL","LIGHT","BLOOM","KNELT","TREES"] },
  { start: 76,  end: 105, name: "Engagement & Plans", priority: ["VINES","DAVIS","VENUE","PLANS","READY","FARMS","DREAM","MAGIC","PARTY","HAPPY"] },
  { start: 106, end: 136, name: "Wedding Party",      priority: ["PAIGE","BLAKE","ROMAN","BRYNN","MEGAN","PARTY","HONEY","SWEET","LUCKY","TOAST"] },
  { start: 137, end: 167, name: "Countdown & Faith",  priority: ["FAITH","JESUS","GRACE","UNITY","NORTH","HEART","WHOLE","LUCKY","GUIDE","SERVE"] },
  { start: 168, end: 192, name: "Final Countdown",    priority: ["AISLE","ALTAR","BRIDE","GROOM","HEART","SMILE","MUSIC","DANCE","DRESS","RINGS"] },
  { start: 193, end: 193, name: "Wedding Day",        priority: ["DANCE","TOAST","RINGS","VOWED","LIGHT","CHEER","WALTZ","FEAST","HONOR","BRIDE"] },
];

function getTheme(i) {
  for (const t of THEMES) { if (i >= t.start && i <= t.end) return t; }
  return THEMES[THEMES.length - 1];
}

function themeScore(p, theme) {
  const words = [p.a1, p.a2, p.a3, p.d1, p.d2, p.d3];
  let s = 0;
  for (const w of words) {
    const idx = theme.priority.indexOf(w);
    if (idx >= 0) s += (theme.priority.length - idx) * 10;
    if (TIER1.includes(w)) s += 5;
    else if (TIER2.includes(w)) s += 2;
  }
  return s;
}

// Select 194 puzzles greedily by theme score
const selected = [];
const usedKeys = new Set();

for (let slot = 0; slot < 194; slot++) {
  const theme = getTheme(slot);
  let best = null, bestScore = -1;
  for (const p of validPuzzles) {
    const key = [p.a1,p.a2,p.a3,p.d1,p.d2,p.d3].sort().join(',');
    if (usedKeys.has(key)) continue;
    const s = themeScore(p, theme);
    if (s > bestScore) { bestScore = s; best = p; }
  }
  if (!best) {
    for (const p of validPuzzles) {
      const key = [p.a1,p.a2,p.a3,p.d1,p.d2,p.d3].sort().join(',');
      if (!usedKeys.has(key)) { best = p; break; }
    }
  }
  if (!best) { process.stderr.write(`ERROR: Ran out of puzzles at slot ${slot}\n`); process.exit(1); }
  usedKeys.add([best.a1,best.a2,best.a3,best.d1,best.d2,best.d3].sort().join(','));
  selected.push({ ...best, slot, theme: theme.name });
}

process.stderr.write(`Selected ${selected.length} puzzles.\n`);

// ---------------------------------------------------------------------------
// Clue usage tracking (cycle through alternatives per word)
// ---------------------------------------------------------------------------
const clueCount = {};
function pickClue(word) {
  if (!clueCount[word]) clueCount[word] = 0;
  const c = getClue(word, clueCount[word]++);
  return c;
}

// ---------------------------------------------------------------------------
// Output TypeScript array
// ---------------------------------------------------------------------------
function getDate(slot) {
  const start = new Date('2026-03-17T12:00:00Z');
  const d = new Date(start.getTime() + slot * 86400000);
  return d.toISOString().slice(0, 10);
}

const lines = [];
lines.push(`// AUTO-GENERATED by scripts/generate-crosswords.mjs`);
lines.push(`// ${selected.length} puzzles: 2026-03-17 through 2026-09-26`);
lines.push(``);
lines.push(`const RAW_PUZZLES: RawPuzzleData[] = [`);

for (const p of selected) {
  const ca1 = pickClue(p.a1), ca2 = pickClue(p.a2), ca3 = pickClue(p.a3);
  const cd1 = pickClue(p.d1), cd2 = pickClue(p.d2), cd3 = pickClue(p.d3);
  lines.push(`    // ${String(p.slot+1).padStart(3,'0')} — ${getDate(p.slot)} — ${p.theme}`);
  lines.push(`    // ACROSS: ${p.a1}/${p.a2}/${p.a3}  DOWN: ${p.d1}/${p.d2}/${p.d3}`);
  lines.push(`    {`);
  lines.push(`        id: "p${String(p.slot+1).padStart(3,'0')}",`);
  lines.push(`        a1: "${p.a1.toLowerCase()}", clue_a1: ${JSON.stringify(ca1)},`);
  lines.push(`        a2: "${p.a2.toLowerCase()}", clue_a2: ${JSON.stringify(ca2)},`);
  lines.push(`        a3: "${p.a3.toLowerCase()}", clue_a3: ${JSON.stringify(ca3)},`);
  lines.push(`        d1: "${p.d1.toLowerCase()}", clue_d1: ${JSON.stringify(cd1)},`);
  lines.push(`        d2: "${p.d2.toLowerCase()}", clue_d2: ${JSON.stringify(cd2)},`);
  lines.push(`        d3: "${p.d3.toLowerCase()}", clue_d3: ${JSON.stringify(cd3)},`);
  lines.push(`    },`);
}

lines.push(`];`);
console.log(lines.join('\n'));
