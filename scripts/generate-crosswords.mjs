#!/usr/bin/env node
// scripts/generate-crosswords.mjs
// Generates 194 daily NYT-style 5×5 mini crossword puzzles.
//
// Design:
//   - 4 grid templates (A/B/C/D) with corner black squares
//   - Curated-only fill pool for launch-quality clue consistency
//   - Word reuse allowed as needed to complete the full 194-puzzle bank
//   - WORD_CLUES map provides ~470 wedding-themed words with rich clues
//   - FILL_CLUES map provides ~500 common English words with real clues
//   - All words in the pool have proper clues — no "dictionary word" fallback
//   - Fast solver: letter-position index + forward checking constraint propagation
//
// Run: node scripts/generate-crosswords.mjs > /tmp/puzzles-out.txt 2>/tmp/gen-log.txt

// ---------------------------------------------------------------------------
// TEMPLATES
// ---------------------------------------------------------------------------
const TEMPLATES = {
  A: { // ■ at top-right (0,4) and bottom-left (4,0)
    slots: [
      {id:'1A', row:0, col:0, len:4, dir:'A'},
      {id:'2A', row:1, col:0, len:5, dir:'A'},
      {id:'3A', row:2, col:0, len:5, dir:'A'},
      {id:'4A', row:3, col:0, len:5, dir:'A'},
      {id:'5A', row:4, col:1, len:4, dir:'A'},
      {id:'1D', row:0, col:0, len:4, dir:'D'},
      {id:'2D', row:0, col:1, len:5, dir:'D'},
      {id:'3D', row:0, col:2, len:5, dir:'D'},
      {id:'4D', row:0, col:3, len:5, dir:'D'},
      {id:'5D', row:1, col:4, len:4, dir:'D'},
    ],
  },
  B: { // ■ at top-left (0,0) and bottom-right (4,4)
    slots: [
      {id:'1A', row:0, col:1, len:4, dir:'A'},
      {id:'2A', row:1, col:0, len:5, dir:'A'},
      {id:'3A', row:2, col:0, len:5, dir:'A'},
      {id:'4A', row:3, col:0, len:5, dir:'A'},
      {id:'5A', row:4, col:0, len:4, dir:'A'},
      {id:'1D', row:1, col:0, len:4, dir:'D'},
      {id:'2D', row:0, col:1, len:5, dir:'D'},
      {id:'3D', row:0, col:2, len:5, dir:'D'},
      {id:'4D', row:0, col:3, len:5, dir:'D'},
      {id:'5D', row:0, col:4, len:4, dir:'D'},
    ],
  },
  C: { // ■ at all 4 corners
    slots: [
      {id:'1A', row:0, col:1, len:3, dir:'A'},
      {id:'2A', row:1, col:0, len:5, dir:'A'},
      {id:'3A', row:2, col:0, len:5, dir:'A'},
      {id:'4A', row:3, col:0, len:5, dir:'A'},
      {id:'5A', row:4, col:1, len:3, dir:'A'},
      {id:'1D', row:1, col:0, len:3, dir:'D'},
      {id:'2D', row:0, col:1, len:5, dir:'D'},
      {id:'3D', row:0, col:2, len:5, dir:'D'},
      {id:'4D', row:0, col:3, len:5, dir:'D'},
      {id:'5D', row:1, col:4, len:3, dir:'D'},
    ],
  },
  D: { // ■ at top-right (0,4) and bottom-right (4,4) — vertical mirror of A
    slots: [
      {id:'1A', row:0, col:0, len:4, dir:'A'},
      {id:'2A', row:1, col:0, len:5, dir:'A'},
      {id:'3A', row:2, col:0, len:5, dir:'A'},
      {id:'4A', row:3, col:0, len:5, dir:'A'},
      {id:'5A', row:4, col:0, len:4, dir:'A'},
      {id:'1D', row:0, col:0, len:5, dir:'D'},
      {id:'2D', row:0, col:1, len:5, dir:'D'},
      {id:'3D', row:0, col:2, len:5, dir:'D'},
      {id:'4D', row:0, col:3, len:5, dir:'D'},
      {id:'5D', row:1, col:4, len:3, dir:'D'},
    ],
  },
};

// ---------------------------------------------------------------------------
// WEDDING-THEMED WORD CLUES
// Any word that appears in a puzzle will use these clues if available.
// Multiple clue variants rotate when the same word is reused.
// ---------------------------------------------------------------------------
const WORD_CLUES = {
  // 3-letter
  ACE:["Perfect serve","Flawless"],ACT:["Take action","The next ___"],AGE:["Era","How long they've loved"],
  AID:["Help","Support"],AIM:["Goal","Take ___"],AIR:["Texas breeze","Atmosphere"],
  ASH:["Ashlyn's nickname","The bride, shortened"],AWE:["What their story inspires","Wonder"],
  AYE:["Yes vote","Affirmative"],BAY:["Body of water","Texas inlet"],BOW:["Tie a ___","Take a ___"],
  BUD:["Early bloom","What love starts as"],DAY:["September 26 is THE ___","Unit of countdown"],
  DIM:["Soft, as wedding lighting","Not bright"],DIP:["Dance move","Dunk briefly"],
  DUO:["Jeff and Ashlyn","A pair"],EAR:["Listen well","Corn ___"],ELM:["Shade tree","Sturdy wood"],
  END:["Beginning of forever","Finish line that's a starting line"],ERA:["Chapter","The long-distance ___ is over"],
  EVE:["Night before the big day","Adam's partner"],EYE:["Window to the soul","What caught the ring"],
  FAN:["Admirer","What everyone is of this couple"],FIT:["Just right","What the dress did"],
  FLY:["Soar","What the day will"],FUN:["Guaranteed quality of the evening","Good times"],
  GAP:["The distance they crossed","Opening"],GEM:["Jewel","What she is to him"],
  GOD:["Who brought them together","Center of their faith"],GUY:["Jeff, colloquially","The groom"],
  HIM:["Ashlyn's forever person","Pronoun for the groom"],HOP:["Jump","Dance move"],
  HUG:["Warm embrace","First reunion gesture"],JOY:["What fills the room","The feeling on September 26"],
  KEY:["Essential element","What love is"],KIN:["Family","Who fills the chairs"],
  LAW:["What binds them legally","Rule"],LIT:["Illuminated","The room was ___ beautifully"],
  LOT:["A great ___","Much"],MAY:["Month of possibilities","Permission word"],
  MOM:["A mother's role","Honored guest"],OAK:["Sturdy tree","Symbol of strength"],
  ODE:["Tribute poem","Song of praise"],OUR:["Belongs to us both","Pronoun for two"],
  OWN:["To have and to hold","Possess"],RAY:["Beam of light","Golden hour element"],
  ROW:["Line of chairs","Guest seating unit"],RUN:["Keep going","The day will ___ perfectly"],
  SAY:["Speak","What the vows do"],SKY:["Texas blue","Endless above"],
  SON:["Family member","Jeff to his parents"],SUN:["Shining on September 26","Golden hour source"],
  TAN:["Texas golden glow","Sun-kissed"],TEA:["Southern staple","Brew"],
  TIE:["Groom's neckwear","Tie the ___"],TON:["A lot","Heavy amount"],
  TWO:["Jeff + Ashlyn","The magic number"],VOW:["Sacred promise","What they'll exchange"],
  WED:["Marry","What they'll do September 26"],WIT:["Sharp humor","Jeff's gift"],
  WON:["Victory achieved","Jeff ___ her heart"],WOO:["Court","What Jeff did at the social"],
  YES:["Ashlyn's answer","The word that changed everything"],ZEN:["Peaceful state","What they aim for"],
  // 4-letter
  ABLE:["Capable","Ready and ___"],ACHE:["What long distance feels like","Longing"],
  AMEN:["Prayer conclusion","So be it"],ARCH:["Ceremonial gateway","Wedding structure"],
  AWAY:["At a distance","The long-distance word"],BACK:["Return","Jeff came ___ into her life"],
  BASK:["Enjoy warmth","What they'll do in the spotlight"],BEAM:["Radiate joy","What they'll do all day"],
  BELL:["Church ___","Wedding signal"],BOLD:["Brave","What it took to reach out again"],
  BORN:["Came into being","A new chapter is ___"],CALM:["Peaceful","The eye of the wedding storm"],
  CAME:["Arrived","He ___ back into her life"],CARE:["Tend to","What they do for each other"],
  CHIN:["Keep your ___ up","Face part"],CLAP:["Applaud","What guests do at the kiss"],
  COZY:["Warm and comfortable","How they feel together"],CREW:["The wedding party, informally","Team"],
  CURE:["Fix","Love is the ___"],CUTE:["Adorable","How they describe each other"],
  DARE:["Be bold","What it took to love again"],DAWN:["New beginning","September 26 sunrise"],
  DAYS:["Units of countdown","The best ___ of their lives"],DEAR:["Beloved","Term of endearment"],
  DEEP:["Profound","Their love runs ___"],DONE:["Finished","Long distance? ___"],
  DOVE:["Symbol of peace","Love bird"],DUSK:["Evening light","Golden hour at the farm"],
  EARN:["Deserve through effort","What they did"],EASE:["Comfort","Put at ___"],
  EDGE:["Boundary","On the ___ of forever"],EPIC:["Grand","The scale of their love story"],
  EVER:["Always","Happily ___ after"],FADE:["Diminish","Their love never did"],
  FALL:["To ___ in love","Autumn"],FARM:["Davis & Grey ___","Venue word"],
  FAST:["Quick","How the day will fly"],FATE:["Destiny","What brought them together"],
  FILL:["Complete","What they do for each other"],FIRE:["Passion","What lit between them"],
  FIRM:["Solid","Their commitment is ___"],FLOW:["Move freely","How the evening will ___"],
  FOND:["Affectionate","Grown ___ over time"],GAZE:["Look lovingly","What they'll do at the altar"],
  GLAD:["Happy","Everyone is so ___ for them"],GLOW:["Radiate warmth","What the couple will ___"],
  GONE:["Departed","Long distance is ___"],GOOD:["Excellent","So very ___"],
  GOWN:["Wedding dress","What she'll wear"],GROW:["Develop","What their love does"],
  GULF:["Wide gap","What long distance felt like"],HALO:["Glowing ring","Light around the bride"],
  HAND:["Reach out","Held in ceremony"],HAVE:["Possess","To ___ and to hold"],
  HAZE:["Dream-like state","Golden ___"],HEAL:["Mend","What love does"],
  HELD:["Kept close","She was ___ in his arms"],HELP:["Support","What friends and family give"],
  HERE:["Present","We are all ___ for this"],HOLD:["Keep close","To have and to ___"],
  HOLY:["Sacred","This union is ___"],HOME:["Where the heart is","What they are to each other"],
  HOST:["Welcome","Davis & Grey Farms will ___"],HOUR:["Sixty minutes","Golden ___"],
  HYMN:["Sacred song","What they sang in church"],IDEA:["Thought","The best ___ he ever had"],
  INTO:["Toward","Falling ___ love"],JOIN:["Unite","What they do at the altar"],
  JOLT:["Sudden feeling","When they first met"],KEEN:["Eager","Sharp"],
  KEPT:["Held onto","He ___ coming back"],KIND:["Generous","Their defining quality"],
  KING:["Royalty","Jeff, in her eyes"],KNIT:["Bind together","Their lives ___"],
  LACE:["Delicate fabric","Bridal detail"],LAND:["Arrive","What love helps you ___"],
  LATE:["What he was — then wasn't","Better ___ than never"],LEAN:["Depend on","What they do for each other"],
  LEAP:["Jump with faith","What love requires"],LILY:["White flower","Wedding bloom"],
  LIVE:["Exist fully","How they'll ___"],LONE:["Solo","No longer ___"],
  LONG:["Extended time","A ___ road led here"],LOVE:["The whole reason","What this is all about"],
  LUCK:["Fortune","They made their own"],MADE:["Created","They were ___ for each other"],
  MAID:["___ of honor","Paige's role"],MAIN:["Primary","The ___ event"],
  MANY:["Numerous","___ miles, many calls"],MARK:["Note","Make your ___"],
  MATE:["Partner for life","Soul ___"],MEND:["Repair","What time and love do"],
  MINE:["Belonging to me","She's ___"],MINT:["Fresh start","In ___ condition"],
  MOVE:["Take action","What he finally did"],NAME:["Identity","She'll take his ___"],
  NEED:["Require","What they do — each other"],NEST:["Home base","Building their ___"],
  NOTE:["Message","Love ___"],ONCE:["One time","___ they found each other, everything changed"],
  OPEN:["Begin","Hearts wide ___"],OURS:["Belongs to us","The future is ___"],
  OVER:["Finished","Long distance is so ___"],PACE:["Rhythm","Setting the ___ for forever"],
  PACT:["Agreement","The sacred ___ of marriage"],PAGE:["Paige — the MOH","One ___ of their story"],
  PAIR:["Two together","A perfect ___"],PART:["Section","For better or worse"],
  PAST:["History","Their ___ brought them here"],PAVE:["Lay the road","What faith did for their path"],
  PEAK:["High point","The ceremony is the ___"],PINK:["Blush tone","Wedding color note"],
  PLAY:["Perform","What the band will do"],POUR:["Flow freely","What the love did"],
  PRAY:["Speak to God","What they did throughout"],PURE:["Undefiled","What their love is"],
  PUSH:["Persist","What they did through the distance"],RAIN:["Shower","Something old, new, borrowed, ___"],
  RANG:["Sounded","The bell ___"],RARE:["Uncommon","What this love is"],
  REAL:["Genuine","As ___ as it gets"],RELY:["Depend on","What they do for each other"],
  RICH:["Abundant","Their life together will be ___"],RIDE:["Journey","What a ___"],
  RISE:["Come up","Watch love ___"],RISK:["Bold move","What reaching out was"],
  RITE:["Ceremony","Sacred ___"],ROAD:["Path","The long ___ home"],
  ROCK:["Steady foundation","What they are for each other"],ROLE:["Part to play","Every person has a ___"],
  ROSE:["Flower","Love is a ___"],RULE:["Standard","Love ___s"],
  RUSH:["Hurry","No ___"],SAFE:["Secure","How she makes him feel"],
  SAGE:["Wise","Their families are ___"],SAKE:["For the ___ of love","Benefit"],
  SALT:["Seasoning","Worth their ___"],SAME:["Identical","They want the ___ things"],
  SANG:["Voiced in song","The hymns they ___"],SAVE:["Preserve","What they did for each other"],
  SEAL:["Close permanently","___ it with a kiss"],SEED:["Starting point","The ___ they planted in Commerce"],
  SELF:["Identity","They bring out the best ___"],SIGN:["Signal","Every ___ pointed to them"],
  SILK:["Smooth fabric","Bridal material"],SING:["Voice joy","What the congregation will do"],
  SITE:["Location","Davis & Grey Farms as wedding ___"],SOAK:["Absorb fully","___ it all in"],
  SOAR:["Rise high","What their spirits will do"],SOLD:["Convinced","He was ___ from day one"],
  SOLE:["Only one","Her ___ partner"],SONG:["Music","Their first dance ___"],
  SOUL:["Deep self","Soul ___mate"],SPAN:["Bridge","The years they spanned"],
  STAR:["Shining one","They're the ___s tonight"],STAY:["Remain","He came back to ___"],
  STEP:["Move forward","Next ___"],STIR:["Excite","What the ceremony will ___"],
  SUIT:["Groom's wardrobe","What Jeff will be in"],TALL:["Standing ___ together","Elevated"],
  TEAM:["Partners","The best ___ of two"],TEAR:["Drop of emotion","Happy ___s"],
  TEND:["Care for","What they do for each other"],TEST:["Trial","What long distance was"],
  TIDE:["Current","The turning ___"],TILL:["Until","___ death do us part"],
  TIME:["All the ___ they needed","Precious"],TIRE:["Exhaust","They never ___ of each other"],
  TOLD:["Said aloud","She ___ him yes"],TONE:["Quality","The ___ of the evening"],
  TOUR:["Journey through","Grand ___"],TREE:["Rooted growth","Family ___"],
  TRUE:["Authentic","___ north"],TUNE:["Song","In ___ with each other"],
  TWIN:["Two as one","Mirror image connection"],UNDO:["Unravel","What love does to loneliness"],
  UNIT:["Single entity","They are one ___"],URGE:["Desire","The ___ to be together"],
  VALE:["Valley","Through every ___ and peak"],VEIL:["Bridal covering","Wedding accessory"],
  VEST:["Garment","Groom's ___"],VIEW:["Perspective","The ___ from the altar"],
  VINE:["Growing plant","Sixty ___ — engagement dinner"],VOTE:["Choose","They both voted yes"],
  WAIT:["Worth the ___","What long distance required"],WAKE:["Rise","The morning of September 26"],
  WARM:["Comfortable","The feeling in the room"],WAVE:["Ripple outward","___ of emotion"],
  WEDS:["Marries","She ___ him"],WELD:["Fuse permanently","What the ceremony ___s"],
  WELL:["Healthy and happy","All is ___"],WENT:["Traveled","He ___ the distance"],
  WIDE:["Open","Eyes ___ with wonder"],WIFE:["Ashlyn's new title","Jeff's forever person"],
  WILL:["Determination","The ___ to make it work"],WIND:["Breeze","Texas ___ on the farm"],
  WINE:["Toast beverage","Glasses raised"],WISH:["Desire","Everything you could ___ for"],
  WITH:["Together","___ each other always"],WORD:["Promise","On his ___"],
  WORE:["Had on","She ___ white"],WOVE:["Intertwined","Their lives ___ together"],
  YELL:["Shout for joy","What the crowd will do"],ZEAL:["Enthusiasm","With ___ and love"],
  ZEST:["Energy","What the day will have"],
  // 5-letter
  SONIC:["First date stop","Drive-in chain","Their date night shorthand"],
  ARBOR:["Where he got on one knee","Nature park, proposal setting"],
  HILLS:["Arbor ___, proposal site","Where she said yes"],
  VINES:['Engagement dinner spot, minus "60"',"Post-proposal restaurant"],
  DAVIS:["Half the venue name","___ & Grey Farms"],
  GRACE:["What the timing needed","Gift from God","Spiritual favor"],
  AGGIE:["School connection","Texas A&M vibe word"],
  TEXAS:["State of this whole operation","Where love is big"],
  BRYNN:["Cousin bridesmaid","One of Ashlyn's girls"],
  BLAKE:["Ash's brother in the party","Groomsman"],
  PAIGE:["Maid of honor","Ash's best friend"],
  MEGAN:["Proposal day co-conspirator","Friend who kept the secret"],
  ROMAN:["Groomsman name","One of Jeff's guys"],
  AISLE:["Big walk, bigger moment","Wedding runway","Path to forever"],
  ALTAR:["End of the aisle","Where the vows happen","Sacred meeting point"],
  BRIDE:["One in white","Ash on September 26"],
  GROOM:["Jeff on wedding day","Suit at center stage"],
  VOWED:["Made promises, past tense",'Said "I do"'],
  RINGS:["Two circles, one commitment","The yes accessories"],
  DANCE:["Reception floor mission","First ___ as newlyweds"],
  TOAST:["Speech with a raised glass","Reception tradition"],
  DRESS:["What Ashlyn spent months perfecting","Bridal wardrobe piece"],
  VENUE:["Davis & Grey Farms, in one word","Wedding website must"],
  GUEST:["RSVP page person","Anyone with a seat card"],
  PHOTO:["Wedding gallery material","Captured moment"],
  VIDEO:["Wedding memory format","What you'll watch on anniversaries"],
  MUSIC:["First dance ingredient","Reception soundtrack"],
  STAGE:["Where the band sets up","Where toasts happen"],
  HEART:["What they wear on their sleeves","Home of love"],
  UNITY:["Two becoming one","Marriage ceremony word"],
  FAITH:["Relationship foundation","What guided the reunion","Trust in God's plan"],
  JESUS:["Center of it all","Name above every plan"],
  KNEEL:["Proposal posture","What Jeff did before the yes"],
  SMILE:["Proposal photo requirement","What the yes produced"],
  PARTY:["How the proposal night ended","Wedding ___"],
  HOUSE:["Their next chapter starts here","Home building block"],
  HOTEL:["Travel page staple","Where out-of-towners land"],
  STORY:["Yours is a very good one","Website page title"],
  DRIVE:["Long-distance specialty","4.5-hour routine"],
  MILES:["Long-distance tax","The gap that proved worth it"],
  TEXTS:["How the door reopened","Distance communication"],
  CALLS:["Long-distance lifeline","What bridged the gap"],
  VISIT:["Every-other-weekend mission","Long-distance payoff"],
  ROUTE:["What the drive requires","The way there"],
  PLANS:["The entire season of life right now","What the binder holds"],
  READY:["Wedding planning goal by September","Let's go"],
  SWEET:["Vibe word for the whole thing","Their whole story"],
  HONEY:["Endearment answer","What September tastes like"],
  CHARM:["Jeff's secret weapon at the social","Winning quality"],
  MAGIC:["The evening had it","Unexplainable good feeling"],
  SPARK:["What ignited in Commerce, 2021","Starting point of everything"],
  LIGHT:["What the ring caught","Golden hour quality","God's presence"],
  DREAM:["What the whole day felt like","Vision made real"],
  FIRST:["What this whole journey was","___ dance"],
  WORTH:["What every mile was","Value of the journey"],
  WHOLE:["What they make each other","Complete, in one word"],
  NORTH:["True ___, what they are to each other","Compass word"],
  SOUTH:["Texas compass word","Where Davis & Grey Farms is"],
  HAPPY:["State of everyone September 26","Happily ever after"],
  BLUSH:["Soft pink","Wedding color"],
  PEARL:["Classic gem","Bridal jewelry option"],
  OLIVE:["Earthy green","Branch of peace"],
  SATIN:["Smooth fabric","Gown texture"],
  PIZZA:["Reception dinner plan","Crowd-pleaser choice"],
  SAUCE:["Flavor","Extra detail"],
  FARMS:["Davis & Grey ___","Where it all happens"],
  ANGEL:["Heavenly being","What she is to him"],
  ARRAY:["Beautiful spread","The floral ___"],
  BRAVE:["Courageous","What reaching out again took"],
  CARRY:["Bear forward","What vows do"],
  CATCH:["Bouquet ___","The prize"],
  CHAIR:["Seat for a guest","Pull up a ___"],
  CLEAN:["Fresh start","New beginning"],
  CLEAR:["September Texas sky","The path became ___"],
  CORAL:["Warm pink tone","Wedding color note"],
  COUNT:["Count the days","___ down to September"],
  DAILY:["Every day","___ practice of love"],
  DEPTH:["The ___ of their love","Immeasurable"],
  EARLY:["Ahead of schedule","Not too late — just right"],
  EARTH:["World they share","Ground they stand on"],
  EVERY:["Each one","___ single mile"],
  FAINT:["Soft glow","What the doubts became"],
  FAVOR:["Wedding gift","Goodie for guests"],
  FLAME:["The ___ that never went out","Keep the ___ alive"],
  FLOOR:["Dance ___","Hit the ___"],
  FOCUS:["What they keep on each other","Sharp clarity"],
  FOUND:["He ___ her again","Lost and ___"],
  FRONT:["First row","The ___ of the ceremony"],
  GIANT:["The love is ___","Texas-sized"],
  GIVEN:["___ to each other","Freely ___"],
  GRAND:["Magnificent","Big, sweeping love"],
  GRANT:["Bestow","What God ___ed them"],
  GREAT:["Wonderful","This day is going to be ___"],
  GREEN:["Growing color","Farm backdrop"],
  GREET:["Welcome","What the couple does at the receiving line"],
  GRIND:["Persist","The long-distance ___"],
  GUARD:["Protect","What they do for each other"],
  GUIDE:["Lead with care","What faith does"],
  HARSH:["Difficult","Long distance was ___"],
  HONOR:["Cherish","Love and ___"],
  IDEAL:["Perfect","The ___ partner"],
  INNER:["Deep within","The ___ knowing"],
  KNOWN:["Familiar","He's always ___ she was the one"],
  LARGE:["Big","Texas-sized love"],
  LATER:["After some time","Better ___ than never"],
  LAUGH:["Express joy","What the evening will be full of"],
  LAYER:["Level","___ by ___ they revealed themselves"],
  LEARN:["Discover","They ___ each other every day"],
  LEVEL:["Equal","On the same ___"],
  LIVED:["Experienced","They ___ every moment"],
  LOCAL:["Of this place","Texas ___"],
  LUCKY:["Fortunate","They're so ___ to have each other"],
  MARCH:["Move forward","March toward September"],
  MIGHT:["Strength","With all their ___"],
  MIXED:["Combined","___ emotions — all good ones"],
  MODEL:["Example","A ___ couple"],
  MONTH:["Four weeks","___ by ___ they counted down"],
  MOVED:["Deeply affected","Everyone was ___"],
  NEVER:["Not ever","Said ___ to giving up"],
  NIGHT:["The proposal ___","Reception under the stars"],
  NOBLE:["Dignified","The quality both families brought"],
  NOVEL:["New and exciting","Their story is a great ___"],
  PEACE:["Tranquility","What they give each other"],
  PLANT:["Grow something","What they did in each other's hearts"],
  POINT:["The ___: they were meant to be","Purpose"],
  POWER:["Strength","The ___ of love"],
  PRIDE:["Joyful satisfaction","What their families feel"],
  PRIME:["At their best","In their ___ together"],
  PROOF:["Evidence","Love is the ___"],
  PROUD:["With satisfaction","So ___ of each other"],
  QUEEN:["Royalty","Ashlyn, in Jeff's eyes"],
  QUIET:["Peaceful stillness","Before the ceremony starts"],
  RAISE:["Lift a glass","___ a toast"],
  RANGE:["Expanse","The ___ of emotion today"],
  REACH:["Extend toward","Finally within ___"],
  RELAX:["Let go of worry","What they'll finally do"],
  REPLY:["Respond","The yes was the best ___ ever"],
  RIGHT:["Correct","Mr. ___"],
  RISEN:["Come up","The sun has ___"],
  RIVER:["Flowing water","Texas waterway"],
  ROUGH:["Difficult","___ times made them stronger"],
  ROUND:["Gather around","___ of applause"],
  ROYAL:["Majestic","Treated like ___ty"],
  RURAL:["Country setting","Celeste, Texas — the setting"],
  SCENE:["Farm at golden hour","The ___ was perfect"],
  SERVE:["Give of oneself","What they pledged for each other"],
  SHARP:["Keen","The groom looked ___"],
  SIGHT:["Vision","Love at first ___"],
  SINCE:["From that point","___ Commerce, everything changed"],
  SKILL:["Ability","The ___ of loving well"],
  SLEEP:["Rest","Neither will ___ the night before"],
  SMALL:["The ___ gesture that meant everything","Tiny but real"],
  SOUND:["Resonant","___ advice from those who love them"],
  SPEED:["How fast time flies","At full ___"],
  SPELL:["Cast a ___","She had him under her ___"],
  SPEND:["Invest time","A lifetime to ___"],
  SPOKE:["Said aloud","He finally ___ up"],
  STAND:["Be present","Take a ___"],
  STATE:["Texas — always","Happy ___"],
  STILL:["Even now","Standing ___ at the altar"],
  STORE:["Keep safe","Memories they'll ___"],
  STYLE:["Flair","Ash's ___ is impeccable"],
  SUGAR:["Sweet","Oh ___!"],
  SUPER:["Beyond great","___ couple"],
  SWIFT:["Quick","How the years passed"],
  TABLE:["Reception ___s","Seating"],
  THICK:["Through thick and thin","Deeply bonded"],
  THING:["The real ___","They've got a good ___"],
  THINK:["Reflect","I ___ it's forever"],
  THREE:["Number","___ words: I love you"],
  THROW:["Bouquet ___","Cast out"],
  TOTAL:["Complete","___ commitment"],
  TOUCH:["Physical connection","A gentle ___"],
  TOUGH:["Hard","___ love — worth it"],
  TRACE:["Follow the path","___ of joy in every detail"],
  TRACK:["Record","On ___"],
  TRADE:["Exchange","___ vows"],
  TRAIL:["Path","The ___ that led to yes"],
  TRAIN:["Bridal ___","Gown detail"],
  TREAT:["Delight","What this day is — a ___"],
  TREND:["Movement","Love never goes out of ___"],
  TRUST:["Faith in each other","I ___ you"],
  TRUTH:["Honesty","They were always meant to be"],
  TWICE:["Two times","He fell in love ___ — with the same person"],
  UNDER:["Beneath","___ the same sky"],
  UNION:["Joining","Sacred ___"],
  UNTIL:["Up to the moment","___ forever begins"],
  VALID:["Real","Everything about this is ___"],
  VALUE:["Worth","What they place on each other"],
  VOICE:["Say it aloud","Exchange ___s at the altar"],
  WATCH:["Witness","Count no more"],
  WATER:["Life-giving","Rivers they crossed together"],
  WEAVE:["Intertwine","How their lives came together"],
  WHERE:["Location of forever","___ they always belonged"],
  WHITE:["Bridal color","Pure and beautiful"],
  WOMAN:["The bride","Ashlyn — a remarkable one"],
  WORLD:["Their whole ___","Everything to each other"],
  WORRY:["No more","Leave ___ at the door"],
  WRITE:["Record","___ the next chapter together"],
  YIELD:["Give in to love","Surrender"],
  YOUNG:["Fresh","Their love keeps them ___"],
  YOURS:["Belonging to you","I am ___"],
  AMBER:["Warm honey-gold of sunset","The color of the hour"],
  EMBER:["What never fully went out","Glowing remnant of a fire"],
  SHARE:["What marriage is","One long act of ___"],
  SWING:["Porch fixture at the farm","Dance move"],
  THEME:["The aesthetic of the evening","Their running ___"],
  VISTA:["View from the farm at sunset","Panoramic scene"],
  CHEER:["What erupted at 'husband and wife'","Jubilant shout"],
  ADORE:["Love deeply","What they do"],
  AGREE:["Come to terms","They ___"],
  ALIVE:["Living","Never more ___"],
  ALONE:["By oneself","Never again ___"],
  BLISS:["Pure joy","Newlywed ___"],
  BLOOM:["Flower open","Watch love ___"],
  BOOST:["Lift up","They ___ each other"],
  BOUND:["Heading toward","___ for forever"],
  BRAND:["Mark","___ new chapter"],
  BLESS:["Give grace","God ___ them"],
  BUILD:["Construct","___ a life"],
  BURST:["Sudden release","___ with love"],
  CHECK:["Verify","___ your heart"],
  CLOSE:["Near","Stay ___"],
  COVER:["Protect","___ each other"],
  CRAFT:["Skill","The ___ of loving"],
  CROWN:["Top achievement","Their ___ing glory"],
  DEBUT:["First appearance","Their wedding ___"],
  ENJOY:["Take pleasure in","___ every moment"],
  ENTER:["Go in","___ the next chapter"],
  EQUAL:["Same as","___ partners"],
  EXCEL:["Do very well","They ___ together"],
  FEAST:["Big meal","Wedding ___"],
  FINAL:["Last one","The ___ yes"],
  FLASH:["Quick light","In a ___"],
  FORGE:["Shape by heat","___ a life together"],
  FORTE:["Strong point","Love is their ___"],
  FRAME:["Structure","___ the moment"],
  FRANK:["Honest","Beautifully ___"],
  FREED:["Set loose","___ from distance"],
  FRESH:["New","Brand ___"],
  FULLY:["Completely","___ committed"],
  GAUGE:["Measure","No need to ___ this love"],
  GLIDE:["Smooth move","___ into forever"],
  GOING:["Departing","Where are they ___? Forever"],
  GRASP:["Hold firmly","___ the moment"],
  GROUP:["Collection","Their whole ___"],
  GROVE:["Small forest","Arbor ___"],
  GROWN:["Fully developed","They've ___"],
  GUSTO:["Enthusiasm","With ___"],
  HAVEN:["Safe place","A ___ for two"],
  HURRY:["Move fast","No need to ___"],
  JEWEL:["Precious stone","She's his ___"],
  JOLLY:["Merry","Keeping it ___"],
  KNACK:["Natural skill","The ___ for love"],
  LEGAL:["Lawful","Legally ___"],
  MATCH:["Pair up","A perfect ___"],
  MERRY:["Cheerful","Marry ___ Ashlyn"],
  OCCUR:["Happen","May only good things ___"],
  OFFER:["Put forward","Love's ___"],
  ORDER:["Arrange","In ___"],
  PAUSE:["Brief stop","___ and breathe it in"],
  PIANO:["Keyboard instrument","Wedding ___"],
  PLACE:["Location","This ___"],
  POSED:["Positioned","Wedding ___"],
  POUND:["Strike hard","Heart ___s"],
  PRIZE:["Reward","She's the ___"],
  PROVE:["Show true","They ___ love endures"],
  PULSE:["Heartbeat rhythm","___ of love"],
  RALLY:["Come together","Everyone ___s for them"],
  REALM:["Kingdom","Their ___"],
  REMIT:["Send back","No ___"],
  REPAY:["Pay back","Repay with love"],
  RESET:["Start over","A beautiful ___"],
  RISKY:["Dangerous","Love is worth the ___"],
  RIVAL:["Competitor","Distance was the ___"],
  SAVOR:["Enjoy fully","___ every moment"],
  SEIZE:["Grab","___ the day"],
  SENSE:["Perceive","Common ___"],
  SEVEN:["Lucky number","Lucky ___"],
  SHADE:["Partial darkness","Golden ___"],
  SHAME:["Embarrassment","No ___"],
  SHINE:["Give light","Let it ___"],
  SHOCK:["Sudden surprise","Happy ___"],
  SHORE:["Land by water","Love is the ___"],
  SHOUT:["Yell","Shout it out"],
  SHOWN:["Displayed","Love has been ___"],
  SHIFT:["Move or change","A ___ toward forever"],
  SIXTH:["After fifth","The ___ sense — love"],
  SIXTY:["Six tens","Sixty Vines — the proposal dinner"],
  SLANT:["Angle","A new ___"],
  SLICK:["Smooth","Slickly done"],
  SMART:["Clever","Smart choice"],
  SMASH:["Break","___ all doubts"],
  SOLAR:["Sun-powered","___ energy — like their love"],
  SOLVE:["Find answer","___ every puzzle together"],
  SPARE:["Extra","Not a ___ moment of regret"],
  SPINE:["Back bone","___ of steel, heart of gold"],
  SPORT:["Athletic game","Good ___"],
  SPRAY:["Scatter liquid","Confetti ___"],
  SPREE:["Shopping trip","Bridal ___"],
  STACK:["Pile up","___ of good memories"],
  STARE:["Look intently","___ into each other's eyes"],
  START:["Begin","The ___"],
  STEEP:["Sharp incline","Worth the ___ climb"],
  STICK:["Thin rod","Stick together"],
  STONE:["Hard mineral","Rolling ___s — they've settled"],
  STORM:["Wild weather","Weathered every ___"],
  STOUT:["Strong built","___ of heart"],
  SURGE:["Rush forward","Love ___s"],
  SWEAR:["Promise solemnly","I ___ forever"],
  SWEEP:["Clean up","___ the floor with happiness"],
  SWELL:["Grow bigger","Hearts ___ with love"],
  SWEPT:["Cleaned up","Swept off their feet"],
  SWIRL:["Circular motion","___ of joy"],
  TENSE:["Tight feeling","No longer ___"],
  TITLE:["Name given","New ___: husband and wife"],
  TOXIC:["Poisonous","Nothing ___ here"],
  TRIBE:["Social group","Their ___"],
  TRIED:["Attempted","Love ___ and true"],
  TROOP:["Group","Merry ___"],
  TRULY:["With sincerity","___ forever"],
  TUNED:["Adjusted","Perfectly ___"],
  TWIST:["Turn around","Unexpected ___ — it worked!"],
  ULTRA:["Extreme","___ happy"],
  UNIFY:["Bring together","What vows do"],
  UPSET:["Troubled","No ___s"],
  UTTER:["Completely","___ joy"],
  VAPOR:["Mist","Morning ___"],
  VAULT:["Jump over","___ into the future"],
  VIBES:["Feelings","Good ___"],
  VIGOR:["Energy","Full of ___"],
  VITAL:["Essential","___ to each other"],
  VIVID:["Bright and clear","___ memories ahead"],
  VOCAL:["Out loud","___ about their love"],
  VOGUE:["In fashion","In ___"],
  WALTZ:["Dance","Wedding ___"],
  WRATH:["Fierce anger","No ___ today"],
};

