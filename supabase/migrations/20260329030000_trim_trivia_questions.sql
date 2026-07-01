-- Migration: Replace trivia bank with the final curated launch set

DELETE FROM trivia_questions;

INSERT INTO trivia_questions
  (prompt, answer_a, answer_b, answer_c, answer_d, correct_index, fun_fact, sort_order)
VALUES

(
  'What kind of event did they first meet at?',
  'A church retreat', 'A college ice cream social', 'A football tailgate', 'A birthday party',
  1,
  'They met at an ice cream social at A&M Commerce in 2021.',
  1
),
(
  'What did they do on their first official date?',
  'Fancy dinner downtown', 'Sonic and driving around talking for hours', 'Bowling and dessert', 'Coffee and a bookstore',
  1,
  'Simple, classic, and somehow turned into hours of conversation.',
  2
),
(
  'Why did they break up the first time?',
  'One of them moved away', 'Family tension', 'They both needed to mature and grow with the Lord', 'School got too busy',
  2,
  'Sometimes the timing is not right until it is.',
  3
),
(
  'Where did they unexpectedly run into each other again?',
  'At a wedding', 'At church', 'At an A&M football game', 'At a coffee shop',
  2,
  'Out of a massive football crowd, they still ended up just rows apart.',
  4
),
(
  'What happened when Jeff first asked Ashlyn to hang out again?',
  'She immediately said yes', 'She said no because she got nervous', 'She forgot to respond', 'She asked to just stay friends',
  1,
  'She turned him down at first and then regretted it almost immediately.',
  5
),
(
  'How did that first hangout feel?',
  'Fun but awkward', 'Like no time had passed', 'Totally different and uncomfortable', 'More like catching up as friends',
  1,
  'Even after years apart, it felt natural right away.',
  6
),
(
  'When did they officially start dating again?',
  'August 18, 2024', 'September 26, 2024', 'October 18, 2024', 'February 21, 2025',
  2,
  NULL,
  7
),
(
  'True or False: most of their relationship has been long distance.',
  'True', 'False', '—', '—',
  0,
  'They have made it work across a lot of miles.',
  8
),
(
  'What has their long-distance rhythm usually looked like?',
  'Visiting every other week', 'Only seeing each other on holidays', 'Daily lunch dates', 'Weekly flights',
  0,
  NULL,
  9
),
(
  'Which activity is especially “them”?',
  'Kayaking', 'Hammocking in the park', 'Trivia nights at bars', 'Going to concerts every month',
  1,
  NULL,
  10
),
(
  'Who said "I love you" first?',
  'Jeff', 'Ashlyn', 'They said it together', 'Neither remembers',
  0,
  NULL,
  11
),
(
  'What phrase has special significance in their relationship?',
  'Full send', 'Put your thing down', 'Stay golden', 'No free rides',
  1,
  NULL,
  12
),
(
  'On the day of the proposal, what did Ashlyn think the plan was?',
  'A family dinner', 'A fun day for Megan and Izzy to meet', 'A surprise birthday party', 'A wedding venue tour',
  1,
  'She had no idea what was actually coming.',
  13
),
(
  'What detail made the proposal setup especially memorable?',
  'Jeff was waiting at the end of a different path in the trees', 'Jeff proposed in the middle of a crowded restaurant', 'Jeff proposed on a boat at sunset', 'Jeff proposed during a football game timeout',
  0,
  NULL,
  14
),
(
  'What was Ashlyn''s actual response?',
  '"Of course I will"', '"Yes, yes, yes, yes I will!"', '"Finally!"', '"I knew this was happening"',
  1,
  NULL,
  15
),
(
  'Who originally wanted to be introduced when they first met?',
  'Jeff', 'Ashlyn', 'Both of them', 'A mutual friend decided on their own',
  3,
  NULL,
  16
),
(
  'What message did Jeff send after that football game?',
  '"We should grab dinner this week."', '"It was good to see you. I hope you''re doing well."', '"I still think about us."', '"I can''t believe that was you."',
  1,
  NULL,
  17
),
(
  'When did they realize that hangout had turned into a real first date?',
  'Before they even met up', 'Halfway through the meal', 'By the end of the night when they realized how well it went', 'A week later after talking about it',
  2,
  NULL,
  18
),
(
  'Which activity do they especially love doing together?',
  'Kayaking', 'Hammocking in the park', 'Trivia nights at bars', 'Going to concerts every month',
  1,
  NULL,
  19
),
(
  'What movie do they count as their favorite together?',
  'Interstellar', 'Inception', 'The Prestige', 'La La Land',
  3,
  NULL,
  20
);