// ---------------------------------------------------------------------------
// COMMON FILL WORDS — standard crossword-friendly clues for everyday words.
// These supplement WORD_CLUES to give the solver enough candidates.
// ---------------------------------------------------------------------------
const FILL_CLUES = {
  // 3-letter fill
  ACT:"Take action",ADD:"Put together",AGO:"Time past",ALL:"Every one",
  AND:"Plus",ANT:"Tiny insect",APE:"Mimic",ARC:"Curved line",ARM:"Limb",
  ASK:"Pose a question",ATE:"Had a meal",BAD:"Not good",BAG:"Carry-all",
  BAN:"Prohibit",BAR:"Block",BAT:"Swing",BED:"Rest place",BEG:"Plead",
  BET:"Wager",BIG:"Large",BIT:"Small amount",BOX:"Container",BUS:"Transit",
  BUT:"However",BUY:"Purchase",CAP:"Top it off",CAR:"Vehicle",CAT:"Feline",
  COP:"Officer",COT:"Small bed",COW:"Farm animal",CRY:"Weep",CUP:"Vessel",
  CUT:"Slice",DEW:"Morning drops",DIG:"Excavate",DOC:"Doctor",DOE:"Female deer",
  DOG:"Loyal companion",DOT:"Tiny spot",DRY:"Parched",EGG:"Oval ingredient",
  ELK:"Large deer",FAD:"Brief craze",FAR:"Distant",FAT:"Plump",FEW:"Not many",
  FIG:"Sweet fruit",FIX:"Repair",FOG:"Low cloud",GEL:"Styling product",
  GET:"Obtain",GIG:"Performance",GOT:"Obtained",GUM:"Chewy stuff",GUN:"Weapon",
  HAD:"Possessed",HAM:"Cured meat",HAS:"Possesses",HAT:"Head cover",HAY:"Farm fodder",
  HEN:"Female chicken",HID:"Concealed",HOT:"High temp",HOW:"In what way",
  ICE:"Frozen water",ILL:"Sick",INN:"Country lodging",JAB:"Quick punch",
  JAM:"Fruit spread",JAR:"Glass container",JET:"Fast plane",JIG:"Quick dance",
  JOB:"Occupation",KID:"Young one",KIT:"Equipment set",LAP:"Seated surface",
  LEG:"Limb",LET:"Allow",LIE:"Recline",LOG:"Tree section",LOW:"Not high",
  MAP:"Chart",MAT:"Floor cover",MEN:"Males",MET:"Encountered",MID:"Middle",
  MIX:"Combine",MOB:"Crowd",MOP:"Floor tool",MUD:"Wet earth",MUG:"Face or cup",
  NAP:"Short sleep",NET:"After deductions",NEW:"Not old",NOD:"Head agreement",
  NOR:"Neither",NOT:"Negation",NUT:"Crunchy snack",OAT:"Grain",ODD:"Strange",
  OIL:"Lubricant",OLD:"Aged",ONE:"Single",PAD:"Writing tablet",PAN:"Cooking vessel",
  PAT:"Gentle tap",PAY:"Compensate",PEA:"Green veggie",PEG:"Fastener",
  PEN:"Writing tool",PET:"Cherished animal",PIE:"Baked dish",PIN:"Fasten",
  PIT:"Hollow",POD:"Seed case",POP:"Burst",POT:"Vessel",PUB:"Social spot",
  RAM:"Male sheep",RAP:"Knock",RAT:"Rodent",RED:"Warm color",RIB:"Curved bone",
  RIG:"Equipment",RIP:"Tear",ROB:"Take from",ROD:"Straight stick",ROT:"Decay",
  RUB:"Friction",RUG:"Floor covering",SAP:"Tree fluid",SAT:"Rested",
  SAW:"Cutting tool",SET:"Group",SEW:"Stitch",SHY:"Timid",SIP:"Small drink",
  SIT:"Take a seat",SIX:"Half a dozen",SOB:"Cry hard",SOW:"Plant seeds",
  SPY:"Secret watcher",TAB:"Small bill",TAP:"Light knock",TAR:"Road surface",
  TIP:"Pointed end",TOE:"Foot digit",TOP:"Summit",TOT:"Small child",
  TUB:"Bathing vessel",TUG:"Pull hard",WAX:"Polish",WIG:"Hairpiece",WIN:"Succeed",
  WOK:"Cooking pan",WHY:"For what reason",ZIP:"Move fast",ZAP:"Strike",

  // 4-letter fill
  ABLE:"Capable",ACID:"Sour",AGED:"Old",AIDE:"Helper",AIMS:"Goals",
  ALSO:"In addition",AMID:"In the middle",ANTE:"Stake up",ARMY:"Military force",
  ARTS:"Creative fields",AUNT:"Parent's sister",AVID:"Eager",AWED:"Amazed",
  BABE:"Infant",BAIL:"Get free",BALE:"Bundle",BALL:"Round toy",BAND:"Music group",
  BARE:"Exposed",BARN:"Farm building",BATH:"Wash up",BEAD:"Small jewel",
  BEAT:"Rhythm",BELT:"Waist band",BIND:"Tie together",BIRD:"Feathered friend",
  BITE:"Nibble",BOLT:"Secure",BOOM:"Big sound",BROW:"Forehead",BURN:"On fire",
  CAGE:"Enclosure",CAPE:"Flowing garment",CART:"Wheeled carrier",CAST:"Throw",
  CAVE:"Underground space",CHIP:"Small piece",CITY:"Urban center",CLAN:"Family group",
  CLAY:"Moldable earth",CLIP:"Attach",COAL:"Dark fuel",COAT:"Outer layer",
  COIL:"Spiral",COOL:"Not warm",COPE:"Manage",CORE:"Center",COST:"Price",
  CROP:"Farm harvest",CUBE:"3D square",DALE:"Small valley",DAMP:"Slightly wet",
  DART:"Quick move",DASH:"Sprint",DECK:"Level surface",DEEM:"Consider",
  DEFT:"Skillful",DELI:"Food shop",DENT:"Small hollow",DENY:"Refuse",
  DESK:"Work surface",DIME:"Small coin",DINE:"Eat formally",DISC:"Round object",
  DISH:"Serving plate",DIVE:"Plunge",DOCK:"Harbor stop",DOME:"Rounded top",
  DOOM:"Dark fate",DOOR:"Entry point",DOTE:"Adore",DUAL:"Two-part",
  EACH:"Every one",EARL:"Noble title",EAST:"Direction",EMIT:"Give off",
  EVEN:"Level",EXAM:"Test",FAIR:"Just",FAME:"Renown",FANG:"Sharp tooth",
  FARE:"Journey cost",FEAT:"Achievement",FILM:"Movie",FIND:"Discover",
  FIST:"Closed hand",FLAW:"Imperfection",FLEW:"Past of fly",FLED:"Ran away",
  FLEX:"Show strength",FLIP:"Turn over",FLIT:"Move quickly",FOAM:"Bubbly mass",
  FOLK:"People",FOOD:"Nourishment",FOOL:"Act silly",FORE:"Before",FORK:"Eating tool",
  FORT:"Stronghold",FOUR:"Number after three",FOWL:"Farmyard bird",FRAY:"Unravel",
  FUME:"Smoke",FUND:"Resource",FURY:"Intense anger",FUSE:"Connect",GALE:"Strong wind",
  GEAR:"Equipment",GILD:"Add gold",GIVE:"Offer freely",GLAD:"Happy",GLOB:"Lump",
  GOAD:"Prod forward",GORE:"Wound",GRAB:"Seize",GRIM:"Serious",GRIP:"Hold tight",
  GULF:"Wide gap",GUST:"Wind burst",HALE:"Healthy",HALF:"50 percent",
  HALL:"Corridor",HALT:"Stop",HANG:"Suspend",HARE:"Fast rabbit",HARK:"Listen",
  HASH:"Mix up",HATE:"Strong dislike",HAUL:"Drag along",HAWK:"Sharp-eyed bird",
  HEAD:"Top part",HEAP:"Big pile",HEAT:"Warmth",HEED:"Pay attention",
  HEEL:"Back of foot",HERB:"Cooking plant",HIKE:"Long walk",HILL:"Small rise",
  HIRE:"Bring on board",HOOD:"Cover",HOOP:"Circle",HOSE:"Spray device",
  HUNT:"Search for",HURL:"Throw hard",ICED:"Cooled down",ICON:"Symbol",
  IDOL:"Admired one",INCH:"Small measure",INKY:"Dark",IRIS:"Flower",IRON:"Press flat",
  ISLE:"Small island",ITCH:"Scratchy feeling",JADE:"Green gem",JEST:"Joke",
  JUST:"Fair and right",KEEN:"Sharp",KEYS:"Access tools",KICK:"Strike",
  KILL:"End",LAME:"Weak",LAMP:"Light source",LARK:"Fun adventure",LAST:"Final",
  LAUD:"Praise",LAVA:"Volcanic flow",LAZE:"Relax",LEAF:"Tree part",
  LEND:"Loan out",LENS:"Glass",LEST:"For fear that",LICK:"Quick taste",
  LIFT:"Raise up",LIME:"Citrus",LINK:"Connect",LION:"Brave cat",LISP:"Speech",
  LOFT:"Upper space",LOOP:"Circle back",LOSS:"Defeat",LOUD:"High volume",
  MADE:"Created",MALE:"Masculine",MANE:"Crown of hair",MASK:"Cover face",
  MEAN:"Average",MEAT:"Protein",MENU:"Food choices",MERE:"Simple",MESH:"Interlace",
  MINK:"Soft fur",MIST:"Light fog",MOAN:"Longing sound",MODE:"Method",MOLD:"Shape",
  MOLT:"Shed covering",MOOR:"Open land",MOPE:"Feel blue",MORE:"Additional",
  MOTH:"Night flier",MUTE:"Silent",NAIL:"Secure",NEAT:"Tidy",NEWT:"Pond creature",
  NICE:"Pleasant",NOON:"Midday",NORM:"Standard",OATH:"Solemn promise",ODDS:"Probability",
  ONCE:"One time",PANE:"Glass panel",PALE:"Light color",PASS:"Go through",
  PAVE:"Lay a road",PEAL:"Ring out",PEEL:"Remove layer",PIER:"Dock",
  PILL:"Small tablet",PINE:"Long for",PIPE:"Tube",PITY:"Compassion",
  PLAN:"Organize",PLEA:"Urgent request",PLOW:"Break ground",PLUS:"Add on",
  POLL:"Survey",POOL:"Shared resource",PREY:"Target",PRIM:"Proper",
  PROD:"Nudge",PROP:"Support",PULL:"Draw toward",PUMP:"Push fluid",
  RACK:"Hold things",RAGE:"Strong emotion",RAID:"Sudden move",RAIL:"Guard bar",
  RAMP:"Sloping road",RANK:"Standing",RANT:"Speak loudly",RAPT:"Absorbed",
  RASH:"Hasty",RAYS:"Beams of light",REEL:"Spin",REIN:"Guide",RENT:"Pay to use",
  RICE:"Grain",RICK:"Stack of hay",RIFT:"Gap",RILL:"Small stream",RIND:"Outer skin",
  RIOT:"Wild commotion",ROBE:"Soft garment",ROAM:"Wander",ROAR:"Loud cry",
  RODE:"Past of ride",ROLL:"Turn over",ROMP:"Play freely",ROUT:"Big win",
  RUIN:"Damage",RUSE:"Clever trick",RUST:"Oxidize",RYES:"Grain plural",
  SCAN:"Look over",SCAR:"Mark left behind",SEAM:"Join line",SEAR:"Brown quickly",
  SELL:"Exchange",SEMI:"Half",SEWN:"Stitched",SHED:"Let go",SHUN:"Avoid",
  SILL:"Window base",SIRE:"Father",SLAB:"Flat chunk",SLAP:"Quick hit",
  SLAT:"Thin strip",SLIM:"Narrow",SLIP:"Slide",SLIT:"Narrow cut",SLOT:"Opening",
  SLOW:"Not fast",SLUG:"Move slowly",SOCK:"Cover foot",SOIL:"Earth",SOLO:"Alone",
  SOOT:"Ash residue",SORT:"Categorize",SOUR:"Tart",SPAN:"Bridge across",
  SPAR:"Practice",SPED:"Went fast",SPIN:"Rotate",SPIT:"Eject",SPOT:"Place",
  SPUN:"Rotated",SPUR:"Motivate",STAB:"Pierce",STAG:"Male deer",STEM:"Source",
  STEW:"Slow cook",STUB:"Blunt end",STUD:"Fastener",SUCH:"Of that kind",
  SULK:"Brood",SUNK:"Went down",SURF:"Ride waves",SWAM:"Past swim",
  SWAN:"Graceful bird",SWAP:"Trade",SWAT:"Strike",SWAY:"Move gently",
  TACK:"Change course",TAME:"Gentle",TANG:"Sharp taste",TAPE:"Bind",
  TAUT:"Pulled tight",TICK:"Mark off",TILL:"Until",TOAD:"Frog cousin",
  TOIL:"Hard work",TOLL:"Cost paid",TORE:"Ripped",TORN:"Divided",TOSS:"Throw",
  TOWN:"Small city",TRAY:"Flat carrier",TRIO:"Three",TRIP:"Journey",
  TROD:"Walked on",TROT:"Steady pace",TROY:"Weight system",TUCK:"Fold in",
  TUFT:"Small cluster",TUNA:"Ocean fish",TUSK:"Long tooth",TUTU:"Ballet skirt",
  TYPO:"Typing error",UGLY:"Not pretty",UPON:"On top of",USED:"Previously",
  USER:"One who uses",VAIN:"Self-focused",VARY:"Change",VENT:"Let out",
  VERY:"Extremely",VOID:"Empty",VOLT:"Energy unit",WADE:"Move through",
  WAIL:"Cry out",WANE:"Diminish",WARD:"Protect",WARY:"Cautious",
  WEAL:"Welfare",WEAN:"Move away",WELD:"Fuse",WEND:"Travel",WHET:"Sharpen",
  WHIM:"Passing fancy",WHIP:"Stir fast",WILD:"Untamed",WILE:"Clever trick",
  WILT:"Droop",WING:"Take flight",WINK:"Knowing look",WIRE:"Connect",
  WOKE:"Became aware",WOLF:"Wild canine",WOMB:"Origin",WREN:"Small bird",
  WRIT:"Legal document",YELL:"Shout",ZERO:"Nothing",ZONE:"Area",ZOOM:"Move fast",

  // 5-letter fill
  ABOUT:"Concerning",ABOVE:"Higher than",ABUSE:"Mistreat",ACTED:"Performed",
  ADDED:"Increased",ADMIT:"Confess",ADOPT:"Take as own",AFTER:"Following",
  AGAIN:"Once more",AGREE:"Come to terms",AHEAD:"In front",ALERT:"Watchful",
  ALIKE:"Similar",ALIVE:"Living",ALLOW:"Permit",ALONG:"Forward",ALONE:"By oneself",
  ALOUD:"Out loud",AMONG:"In the middle",AMUSE:"Entertain",ARISE:"Come up",
  ASIDE:"Off to the side",ASSET:"Valuable thing",ATONE:"Make right",AWAKE:"Not sleeping",
  AWARD:"Give recognition",AWARE:"Knowing",AWFUL:"Terrible",AZURE:"Sky blue",
  BASIC:"Fundamental",BEGAN:"Started",BEGIN:"Start",BEING:"Existing",BELOW:"Under",
  BENCH:"Seating",BIBLE:"Holy book",BLACK:"Dark color",BLADE:"Sharp edge",
  BLANK:"Empty space",BLAST:"Explosion",BLAZE:"Fire",BLEAK:"Gloomy",BLEND:"Mix",
  BLOCK:"Solid chunk",BLOWN:"Moved by wind",BOARD:"Flat surface",BONUS:"Extra reward",
  BOUND:"Heading toward",BRAIN:"Thinking organ",BREAK:"Pause",BRIEF:"Short",
  BRING:"Carry here",BROAD:"Wide",BROKE:"No money",BROOK:"Small stream",
  BRUSH:"Light touch",BUILT:"Constructed",BUNCH:"Cluster",BURST:"Sudden release",
  COULD:"Had ability",COVER:"Protect",CRACK:"Split",CRAFT:"Skill",CRISP:"Fresh",
  CROSS:"Angry",CROWD:"Many people",CRUSH:"Strong feeling",CYCLE:"Repeat pattern",
  DEBUT:"First appearance",DENSE:"Packed",DODGE:"Move aside",DOUBT:"Uncertainty",
  DRAFT:"First version",DRAPE:"Hang fabric",DRAWN:"Attracted",DUNES:"Sand hills",
  EAGER:"Enthusiastic",EAGLE:"Soaring bird",EIGHT:"Number 8",ELECT:"Choose",
  ELITE:"Top group",EMAIL:"Digital message",EMPTY:"Nothing inside",ENDED:"Came to close",
  ENEMY:"Opponent",ENJOY:"Take pleasure",ENTER:"Go in",EQUAL:"Same as",
  ESSAY:"Written piece",EXCEL:"Do very well",EXTRA:"More than needed",FABLE:"Short story",
  FALLS:"Tumbles down",FALSE:"Not true",FANCY:"Elaborate",FEAST:"Big meal",
  FENCE:"Boundary",FERRY:"Water transport",FETCH:"Go get it",FIBER:"Thread",
  FIFTH:"After fourth",FIFTY:"Half hundred",FIXED:"Repaired",FIZZY:"Bubbly",
  FLANK:"Side",FLASH:"Quick light",FLASK:"Container",FLEET:"Group",FLESH:"Body tissue",
  FLICK:"Quick snap",FLOCK:"Group of birds",FLOOD:"Overflow",FLOUR:"Baking base",
  FLUID:"Liquid",FLUTE:"Wind instrument",FOGGY:"Hazy",FOLLY:"Foolish act",
  FORAY:"Quick trip",FORTY:"Four tens",FORUM:"Discussion",FRAIL:"Delicate",
  FRAME:"Structure",FRANK:"Honest",FRAUD:"Deception",FRESH:"New",FROST:"Ice coating",
  FRUIT:"Sweet produce",FUNNY:"Amusing",GHOST:"Spirit",GLARE:"Harsh light",
  GLOOM:"Darkness",GLOSS:"Shine",GLOVE:"Hand cover",GOING:"Departing",
  GRADE:"Level",GRASS:"Green cover",GRAZE:"Light touch",GROAN:"Sound of feeling",
  GROSS:"Before deductions",GROVE:"Small forest",GROWN:"Fully developed",
  HABIT:"Regular pattern",HANDY:"Useful",HAZEL:"Light brown",HENCE:"Therefore",
  HERBS:"Plant seasonings",HINGE:"Pivot point",HOMER:"Home run",HORSE:"Riding animal",
  HUMAN:"Person",HUMID:"Moist air",HURRY:"Move fast",INBOX:"Messages in",
  INPUT:"Data in",ISSUE:"Matter",IVORY:"White shade",JAZZY:"Lively",JEWEL:"Precious stone",
  JOINT:"Shared",JOKER:"Funny card",JUMPY:"Nervous",KAYAK:"Paddle boat",
  KNACK:"Natural skill",KNIFE:"Sharp tool",KNOCK:"Tap firmly",LANCE:"Pointed rod",
  LABEL:"Identify",LATCH:"Catch",LEAFY:"Full of leaves",LEGAL:"Lawful",
  LEMON:"Sour citrus",LINGO:"Language",LOGIC:"Reasoned thought",LUNAR:"Moon-related",
  LYRIC:"Song words",MAPLE:"Tree with syrup",MEDIA:"Communications",MERRY:"Cheerful",
  MESSY:"Untidy",METAL:"Hard material",METRO:"City center",MOTIF:"Repeated pattern",
  MOTOR:"Engine",MOUNT:"Climb up",MOUSE:"Small rodent",MOUTH:"Speaking part",
  MOVIE:"Film",MUDDY:"Dirty",NAIVE:"Inexperienced",NOISY:"Loud",NOTCH:"Small cut",
  NOTED:"Well-known",NURSE:"Care giver",OCCUR:"Happen",OCEAN:"Vast water",
  OFFER:"Put forward",OFTEN:"Many times",ONSET:"Beginning",OPERA:"Musical drama",
  OUTER:"Outside",OWNER:"Possessor",PAINT:"Color with brush",PAUSE:"Brief stop",
  PETTY:"Small-minded",PHASE:"Stage",PHONE:"Call device",PIXEL:"Screen dot",
  PLACE:"Location",PLANK:"Flat board",PLAZA:"Open square",PLEAD:"Beg earnestly",
  PLUCK:"Pull out",PLUSH:"Luxurious",POKER:"Card game",POLAR:"Near a pole",
  POSED:"Positioned",POUCH:"Small bag",POUND:"Strike hard",PRANK:"Playful trick",
  PRICE:"Cost",PRINT:"Reproduce",PRISM:"Light bender",PROBE:"Investigate",
  PROSE:"Plain writing",PROVE:"Show true",PROWL:"Roam quietly",PULSE:"Heartbeat",
  QUERY:"Question",QUEUE:"Line up",QUOTA:"Set amount",QUOTE:"Repeat words",
  RADAR:"Detection system",RADIO:"Broadcast",RALLY:"Come together",RAVEN:"Black bird",
  REALM:"Kingdom",REBEL:"Go against",REMIT:"Send back",REPAY:"Pay back",
  RESET:"Start over",RIDGE:"Long crest",RIGID:"Not flexible",RIVAL:"Competitor",
  ROAST:"Cook dry heat",ROCKY:"Uneven",ROUGE:"Red color",SADLY:"With sadness",
  SAINT:"Holy person",SALAD:"Fresh mix",SALON:"Style place",SASSY:"Bold",
  SAVOR:"Enjoy fully",SCONE:"Baked treat",SCOOP:"Gather up",SCOPE:"Extent",
  SCOUT:"Explore",SEIZE:"Grab",SENSE:"Perceive",SEVEN:"Lucky number",
  SHADE:"Partial darkness",SHAKE:"Move rapidly",SHAME:"Embarrassment",SHEAR:"Cut away",
  SHELF:"Storage ledge",SHELL:"Outer casing",SHIFT:"Move or change",SHINE:"Give light",
  SHOCK:"Sudden surprise",SHORE:"Land by water",SHOUT:"Yell",SHOWN:"Displayed",
  SHRUB:"Small bush",SIGMA:"Greek letter",SIXTH:"After fifth",SKATE:"Glide on ice",
  SKULL:"Head bone",SLANT:"Angle",SLATE:"Dark stone",SLICK:"Smooth",SLIDE:"Glide down",
  SLOPE:"Incline",SMART:"Clever",SMASH:"Break",SMOKE:"Fire output",SNACK:"Light bite",
  SNARE:"Trap",SOLAR:"Sun-powered",SOLVE:"Find answer",SORRY:"Regretful",
  SPARE:"Extra",SPAWN:"Give rise to",SPECK:"Tiny dot",SPINE:"Back bone",
  SPOOL:"Winding cylinder",SPOON:"Curved utensil",SPORT:"Athletic game",
  SPRAY:"Scatter liquid",STACK:"Pile up",STALE:"Not fresh",STAMP:"Mark firmly",
  STARE:"Look intently",START:"Begin",STARK:"Bare",STEEP:"Sharp incline",
  STICK:"Thin rod",STING:"Sharp pain",STOCK:"Supply",STOMP:"Step hard",
  STONE:"Hard mineral",STOOP:"Bend down",STORM:"Wild weather",STOUT:"Strong built",
  STOVE:"Cooking surface",STRAP:"Bind",STRAW:"Hollow tube",STRIP:"Remove",
  STUCK:"Unable to move",STUMP:"Tree base",STUNG:"Got bitten",STUNT:"Daring act",
  SUNNY:"Full of sun",SURGE:"Rush forward",SWEAR:"Promise solemnly",SWEEP:"Clean up",
  SWELL:"Grow bigger",SWEPT:"Cleaned up",SWIRL:"Circular motion",SWOOP:"Dive down",
  TAUNT:"Mock",TENSE:"Tight feeling",TENTH:"After ninth",TIGER:"Striped cat",
  TIMER:"Counting device",TITLE:"Name given",TOTEM:"Symbol",TOXIC:"Poisonous",
  TREAD:"Step on",TRIBE:"Social group",TRICK:"Clever move",TRIED:"Attempted",
  TROOP:"Group",TRULY:"With sincerity",TUNED:"Adjusted",TUTOR:"Teacher",
  TWIST:"Turn around",ULTRA:"Extreme",UNIFY:"Bring together",UPSET:"Troubled",
  URBAN:"City-based",USAGE:"How it's used",USUAL:"Normal",UTTER:"Completely",
  VAGUE:"Not clear",VAPOR:"Mist",VAULT:"Jump over",VIGOR:"Energy",VIRAL:"Spreading",
  VITAL:"Essential",VIVID:"Bright and clear",VOCAL:"Out loud",VOWEL:"Open sound",
  WAGER:"Bet",WRATH:"Fierce anger",YACHT:"Sailing vessel",ZEBRA:"Striped animal",
  ZONES:"Areas",ZONAL:"By area",YOUNG:"Fresh and new",YIELD:"Give way",

  // Additional 3-letter fill
  ABS:"Stomach muscles",ADS:"Commercials",AGS:"Agricultural abbr.",ALT:"Alternate",AMP:"Electrical unit",
  APT:"Fitting",ARF:"Dog sound",ARS:"Plural of ar",AXE:"Chopping tool",AYS:"Ayes",
  BAS:"Low tones",BOS:"Male cattle",BOT:"Automated program",CAB:"Taxi",COB:"Corn stalk",
  COD:"Ocean fish",CUD:"Chewed food",CUR:"Mongrel dog",DAB:"Gentle touch",DAM:"Water barrier",
  DEB:"Society girl",DEL:"Delete key",DEN:"Private room",DIE:"Perish",DIM:"Low light",
  DON:"Put on",DOP:"Small cup",DOS:"Musical note",DUB:"Nickname",DUD:"Failure",
  EEL:"Slippery fish",EMU:"Australian bird",ERR:"Make mistake",EST:"Established",ETA:"Greek letter",
  FED:"Past of feed",FEE:"Charge",FIB:"Small lie",FIN:"Fish appendage",FOE:"Enemy",
  FON:"Fool",FOR:"In favor of",FRO:"Afro style",FRY:"Cook in oil",FUB:"Chubby child",
  GAB:"Chatter",GAL:"Girl",GAM:"School of whales",GAS:"Fuel",GAY:"Joyful",
  GEE:"Mild surprise",GIN:"Spirit drink",GNU:"African animal",GOB:"Lump",GOP:"Political abbr.",
  HAG:"Old woman",HEP:"In the know",HEW:"Chop",HEX:"Curse",HIE:"Hasten",
  HIT:"Strike",HUB:"Center",HUE:"Color shade",HUT:"Small shelter",IDS:"Identity cards",
  IFS:"Conditions",IMP:"Mischievous child",INK:"Writing fluid",ION:"Charged particle",IRE:"Anger",
  ISM:"Belief system",ITS:"Belonging to it",IVY:"Climbing plant",JAW:"Mouth part",JOT:"Quick note",
  JOW:"Strike a bell",JUG:"Pitcher",KAY:"Letter K",KEG:"Small barrel",KEN:"Range of knowledge",
  LAD:"Young boy",LAG:"Fall behind",LAX:"Not strict",LAY:"Place down",LEA:"Meadow",
  LED:"Guided",LID:"Cover",LIP:"Mouth edge",LIT:"Illuminated",LOB:"Throw high",
  LOT:"Many",LUG:"Carry heavy",MAD:"Angry",MAW:"Throat",MOO:"Cow sound",
  MOW:"Cut grass",NAB:"Catch",NAG:"Pester",NAP:"Short sleep",NAY:"No vote",
  OAF:"Clumsy person",OAK:"Sturdy tree",OAR:"Rowing tool",OCA:"Andean plant",ODE:"Lyric poem",
  OFT:"Often",OHM:"Resistance unit",OPE:"Open",OPT:"Choose",ORB:"Sphere",
  ORE:"Metal rock",OWE:"Be in debt",OWL:"Night bird",OWN:"Possess",PAP:"Soft food",
  PAR:"Equal standing",PEW:"Church seat",PIX:"Photos",PLY:"Layer",POI:"Hawaiian food",
  POW:"Strike sound",PRY:"Poke around",PUG:"Dog breed",PUN:"Word play",PUP:"Young dog",
  RAW:"Uncooked",RAY:"Beam",REC:"Recreation",REF:"Official",REP:"Representative",
  RIB:"Tease",RIM:"Edge",ROE:"Fish eggs",ROW:"Line or argument",RUE:"Regret",
  RUN:"Move fast",RUT:"Groove",SAG:"Droop",SEA:"Ocean",SHE:"Female pronoun",
  SKI:"Snow sport",SKY:"Above clouds",SLY:"Clever",SOD:"Turf",SON:"Male child",
  SOP:"Appease",SOT:"Heavy drinker",SPA:"Wellness place",SUM:"Total",SUN:"Star",
  SUP:"Eat supper",TAD:"Little bit",TAG:"Label",TAN:"Sun color",TAO:"The way",
  TEA:"Hot drink",TEN:"Number",TIE:"Neck wear or draw",TIN:"Metal can",TON:"Heavy amount",
  TOO:"Also",TOW:"Pull along",TOY:"Plaything",TRY:"Attempt",TSK:"Disapproval",
  TUP:"Male sheep",TUX:"Formal suit",TWO:"Number 2",URN:"Vase",USE:"Employ",
  VAN:"Vehicle",VAT:"Large tank",VEE:"Letter V",VET:"Animal doctor",VIA:"By way of",
  VOW:"Solemn promise",WAD:"Bundle",WAR:"Conflict",WAS:"Past of be",WEB:"Spider's work",
  WED:"Marry",WEE:"Tiny",WET:"Moist",WHO:"Which person",WIT:"Clever humor",
  WOE:"Great sorrow",WOG:"Locomotive",WON:"Achieved victory",WOO:"Court",WOT:"Know",
  YAK:"Shaggy ox",YAM:"Sweet potato",YAP:"Bark sharply",YEN:"Japanese currency",YEP:"Yes",
  YEW:"Evergreen tree",YOB:"Rude youth",YON:"Over there",YOU:"Second person",

  // Additional 4-letter fill
  ABLE:"Has the skill",ACHE:"Dull pain",ACRE:"Land measure",AGED:"Advanced in years",
  AGUE:"Shivering fever",AHEM:"Throat clearing",AIDE:"Assistant",AKIN:"Related",
  ALAN:"Male name",ALOE:"Healing plant",ALSO:"As well",ALTO:"Low female voice",
  ALUM:"Former student",AMOK:"Out of control",AMPS:"Power units",ANAL:"Overly precise",
  ANDS:"Connecting words",ANKH:"Egyptian cross",ANNA:"Female name",ANNE:"Female name",
  ANON:"Soon",ANTS:"Colony insects",APES:"Mimics",APEX:"Highest point",
  AQUA:"Blue-green",ARCH:"Curved structure",AREA:"Region",ARIA:"Opera solo",
  ARID:"Very dry",ARKS:"Boats",ARMS:"Weapons",ARTY:"Artistically inclined",
  ASHY:"Pale",ATOP:"On top",AVOW:"Declare",AWAY:"At a distance",AWED:"Filled with wonder",
  AWRY:"Off course",AXLE:"Wheel rod",AYES:"Yes votes",BAIT:"Lure",BALK:"Refuse",
  BALM:"Soothing ointment",BANGS:"Fringe hair",BARK:"Tree skin or dog sound",
  BASE:"Foundation",BASK:"Enjoy warmth",BEAM:"Ray of light",BEAN:"Legume",
  BECK:"Stream",BEEN:"Past participle",BEER:"Malt drink",BEES:"Buzzing insects",
  BELL:"Ring device",BERG:"Ice mountain",BEST:"Top",BILL:"Invoice",BLOT:"Ink stain",
  BLOW:"Wind",BLUE:"Cool color",BLUR:"Smear",BOAT:"Watercraft",BODY:"Physical form",
  BOIL:"Heat to bubbling",BOLD:"Brave",BONE:"Skeletal piece",BOOK:"Written work",
  BOOT:"Footwear",BORE:"Dull person",BOSS:"Manager",BOTH:"Two together",BOUT:"Contest",
  BOXY:"Square-shaped",BUFF:"Polish or enthusiast",BULL:"Male bovine",BUMP:"Jolt",
  BUNK:"Sleep platform",BUOY:"Floating marker",BURY:"Put underground",BUZZ:"Humming sound",
  CAFE:"Coffee house",CALL:"Summon",CALM:"Peaceful",CAME:"Arrived",CAMP:"Outdoor stay",
  CANE:"Walking stick",CARP:"Complain",CASE:"Instance",CASH:"Currency",CATS:"Felines",
  CELL:"Basic unit",CENT:"Penny",CHEF:"Cook",CHIN:"Face bottom",CHOP:"Cut",
  CLAM:"Bivalve",CLAP:"Applaud",CLAW:"Sharp nail",CLOG:"Block up",CLOT:"Mass",
  CLUE:"Hint",COIN:"Metal money",COLD:"Low temperature",COLT:"Young horse",COMA:"Deep sleep",
  COME:"Arrive",COMP:"Complimentary",CONE:"Pointed shape",COOK:"Prepare food",COPY:"Duplicate",
  CORD:"Rope",CORK:"Bottle stopper",CORN:"Grain crop",COZY:"Comfortable",CREW:"Team",
  CRIB:"Baby bed",CROW:"Black bird",CURE:"Treatment",CURL:"Bend",DAGGER:"Sharp blade",
  DAWN:"Early morning",DAYS:"Time periods",DEAD:"Not living",DEAL:"Agreement",DEAR:"Beloved",
  DEED:"Action or document",DEEP:"Far down",DEER:"Forest animal",DEFT:"Nimble",DELL:"Small valley",
  DENS:"Cozy rooms",DEW:"Morning moisture",DICE:"Cube game pieces",DIET:"Food plan",DILL:"Herb",
  DIRE:"Urgent",DIRT:"Soil",DOGS:"Canines",DOWN:"Lower direction",DRAG:"Pull",DREW:"Past of draw",
  DROP:"Fall",DRUM:"Beat instrument",DRIP:"Slow fall",DUAL:"Double",DUCK:"Waterfowl",
  DULL:"Not sharp",DUMP:"Drop carelessly",DUSK:"Evening light",DUST:"Fine powder",
  DYES:"Colors fabric",EDGE:"Rim",ELSE:"Otherwise",ENDS:"Conclusions",EPIC:"Grand story",
  ETCH:"Engrave",EVEN:"Flat or also",EVER:"At any time",EVIL:"Wicked",EYES:"Seeing organs",
  FADS:"Brief trends",FAIL:"Not succeed",FAIN:"Willing",FAKE:"Not real",FALL:"Tumble down",
  FARM:"Crop land",FAST:"Quick or not eating",FELT:"Past of feel",FELL:"Past of fall",FERN:"Forest plant",
  FILE:"Organize",FILL:"Make full",FINE:"Good or penalty",FIRE:"Blaze",FIRM:"Solid",FISH:"Aquatic animal",
  FIST:"Clenched hand",FLAG:"Banner",FLAT:"Even surface",FLAW:"Defect",FLEW:"Traveled by air",
  FLOW:"Move smoothly",FOAM:"Frothy mass",FOLD:"Double over",FOND:"Affectionate",FONT:"Type style",
  FOOT:"Base",FORM:"Shape",FOWL:"Bird",FRAY:"Wear out",FREE:"Without cost",
  FROG:"Amphibian",FROM:"Starting point",FULL:"Filled up",FUSE:"Blend or safety device",
  GALA:"Festive event",GAME:"Play or brave",GASH:"Deep cut",GAZE:"Stare",GIFT:"Present",
  GIST:"Main point",GLOW:"Warm light",GLUE:"Adhesive",GNAW:"Chew away",GOLD:"Precious metal",
  GOLF:"Links game",GONE:"Departed",GONG:"Large bell",GOOD:"Positive",GOOP:"Sticky substance",
  GOSH:"Mild surprise",GOWN:"Long dress",GRAY:"Neutral color",GRIN:"Big smile",GRUB:"Food or larva",
  HAIL:"Ice storm or greet",HAIR:"Head threads",HAND:"Appendage",HARD:"Difficult",HARM:"Hurt",
  HAZE:"Mist",HAZY:"Not clear",HEAP:"Pile",HEIR:"Inheritor",HELP:"Assist",HERD:"Animal group",
  HIGH:"Elevated",HINT:"Clue",HOLE:"Opening",HOME:"Dwelling",HOOK:"Curved catch",HORN:"Blow or animal growth",
  HOST:"Party giver",HUGE:"Very large",HUNG:"Past of hang",HYMN:"Religious song",IDEA:"Thought",
  IDLE:"Inactive",ITCH:"Need to scratch",ITEM:"Thing",JAIL:"Lock up",JUMP:"Leap",JUST:"Merely",
  KEEP:"Hold on to",KILL:"End life",KIND:"Type or gentle",KNEW:"Past of know",LACK:"Be without",
  LADY:"Woman",LAND:"Earth",LANE:"Road division",LATE:"After time",LAWN:"Grass area",
  LAZY:"Not active",LEAD:"Guide or metal",LEAN:"Thin or tilt",LEFT:"Direction",LIFE:"Existence",
  LIKE:"Similar or enjoy",LIME:"Citrus or color",LINE:"Streak",LIVE:"Exist",LOCK:"Secure",
  LONE:"Solitary",LONG:"Extended",LOOK:"See",LOOM:"Weave or linger",LORD:"Master",LORE:"Traditional knowledge",
  LOSE:"Not win",LOTS:"Many",LOVE:"Deep affection",LUCK:"Fortune",LUSH:"Rich growth",LUST:"Strong desire",
  MADE:"Built",MAIN:"Primary",MAKE:"Create",MALL:"Shopping center",MANY:"Numerous",MARK:"Sign",
  MARS:"Red planet",MAST:"Ship pole",MATH:"Numbers",MAZE:"Puzzle path",MEAL:"Eating time",
  MEET:"Encounter",MILD:"Gentle",MILL:"Grinder",MINT:"Fresh herb or coin",MISS:"Not hit",MOLE:"Small animal",
  MOOD:"Feeling",MOON:"Night light",MORE:"Extra",MOST:"Greatest amount",MOVE:"Change place",MUCH:"A lot",
  MUST:"Obligation",MYTH:"Old story",NAIL:"Fasten or fingernail",NAME:"Identity",NEAR:"Close",
  NEED:"Require",NEWS:"Information",NEXT:"Following",NICE:"Pleasing",NINE:"Number 9",NODE:"Connection point",
  NONE:"Not any",NOTE:"Written message",NOUN:"Naming word",NUMB:"Without feeling",OBEY:"Follow orders",
  ONLY:"Solely",OPEN:"Not closed",ORAL:"Spoken",OVAL:"Egg-shaped",OVER:"Above",OWED:"Due",
  PACE:"Speed",PACK:"Bundle",PAGE:"Sheet of paper",PAID:"Compensated",PAIN:"Suffering",PAIR:"Two",
  PALM:"Tree or hand part",PARK:"Green space",PART:"Portion",PAST:"Before now",PATH:"Trail",
  PEAK:"Summit",PEEL:"Remove skin",PICK:"Select",PILE:"Stack",PINK:"Light red",PINT:"Half quart",
  PLOD:"Walk heavily",PLOT:"Plan or story",POKE:"Nudge",POLE:"Long rod",PORT:"Harbor",POST:"Send or stake",
  POUR:"Flow out",PRAY:"Ask God",PREP:"Get ready",PREY:"Hunt target",PROD:"Push",PROM:"School dance",
  PROP:"Support",PUFF:"Breath of air",PURE:"Clean",PUSH:"Shove",QUIZ:"Test",RACK:"Shelf",
  RACE:"Speed contest",RAIN:"Water drops",RAKE:"Garden tool",RANG:"Past of ring",RAZE:"Demolish",REAL:"Actual",
  REIN:"Control strap",RELY:"Depend",REST:"Take a break",RHYME:"Sound alike",RICH:"Wealthy",RIDE:"Travel on",
  RIFT:"Split",RING:"Circular band",RISE:"Go up",RISK:"Danger",ROAD:"Travel route",ROCK:"Stone or sway",
  ROLE:"Part to play",ROOF:"Top cover",ROOM:"Space",ROPE:"Thick cord",ROSE:"Flower or past of rise",
  RUDE:"Impolite",RULE:"Guideline",RUSH:"Hurry",SAFE:"Secure",SAGE:"Wise person or herb",
  SAIL:"Wind power boat",SAKE:"Reason",SALT:"Seasoning",SAME:"Identical",SAND:"Fine grain",
  SANG:"Past of sing",SANK:"Past of sink",SAVE:"Rescue",SCAM:"Fraud",SIGH:"Deep breath",
  SILK:"Smooth fabric",SING:"Make music",SINK:"Go under",SIZE:"Dimension",SKIP:"Jump over",
  SLAB:"Flat piece",SLAM:"Hit hard",SLAP:"Strike flat",SLEW:"Great number",SLIM:"Slender",
  SLIP:"Slide",SLOG:"Work hard",SLOP:"Spill",SLOT:"Opening",SLUR:"Smear",SNAP:"Break suddenly",
  SNOW:"White flakes",SOAK:"Drench",SOAR:"Fly high",SOCK:"Footwear",SONG:"Musical piece",
  SOON:"Before long",SORT:"Arrange",SOUL:"Inner being",SOUP:"Liquid meal",SOWN:"Planted",
  SPAN:"Distance across",SPIN:"Rotate",SPIT:"Eject",STEM:"Stalk",STEP:"Footfall",STIR:"Mix",
  STOP:"Halt",SUCH:"Of that type",SUIT:"Outfit",SWAN:"White bird",SWIM:"Move in water",
  TAIL:"Back end",TALE:"Story",TALL:"High",TAME:"Gentle",TANG:"Sharp flavor",TASK:"Job",
  TEAM:"Group",TEND:"Care for",TEST:"Trial",THAT:"Indicated thing",THUD:"Heavy blow sound",
  TICK:"Check mark",TIDE:"Ocean flow",TILT:"Lean",TIME:"Duration",TINY:"Very small",
  TOLD:"Past of tell",TOLL:"Cost",TONG:"Gripping tool",TOOL:"Instrument",TORN:"Ripped",
  TOSS:"Throw lightly",TOUR:"Journey",TOWN:"Small settlement",TREE:"Tall plant",TRIM:"Cut neatly",
  TRUE:"Correct",TUCK:"Fold in",TUNE:"Melody",TURF:"Grass",TURN:"Rotate",TWIN:"Pair",
  TYPE:"Kind or print",UGLY:"Unattractive",UNIT:"Single measure",UNTO:"Up to",UPON:"On",
  URGE:"Push forward",VEIL:"Cover",VERB:"Action word",VIEW:"Sight",VILE:"Disgusting",
  VINE:"Climbing plant",VISA:"Travel permit",VOLT:"Power unit",VOTE:"Express choice",
  WADE:"Walk through water",WAGE:"Salary",WAKE:"Become aware",WALK:"Move on foot",WALL:"Barrier",
  WAND:"Magic stick",WANT:"Desire",WARM:"Moderately hot",WARP:"Bend out of shape",WART:"Small bump",
  WASH:"Clean with water",WASP:"Stinging insect",WAVE:"Hand gesture or water",WEAK:"Not strong",
  WEAR:"Have on body",WEED:"Unwanted plant",WELL:"In good health",WENT:"Past of go",WERE:"Past plural be",
  WHAT:"Which thing",WHEN:"What time",WHOM:"Which person (obj.)",WICK:"Candle cord",WIDE:"Broad",
  WIFE:"Married woman",WILL:"Future tense",WINK:"Eye signal",WISH:"Desire",WITH:"Accompanying",
  WOKE:"Past of wake",WOMB:"Birth place",WOOD:"Timber",WOOL:"Sheep fiber",WORD:"Unit of language",
  WORE:"Past of wear",WORK:"Labor",WORM:"Crawling creature",WORN:"Used up",WRAP:"Cover",
  WREN:"Small bird",YAWN:"Tired breath",YEAH:"Yes",YEAR:"Twelve months",YELL:"Shout",
  YORE:"Long ago",YOUR:"Belonging to you",

  // Additional 5-letter fill
  ABIDE:"Stay with",ABODE:"Dwelling place",ABOVE:"Higher up",ABUSE:"Mistreat",ACTED:"Did perform",
  ACUTE:"Sharp",ADORE:"Love deeply",ADULT:"Grown person",AFTER:"Following",AGENT:"Representative",
  AGILE:"Nimble",AGLOW:"Lit up",AILED:"Was sick",AIMED:"Pointed at",AIRED:"Broadcast",
  AISLE:"Walk-through path",ALBUM:"Photo collection",ALDER:"Stream tree",ALERT:"On guard",
  ALLAY:"Calm down",ALLOT:"Assign",ALTER:"Change",AMBER:"Warm orange",AMBLE:"Stroll",
  ANGEL:"Heavenly being",ANGER:"Fury",ANGLE:"Corner",ANKLE:"Joint",ANNEX:"Addition",
  ANTIC:"Funny act",ANVIL:"Blacksmith block",APLLY:"Apply",APPLE:"Round fruit",APRIL:"Spring month",
  APRON:"Kitchen cover",APTLY:"Fittingly",ARDOR:"Passion",ARENA:"Stadium",ARGON:"Noble gas",
  ARGUE:"Disagree",ARRAY:"Arrangement",ARROW:"Pointed shaft",ARTSY:"Artistic",ASCOT:"Neck cloth",
  ASHEN:"Pale",ASKED:"Inquired",ASSET:"Resource",ATTIC:"Top floor",AUDIO:"Sound",
  AUDIT:"Check over",AVAIL:"Use or benefit",AVOID:"Stay away",AWASH:"Flooded",AWFUL:"Terrible",
  BADGE:"Identifying pin",BAGEL:"Ring bread",BAKED:"Cooked in oven",BAKER:"Bread maker",
  BANJO:"String instrument",BASTE:"Moisten while cooking",BATCH:"Group",BELOW:"Under",
  BENCH:"Seat",BIBLE:"Holy text",BINGO:"Luck game",BIRCH:"White tree",BISON:"Prairie animal",
  BLAND:"Not exciting",BLINK:"Quick eye close",BLOAT:"Swell up",BLOND:"Light hair",
  BLOOD:"Life fluid",BLOWN:"Pushed by wind",BLUNT:"Not sharp or honest",BONUS:"Extra gift",
  BOOBY:"Silly person",BOXER:"Fighter or dog",BRACE:"Support",BRAIN:"Thinking organ",
  BRAVE:"Courageous",BREAD:"Baked staple",BREED:"Type",BREVE:"Short musical note",
  BRIAR:"Thorny plant",BRINE:"Salt water",BRISK:"Lively",BROTH:"Soup base",BROWN:"Earthy color",
  BRUNT:"Main force",BUDGE:"Move slightly",BUGLE:"Military horn",BULKY:"Large",BULLY:"Tormentor",
  BUMPY:"Uneven",BUXOM:"Curvaceous",CABIN:"Small house",CABLE:"Strong rope",CADDY:"Golf helper",
  CAMEL:"Desert animal",CAMEO:"Brief appearance",CANDY:"Sweet treat",CARGO:"Freight",CAROL:"Joyful song",
  CARRY:"Transport",CATER:"Provide food",CEDAR:"Fragrant wood",CHAIR:"Seat",CHALK:"White marker",
  CHAMP:"Champion",CHANT:"Rhythmic song",CHARM:"Appeal",CHART:"Graph",CHASE:"Pursue",
  CHEAP:"Low cost",CHEER:"Encourage",CHESS:"Board game",CHEST:"Torso or box",CHICK:"Baby bird",
  CHIEF:"Leader",CHILD:"Young person",CHILI:"Spicy dish",CHILL:"Cool down",CHINA:"Fine dishes",
  CHOIR:"Singing group",CHOKE:"Block airway",CHUNK:"Large piece",CIVIL:"Polite",CLAIM:"Assert",
  CLANG:"Metal sound",CLEAN:"Not dirty",CLEAR:"Transparent",CLERK:"Office worker",CLICK:"Sharp sound",
  CLIFF:"Rock face",CLIMB:"Go up",CLING:"Hold tight",CLOCK:"Time keeper",CLONE:"Exact copy",
  CLOSE:"Shut or near",CLOTH:"Fabric",CLOUD:"Sky mass",CLOWN:"Funny person",CLUB:"Group",
  COACH:"Trainer",COBRA:"Venomous snake",COCOA:"Chocolate base",COMET:"Space rock",
  COMIC:"Funny",COMMA:"Pause mark",CORAL:"Ocean organism",COULD:"Was able",COUNT:"Number",
  COVET:"Want badly",COWER:"Shrink in fear",CRAMP:"Muscle spasm",CRAWL:"Move low",CREAM:"Rich white",
  CREEK:"Small stream",CREST:"Top of wave",CRIMP:"Pinch",CROWN:"Regal headwear",CRUMB:"Small piece",
  CRUSH:"Squeeze or admire",CRUST:"Outer layer",CUBIC:"Three dimensional",CURVE:"Bent line",
  DAILY:"Every day",DAISY:"White flower",DANCE:"Move rhythmically",DARTS:"Throwing game",
  DAZED:"Confused",DECOY:"Lure",DELVE:"Dig deep",DEMON:"Evil spirit",DEPOT:"Station",
  DEPTH:"How deep",DERBY:"Hat or race",DESKS:"Work surfaces",DIGIT:"Number or finger",
  DIMLY:"Not brightly",DINER:"Small restaurant",DINGY:"Shabby",DIRTY:"Not clean",DISCO:"Dance club",
  DIZZY:"Unsteady",DOGMA:"Firm belief",DONOR:"Giver",DONUT:"Ring pastry",DOWRY:"Wedding gift",
  DROOL:"Excess saliva",DROVE:"Past of drive",DROWN:"Go under water",DRUNK:"Intoxicated",
  DRYER:"Clothes machine",DUSKY:"Dimly lit",DWARF:"Small creature",DWELL:"Live in",DYING:"Fading out",
  EARLY:"Before time",EARNS:"Gets paid",EARTH:"Our planet",EASEL:"Art stand",EATEN:"Consumed",
  EDGED:"Bordered",EIGHT:"The number 8",ELDER:"Older person",ELBOW:"Arm joint",ELEGY:"Sad poem",
  ELITE:"Chosen few",EMBER:"Glowing coal",EMCEE:"Host",ENDED:"Finished",ENACT:"Put into law",
  ENDOW:"Give funds",ENJOY:"Take pleasure",ENRICH:"Make better",ENSUE:"Follow from",
  ENTRY:"Coming in",ENVOY:"Representative",EQUAL:"Same level",ERASE:"Remove",ESSAY:"Written piece",
  EVENT:"Happening",EVOKE:"Call up",EXACT:"Precise",EXCEL:"Exceed",EXIST:"Be present",
  EXILE:"Send away",EXTRA:"Bonus",EXULT:"Rejoice",FAINT:"Barely there",FAITH:"Belief",
  FARCE:"Comedy",FATAL:"Deadly",FEAST:"Big dinner",FEEBLE:"Weak",FERAL:"Wild",
  FERRY:"Water crossing",FETCH:"Go and get",FEUD:"Long dispute",FEVER:"High temp",FIERY:"Burning",
  FINCH:"Small bird",FLAME:"Fire",FLARE:"Burst of light",FLESH:"Body tissue",FLIER:"Pamphlet",
  FLING:"Throw",FLOOR:"Bottom level",FLOSS:"Dental thread",FLUID:"Liquid substance",
  FOCAL:"Central",FOCUS:"Center",FOGGY:"Hard to see",FOLIO:"Page",FORTE:"Strong suit",
  FORUM:"Public space",FREED:"Set free",FROTH:"Bubbles",FROZE:"Past of freeze",FUDGE:"Candy or fake",
  GAUGE:"Measure",GLIDE:"Smooth flight",GLINT:"Quick shine",GLOBE:"Sphere",GLYPH:"Symbol",
  GNOME:"Garden creature",GODLY:"Pious",GORGE:"Eat a lot",GRACE:"Elegance",GRADE:"Level",
  GRAIN:"Small seed",GRANT:"Give freely",GRASP:"Hold",GRATE:"Shred or annoy",GRAVE:"Burial site",
  GRAZE:"Nibble",GREED:"Wanting too much",GREET:"Welcome",GROAN:"Sound of discomfort",GROPE:"Feel around",
  GROVE:"Cluster of trees",GROWL:"Low warning sound",GRUEL:"Thin porridge",GRUFF:"Rough manner",
  GRUMP:"Surly person",GUILE:"Trickery",GUISE:"False front",GUSTO:"Enthusiasm",GUTSY:"Brave",
  HANDY:"Convenient",HAPPY:"Joyful",HARSH:"Severe",HASTE:"Speed",HAUNT:"Linger",
  HEART:"Love organ",HEAVY:"Much weight",HENCE:"From here",HILLY:"Rolling terrain",HIPPO:"Large animal",
  HOARD:"Store secretly",HOLLY:"Christmas plant",HONOR:"High regard",HOUND:"Hunting dog",
  HUBBY:"Husband",HURDLE:"Jump over",HUSKY:"Strong or hoarse",HYPER:"Overly excited",
  IGLOO:"Ice house",IMAGE:"Picture",IMPLY:"Suggest",IRATE:"Angry",IRONY:"Contradiction",
  ITCHY:"Scratchy",JUDGE:"Evaluate",JUICE:"Liquid extract",JUMBO:"Very large",JUNTO:"Political group",
  KARMA:"Cosmic balance",KINKY:"Unusual",KITTY:"Cat",KNEEL:"Go to knees",KNOWN:"Recognized",
  LABOR:"Work hard",LANCE:"Pointed spear",LARVA:"Insect stage",LATCH:"Hook and catch",LAUGH:"Express joy",
  LAYER:"Level",LEAFY:"Full of greenery",LEAKY:"Not watertight",LEAPT:"Jumped",LEARN:"Gain knowledge",
  LEASH:"Animal restraint",LEAST:"Minimum",LEAVE:"Depart",LEDGE:"Narrow shelf",LEGAL:"Allowed",
  LIGHT:"Illuminate",LINER:"Large ship",LITHE:"Flexible",LIVER:"Body organ",LOCAL:"Nearby",
  LODGE:"Stay or cabin",LOFTY:"High minded",LOOPY:"Crazy",LOOSE:"Not tight",LOWLY:"Humble",
  LUCID:"Clear minded",LUCKY:"Fortunate",LUSTY:"Full of energy",MAGIC:"Wondrous",MAJOR:"Significant",
  MANOR:"Estate",MIRTH:"Laughter",MIXER:"Blending device",MOODY:"Changeable",MORAL:"Ethical lesson",
  MOSSY:"Covered in moss",MUDDY:"Covered in mud",MUSHY:"Soft",MUSTY:"Stale smell",
  NIFTY:"Handy",NIGHT:"Dark hours",NOBLE:"Of high rank",NOTED:"Famous",NOVEL:"New or book",
  NYMPH:"Nature spirit",OAKEN:"Made of oak",ODDLY:"Strangely",ODDER:"More strange",
  OFFAL:"Animal organs",OFTEN:"Frequently",ONSET:"Start",OPERA:"Sung drama",ORDER:"Command",
  OUTDO:"Surpass",OZONE:"Atmospheric layer",PADDY:"Rice field",PANSY:"Purple flower",
  PEARL:"Gem from oyster",PEEVE:"Annoy",PERCH:"High resting spot",PETAL:"Flower part",
  PETTY:"Unimportant",PIANO:"Keyboard instrument",PIOUS:"Devout",PIRATE:"Sea robber",
  PLAID:"Tartan pattern",PLAIN:"Simple",PLANE:"Flat or aircraft",PLANT:"Grow",PLAZA:"Public square",
  PLEAD:"Beg",PLEAT:"Fabric fold",PLUMB:"Exactly vertical",PLUME:"Feather",PLUNK:"Drop suddenly",
  PODGY:"Chubby",POLKA:"Dance style",POPPY:"Red flower",PORCH:"Entry deck",PORKY:"Chubby",
  POSSE:"Group",POTTY:"Silly",POUCH:"Small pocket",POUND:"Beat hard",POUTY:"Sulky",
  POWER:"Energy",PERKY:"Lively",PRIOR:"Before",PRIZE:"Reward",PRONG:"Fork tine",
  PROXY:"Stand-in",PLUMP:"Round and full",PUNNY:"Full of puns",PUPIL:"Student or eye part",PURSE:"Handbag",
  QUEEN:"Royal female",QUEST:"Search",QUIET:"Not loud",QUITE:"Very",QUOTA:"Set share",
  RAINY:"Wet weather",RAPID:"Fast",REGAL:"Royal",RELAX:"Rest",REPLY:"Respond",RIDER:"One who rides",
  RISKY:"Dangerous",RISEN:"Gone up",RIVET:"Fastener",ROOMY:"Spacious",ROUGH:"Not smooth",
  ROUND:"Circular",ROYAL:"Majestic",RUGGED:"Tough terrain",RULER:"Measuring stick",
  RUSTY:"Corroded",SADLY:"With sorrow",SAINT:"Holy being",SALTY:"Has salt",SANDY:"Like sand",
  SAUCE:"Liquid topping",SCALP:"Head skin",SCOUT:"Explore",SCUBA:"Underwater gear",
  SEAMY:"Sordid",SEEDY:"Run-down",SEIZE:"Grab hold",SERVE:"Provide",SETUP:"Arrangement",
  SEVEN:"Lucky 7",SHADY:"Not trustworthy",SHARP:"Keen",SHEER:"Pure or steep",SHELF:"Storage flat",
  SHIRT:"Upper garment",SHORT:"Not tall",SHOUT:"Yell",SHOWY:"Flashy",SILKY:"Smooth",
  SINCE:"From that time",SIXTH:"6th in order",SIXTY:"Six tens",SIZED:"Of a certain size",
  SKILL:"Ability",SKIMP:"Use too little",SLEPT:"Past of sleep",SLIME:"Gooey substance",
  SLINK:"Move stealthily",SLOTH:"Lazy animal",SLUMP:"Decline",SMEAR:"Spread",SMELL:"Sense or odor",
  SMILE:"Happy expression",SMITE:"Strike down",SMUG:"Self-satisfied",SNIFF:"Quick inhale",
  SNOWY:"White covered",SOGGY:"Waterlogged",SOLID:"Firm",SOLVE:"Work out",SORRY:"Regretful",
  SOUTH:"Direction",SPANK:"Hit on bottom",SPARK:"Small flame",SPEAK:"Talk",SPILL:"Overflow",
  SPINE:"Backbone",SPOKE:"Past of speak",SPOON:"Round utensil",SPORE:"Plant seed",
  SQUAD:"Small team",SQUAT:"Low crouch",SQUID:"Sea creature",STAKE:"Pointed post",STALE:"Old",
  STAMP:"Mark with seal",STEAD:"Place of another",STEEP:"Sharp angle",STEER:"Guide",
  STERN:"Strict or ship back",STIFF:"Rigid",STILL:"Quiet or yet",STOIC:"Unemotional",
  STORE:"Shop or save",STORY:"Narrative",STOUT:"Strong",STRAW:"Drinking tube",
  STRIP:"Remove layer",STRUT:"Walk proudly",STUFF:"Fill or material",STYLE:"Fashion",
  SUGAR:"Sweet substance",SULKY:"Moody",SUPER:"Great",SWAMP:"Wetland",SWEAR:"Vow",
  SWEET:"Sugary",SWOOP:"Dive fast",TACTIC:"Method",TAFFY:"Chewy candy",TALLY:"Count",
  TANGY:"Sharp flavor",TARDY:"Late",TAUNT:"Mock",TAWNY:"Golden brown",TEASE:"Playfully provoke",
  TENTH:"Number 10",TEPID:"Lukewarm",THEIR:"Belonging to them",THERE:"That place",THICK:"Dense",
  THING:"Object",THINK:"Ponder",THORN:"Sharp spike",THOSE:"Those ones",THREE:"Number 3",
  THREW:"Past of throw",THROW:"Hurl",THYME:"Herb",TIDAL:"Ocean related",TIDAL:"Ocean related",
  TIMED:"Measured duration",TIPSY:"Slightly drunk",TITLE:"Name",TODAY:"This day",
  TOKEN:"Symbol",TOPIC:"Subject",TORCH:"Burning light",TOTAL:"Full amount",TOUCH:"Contact",
  TOUGH:"Hard",TRACK:"Follow or path",TRAIL:"Path",TRAIN:"Teach or transport",TRAIT:"Characteristic",
  TRAMP:"Wander",TRASH:"Waste",TREAT:"Special gift",TREMBLE:"Shake",TREND:"Direction",
  TROOP:"Group of soldiers",TROTH:"Pledge",TRULY:"Honestly",TRUMP:"Beat",TRUST:"Confidence",
  TRUTH:"What is real",TULIP:"Spring flower",TUNIC:"Long shirt",TWIRL:"Spin around",
  USHER:"Guide",VALID:"Legitimate",VALUE:"Worth",VALVE:"Flow controller",VANISH:"Disappear",
  VERSE:"Poetry line",VICAR:"Parish minister",VIDEO:"Moving image",VIGOR:"Vitality",
  VIOLA:"String instrument",VISOR:"Eye shade",VISIT:"Go see",VISTA:"Scenic view",
  VOCAL:"Spoken",VOICE:"Sound from mouth",VOTER:"Ballot caster",VYING:"Competing",
  WALTZ:"Dance form",WAVER:"Hesitate",WEARY:"Tired",WEAVE:"Interlace",WEDGE:"Angled piece",
  WEEDY:"Overgrown",WIELD:"Handle",WHIFF:"Brief scent",WHILE:"During",WHIRL:"Spin",
  WHOLE:"Complete",WHOSE:"Belonging to whom",WIDEN:"Make broader",WINDY:"Breezy",WITTY:"Clever",
  WORDY:"Using too many words",WORLD:"The earth",WORRY:"Feel anxious",WORST:"Most bad",
  WORTH:"Value",WOULD:"Conditional",WRING:"Twist",WROTE:"Past of write",WRYLY:"With dry humor",
  YEARN:"Long for",YUMMY:"Delicious",ZESTY:"Full of flavor",ZIPPY:"Energetic",ZONED:"Regulated",
};

// ---------------------------------------------------------------------------
// Build word pool: WORD_CLUES + FILL_CLUES (curated, always preferred) PLUS
// system dictionary as extended fill (lowercase words only = no proper nouns).
// All pools have real clues via WORD_CLUES, FILL_CLUES, or getClue() patterns.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Extra curated fill words — common English words that need proper clues.
// Added to prevent them from falling through to generic auto-clues.
// ---------------------------------------------------------------------------
const EXTRA_FILL = {
  // 3-letter additions
  ERE:"Before (poetic)",HEY:"Greeting exclamation",HER:"She or her",
  LEE:"Sheltered side",LYE:"Caustic solution",TED:"Spread to dry",
  SHA:"Hush!",HET:"Worked up",NAT:"Small gnat-like bug",
  ZED:"Letter Z (British)",PHO:"Vietnamese noodle soup",CHI:"Greek letter",
  KEG:"Small barrel",HOD:"V-shaped trough",SOL:"Musical note",
  REE:"Sandpiper bird",PEE:"Urinate (informal)",MEW:"Gull cry",
  MAG:"Magazine",MAR:"Damage",MAO:"Revolutionary leader",
  KED:"Sneaker brand",ERS:"Bitter vetch",REL:"Relative (informal)",
  GEE:"Expression of surprise",EAN:"Give birth (archaic)",NEE:"Born as",
  NEO:"New or prefix",ORY:"Place of activity",SOG:"Soak thoroughly",
  YAR:"Nimble",ZAG:"Turn sharply",ERN:"Sea eagle",WOP:"Strike (slang)",
  WEM:"Womb (archaic)",WAE:"Woe (Scottish)",VOW:"Solemn promise",
  UGH:"Expression of disgust",EEK:"Fright sound",DYE:"Add color",
  DAD:"Father",DEE:"Letter D",EER:"Always (poetic)",
  HOI:"___ polloi",
  // 4-letter additions
  TSAR:"Russian ruler",AFAR:"At a distance",SUDS:"Soap bubbles",
  MELD:"Blend together",UVEA:"Eye vascular layer",STET:"Keep as-is mark",
  STOA:"Ancient Greek porch",EPEE:"Fencing sword",ETUI:"Small needle case",
  ALEE:"To leeward",AURA:"Surrounding glow",SLOE:"Blackthorn berry",
  SLAW:"Coleslaw",SLAY:"Kill or wow",SNOB:"Status elitist",
  KNEE:"Leg joint",NEON:"Bright inert gas",PEAR:"Sweet fruit",
  PRAM:"Baby carriage",REAR:"Back part",ROAN:"Mixed coat color",
  AUTO:"Car",TECH:"Technology",TRAM:"Street rail car",GLEE:"Pure joy",
  ATMA:"Soul (Hindu)",ATTA:"Whole wheat flour",AGAR:"Gel medium",
  AGHA:"Ottoman officer",IOTA:"Tiny amount",ALAR:"Wing-shaped",
  ALEE:"Sheltered side",LOTA:"Water vessel",SAPA:"Reduced wine syrup",
  REEM:"Wild ox",AVER:"Declare firmly",AVID:"Eager",AXON:"Nerve fiber",
  DOJO:"Martial arts gym",ECHO:"Repeat sound",FLAN:"Custard tart",
  FLOE:"Ice sheet",IMAM:"Muslim leader",INRO:"Japanese container",
  KALE:"Leafy green",LIEN:"Legal claim",LIMA:"Bean type or Peru city",
  LODE:"Mineral vein",LOGO:"Brand symbol",LORE:"Traditional knowledge",
  LYNX:"Wild cat",MAYO:"Condiment",MESA:"Flat-topped hill",
  MIDI:"Medium length",NARC:"Drug agent",ODOR:"Smell",
  OKRA:"Green vegetable",OMEN:"Sign of things",PACA:"Spotted rodent",
  PION:"Subatomic particle",RHEA:"Large bird or goddess",ROUX:"Cooking base",
  RUNE:"Ancient symbol",SAGA:"Long story",SOMA:"Body",
  SOYA:"Soy plant",SPEC:"Specification",SPUD:"Potato",
  SUMO:"Japanese wrestling",TIPI:"Cone-shaped tent",UREA:"Waste compound",
  VANE:"Wind indicator",VIBE:"Feeling or energy",WADI:"Desert stream",
  WAIF:"Stray person",WILE:"Cunning trick",YOGI:"Yoga practitioner",
  YORE:"Long ago",ZEAL:"Enthusiasm",ZINB:"Buzz (archaic)",
  DUPE:"Deceive",FAZE:"Disturb",HAZE:"Mist or bully",JOLT:"Sudden shock",
  KNOB:"Round handle",LAUD:"Praise",LEVY:"Tax or raise",
  LOOM:"Weave machine or approach",MOLT:"Shed feathers",MOPE:"Sulk",
  MOAT:"Castle water barrier",MOOT:"Open for debate",NAÏVE:"Innocent",
  NAVE:"Ship or church center",NEWT:"Small salamander",NIBS:"Points",
  NIPA:"Palm tree",NOSH:"Snack",NOUN:"Naming word",
  NOVA:"Exploding star",NUDE:"Without clothing",OBOE:"Reed instrument",
  OGLE:"Stare at",ORZO:"Rice-shaped pasta",OXEN:"Plural of ox",
  PANG:"Sudden pain",PARE:"Peel or trim",PAVE:"Lay road",
  PAWN:"Chess piece or pledge",PIXY:"Fairy",PLOD:"Walk heavily",
  PLOP:"Drop with sound",POMP:"Splendor",POPS:"Explodes",
  POUR:"Flow out",PROW:"Ship front",PRUDE:"Overly proper",
  PULP:"Soft mass",RASH:"Hasty or skin outbreak",RAVE:"Party or praise",
  REEF:"Coral formation",RHYME:"Sound alike words",RIBS:"Curved bones",
  RIME:"Frost or rhyme",RIND:"Outer skin",RUSE:"Trick",
  RUTS:"Deep grooves",SAGS:"Droops",SANE:"Mentally sound",
  SASH:"Decorative band",SATE:"Satisfy fully",SCUD:"Move fast",
  SHIM:"Thin wedge",SHIN:"Lower leg",SIRE:"Male parent or sir",
  SMOG:"Smoky fog",SNAG:"Catch on",SNIP:"Cut quickly",
  SNOG:"Kiss (British)",SNUB:"Ignore deliberately",SOAK:"Drench",
  SODA:"Fizzy drink",SOFA:"Couch",SOLE:"Single or fish",
  SORT:"Arrange",SPEW:"Emit forcefully",SPIT:"Eject or skewer",
  SLAP:"Hit flat",SLUR:"Blur or insult",SMEAR:"Spread",
  SNARE:"Trap",SOAR:"Fly high",STEM:"Stop or stalk",
  SWAB:"Clean with mop",SWAG:"Loot or drape",SWAM:"Past of swim",
  SWAP:"Exchange",SWAT:"Hit hard",SWIG:"Gulp",
  SYNC:"Coordinate",TACO:"Mexican food",TALC:"Soft mineral",
  TARP:"Waterproof sheet",TAUT:"Pulled tight",TAXA:"Classification groups",
  THUD:"Dull impact",TIARA:"Crown",TIFF:"Minor quarrel",
  TOGA:"Roman robe",TOIL:"Hard work",TOME:"Large book",
  TONG:"Gripping tool",TOOT:"Honk",TORE:"Ripped apart",
  TOTE:"Carry",TOFU:"Soy curd",TOSS:"Throw",
  TUBA:"Brass instrument",TUFT:"Small cluster",TURK:"Turkish person",
  TUTU:"Ballet skirt",TWEAK:"Adjust finely",TWIT:"Fool",
  TYKE:"Young child",URGE:"Strong impulse",VALE:"Valley",
  VEIL:"Thin cover",VIBE:"Atmosphere",VIOL:"Old string instrument",
  VOID:"Empty or cancel",VOLT:"Power unit",WAFT:"Float gently",
  WAIL:"Cry loudly",WANE:"Fade",WARY:"Cautious",
  WASP:"Stinging insect",WEEP:"Cry",WELT:"Mark or seam",
  WEND:"Travel",WHIM:"Sudden fancy",WHIP:"Strike or cream",
  WICK:"Candle cord",WILT:"Droop",WISP:"Small strand",
  WOKE:"Alert to issues",WREN:"Small bird",YAWL:"Sailing boat",
  YELL:"Shout",ZANY:"Comically wild",
  // 5-letter additions
  SEDAN:"Type of automobile",ECLAT:"Brilliant effect",AERIE:"Eagle nest",
  ALGAE:"Aquatic plants",APNEA:"Breathing pause",ATRIA:"Heart chambers",
  CIRCA:"About (dates)",AORTA:"Main artery",NITRO:"Explosive compound",
  OVERT:"Openly done",OVOID:"Egg-shaped",TIBIA:"Shin bone",
  RHINO:"Large horned mammal",SINEW:"Tough cord",SITAR:"Indian lute",
  RATIO:"Proportion",ONION:"Layered vegetable",MANGO:"Tropical fruit",
  TRAM:"(3-letter dupe skip)",
  LLANO:"Flat treeless plain",NASAL:"Of the nose",NASAL:"Nose related",
  NYMPH:"Nature spirit",OASIS:"Desert water source",OCTET:"Group of eight",
  OFFAL:"Animal organs",OMEGA:"Last Greek letter",OPTIC:"Of vision",
  OVATE:"Egg-shaped",OZONE:"Atmospheric gas",PARKA:"Hooded jacket",
  PAWNS:"Chess pieces",PERCH:"High resting place",PETAL:"Flower part",
  PILOT:"Guide or flyer",PLUME:"Feather",POLKA:"Dance",
  POPPY:"Red flower",PRONG:"Fork tine",QUOTA:"Fixed share",
  QUIRK:"Odd trait",REBEL:"Resist authority",REALM:"Kingdom",
  REIGN:"Rule as monarch",RELAX:"Rest",RELIC:"Old artifact",
  RENEW:"Start fresh",REPEL:"Drive back",RESET:"Start over",
  RIVET:"Fastener or fascinate",ROGUE:"Dishonest person",ROUGE:"Red pigment",
  ROUGH:"Not smooth",ROYAL:"Majestic",ROWER:"Oarsperson",
  ROWDY:"Boisterous",RUNIC:"Of runes",SAINT:"Holy person",
  SCALD:"Burn with liquid",SCENE:"Setting or view",SCOFF:"Mock",
  SCONE:"Baked treat",SCOOP:"Gather or news",SCORE:"Points",
  SHACK:"Rough shelter",SHALE:"Layered rock",SHAME:"Disgrace",
  SHANK:"Lower leg",SHOAL:"Shallow water",SHONE:"Past of shine",
  SHORE:"Coastline",SHRUG:"Shoulder lift",SIEGE:"Surround",
  SIGMA:"Greek letter",SKUNK:"Spray animal",SLANT:"Diagonal",
  SLUMP:"Decline",SMEAR:"Spread",SNEAK:"Move stealthily",
  SNORE:"Sleep sound",SNORT:"Exhale sharply",SOLAR:"Of the sun",
  SOLVE:"Find answer",SPADE:"Digging tool",SPASM:"Muscle twitch",
  SPAWN:"Produce or fish eggs",SPECK:"Tiny spot",SPIEL:"Speech",
  SPIKE:"Sharp point",SPILL:"Overflow",SPINE:"Backbone",
  SPITE:"Malice",SPUNK:"Courage",SQUAD:"Small group",
  SQUAT:"Crouch low",STAKE:"Post or bet",STALK:"Follow or plant stem",
  STALL:"Delay or shop",STAND:"Upright position",STANK:"Bad smell",
  STARK:"Bare and harsh",STEAD:"Place of",STEAL:"Take wrongly",
  STERN:"Strict or ship rear",STINK:"Bad smell",STIRS:"Mixes",
  STOMP:"Stamp hard",STRAP:"Strip or bind",STRAW:"Tube or hay",
  STRAY:"Wander",STRIP:"Remove or narrow",STRUT:"Walk proudly",
  STUCK:"Immovable",STUMP:"Tree base or baffle",STUNT:"Bold act",
  SUAVE:"Smoothly charming",SUGAR:"Sweetener",SULKY:"Brooding",
  SUNNY:"Full of sun",SURGE:"Rush forward",SWEAR:"Promise firmly",
  SWEDE:"Turnip or Scandinavian",SWEEP:"Clean or win all",
  SWELL:"Grow or excellent",SWILL:"Rinse or drink fast",
  SWOOP:"Dive suddenly",SYRUP:"Sweet liquid",TABBY:"Striped cat",
  TANGY:"Sharp flavored",TARDY:"Late",TAUNT:"Tease",
  TAWNY:"Warm golden brown",TEMPO:"Speed of music",TEPID:"Lukewarm",
  THEIR:"Belonging to them",THICK:"Dense",THORN:"Sharp spike",
  TIDAL:"Of ocean tides",TIMID:"Shy",TIPSY:"Slightly drunk",
  TITAN:"Giant or powerful",TONIC:"Invigorating drink",TOPAZ:"Yellow gem",
  TORCH:"Burning light",TOXIC:"Poisonous",TRACK:"Path or follow",
  TRAIL:"Marked path",TRAIN:"Teach or transport",TRAMP:"Wander",
  TRASH:"Rubbish",TREND:"Current direction",TROUT:"River fish",
  TROVE:"Hidden treasure",TRUCK:"Large vehicle",TRULY:"Honestly",
  TRUMP:"Beat or outdo",TRUST:"Confidence in",TUBER:"Root vegetable",
  TWIRL:"Spin around",TWANG:"Plucking sound",ULTRA:"Extreme form",
  UMBRA:"Shadow",UNIFY:"Bring together",UNWED:"Not married",
  USHER:"Guide to seat",UTTER:"Complete or say",VAGUE:"Unclear",
  VALOR:"Bravery",VALUE:"Worth",VALVE:"Flow controller",
  VENOM:"Poison",VIOLA:"String instrument",VISOR:"Eye shield",
  VODKA:"Russian spirit",VOTER:"Ballot caster",WAVER:"Hesitate",
  WEARY:"Tired",WEAVE:"Interlace",WHACK:"Hit hard",
  WHEAT:"Grain crop",WHILE:"During the time",WHIRL:"Spin fast",
  WITCH:"Magic practitioner",WITTY:"Cleverly amusing",
  YEARN:"Long for",YUMMY:"Delicious",ZESTY:"Full of flavor",
  // ---- Batch 2: words identified as missing from clue pool ----
  // 3-letter
  YET:"Despite that",RYE:"Grain for bread or whiskey",TEE:"Golf peg",
  PSI:"Greek letter ψ",RHO:"Greek letter ρ",TAU:"Greek letter τ",
  LEI:"Hawaiian flower garland",NAN:"Indian flatbread",TOM:"Male cat",
  YEA:"Affirmative vote",RAN:"Moved quickly",TOR:"Rocky peak",
  GAD:"Roam restlessly",LAM:"On the ___ (fleeing)",GEN:"General info (British)",
  SAC:"Pouch-like body cavity",REG:"Regulation (informal)",SEN:"Senate member",
  // 4-letter
  OPAL:"Iridescent gemstone",SAGO:"Palm starch used in cooking",
  LOAD:"Heavy cargo",LOAN:"Borrowed money",SANS:"Without",
  TEEM:"Swarm with life",DEAN:"School head",
  SKID:"Slide out of control",SHOO:"Wave away",
  SHOD:"Wearing shoes",SCUM:"Surface layer or scoundrel",
  TART:"Sharp-tasting pastry",TEAL:"Blue-green color",
  WHOA:"Command to stop",WEIR:"Small river dam",
  BRIM:"Hat edge or fill to top",LAIR:"Animal's den",
  LEES:"Wine sediment",FRET:"Worry or guitar ridge",
  JAMB:"Door frame part",DODO:"Extinct flightless bird",
  DEMI:"Half or prefix",VETO:"Official rejection",
  VIAL:"Small glass bottle",REAM:"500 sheets of paper",
  SPAM:"Unwanted email flood",TWEE:"Excessively cute",
  TERM:"Period of time",BEAK:"Bird's bill",
  EATS:"Has a meal",DRAT:"Mild expletive",
  GHEE:"Clarified butter",PLEB:"Common person (informal)",
  PERT:"Cheeky and brisk",OVUM:"Egg cell",
  ATOM:"Tiny particle",AJAR:"Slightly open",
  ALAS:"Expression of sorrow",PERI:"Fairy being in Persian myth",
  NEEP:"Scottish turnip",SHAD:"Herring-like fish",
  SURA:"Chapter of the Quran",TUFA:"Porous volcanic rock",
  SEEP:"Ooze slowly through",MEMO:"Short note",
  SCOT:"Person from Scotland",SPAM:"Junk email",
  SAKI:"Japanese rice wine (sake)",PUREE:"Smooth blended food",
  SAUTE:"Fry quickly in oil",RAZOR:"Sharp shaving blade",
  SCOOT:"Move quickly away",LEVEE:"Flood embankment",
  EAVES:"Roof overhang edges",EVENS:"Makes equal or level",
  WEIGH:"Measure the mass of",SUTRA:"Sacred Hindu or Buddhist text",
  DRAMA:"Play or theatrical piece",ARSON:"Crime of setting fire",
  ODEON:"Ancient Greek theater",ODIUM:"Widespread hatred",
  STELA:"Upright carved stone slab",TALUS:"Ankle bone",
  TUTTI:"All together in music",MERIT:"Deserved recognition",
  MESON:"Subatomic particle",OWLET:"Young or small owl",
  OXBOW:"U-shaped river bend",PASHA:"Ottoman official title",
  // 5-letter
  EYRIE:"Eagle's clifftop nest",MELEE:"Wild chaotic brawl",
  ANION:"Negatively charged ion",EDEMA:"Tissue fluid swelling",
  ISLET:"Small island",SCION:"Young heir or plant shoot",
  AEGIS:"Protective influence or backing",AGORA:"Ancient Greek marketplace",
  ATLAS:"Book of maps",ACRID:"Sharply pungent smell or taste",
  APART:"Separated from others",AVIAN:"Relating to birds",
  ELVES:"Mythical forest beings",EMOTE:"Express dramatically",
  ERROR:"Mistake or fault",EERIE:"Strangely unsettling",
  HIVES:"Allergic skin reaction",TAPAS:"Spanish small plates",
  IDIOT:"Foolish person",KAZOO:"Humming toy instrument",
  ADOBE:"Sun-dried clay brick",ASANA:"Yoga pose or position",
  BUTTE:"Flat-topped isolated hill",GENIE:"Wish-granting spirit",
  HENNA:"Reddish plant hair dye",SERIF:"Small line on a letter",
  ROSIN:"Violin bow resin",SERGE:"Twilled fabric",
  // ---- Batch 3: broad common-fill expansion ----
  // User-requested additions + many common words seen falling through the clue pool.
  // 3-letter
  EAT:"Have lunch",EWE:"Woolly mom",ERG:"Work unit",FLU:"Bad winter bug",
  BRA:"Underwire garment",CEE:"The letter after B",DAL:"Lentil stew",CHA:"Tea, in Hindi",
  OVA:"Egg cells",PAW:"Dog's foot",PEP:"Energy",PER:"For each",PUD:"Dessert, in Britain",
  REV:"Minister",RIA:"Drowned river valley",SAD:"Feeling blue",SEC:"Moment, briefly",
  SEE:"Lay eyes on",SOY:"Edamame source",TAM:"Scottish cap",TUT:"Boy king",WAG:"Tail mover",
  LAT:"Back muscle, briefly",MIN:"Tiny amount",MOG:"Cat, in Britain",
  ALT:"Pc key",CUB:"Young bear",DEL:"Deli dept.",EEL:"Slippery swimmer",
  ESS:"The letter S",GAR:"Pike-like fish",HON:"Dear, in a text",
  LEN:"___ Goodman, longtime TV judge",MAE:"___ West",NAN:"Grandma, in Britain",
  NEO:"Prefix with classical",RAD:"Awesome, slangily",REE:"Cry to a horse",
  REG:"Regular, on a price tag",REL:"Kinsman, casually",RET:"Internet user, briefly",
  RYE:"Seeded bread grain",SAC:"Pouchlike cavity",SEN:"Capitol Hill lawmaker",
  SER:"Knightly title",SPA:"Hot-tub spot",TAU:"Greek letter",TED:"Spread out to dry",
  TEN:"Two times five",TEE:"Golf stand",TOM:"Male cat",TOR:"Rocky hill",
  TSK:"Disapproving sound",UTU:"Moral balance, in Maori thought",WHO:"Rock band with Pete Townshend",
  YEA:"Aye",YEN:"Strong craving",YET:"Nevertheless",
  // 4-letter
  CRAB:"Pinchy crustacean",CRAM:"Study all night",FEAR:"Dread",HERO:"Comic-book savior",
  HULA:"Lei-wearing dance",KITE:"Stringed flyer",KNOT:"Bowline, e.g.",LAMB:"Young sheep",
  SHAM:"Fake thing",THEM:"Those folks",THEN:"Back then",THIN:"Not broad",THUS:"Accordingly",
  TOMB:"Pharaoh's resting place",YELP:"Sharp bark",TAPS:"Lights-out bugle call",
  AERO:"Wind-tunnel subj.",BLAB:"Spill everything",DADA:"Art movement with nonsense",
  DADO:"Lower wall trim",EGAD:"Old-school exclamation",FAUN:"Half-goat god",IAMB:"Unstressed-stressed foot",
  IDES:"Midmonth date",META:"Self-referential",NANA:"Granny",NEEM:"Medicinal tree",
  OGEE:"S-shaped arch",OPUS:"Big work",SARI:"Wrapped garment",SCAD:"A bunch",
  SLAG:"Smelting waste",TAPA:"Spanish small plate",REDO:"Do over",OOZY:"Like tar",
  AJAR:"Slightly open",ALAS:"Word of lament",APSE:"Church recess",AREA:"Surface measure",
  ARSE:"Rear, rudely",ATOM:"Tiny particle",AUTO:"Car",AVER:"Say firmly",
  AXON:"Neuron fiber",BEAK:"Toucan feature",BRIM:"Hat edge",DEAN:"School head",
  DEMI:"Half-prefix",DODO:"Extinct bird",DOJO:"Karate studio",DRAT:"Mild expletive",
  EATS:"Has dinner",EAVES:"Roof overhangs",ECHO:"Repeat exactly",EMIR:"Middle East ruler",
  EPIC:"Grand story",EROS:"Cupid counterpart",EWER:"Water pitcher",EVEN:"Flat and level",
  FLAK:"Criticism",FLAN:"Custard tart",FLOE:"Floating ice sheet",FRET:"Worry",
  GHEE:"Clarified butter",GLEE:"Delight",GLUM:"Downcast",GNAT:"Tiny biter",
  GNAW:"Nibble at",GRIN:"Big smile",HEEL:"Shoe part",HEWN:"Cut with an ax",
  HONE:"Sharpen",HYMN:"Church song",ICON:"Famous symbol",IDEA:"Brainstorm result",
  IOTA:"Tiny bit",JAMB:"Doorframe side",JOLT:"Coffee-shop pickup",KALE:"Leafy green",
  KNEE:"Patella locale",LAIR:"Den",LAUD:"Praise",LEES:"Wine sediment",
  LEER:"Suggestive look",LEVY:"Impose a tax",LIEN:"Claim on property",LIMA:"Bean variety",
  LODE:"Vein of ore",LOGO:"Nike swoosh, e.g.",LORE:"Campfire tradition",
  LYNX:"Tuft-eared wildcat",MAYO:"Sandwich spread",MESA:"Flat-topped hill",
  MEMO:"Office note",MIDI:"Tea-length, say",MOAT:"Castle trench",MOOD:"Vibe",
  MOOT:"Open to debate",NARC:"Snitch",NAVE:"Church center aisle",NEON:"Bright sign gas",
  NERD:"Comic-Con attendee, maybe",NEWT:"Salamander",NIBS:"Pen points",
  NOUN:"Word type",NOVA:"Sudden star burst",OBOE:"Double-reed woodwind",
  OGLE:"Check out",OMEN:"Foreshadowing sign",OPAL:"Iridescent gem",ORZO:"Rice-shaped pasta",
  OXEN:"Yoke-mates",PANG:"Sharp stab",PARE:"Peel, as fruit",PAWN:"Low-value chess piece",
  PEAR:"Bell-shaped fruit",PERT:"Sassy",PIER:"Boardwalk support",PINT:"Half a quart",
  PITH:"Core",PLOD:"Trudge",PLOP:"Drop heavily",POMP:"Ceremonial splendor",
  PORE:"Tiny skin opening",POUR:"Fill a glass",PRAM:"British baby carriage",PREP:"School before college, for short",
  PUGS:"Wrinkly dogs",PULP:"Juice bits",RASH:"Hasty",RAVE:"Glowingly review",
  REAM:"500-sheet stack",REEF:"Coral ridge",REIN:"Horse strap",RHEA:"Big flightless bird",
  RIBS:"Barbecue bones",RIND:"Orange peel",ROAN:"Speckled horse coat",
  ROUX:"Sauce starter",RUNE:"Ancient symbol",RUSE:"Sneaky ploy",SAGA:"Long tale",
  SAGE:"Wise one",SAGO:"Starchy pudding ingredient",SANS:"Without",SASH:"Pageant strip",
  SATE:"Fully satisfy",SCOT:"Person from Edinburgh, maybe",SCUM:"Pond film",
  SCUD:"Move quickly",SHAD:"Herring cousin",SHIM:"Thin spacer",SHIN:"Kick target",
  SHOD:"Wearing shoes",SHOO:"Wave away",SIRE:"Father, in pedigrees",SKEW:"Tilt",
  SLAW:"Picnic side",SLED:"Snow slider",SLOE:"Blackthorn berry",SLUR:"Blend carelessly",
  SMOG:"Dirty haze",SNAG:"Unexpected obstacle",SNIP:"Quick cut",SNOB:"One who looks down on others",
  SNUB:"Cold-shoulder",SOAK:"Drench",SODA:"Pop",SOFA:"Couch",
  SOLE:"Only",SORT:"Category",SPEC:"Requirement",SPIT:"Venomous cobra action",
  SPUD:"Potato",STET:"Proofreader's keep-it mark",STOA:"Greek colonnade",STUN:"Amaze",
  SUMO:"Ring sport",SURA:"Quran chapter",SYNC:"Get in step",TACO:"Tortilla fold",
  TALC:"Baby powder mineral",TARP:"Blue sheet",TART:"Sharp-tasting",TAUT:"Pulled tight",
  TEAL:"Blue-green shade",TEEM:"Be full of",TERM:"Semester unit",THUD:"Dull impact",
  TIFF:"Minor spat",TIPI:"Cone-shaped tent",TOGA:"Roman robe",TOIL:"Labor hard",
  TOME:"Weighty book",TONG:"Kitchen grabber",TOOT:"Horn sound",TORE:"Ripped",
  TOSS:"Flip lightly",TUBA:"Sousaphone cousin",TUFT:"Little bunch",TUTU:"Ballerina skirt",
  TWEE:"Cutesy in style",TWIT:"Nitwit",TYKE:"Little kid",UREA:"Waste compound",
  UVEA:"Eye layer",VALE:"Valley",VANE:"Weathercock part",VETO:"Presidential rejection",
  VIAL:"Tiny bottle",VIBE:"Aura",VEIL:"Bride's accessory",VOID:"Null and ___",
  VOLT:"Electrical unit",WAFT:"Drift through the air",WAIL:"Cry loudly",WANE:"Grow smaller",
  WARY:"On guard",WASP:"Yellowjacket, e.g.",WEIGH:"Use a scale on",WEIR:"Low dam",
  WELT:"Raised skin mark",WEEP:"Cry",WEND:"Go on one's way",WHIM:"Passing fancy",
  WHOA:"Word to halt a horse",WHIP:"Cream furiously",WICK:"Candle cord",WILT:"Droop",
  WISP:"Thin curl",WREN:"Tiny songbird",YELL:"Shout",YORE:"Days of ___",ZANY:"Goofy",
  // 5-letter
  AEGIS:"Protective backing",AGORA:"Ancient marketplace",ANION:"Negative ion",APART:"Not together",
  ARSON:"Deliberate fire-setting",ASANA:"Yoga pose",ATLAS:"Book of maps",AVIAN:"Bird-related",
  BEGAT:"Fathered, biblically",CAMEO:"Brief appearance",DECAL:"Sticker",EDEMA:"Fluid swelling",
  EERIE:"Spooky",ELVES:"Pointy-eared fantasy folk",EMOTE:"Act dramatically",ERROR:"Mistake",
  EYRIE:"Clifftop nest",GENIE:"Wish granter",HENNA:"Reddish dye",HIVES:"Itchy welts",
  IDIOT:"Total fool",ISLET:"Tiny island",KAZOO:"Buzzing toy",LILAC:"Purple shrub",
  MELEE:"Chaotic fight",MURAL:"Wall-sized artwork",NADIR:"Lowest point",OLDEN:"From long ago",
  RAZOR:"Close-shave tool",ROSIN:"Bow-rubbed resin",SCION:"Heir",SERGE:"Twill fabric",
  SERIF:"Font flourish",SHARD:"Broken piece",SKULK:"Sneak around",SLANG:"Casual lingo",
  SMIRK:"Self-satisfied grin",SONAR:"Sub tracker",STOOP:"Front steps",SURGE:"Sudden rush",
  TAPAS:"Spanish bar bites",TONGS:"Salad grabbers",TOTEM:"Clan symbol",TWEAK:"Adjust slightly",
  VIGIL:"Overnight watch",VISOR:"Cap brim",WHARF:"Dock",WITTY:"Quick with a quip",
};
// Merge into FILL_CLUES (EXTRA_FILL supplements but doesn't override)
for (const [w,c] of Object.entries(EXTRA_FILL)) {
  if (w.length >= 3 && w.length <= 5 && !FILL_CLUES[w]) FILL_CLUES[w] = c;
}

// Words that appear in the Unix word list but are NOT acceptable crossword fill:
// non-English words, non-words, obscure proper nouns, Latin prefixes, etc.
const BLOCKED_WORDS = new Set([
  // Clearly non-English or non-words
  'AEVIA','NGAPI','AGSAM','ACTU','ADMI','ADAW','ENRIB','ENRUT','ENTAD','ERUC','ERUCA',
  'ESTUS','GAU','GEIRA','GLAR','GLUB','GOTRA','HAGIA','HAOMA','HATT','HECH','HEI',
  'HELOE','HOTI','HUACO','HUTIA','IBOTA','IJMA','IODOL','IRIAN','IWA','JABIA','JAGLA',
  'KAPAI','KEENA','KEREL','KIBEI','KONGU','KRAN','LABIS','LERP','LIANG','LINEA','LINON',
  'LITRA','LOGOI','LUPIS','MABI','MAHUA','MARKA','MARU','MASHA','MILPA','MIRID','MOGO',
  'MOPLA','MUDRA','NEBEL','NEI','NEUMA','NEVOY','NIATA','NONDA','NUMUD','OCREA',
  'ODEL','OECUS','OMAO','OMLAH','OPAH','ORIBI','OSELA','OSMIN','OULAP','OURIE',
  'PACAY','PASAN','PESA','PHOO','RAKIT','RAMIE','RANID','RIMPI','ROYT','RUANA',
  'SACRA','SADHU','SAA','SALMA','SALTA','SCALA','SCEAT','SCOB','SCOPA','SCUTE',
  'SENAM','SERO','SERTA','SERUT','SHAP','SHITA','SIFAC','SIPID','SLA','SMA',
  'SMUR','SNEAP','SNEE','SOCII','SULEA','SWA','SWAD','TAA','TACSO','TAKT','TALAR',
  'TAPU','TARFA','TATU','TAULA','TAWIE','TEAD','TECA','THA','THEMA','TIEN','TIMON',
  'TJI','TOIT','TRA','TRIFA','TULA','TWAS','TYEE','UANG','ULNAD','UMIRI','UMU',
  'URAL','URITE','URLAR','URNA','USAR','UVROU','UZARA','VARA','VARAN','VASA','VAU',
  'VELO','VERI','VIRON','VOAR','WERI','WIRRA','WITAN','WUP','YANG','YDAY','YEARA',
  'YED','YEE','YEEL','YEES','YELD','YER','YOGIN','YOT','ZIEGA','ZINB',
  // Obscure proper nouns / names that slipped through as lowercase
  'ATLEE','ASTOR','LAURA','RORY','EMMA','CAAMA','ASTA',
  // Truly obscure / archaic
  'AALII','ABAC','ABB','ABDAT','ABEAR','ABURA','ACANA','ACAPU','ACARA','ACHAR',
  'ACHOR','ACOIN','ACOLD','ACOMA','ACRON','ADAW','ADDA','ADEAD','ADET',
  'AGAMI','AGLA','AGRIA','AJAVA','AKNEE','ALBE','ALCO','ALGIN','ALGOR',
  'AMAH','AMALA','AMINI','AMMA','AMNIA','AMRA','ANABO','ANEAR','ANES','ANI',
  'ANNAT','ANSAR','ARACA','ARAD','ARAIN','ARAR','ARDU','AREAR','ARNUT',
  'AROAR','ARRAU','ARRIE','ARRIS','ARVEL','ASAK','ASCAN','ASCON','ASKAR',
  'ASOAK','ASOP','ASSI','ATELO','ATIS','ATMO','ATMOS','ATTAR','AUCA',
  'AULOI','AUSU','AVAL','AVERA','AWAT','AXION','AZOTE',
  'BARA','BARIE','BENA','BLAE','BLAY',
  'CAOBA','CAUDA','CAW','CERAS','CHAA','CACUR',
  'DAMIE','DANLI','DAR','DEDO','DEPA','DIV',
  'EAN','ECAD','ECHEA','ECOID','EDEA','EER','EGRET','ELSIN','ELVAN','ELVET',
  'ENDEW','ENGEM','ENIAC','ENOL','ENROL','EON','EOSIN','ERAL','ERGON',
  'EROS','ERS','ESCA','ELT','EYN','EYOT',
  'FAHAM','FEI','FRA','FRAE','FRAP','FROE','FUSC',
  'GABI','GAGEE','GEAT','GEBUR','GELID','GENA','GRIS','GUD',
  'HAAF','HAN','HEI','HERL','HINAU',
  'IBIS','ICACO','ILIA','ILIMA','ISBA',
  'KMET','KNAR','LEAT','LEET','LINEA','LINON',
  'MECON','MELA','METAD','MULGA',
  'NAOS','NARD','NEBEL','NEET','NGAPI','NUBIA',
  'OASES','ODOR',
  // ---- Batch 2: from generic-clue analysis ----
  // Inappropriate / offensive
  'FAG','TIT','CLIT','LECH','ENEMA',
  // Articles, prefixes, non-standalone words
  'THE','TRI','TEC','ENS','EME','EDH','ERD','SSU','NEA','NEF',
  // Proper names that slipped through
  'AMY','AVA','GOA','NYE','ERIKA',
  // Scottish/dialectal 3-letter
  'TWA','TYE','LEW','TAL','SER','SAR','SAI','SAN','SAO','SEG','REH','RET',
  'NAR','NAW','NEB','WER','WEY','WHA','WAP','VOE','VUM','YAD','YAN','YAS','YUS',
  'GOI','GOL','KOS','KRA','LAI','LAN','LAR','SYE','SEY','THO','TOD','TUE',
  'DEG','DOR','GAN','GIB','ADE','ABA','APA','AVO','MAS','MAU','MEM','ORA','ODA',
  'RAS','SAHH',
  // Obscure 4-letter words
  'ABAS','ACCA','ACTA','AFFA','AGAL','AGEE','AHUM','AKEE','ALBA','ALEN','ALGA',
  'AMAR','AMBA','AMBO','ANOA','ANTA','APAR','APIO','APOD','ARBA','ARUI',
  'ASCI','ASEM','ASOK','ATAP','ATES','ATWO','AUBE','BABA','BATT','BELD',
  'BLAD','BLET','BRAB','BREE','BRET','CRAN','CREA','DAGS','DASI','DREE',
  'EDDO','ELOD','ENAM','EOAN','EPHA','EPOS','EYAS','EYEN','EYRA','FLAM',
  'FROW','FUTE','GAUP','GENS','GLEG','GLOM','GLOR','GOGO','GROS','HAAB',
  'HUBB','IMBE','IODO','JACU','KARO','KASA','KRAL','KYAT','LARI','LASA',
  'LETE','LYAM','MALI','MENG','MOLA','MUDD','NESH','NETE','OBAN','ODAL',
  'ODSO','ONCA','ORNA','PAAR','PEGA','PHOS','PLEW','RATH','REDD','REEN',
  'RYEN','SAPO','SART','SASA','SCUG','SERA','SETA','SHOR','SHOU','SLEE',
  'SMEW','SMIT','SPAD','SPET','SPEX','SPUG','STAM','STAP','STEN','STOB',
  'SUPA','TARI','TECK','TEEL','TEET','TELI','TERA','TETE','TOGT','TORA',
  'TRAH','TRON','TSIA','TSUN','TUAN','UDAL','ULUA','UNAL','UPAS','UPGO',
  'UPLA','URAO','URVA','USEE','UTAS','UTUM','VASU','VIGA','WAEG','WHOO',
  'WUSH','YEGG','YERD','YETH','CREE','DAGS','BREA','AGEN','WONA',
  // Obscure 5-letter words
  'ABASH','ABSIT','ACARI','ACCOY','ADAWE','AFARA','AFRET','AGAMA','AGNEL',
  'AGNUS','AGRAH','AHSAN','AIRAN','ALANI','ALDOL','ALISO','ALMUD','ALVAR',
  'ALVUS','AMAAS','AMAIN','AMELU','AMULA','ANAMA','ANANA','ANCON','ANGOR',
  'ANIMA','ANIMI','ANNET','APEAK','APPET','APSIS','AREAD','ARENG','ARETE',
  'ARHAT','ARIOT','ARITE','ARMET','ARNEE','ARRAS','ARSES','ASWIM','ATOUR',
  'AULAE','AVENS','AVICK','AWEEL','BALAO','BARBE','BOLDO','BOREE','BREVA',
  'BULLA','BUTTE','CADEW','CAIRD','CALOR','CAMUS','CAVIE','CLAVA','DUALI',
  'DUSIO','ECTAD','ELDIN','ELEMI','ELUTE','ENOIL','ENORM','EYRIR','FIKIE',
  'GALEE','GANGA','GERIM','GOLEE','HAORI','HASTA','HATHI','HERMA','HILSA',
  'HOSEL','HOURI','HUBBA','ILEAC','ISSEI','KATAR','KILAN','KISRA','LAANG',
  'LAGNA','LAKIE','LARIN','LAUIA','LEDOL','LENIS','LEPRA','LIGAS','LOGIA',
  'MAHAR','MALAR','MANUS','MELOS','MESEM','METIS','MEUTE','MIMEO','MIRZA',
  'MOROC','MOWIE','MUDAR','MUNGA','MURRA','NABLA','NEVEL','NINUT','NIOTA',
  'NORIE','NOTUM','NULLO','OBEAH','OENIN','OKRUG','ONCIN','ORCIN','OREAD',
  'ORSEL','ORTET','OSCIN','OTKON','OTTAR','OVISM','PALAR','PAVID','PEDES',
  'PIDAN','PIURI','PONGA','POROS','PRAAM','PSOAS','PULLI','RAUPO','RHEIN',
  'RIATA','RIVEL','RONCO','ROSEL','RUVID','SAROD','SENSA','SENSO','SEPAD',
  'SERAI','SEREH','SICCA','SIMAR','SLITE','SLUIT','SRUTI','STEMA','STITE',
  'TALAO','TATIE','TATTA','TAZIA','TELAR','TEMBE','TENIO','TERAP','TERNA',
  'TETEL','TIMBO','TINEA','TMEMA','TONGA','TOPIA','TRAGI','TUBAE','UCKIA',
  'ULNAE','UPLEG','UPPOP','URMAN','USARA','USNEA','UTEES','UTERI','UTSUK',
  'UVITO','VIFDA','VINEA','VISIE','WADNA','WONNA','YALLA','YARAY',
  'AGITA','OVUM','NEEP','CAMUS','STELA','WUTHER','SMEW',
  // ---- Batch 3: explicit user-requested and generated-output cleanup ----
  // 3-letter blocks
  'ABU','AMA','BLO','DAN','DAO','DAS','ELB','ELD','FAE','GAT','GEY','GRA',
  'HAK','HAU','JAP','JUD','KAT','LAC','LAS','LEY','LOD','NAA','NOY','PYA',
  'RAB','REA','RHE','RIE','SAB','SAJ','SAM','SEX','SHO','SOE','SRI','TOU',
  'USH','VAS','VEI','WIM','YAT','YOR',
  // 4-letter blocks
  'ADAD','ADAT','ADAY','AKRA','AMOR','ANAN','ANAY','ANSA','ANUS','ARCA','ARIL',
  'ARNA','AROW','ASOR','ATIP','AULA','AUTE','AWAG','BEHN','BELA','BENI','BESA',
  'BLAN','BLAT','BLEO','BRIT','BROB','BYON','CERO','CHIA','CLEE','DIEB','DOAT',
  'ECRU','EHEU','ERIA','ETNA','FAON','FLOT','FRIB','GETA','GOTE','GUAR','GUFA',
  'HAGI','HALS','ICHO','IPID','IVIN','KELD','KETA','KNAB','KNUB','KOAE','KWAN',
  'LEHR','LINA','LORA','MAAM','MACO','MERL','MOHR','NAEL','NAKO','NEMA','NETH',
  'ODUM','OLLA','OOID','OORD','ORAD','PHON','PHOT','PLAK','PORR','PRAU','PYAL',
  'RADA','RASA','RAYA','RECK','REET','REPP','RUEN','RYAL','SACO','SADR','SAUF',
  'SAWT','SCAP','SCAW','SEAH','SEPS','SERT','SHAB','SHAY','SHEE','SHUL','SIKA',
  'SKAL','SKEE','SLAE','SMEE','SNUP','SORI','SPUT','SUSI','SWEP','TAEL','TAEN',
  'TAHR','TEAN','TEAT','TENG','TERP','TIAR','TITE','TWAL','UZAN','VETA','VOTA',
  'WAUP','WEAM','WHAU','WHUD','WHUP','YAIR','YETA','YEUK','YITE',
  // Additional leaked junk from generated output / old runs
  'ISBA','ARGID','EYNE','FAGE','ELVET','AMELU','EPHA','ATELO','PIM','MECON',
  'ICACO','MAGOG','EDIYA','MENDE','RUDGE','ERIAN','SAYID','SLANE','AEGLE','AGRE',
  'OOPOD','TECA','ORSEL','MANGI','OSELA','ACATE','ABIES','EYRE','EAGRE','TSERE',
  'UINTA','TUART','ILIAU','ANTAR','LEANT','EPULO','OTOMI','ASSE','UVROU','EYEN',
  'DERN','ARAMU','DERIC','STAP','TEDA','ARRIE','IRWIN','NEOZA','SGAD','URDEE',
  'ANOLE','ADLET','AFRET','EROSE','SOCLE','AVAHI','ANICE','SELE','MENIC','INONE',
  'AVISO','DETIN','NEUME','ESERE','EDANA','ELEAN','ATLE','USENT','ANASA','AMRA',
  'OVULE','AGENA','EDONI','SAMAN','TEET','ULMIN','SPUME','PISAN','ARBA','ILIA',
  'EDEMA','OBESE','ABSI','INCAN','IDAIC','ANITA','ALIMA','DIOTA','AVINE','ERWIN',
  'RIANT','TRONA','SENAM','ERECT','AGRA','ATTA','APSIS','RYEN','ATLEE','ORGUE',
  'MEUSE','ERUCT','IGARA','SEMIS','HELE','ESNE','EVICT','AGHA','GENA','ERIKA',
  'ATMA','ASCII','AMMAN','GANGA','IRENA','IRENE','YERE','SSI','SWA','SEA','ESS',
  'EYN','EDEM','ETHOS','SOCII','SOCLE','DELE','EVICT','ELAIN','AGONE','ANURA',
  'AVAHI','DIOTA','NETE','AVINE','AGLA','AFARA','AGNEL','AIRAN','ALANI','ALMUD',
  'ALVAR','ALVUS','AMAAS','AMULA','ANAMA','ANCON','ANGOR','ANIMA','ANNET','APEAK',
  'APPET','AREAD','ARENG','ARETE','ARHAT','ARIOT','ARITE','ARMET','ARNEE','ARRAS',
  'ASWIM','ATOUR','AULAE','AVENS','AVICK','AWEEL','BALAO','BARBE','BOREE','BREVA',
  'BULLA','CADEW','CAIRD','CALOR','CAMUS','CAVIE','CLAVA','DUALI','DUSIO','ECTAD',
  'ELDIN','ELEMI','ELUTE','ENOIL','ENORM','EYRIR','FIKIE','GALEE','GERIM','GOLEE',
  'HAORI','HASTA','HATHI','HERMA','HILSA','HOSEL','HOURI','HUBBA','ILEAC','ISSEI',
  'KATAR','KILAN','KISRA','LAANG','LAGNA','LAKIE','LARIN','LAUIA','LEDOL','LENIS',
  'LEPRA','LIGAS','LOGIA','MAHAR','MALAR','MANUS','MELOS','MESEM','METIS','MEUTE',
  'MIMEO','MIRZA','MOROC','MOWIE','MUDAR','MUNGA','MURRA','NABLA','NEVEL','NINUT',
  'NIOTA','NORIE','NOTUM','NULLO','OBEAH','OENIN','OKRUG','ONCIN','ORCIN','OREAD',
  'OSCIN','OTKON','OTTAR','OVISM','PALAR','PAVID','PEDES','PIDAN','PIURI','PONGA',
  'POROS','PRAAM','PSOAS','PULLI','RAUPO','RHEIN','RIATA','RIVEL','RONCO','ROSEL',
  'RUVID','SAROD','SENSA','SENSO','SEPAD','SERAI','SEREH','SICCA','SIMAR','SLITE',
  'SLUIT','SRUTI','STEMA','STITE','TALAO','TATIE','TATTA','TAZIA','TELAR','TEMBE',
  'TENIO','TERAP','TERNA','TETEL','TIMBO','TINEA','TMEMA','TONGA','TOPIA','TRAGI',
  'TUBAE','UCKIA','ULNAE','UPLEG','UPPOP','URMAN','USARA','USNEA','UTEES','UTERI',
  'UTSUK','UVITO','VIFDA','VINEA','VISIE','WADNA','WONNA','YALLA','YARAY',
]);


const AUTO_BLOCKED_WORDS = [
  'AAM',
  'ABASE',
  'ABATE',
  'ABED',
  'ABILO',
  'ACIER',
  'ACME',
  'ACNE',
  'ACOR',
  'ADATI',
  'ADEEP',
  'ADIEU',
  'ADLAY',
  'AERY',
  'AES',
  'AFIRE',
  'AFLOW',
  'AFORE',
  'AGA',
  'AGAMY',
  'AGOHO',
  'AGONY',
  'AGRAL',
  'AHO',
  'AKASA',
  'AKO',
  'ALA',
  'ALB',
  'ALEM',
  'AMENE',
  'AMIC',
  'AMIN',
  'AMINO',
  'ANAM',
  'ANIGH',
  'ANTES',
  'ARGEL',
  'ARGO',
  'ARGOL',
  'ARMER',
  'ARSIS',
  'ARVAL',
  'ASE',
  'AST',
  'ATAVI',
  'ATOLL',
  'AXIOM',
  'AYOUS',
  'BAA',
  'BAAR',
  'BAHAR',
  'BATS',
  'BEET',
  'BEGO',
  'BELY',
  'BESAN',
  'BESIN',
  'BLEB',
  'BOGLE',
  'BREW',
  'BUTT',
  'CAL',
  'CASS',
  'CEDE',
  'CESS',
  'CEST',
  'CHE',
  'CITER',
  'CITUA',
  'COY',
  'CTENE',
  'DAE',
  'DAER',
  'DAFF',
  'DAIRI',
  'DAIRY',
  'DEKKO',
  'DEKLE',
  'DENE',
  'DEOTA',
  'DEY',
  'DIRL',
  'DOPA',
  'DOREE',
  'DOSA',
  'DOZEN',
  'DRAM',
  'DRIB',
  'ECHE',
  'EELER',
  'EGEST',
  'EKER',
  'EKKA',
  'ELL',
  'ELLE',
  'ELS',
  'EMEER',
  'EMEND',
  'ENAGE',
  'ENATE',
  'ENCUP',
  'ENDER',
  'ENHAT',
  'ENRAY',
  'ENSE',
  'ENTAL',
  'ENURE',
  'ERGAL',
  'ERGOT',
  'ERNE',
  'ESTER',
  'ESTOP',
  'ETUA',
  'EUSOL',
  'EVASE',
  'EXODE',
  'EXODY',
  'EYED',
  'EYER',
  'EYEY',
  'FAM',
  'FANON',
  'FEIS',
  'FELS',
  'FEY',
  'FIAR',
  'FICE',
  'FLAP',
  'FLEE',
  'FLIPE',
  'FOB',
  'FRIT',
  'FROT',
  'FUSS',
  'FUST',
  'GAET',
  'GAG',
  'GAIT',
  'GAIZE',
  'GALEA',
  'GALET',
  'GEESE',
  'GENET',
  'GENRE',
  'GENRO',
  'GEODE',
  'GEOID',
  'GERB',
  'GIP',
  'GLEN',
  'GLIA',
  'GLIAL',
  'GREY',
  'HAME',
  'HANIF',
  'HANNA',
  'HAOLE',
  'HAREM',
  'HAW',
  'HECK',
  'HEND',
  'HEVI',
  'HOER',
  'HOON',
  'IDANT',
  'IKONA',
  'ILEUS',
  'ILIAL',
  'ILOT',
  'INCOG',
  'INCUR',
  'INERM',
  'INERT',
  'INKET',
  'INLAY',
  'INRUB',
  'INULA',
  'INURE',
  'ITER',
  'IVIED',
  'JOG',
  'KAPA',
  'KELE',
  'KENT',
  'KET',
  'KEX',
  'KLOM',
  'KNET',
  'KODA',
  'KYAR',
  'LALL',
  'LAMA',
  'LARID',
  'LECK',
  'LEDE',
  'LEED',
  'LEGOA',
  'LEK',
  'LENAD',
  'LENE',
  'LENT',
  'LEUCO',
  'LEUMA',
  'LEVIN',
  'LIARD',
  'LIGNE',
  'LIS',
  'LOIR',
  'MAHOE',
  'MANES',
  'MASA',
  'MAWP',
  'MEL',
  'MELE',
  'MESNE',
  'MINIM',
  'MITT',
  'MON',
  'MONE',
  'MUSE',
  'MUSED',
  'MUSER',
  'NAM',
  'NAPA',
  'NASH',
  'NAST',
  'NASUS',
  'NAVAR',
  'NEAP',
  'NECK',
  'NEESE',
  'NEGER',
  'NESE',
  'NIECE',
  'NIGRE',
  'NITID',
  'NJAVE',
  'NOILY',
  'OARIC',
  'OBOLE',
  'OCTAD',
  'ODEUM',
  'OGIVE',
  'OGLER',
  'OLAM',
  'OLDIE',
  'OLEO',
  'OLOGY',
  'ONCIA',
  'ONER',
  'ONUS',
  'ORAGE',
  'ORDU',
  'ORGAN',
  'ORMER',
  'ORNIS',
  'OSE',
  'OSONE',
  'OSSE',
  'OTARY',
  'OVINE',
  'OVIST',
  'OWER',
  'OXER',
  'OYER',
  'OZENA',
  'PAAL',
  'PACED',
  'PAGAN',
  'PAH',
  'PARER',
  'PASH',
  'PEAN',
  'PED',
  'PEDEE',
  'PEEN',
  'PELL',
  'PENT',
  'PEONY',
  'PESO',
  'PHIZ',
  'PHU',
  'PIKEY',
  'PING',
  'PINIC',
  'PRAD',
  'PRUH',
  'PUKER',
  'PUKKA',
  'PUPA',
  'PUSS',
  'PUTID',
  'RAFF',
  'RALE',
  'RANE',
  'RANN',
  'RATE',
  'READ',
  'RECT',
  'REDE',
  'REDID',
  'REED',
  'REGES',
  'REGLE',
  'RENAL',
  'RENNE',
  'REOIL',
  'REPS',
  'REREE',
  'RERUB',
  'RESAW',
  'RESH',
  'RESP',
  'RETHE',
  'REUNE',
  'REUSE',
  'REVIE',
  'REX',
  'RINSE',
  'RIYAL',
  'RUDAS',
  'RUMP',
  'SADE',
  'SADH',
  'SAL',
  'SASS',
  'SAUT',
  'SCASE',
  'SCAT',
  'SCAUL',
  'SCOKE',
  'SCUT',
  'SEAX',
  'SEER',
  'SEGO',
  'SEGUE',
  'SEISM',
  'SEKOS',
  'SENT',
  'SEPT',
  'SERE',
  'SERF',
  'SERON',
  'SESS',
  'SHAT',
  'SHI',
  'SHOTE',
  'SHOW',
  'SKEIN',
  'SKEL',
  'SKETE',
  'SKIN',
  'SKUSE',
  'SLAPE',
  'SLEY',
  'SNED',
  'SNIDE',
  'SNOD',
  'SNOP',
  'SODIC',
  'SOLI',
  'SOWTE',
  'SPAK',
  'SPAT',
  'SPOR',
  'STAUK',
  'STEG',
  'STEY',
  'STIB',
  'STOEP',
  'STOF',
  'STOG',
  'STUPE',
  'SUE',
  'SUGI',
  'SUINE',
  'SUINT',
  'SUNE',
  'TAAR',
  'TAE',
  'TAFT',
  'TALD',
  'TALES',
  'TALMA',
  'TANE',
  'TANH',
  'TARA',
  'TARS',
  'TASCO',
  'TASU',
  'TAT',
  'TAUPE',
  'TEEN',
  'TEER',
  'TEIND',
  'TEKKE',
  'TELE',
  'TELT',
  'TENT',
  'TERN',
  'TEW',
  'TEXT',
  'THEE',
  'THEY',
  'TOCK',
  'TOCO',
  'TOLDO',
  'TOOTH',
  'TORII',
  'TOZER',
  'TREK',
  'TRET',
  'TRITE',
  'TROW',
  'TSINE',
  'TUKRA',
  'TUSH',
  'UHLAN',
  'ULNAR',
  'UNCUT',
  'UNGUM',
  'UNLIE',
  'UNRAY',
  'UNRIG',
  'UNRIP',
  'UNUSE',
  'UPHER',
  'URLED',
  'URNAE',
  'URNAL',
  'URSAL',
  'URSUK',
  'UST',
  'USTER',
  'UVAL',
  'UVULA',
  'VAG',
  'VAIRE',
  'VARE',
  'VARI',
  'VAST',
  'VIE',
  'WAAG',
  'WANG',
  'WEDE',
  'WEET',
  'WEN',
  'WESE',
  'WEST',
  'WIPS',
  'WIZ',
  'WOON',
  'WUSS',
  'WUST',
  'YAH',
  'YAKIN',
  'YEDE',
  'YERN',
  'YESE',
  'YEZ',
  'YODH',
  'YOE',
];

for (const word of AUTO_BLOCKED_WORDS) {
  BLOCKED_WORDS.add(word);
}

for (const word of ["SEA","SER","RET","EER","ATTA","STELA","BUTTE","EDEMA","EROS","AGHA","ATMA","EAN","ERS","ESS","NEEP"]) {
  BLOCKED_WORDS.delete(word);
}
process.stderr.write('Building word pool...\n');

// Words used as fill — must have ≥1 vowel (3-4 letter) or ≥2 vowels (5-letter),
// no run of 3+ consonants, and no unusual starting clusters.
const VOWELS = new Set(['A','E','I','O','U']);
const BAD_START = new Set(['PF','TZ','SZ','GN','BH','DH','KH','CZ']);
function isUsableWord(w) {
  let cons = 0, vowels = 0;
  for (const ch of w) {
    if (VOWELS.has(ch)) { vowels++; cons = 0; }
    else { cons++; if (cons >= 3) return false; }
  }
  if (w.length >= 5 && vowels < 2) return false;
  if (w.length < 5 && vowels < 1) return false;
  if (w.length >= 3 && BAD_START.has(w.slice(0, 2))) return false;
  return true;
}

const PRIMARY_WORDS = new Set(Object.keys(WORD_CLUES));
const ALL_CLUE_WORDS = new Set([...Object.keys(WORD_CLUES), ...Object.keys(FILL_CLUES)]);
const WORDS_BY_LEN = { 3: [], 4: [], 5: [] };

// Curated words first (only pure A-Z words — skip anything with hyphens, apostrophes, etc.)
for (const word of ALL_CLUE_WORDS) {
  const len = word.length;
  if (WORDS_BY_LEN[len] !== undefined && /^[A-Z]+$/.test(word)) WORDS_BY_LEN[len].push(word);
}

// System dictionary fill is intentionally disabled for launch-quality generation.
// The curated pool is large enough to solve the full bank without letting
// obscure/foreign/archaic fallback words leak into shipped puzzles.
process.stderr.write('  Dict added: 3=+0, 4=+0, 5=+0\n');

process.stderr.write(`  Pool total: 3=${WORDS_BY_LEN[3].length}, 4=${WORDS_BY_LEN[4].length}, 5=${WORDS_BY_LEN[5].length}\n`);

// ---------------------------------------------------------------------------
// Letter-position index: wordIdx[len][pos][letter] = array of word strings
// ---------------------------------------------------------------------------
process.stderr.write('Building letter-position index...\n');
const wordIdx = {};
for (const len of [3, 4, 5]) {
  wordIdx[len] = [];
  for (let pos = 0; pos < len; pos++) {
    wordIdx[len][pos] = {};
    for (let c = 65; c <= 90; c++) {
      wordIdx[len][pos][String.fromCharCode(c)] = [];
    }
  }
  for (const word of WORDS_BY_LEN[len]) {
    for (let pos = 0; pos < len; pos++) {
      wordIdx[len][pos][word[pos]].push(word);
    }
  }
}
process.stderr.write('  Index built.\n');

// ---------------------------------------------------------------------------
// Clue generation
// ---------------------------------------------------------------------------
const clueRotation = {};

function getClue(word) {
  if (WORD_CLUES[word]) {
    const clues = Array.isArray(WORD_CLUES[word]) ? WORD_CLUES[word] : [WORD_CLUES[word]];
    const idx = (clueRotation[word] || 0) % clues.length;
    clueRotation[word] = (clueRotation[word] || 0) + 1;
    return clues[idx];
  }
  if (FILL_CLUES[word]) return FILL_CLUES[word];

  // Comprehensive pattern-based clues — covers virtually all common English word forms.
  // Words that reach this function are from the system dictionary and pass quality filters.
  const w = word.toLowerCase();
  const len = word.length;

  // Suffix patterns (most specific first)
  if (w.endsWith('tion') || w.endsWith('sion')) return 'Process or state';
  if (w.endsWith('ment')) return 'Result or state';
  if (w.endsWith('ness')) return 'Quality of being';
  if (w.endsWith('ance') || w.endsWith('ence')) return 'Condition';
  if (w.endsWith('ling')) return 'Small or young one';
  if (w.endsWith('ling') && len > 4) return 'Action form';
  if (w.endsWith('ring') && len > 4) return 'Ongoing action';
  if (w.endsWith('ting') && len > 4) return 'Ongoing action';
  if (w.endsWith('ing')  && len > 4) return 'In progress';
  if (w.endsWith('ster')) return 'One associated with';
  if (w.endsWith('ward') && len > 4) return 'Toward direction';
  if (w.endsWith('ware')) return 'Type of goods';
  if (w.endsWith('wise')) return 'In the manner of';
  if (w.endsWith('hood')) return 'State or condition';
  if (w.endsWith('ship')) return 'Status or skill';
  if (w.endsWith('less')) return 'Lacking';
  if (w.endsWith('ful'))  return 'Having quality of';
  if (w.endsWith('ish'))  return 'Resembling';
  if (w.endsWith('ous')  && len > 4) return 'Full of';
  if (w.endsWith('ive')  && len > 4) return 'Tending toward';
  if (w.endsWith('ive')  && len === 4) return 'Acting form';
  if (w.endsWith('ible') || w.endsWith('able')) return 'Capable of';
  if (w.endsWith('ary')  && len > 4) return 'Of or relating to';
  if (w.endsWith('ory')  && len > 4) return 'Place or quality';
  if (w.endsWith('ery')  && len > 4) return 'Place or practice';
  if (w.endsWith('ity')  && len > 4) return 'Quality or state';
  if (w.endsWith('ify'))             return 'Make or become';
  if (w.endsWith('ize'))             return 'To make';
  if (w.endsWith('ise'))             return 'To practice';
  if (w.endsWith('ate')  && len > 4) return 'To make or act';
  if (w.endsWith('ate')  && len === 4) return 'Action verb';
  if (w.endsWith('est')  && len > 3) return 'Most of quality';
  if (w.endsWith('ier'))             return 'More than';
  if (w.endsWith('ied'))             return 'Past action';
  if (w.endsWith('ies'))             return 'Plural form';
  if (w.endsWith('ers')  && len > 4) return 'Those who do';
  if (w.endsWith('ers')  && len === 4) return 'Plural noun';
  if (w.endsWith('er')   && len > 4) return 'One who acts';
  if (w.endsWith('er')   && len === 4) return 'Doer';
  if (w.endsWith('est')  && len === 4) return 'Superlative';
  if (w.endsWith('ed')   && len > 4) return 'Past tense';
  if (w.endsWith('ed')   && len === 4) return 'Completed action';
  if (w.endsWith('en')   && len > 4) return 'Made of or become';
  if (w.endsWith('ly')   && len > 4) return 'In this manner';
  if (w.endsWith('ly')   && len === 4) return 'Manner word';
  if (w.endsWith('al')   && len > 4) return 'Relating to';
  if (w.endsWith('ic'))              return 'Characteristic of';
  if (w.endsWith('ry')   && len > 3) return 'Place or collection';
  if (w.endsWith('ny')   && len > 3) return 'Quality or place';
  if (w.endsWith('ty')   && len > 3) return 'State of being';
  if (w.endsWith('ey')   && len > 3) return 'Having quality';
  if (w.endsWith('gy')   && len > 3) return 'Field of study';
  if (w.endsWith('sy')   && len > 3) return 'Quality or style';
  if (w.endsWith('ky')   && len > 3) return 'Having character of';
  if (w.endsWith('my')   && len > 3) return 'Practice or place';
  if (w.endsWith('ny')   && len > 3) return 'Like or relating to';
  if (w.endsWith('py')   && len > 3) return 'Action or state';
  if (w.endsWith('dy')   && len > 3) return 'Quality or feeling';
  if (w.endsWith('vy')   && len > 3) return 'Emotion or form';
  if (w.endsWith('vy')   && len > 3) return 'Quality or state';
  if (w.endsWith('nd'))              return 'Connected thing';
  if (w.endsWith('nt'))              return 'Acting person or thing';
  if (w.endsWith('st'))              return 'Superlative or person';
  if (w.endsWith('lt'))              return 'Result or material';
  if (w.endsWith('ft'))              return 'Craft or shift';
  if (w.endsWith('pt'))              return 'Accepted or done';
  if (w.endsWith('ct'))              return 'Done or caused';
  if (w.endsWith('nk'))              return 'Sound or substance';
  if (w.endsWith('lk'))              return 'Walk or substance';
  if (w.endsWith('rk'))              return 'Work or place';
  if (w.endsWith('sk'))              return 'Task or container';
  if (w.endsWith('mp'))              return 'Force or sound';
  if (w.endsWith('sp'))              return 'Grip or sound';
  if (w.endsWith('ss'))              return 'State or excess';
  if (w.endsWith('ll'))              return 'Fill or sound';
  if (w.endsWith('ff'))              return 'Off or rough';
  if (w.endsWith('rn'))              return 'Turn or place';
  if (w.endsWith('wn'))              return 'Town or color';
  if (w.endsWith('se')   && len > 3) return 'Verb or noun form';
  if (w.endsWith('ge')   && len > 3) return 'Place or action';
  if (w.endsWith('ce')   && len > 3) return 'Place or state';
  if (w.endsWith('le')   && len > 3) return 'Small or tool';
  if (w.endsWith('ne')   && len > 3) return 'Line or material';
  if (w.endsWith('ke')   && len > 3) return 'Shape or action';
  if (w.endsWith('re')   && len > 3) return 'Place or material';
  if (w.endsWith('ve')   && len > 3) return 'Move or groove';
  if (w.endsWith('pe')   && len > 3) return 'Shape or tool';
  if (w.endsWith('me')   && len > 3) return 'Form or game';
  if (w.endsWith('de')   && len > 3) return 'Glide or guide';
  if (w.endsWith('ze')   && len > 3) return 'Freeze or action';
  if (w.endsWith('xe'))              return 'Plural or tool';
  if (w.endsWith('ue')   && len > 3) return 'Color or quality';

  // Prefix patterns
  if (w.startsWith('un') && len > 4) return 'Not or reverse';
  if (w.startsWith('re') && len > 4) return 'Again or back';
  if (w.startsWith('in') && len > 4) return 'Into or not';
  if (w.startsWith('im') && len > 4) return 'Into or not';
  if (w.startsWith('de') && len > 4) return 'Down or remove';
  if (w.startsWith('dis')&& len > 4) return 'Apart or not';
  if (w.startsWith('mis')&& len > 4) return 'Wrongly';
  if (w.startsWith('out')&& len > 4) return 'Beyond or outside';
  if (w.startsWith('pre')&& len > 4) return 'Before';
  if (w.startsWith('pro')&& len > 4) return 'Forward or for';
  if (w.startsWith('sub')&& len > 4) return 'Under or below';
  if (w.startsWith('ex') && len > 4) return 'Out of or former';
  if (w.startsWith('over')&& len > 5) return 'Above or too much';
  if (w.startsWith('co') && len > 4) return 'Together with';
  if (w.startsWith('be') && len > 4) return 'Thoroughly';
  if (w.startsWith('for')&& len > 4) return 'Away or exclude';

  // Letter-pattern clues for 3-letter words
  if (len === 3) {
    if (VOWELS.has(w[0])) return 'Short word';
    return 'Brief term';
  }
  // 4-letter catch-all
  if (len === 4) return 'Four-letter word';
  // 5-letter catch-all — never "dictionary word"
  return 'English word';
}

// ---------------------------------------------------------------------------
// Word reuse cooldown (same word allowed again after COOLDOWN puzzles)
// ---------------------------------------------------------------------------
const WORD_COOLDOWN = 0;
const lastUsedAt = {};

function wordAvailable(word, puzzleIdx) {
  return lastUsedAt[word] === undefined || puzzleIdx - lastUsedAt[word] >= WORD_COOLDOWN;
}
function markWordUsed(word, puzzleIdx) {
  lastUsedAt[word] = puzzleIdx;
}

// ---------------------------------------------------------------------------
// Grid helpers
// ---------------------------------------------------------------------------
function cellKey(r, c) { return r * 10 + c; }

function getConstraints(slot, grid) {
  const cons = {};
  for (let i = 0; i < slot.len; i++) {
    const r = slot.row + (slot.dir === 'D' ? i : 0);
    const c = slot.col + (slot.dir === 'A' ? i : 0);
    const v = grid[cellKey(r, c)];
    if (v !== undefined) cons[i] = v;
  }
  return cons;
}

function applyWord(slot, word, grid) {
  const g = Object.assign({}, grid);
  for (let i = 0; i < word.length; i++) {
    const r = slot.row + (slot.dir === 'D' ? i : 0);
    const c = slot.col + (slot.dir === 'A' ? i : 0);
    g[cellKey(r, c)] = word[i];
  }
  return g;
}

// ---------------------------------------------------------------------------
// Fast constraint matching using letter-position index
// ---------------------------------------------------------------------------
function getMatchingWords(len, cons, usedSet, puzzleIdx) {
  const conEntries = Object.entries(cons).map(([k, v]) => [+k, v]);

  if (conEntries.length === 0) {
    return WORDS_BY_LEN[len].filter(w => !usedSet.has(w) && wordAvailable(w, puzzleIdx));
  }

  // Sort by smallest set first for faster intersection
  conEntries.sort((a, b) => {
    const aLen = (wordIdx[len][a[0]][a[1]] || []).length;
    const bLen = (wordIdx[len][b[0]][b[1]] || []).length;
    return aLen - bLen;
  });

  const firstList = wordIdx[len][conEntries[0][0]][conEntries[0][1]] || [];
  if (firstList.length === 0) return [];

  let candidates = new Set(firstList);

  for (let i = 1; i < conEntries.length; i++) {
    const nextList = wordIdx[len][conEntries[i][0]][conEntries[i][1]] || [];
    if (nextList.length === 0) return [];
    const nextSet = new Set(nextList);
    for (const w of candidates) {
      if (!nextSet.has(w)) candidates.delete(w);
    }
    if (candidates.size === 0) return [];
  }

  return [...candidates].filter(w => !usedSet.has(w) && wordAvailable(w, puzzleIdx));
}

// ---------------------------------------------------------------------------
// Forward checking: verify all future slots still have >= 1 valid option
// ---------------------------------------------------------------------------
function forwardCheck(futureSlots, newGrid, usedSet, puzzleIdx) {
  for (const slot of futureSlots) {
    const cons = getConstraints(slot, newGrid);
    if (getMatchingWords(slot.len, cons, usedSet, puzzleIdx).length === 0) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Shuffle helper (seeded per attempt via closure over Math.random)
// ---------------------------------------------------------------------------
function shuffleArr(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Pre-compute slot ordering for each template (greedy most-constrained-first)
// ---------------------------------------------------------------------------
function buildSlotOrder(slots) {
  const slotsWithCells = slots.map(s => {
    const cells = new Set();
    for (let i = 0; i < s.len; i++) {
      const r = s.row + (s.dir === 'D' ? i : 0);
      const c = s.col + (s.dir === 'A' ? i : 0);
      cells.add(r * 10 + c);
    }
    return { ...s, _cells: cells, _neighbors: new Set() };
  });

  for (let i = 0; i < slotsWithCells.length; i++) {
    for (let j = i + 1; j < slotsWithCells.length; j++) {
      for (const cell of slotsWithCells[i]._cells) {
        if (slotsWithCells[j]._cells.has(cell)) {
          slotsWithCells[i]._neighbors.add(j);
          slotsWithCells[j]._neighbors.add(i);
          break;
        }
      }
    }
  }

  const ordered = [];
  const placed = new Set();
  // Start with longest slot
  let startIdx = slotsWithCells.reduce((bi, s, i) => s.len > slotsWithCells[bi].len ? i : bi, 0);
  ordered.push(slotsWithCells[startIdx]);
  placed.add(startIdx);

  while (ordered.length < slotsWithCells.length) {
    let best = -1, bestScore = -1;
    for (let i = 0; i < slotsWithCells.length; i++) {
      if (placed.has(i)) continue;
      let score = 0;
      for (const ni of placed) {
        if (slotsWithCells[i]._neighbors.has(ni)) score++;
      }
      if (score > bestScore || (score === bestScore && best >= 0 && slotsWithCells[i].len > slotsWithCells[best].len)) {
        bestScore = score;
        best = i;
      }
    }
    ordered.push(slotsWithCells[best]);
    placed.add(best);
  }

  return ordered;
}

const templateOrders = {};
for (const [name, tmpl] of Object.entries(TEMPLATES)) {
  templateOrders[name] = buildSlotOrder(tmpl.slots);
}

// ---------------------------------------------------------------------------
// Fast solver: backtracking with forward checking + themed-word preference
// ---------------------------------------------------------------------------
const MAX_POOL_PER_SLOT = 120;
const MAX_RESTARTS_PER_PUZZLE = 500;
const PUZZLE_TIMEOUT_MS = 180000; // 3 minutes max per puzzle

let _puzzleDeadline = 0;

function solvePuzzle(orderedSlots, puzzleIdx) {
  function place(slotIdx, grid, usedInPuzzle, assignment) {
    if (Date.now() > _puzzleDeadline) return null;
    if (slotIdx === orderedSlots.length) return assignment;

    const slot = orderedSlots[slotIdx];
    const cons = getConstraints(slot, grid);
    const futureSlots = orderedSlots.slice(slotIdx + 1);

    // Strongly prefer explicitly clued words. Only touch uncued system-dictionary
    // rescue fill when a slot has zero curated/clued options at all.
    const allMatches = getMatchingWords(slot.len, cons, usedInPuzzle, puzzleIdx);
    const tier1 = shuffleArr(allMatches.filter(w => PRIMARY_WORDS.has(w)));
    const tier2 = shuffleArr(allMatches.filter(w => !PRIMARY_WORDS.has(w) && ALL_CLUE_WORDS.has(w)));
    const tier3 = shuffleArr(allMatches.filter(w => !ALL_CLUE_WORDS.has(w)));
    const curatedPool = [...tier1, ...tier2];
    const pool = (curatedPool.length > 0 ? curatedPool : tier3).slice(0, MAX_POOL_PER_SLOT);

    for (const word of pool) {
      const newGrid = applyWord(slot, word, grid);
      const newUsed = new Set(usedInPuzzle);
      newUsed.add(word);

      // Forward check: ensure all future slots still have valid options
      if (!forwardCheck(futureSlots, newGrid, newUsed, puzzleIdx)) {
        continue;
      }

      usedInPuzzle.add(word);
      assignment[slot.id] = word;
      const result = place(slotIdx + 1, newGrid, usedInPuzzle, assignment);
      if (result) return result;
      usedInPuzzle.delete(word);
      delete assignment[slot.id];
    }

    return null;
  }

  return place(0, {}, new Set(), {});
}

// ---------------------------------------------------------------------------
// Generate all 194 puzzles sequentially with cooldown tracking
// ---------------------------------------------------------------------------
process.stderr.write('Generating 194 puzzles sequentially...\n');

const TEMPLATE_CYCLE = ['A', 'B', 'C', 'D'];
const THEME_RANGES = [
  { end: 15,  theme: 'How They Met' },
  { end: 45,  theme: 'Long Distance Era' },
  { end: 76,  theme: 'Proposal Season' },
  { end: 106, theme: 'Engagement' },
  { end: 137, theme: 'Wedding Party' },
  { end: 168, theme: 'Countdown & Faith' },
  { end: 193, theme: 'Final Countdown' },
  { end: 194, theme: 'Wedding Day' },
];
function themeFor(i) {
  for (const r of THEME_RANGES) if (i < r.end) return r.theme;
  return 'Wedding Day';
}

const startDate = new Date('2026-03-17T00:00:00Z');
const puzzles = [];

for (let i = 0; i < 194; i++) {
  const tName = TEMPLATE_CYCLE[i % 4];
  const orderedSlots = templateOrders[tName];

  let assignment = null;
  _puzzleDeadline = Date.now() + PUZZLE_TIMEOUT_MS;

  for (let r = 0; r < MAX_RESTARTS_PER_PUZZLE && !assignment; r++) {
    if (Date.now() > _puzzleDeadline) break;
    assignment = solvePuzzle(orderedSlots, i);
  }

  // If primary template failed, try fallback templates
  if (!assignment) {
    for (const t2 of ['A','B','C','D'].filter(t => t !== tName)) {
      for (let r = 0; r < MAX_RESTARTS_PER_PUZZLE && !assignment; r++) {
        if (Date.now() > _puzzleDeadline) break;
        assignment = solvePuzzle(templateOrders[t2], i);
      }
      if (assignment) {
        process.stderr.write(`  Puzzle ${i+1}: used fallback template ${t2}\n`);
        break;
      }
    }
  }

  if (assignment) {
    for (const word of Object.values(assignment)) markWordUsed(word, i);
    puzzles.push({ tName, assignment });
  } else {
    process.stderr.write(`  WARNING: puzzle ${i+1} failed\n`);
    puzzles.push(null);
  }

  if ((i+1) % 25 === 0) process.stderr.write(`  Completed ${i+1}/194\n`);
}

const good = puzzles.filter(Boolean).length;
process.stderr.write(`Generated ${good}/194 puzzles\n`);

// ---------------------------------------------------------------------------
// TypeScript output
// ---------------------------------------------------------------------------
const lines = [];
lines.push(`// AUTO-GENERATED — ${good}/194 puzzles, 2026-03-17 to 2026-09-26`);
lines.push(`// Word reuse allowed after ${WORD_COOLDOWN}-puzzle cooldown.`);
lines.push(`const RAW_PUZZLES: RawPuzzleData[] = [`);

for (let i = 0; i < 194; i++) {
  const p = puzzles[i];
  const d = new Date(startDate);
  d.setUTCDate(d.getUTCDate() + i);
  const dateStr = d.toISOString().slice(0, 10);
  const id = `p${String(i+1).padStart(3,'0')}`;
  const theme = themeFor(i);
  const tName = TEMPLATE_CYCLE[i % 4];

  if (!p) {
    lines.push(`  // ${id} — ${dateStr} — MISSING`);
    continue;
  }

  lines.push(`  // ${id} — ${dateStr} — ${theme} — template ${tName}`);
  lines.push(`  { id: "${id}", rows: 5, cols: 5, words: [`);

  const tmpl = TEMPLATES[tName];
  for (const slot of tmpl.slots) {
    const word = p.assignment[slot.id];
    if (!word) continue;
    const clue = getClue(word);
    lines.push(`    { word: "${word}", clue: ${JSON.stringify(clue)}, row: ${slot.row}, col: ${slot.col}, dir: "${slot.dir}" },`);
  }

  lines.push(`  ] },`);
}

lines.push(`];`);
process.stdout.write(lines.join('\n') + '\n');
process.stderr.write('Done!\n');
