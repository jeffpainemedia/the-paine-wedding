-- ============================================================
-- GUEST LIST SEED DATA — Round 2 (FULL REPLACEMENT)
-- Generated from: Guest List - Round 2 List.csv
-- Households: 103 | Guests: 192
-- 
-- ⚠️  WARNING: This TRUNCATES existing households + guests.
-- Any RSVP responses already saved will be DELETED.
-- Only run this on a fresh setup or when resetting.
-- ============================================================

BEGIN;

-- Clear existing data (cascade deletes guests too)
TRUNCATE households CASCADE;

DO $$
DECLARE
  hh_id UUID;
BEGIN

  -- ── The Paine Family 1 (3 guests)
  INSERT INTO households (name) VALUES ('The Paine Family 1') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Jennifer', 'Paine', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'John', 'Paine', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'John', 'Paine', '3', false, NULL, 'Family', 'Jeff', 'Yes');

  -- ── The Wilson Family 1 (1 guest)
  INSERT INTO households (name) VALUES ('The Wilson Family 1') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Emma', 'Wilson', NULL, true, 'Chris', 'Family', 'Jeff', 'Yes');

  -- ── The Wilson Family 2 (1 guest)
  INSERT INTO households (name) VALUES ('The Wilson Family 2') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Brynn', 'Wilson', NULL, true, 'Collin', 'Family', 'Jeff', 'Yes');

  -- ── The Bimmerle Family 1 (4 guests)
  INSERT INTO households (name) VALUES ('The Bimmerle Family 1') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Katie', 'Bimmerle', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'John', 'Bimmerle', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Blake', 'Bimmerle', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Paige', 'Bimmerle', NULL, true, 'Jacob', 'Family', 'Ash', 'Yes');

  -- ── The Paine Family 5 (1 guest)
  INSERT INTO households (name) VALUES ('The Paine Family 5') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Hillary', 'Paine', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  -- ── The Lynch Family (1 guest)
  INSERT INTO households (name) VALUES ('The Lynch Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Kate', 'Lynch', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  -- ── The Paine Family 2 (2 guests)
  INSERT INTO households (name) VALUES ('The Paine Family 2') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Josh', 'Paine', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Schyler', 'Paine', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  -- ── The Paine Family 3 (3 guests)
  INSERT INTO households (name) VALUES ('The Paine Family 3') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Sandy', 'Paine', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Joshua', 'Paine', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Sam', 'Paine', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  -- ── The Paine Family 4 (1 guest)
  INSERT INTO households (name) VALUES ('The Paine Family 4') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Margret', 'Paine', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  -- ── The Wilson Family 3 (1 guest)
  INSERT INTO households (name) VALUES ('The Wilson Family 3') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Ainsley', 'Wilson', NULL, false, NULL, 'Family', 'Jeff', 'Maybe');

  -- ── The Ray Family 1 (2 guests)
  INSERT INTO households (name) VALUES ('The Ray Family 1') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Eddie', 'Ray', NULL, false, NULL, 'Family', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Vickie', 'Ray', NULL, false, NULL, 'Family', 'Jeff', 'No');

  -- ── The Ray Family 2 (1 guest)
  INSERT INTO households (name) VALUES ('The Ray Family 2') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Joann', 'Ray', NULL, false, NULL, 'Family', 'Jeff', 'Maybe');

  -- ── The Runyon Family 1 (2 guests)
  INSERT INTO households (name) VALUES ('The Runyon Family 1') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Mary Beth', 'Runyon', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Tom', 'Runyon', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  -- ── The Runyon Family 2 (4 guests)
  INSERT INTO households (name) VALUES ('The Runyon Family 2') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Maggie', 'Runyon', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Tommy', 'Runyon', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Audrey', 'Runyon', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Charlie', 'Runyon', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  -- ── The Runyon Family 3 (2 guests)
  INSERT INTO households (name) VALUES ('The Runyon Family 3') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Matthew', 'Runyon', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Megan', 'Runyon', NULL, false, NULL, 'Family', 'Jeff', 'Yes');

  -- ── The Robertson Family 1 (4 guests)
  INSERT INTO households (name) VALUES ('The Robertson Family 1') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Christy', 'Robertson', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Keith', 'Robertson', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Alyse', 'Robertson', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Tyler', 'Robertson', NULL, true, 'Annie', 'Family', 'Ash', 'Yes');

  -- ── The Robertson Family 2 (4 guests)
  INSERT INTO households (name) VALUES ('The Robertson Family 2') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Ryan', 'Robertson', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Sydney', 'Robertson', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Adley', 'Robertson', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Reese', 'Robertson', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  -- ── The Lawson Family (4 guests)
  INSERT INTO households (name) VALUES ('The Lawson Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Sally', 'Lawson', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Greg', 'Lawson', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Natalie', 'Lawson', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Whitney', 'Lawson', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  -- ── The Lord Family (1 guest)
  INSERT INTO households (name) VALUES ('The Lord Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Jackson', 'Lord', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  -- ── The Word Family (1 guest)
  INSERT INTO households (name) VALUES ('The Word Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Gay', 'Word', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  -- ── The Welling Family (2 guests)
  INSERT INTO households (name) VALUES ('The Welling Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Renee', 'Welling', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Frank', 'Welling', NULL, false, NULL, 'Family', 'Ash', 'Yes');

  -- ── The Ostryzniuk Family (2 guests)
  INSERT INTO households (name) VALUES ('The Ostryzniuk Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Alice', 'Ostryzniuk', NULL, false, NULL, 'Family', 'Ash', 'No');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Bernie', 'Ostryzniuk', NULL, false, NULL, 'Family', 'Ash', 'No');

  -- ── The Bimmerle Family 2 (1 guest)
  INSERT INTO households (name) VALUES ('The Bimmerle Family 2') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Rachel', 'Bimmerle', NULL, false, NULL, 'Family', 'Ash', 'Maybe');

  -- ── The Bimmerle Family 3 (1 guest)
  INSERT INTO households (name) VALUES ('The Bimmerle Family 3') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Tom', 'Bimmerle', NULL, false, NULL, 'Family', 'Ash', 'No');

  -- ── The Proctor Family (2 guests)
  INSERT INTO households (name) VALUES ('The Proctor Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Angie', 'Proctor', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Richard', 'Proctor', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  -- ── The Tesfaye Family (1 guest)
  INSERT INTO households (name) VALUES ('The Tesfaye Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Joe', 'Tesfaye', NULL, false, NULL, 'Our Friends', 'Jeff', 'Yes');

  -- ── The Raines Family (2 guests)
  INSERT INTO households (name) VALUES ('The Raines Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Will', 'Raines', NULL, false, NULL, 'Our Friends', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Kayla', 'Raines', NULL, false, NULL, 'Our Friends', 'Jeff', 'Yes');

  -- ── The Boyd Family (2 guests)
  INSERT INTO households (name) VALUES ('The Boyd Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Hudson', 'Boyd', NULL, false, NULL, 'Our Friends', 'Both', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Abby', 'Boyd', NULL, false, NULL, 'Our Friends', 'Both', 'Yes');

  -- ── The Richichi Family (2 guests)
  INSERT INTO households (name) VALUES ('The Richichi Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Roman', 'Richichi', NULL, false, NULL, 'Our Friends', 'Both', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Olivia', 'Richichi', NULL, false, NULL, 'Our Friends', 'Both', 'Yes');

  -- ── The Preston Family (1 guest)
  INSERT INTO households (name) VALUES ('The Preston Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Connor', 'Preston', NULL, false, NULL, 'Our Friends', 'Jeff', 'Yes');

  -- ── The Luurtsema Family (1 guest)
  INSERT INTO households (name) VALUES ('The Luurtsema Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Justin', 'Luurtsema', NULL, false, NULL, 'Our Friends', 'Jeff', 'Yes');

  -- ── The Groezinger Family 2 (2 guests)
  INSERT INTO households (name) VALUES ('The Groezinger Family 2') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Collin', 'Groezinger', NULL, false, NULL, 'Our Friends', 'Both', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Megan', 'Groezinger', NULL, false, NULL, 'Our Friends', 'Both', 'Yes');

  -- ── The Marshall Family (2 guests)
  INSERT INTO households (name) VALUES ('The Marshall Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Duncan', 'Marshall', NULL, false, NULL, 'Our Friends', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Caitlyn', 'Marshall', NULL, false, NULL, 'Our Friends', 'Jeff', 'Yes');

  -- ── The Westbrook Family (2 guests)
  INSERT INTO households (name) VALUES ('The Westbrook Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Kaden', 'Westbrook', NULL, false, NULL, 'Our Friends', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Kaitlyn', 'Westbrook', NULL, false, NULL, 'Our Friends', 'Jeff', 'Yes');

  -- ── The Gonzales Family (2 guests)
  INSERT INTO households (name) VALUES ('The Gonzales Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Jeremy', 'Gonzales', NULL, false, NULL, 'Our Friends', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Sam', 'Gonzales', NULL, false, NULL, 'Our Friends', 'Jeff', 'Maybe');

  -- ── The Reece Family (2 guests)
  INSERT INTO households (name) VALUES ('The Reece Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'John', 'Reece', NULL, false, NULL, 'Our Friends', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Kimberly', 'Reece', NULL, false, NULL, 'Our Friends', 'Jeff', 'Yes');

  -- ── The Groezinger Family 1 (2 guests)
  INSERT INTO households (name) VALUES ('The Groezinger Family 1') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Julanne', 'Groezinger', NULL, false, NULL, 'Their Friends', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Jason', 'Groezinger', NULL, false, NULL, 'Their Friends', 'Jeff', 'Yes');

  -- ── The Groezinger Family 3 (1 guest)
  INSERT INTO households (name) VALUES ('The Groezinger Family 3') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Moises', 'Groezinger', NULL, true, 'Girlfriend', 'Our Friends', 'Jeff', 'Maybe');

  -- ── The Ray Family (2 guests)
  INSERT INTO households (name) VALUES ('The Ray Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Megan', 'Ray', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Dustin', 'Ray', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  -- ── The Meirovitz Family (2 guests)
  INSERT INTO households (name) VALUES ('The Meirovitz Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Jolynn', 'Meirovitz', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Casey', 'Meirovitz', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  -- ── The Hoops Family (2 guests)
  INSERT INTO households (name) VALUES ('The Hoops Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Rocki', 'Hoops', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Cary', 'Hoops', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  -- ── The Gerner Family (1 guest)
  INSERT INTO households (name) VALUES ('The Gerner Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Shelby', 'Gerner', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  -- ── The May Family (1 guest)
  INSERT INTO households (name) VALUES ('The May Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Izzy', 'May', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  -- ── The Santillan Family (1 guest)
  INSERT INTO households (name) VALUES ('The Santillan Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Alondra', 'Santillan', NULL, true, 'Cade', 'Our Friends', 'Ash', 'Yes');

  -- ── The Alvarez Family (1 guest)
  INSERT INTO households (name) VALUES ('The Alvarez Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Liz', 'Alvarez', NULL, true, 'Nate', 'Our Friends', 'Ash', 'Yes');

  -- ── The Jwanouskos Family (1 guest)
  INSERT INTO households (name) VALUES ('The Jwanouskos Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Samantha', 'Jwanouskos', NULL, true, 'Fiance', 'Our Friends', 'Ash', 'Yes');

  -- ── The Franks Family (1 guest)
  INSERT INTO households (name) VALUES ('The Franks Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Hannah', 'Franks', NULL, true, 'Cameron', 'Our Friends', 'Ash', 'Yes');

  -- ── The Halverson Family (1 guest)
  INSERT INTO households (name) VALUES ('The Halverson Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Marissa', 'Halverson', NULL, true, 'Nate', 'Our Friends', 'Ash', 'Yes');

  -- ── The Crawford Family (1 guest)
  INSERT INTO households (name) VALUES ('The Crawford Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Kyla', 'Crawford', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  -- ── The Brown Family (1 guest)
  INSERT INTO households (name) VALUES ('The Brown Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Katey', 'Brown', NULL, true, 'Steven', 'Our Friends', 'Ash', 'Yes');

  -- ── The Horne Family (2 guests)
  INSERT INTO households (name) VALUES ('The Horne Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Ryan', 'Horne', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Amanda', 'Horne', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  -- ── The Luna Family (2 guests)
  INSERT INTO households (name) VALUES ('The Luna Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Zayda', 'Luna', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Carlos', 'Luna', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  -- ── The Isom Family (1 guest)
  INSERT INTO households (name) VALUES ('The Isom Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Emma', 'Isom', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  -- ── The Washburn Family (1 guest)
  INSERT INTO households (name) VALUES ('The Washburn Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Sydney', 'Washburn', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  -- ── The Howe Family (1 guest)
  INSERT INTO households (name) VALUES ('The Howe Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'David', 'Howe', NULL, true, 'David''s Fiance', 'Our Friends', 'Jeff', 'Yes');

  -- ── The Bishop Family (2 guests)
  INSERT INTO households (name) VALUES ('The Bishop Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Mike', 'Bishop', NULL, false, NULL, 'Our Friends', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Angie', 'Bishop', NULL, false, NULL, 'Our Friends', 'Jeff', 'Yes');

  -- ── The Taylor Family (6 guests)
  INSERT INTO households (name) VALUES ('The Taylor Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Jennifer', 'Taylor', NULL, false, NULL, 'Their Friends', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Bryan', 'Taylor', NULL, false, NULL, 'Their Friends', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Brylan', 'Taylor', NULL, false, NULL, 'Their Friends', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Trent', 'Taylor', NULL, false, NULL, 'Their Friends', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Kailey', 'Taylor', NULL, false, NULL, 'Their Friends', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Nathan', 'Taylor', NULL, true, 'Scout', 'Their Friends', 'Ash', 'Yes');

  -- ── The Chiu Family (2 guests)
  INSERT INTO households (name) VALUES ('The Chiu Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Callie', 'Chiu', NULL, false, NULL, 'Their Friends', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Allen', 'Chiu', NULL, false, NULL, 'Their Friends', 'Ash', 'Yes');

  -- ── The Cary Family (3 guests)
  INSERT INTO households (name) VALUES ('The Cary Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Amy', 'Cary', NULL, false, NULL, 'Their Friends', 'Ash', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Steve', 'Cary', NULL, false, NULL, 'Their Friends', 'Ash', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Anna', 'Cary', NULL, true, 'Husband', 'Their Friends', 'Ash', 'Maybe');

  -- ── The Adams Family (2 guests)
  INSERT INTO households (name) VALUES ('The Adams Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Sarah', 'Adams', NULL, false, NULL, 'Our Friends', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Emma', 'Adams', NULL, false, NULL, 'Our Friends', 'Jeff', 'Yes');

  -- ── The Redell Family (6 guests)
  INSERT INTO households (name) VALUES ('The Redell Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Brendan', 'Redell', NULL, false, NULL, 'Our Friends', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Caroline', 'Redell', NULL, false, NULL, 'Our Friends', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Lisa', 'Redell', NULL, false, NULL, 'Their Friends', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Ron', 'Redell', NULL, false, NULL, 'Their Friends', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Kalina', 'Redell', NULL, false, NULL, 'Their Friends', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Macie', 'Redell', NULL, true, 'Fiance', 'Their Friends', 'Jeff', 'Yes');

  -- ── The Dover Family (2 guests)
  INSERT INTO households (name) VALUES ('The Dover Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Clay', 'Dover', NULL, false, NULL, 'Their Friends', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Rebecca', 'Dover', NULL, false, NULL, 'Their Friends', 'Jeff', 'Yes');

  -- ── The Armstrong Family (1 guest)
  INSERT INTO households (name) VALUES ('The Armstrong Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Becky', 'Armstrong', NULL, false, NULL, 'Their Friends', 'Jeff', 'Yes');

  -- ── The Howard Family (1 guest)
  INSERT INTO households (name) VALUES ('The Howard Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Les', 'Howard', NULL, false, NULL, 'Their Friends', 'Jeff', 'Yes');

  -- ── The Edwards Family (2 guests)
  INSERT INTO households (name) VALUES ('The Edwards Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Dani', 'Edwards', NULL, false, NULL, 'Our Friends', 'Both', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Josh', 'Edwards', NULL, false, NULL, 'Our Friends', 'Both', 'Maybe');

  -- ── The Arnold Family (1 guest)
  INSERT INTO households (name) VALUES ('The Arnold Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Meichell', 'Arnold', NULL, false, NULL, 'Our Friends', 'Ash', 'Yes');

  -- ── The Coffey Family (1 guest)
  INSERT INTO households (name) VALUES ('The Coffey Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Carter', 'Coffey', NULL, false, NULL, 'Our Friends', 'Both', 'Yes');

  -- ── The Potoeschnik Family (1 guest)
  INSERT INTO households (name) VALUES ('The Potoeschnik Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Jonathan', 'Potoeschnik', NULL, true, 'His wife', 'Our Friends', 'Jeff', 'Yes');

  -- ── The Francis Family (2 guests)
  INSERT INTO households (name) VALUES ('The Francis Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Julie', 'Francis', NULL, false, NULL, 'Our Friends', 'Both', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Ethan', 'Francis', NULL, false, NULL, 'Our Friends', 'Both', 'Yes');

  -- ── The Pizzarello Family (2 guests)
  INSERT INTO households (name) VALUES ('The Pizzarello Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Iris', 'Pizzarello', NULL, false, NULL, 'Their Friends', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Nico', 'Pizzarello', NULL, false, NULL, 'Their Friends', 'Jeff', 'Yes');

  -- ── The Simpson Family (1 guest)
  INSERT INTO households (name) VALUES ('The Simpson Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Jen', 'Simpson', NULL, true, 'Brian', 'Our Friend', 'Ash', 'Yes');

  -- ── The Walker Family (1 guest)
  INSERT INTO households (name) VALUES ('The Walker Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Renee', 'Walker', NULL, true, 'John Walker', 'Our Friend', 'Ash', 'Yes');

  -- ── The Smith Family (4 guests)
  INSERT INTO households (name) VALUES ('The Smith Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Greg', 'Smith', NULL, false, NULL, 'Their Friends', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Holly', 'Smith', NULL, false, NULL, 'Their Friends', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Heidi', 'Smith', NULL, false, NULL, 'Their Friends', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Lisa', 'Smith', NULL, false, NULL, 'Their Friends', 'Jeff', 'Yes');

  -- ── The Cavagnaro Family (1 guest)
  INSERT INTO households (name) VALUES ('The Cavagnaro Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Ethan', 'Cavagnaro', NULL, true, 'Girlfriend', 'Our Friends', 'Jeff', 'Yes');

  -- ── The Gribnitz Family (5 guests)
  INSERT INTO households (name) VALUES ('The Gribnitz Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Jim', 'Gribnitz', NULL, false, NULL, 'Their Friends', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Nikki', 'Gribnitz', NULL, false, NULL, 'Their Friends', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Hannah', 'Gribnitz', NULL, false, NULL, 'Their Friends', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Abigail', 'Gribnitz', NULL, false, NULL, 'Their Friends', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Seth', 'Gribnitz', NULL, false, NULL, 'Their Friends', 'Jeff', 'Maybe');

  -- ── The Stevenson Family (2 guests)
  INSERT INTO households (name) VALUES ('The Stevenson Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Carley', 'Stevenson', NULL, false, NULL, 'Their Friends', 'Jeff', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Jason', 'Stevenson', NULL, false, NULL, 'Their Friends', 'Jeff', 'Yes');

  -- ── The Owen Family (2 guests)
  INSERT INTO households (name) VALUES ('The Owen Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Lori', 'Owen', NULL, false, NULL, 'Their Friends', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Bruce', 'Owen', NULL, false, NULL, 'Their Friends', 'Ash', 'Yes');

  -- ── The Eaton Family (1 guest)
  INSERT INTO households (name) VALUES ('The Eaton Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Tandra', 'Eaton', NULL, false, NULL, 'Their Friends', 'Ash', 'Yes');

  -- ── The Hearn Family (1 guest)
  INSERT INTO households (name) VALUES ('The Hearn Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Kathy', 'Hearn', NULL, false, NULL, 'Their Friends', 'Ash', 'Yes');

  -- ── The Kassady Family (1 guest)
  INSERT INTO households (name) VALUES ('The Kassady Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Casey', 'Kassady', NULL, false, NULL, 'Their Friends', 'Ash', 'Yes');

  -- ── The Bardin Family (4 guests)
  INSERT INTO households (name) VALUES ('The Bardin Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Emily', 'Bardin', NULL, false, NULL, 'Their Friends', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Brad', 'Bardin', NULL, false, NULL, 'Their Friends', 'Ash', 'Yes');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Brent', 'Bardin', NULL, true, 'Ramon', 'Their Friends', 'Ash', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Dylan', 'Bardin', NULL, false, NULL, 'Their Friends', 'Ash', 'Maybe');

  -- ── The Horton Family (2 guests)
  INSERT INTO households (name) VALUES ('The Horton Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Susan', 'Horton', NULL, false, NULL, 'Their Friends', 'Ash', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Chris', 'Horton', NULL, false, NULL, 'Their Friends', 'Ash', 'Maybe');

  -- ── The Blackwood Family (2 guests)
  INSERT INTO households (name) VALUES ('The Blackwood Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Kim', 'Blackwood', NULL, false, NULL, 'Their Friends', 'Ash', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Nathan', 'Blackwood', NULL, false, NULL, 'Their Friends', 'Ash', 'Maybe');

  -- ── The Reid Family (2 guests)
  INSERT INTO households (name) VALUES ('The Reid Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Elaine', 'Reid', NULL, false, NULL, 'Family', 'Ash', 'No');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Jeff', 'Reid', NULL, false, NULL, 'Family', 'Ash', 'No');

  -- ── The Young Family (2 guests)
  INSERT INTO households (name) VALUES ('The Young Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Donna', 'Young', NULL, false, NULL, 'Family', 'Ash', 'No');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Peter', 'Young', NULL, false, NULL, 'Family', 'Ash', 'No');

  -- ── The Finforck Family 1 (2 guests)
  INSERT INTO households (name) VALUES ('The Finforck Family 1') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Paul', 'Finforck', NULL, false, NULL, 'Family', 'Ash', 'No');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Patricia', 'Finfrock', NULL, false, NULL, 'Family', 'Ash', 'No');

  -- ── The Finforck Family 2 (2 guests)
  INSERT INTO households (name) VALUES ('The Finforck Family 2') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Duane', 'Finfrock', NULL, false, NULL, 'Family', 'Ash', 'No');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Kathy', 'Finfrock', NULL, false, NULL, 'Family', 'Ash', 'No');

  -- ── The Ray Family 3 (2 guests)
  INSERT INTO households (name) VALUES ('The Ray Family 3') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Glen', 'Ray', NULL, false, NULL, 'Family', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Shawn', 'Ray', NULL, false, NULL, 'Family', 'Jeff', 'Maybe');

  -- ── The Ray Family 4 (2 guests)
  INSERT INTO households (name) VALUES ('The Ray Family 4') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Rodney', 'Ray', NULL, false, NULL, 'Family', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Vicki', 'Ray', NULL, false, NULL, 'Family', 'Jeff', 'Maybe');

  -- ── The Ray Family 5 (2 guests)
  INSERT INTO households (name) VALUES ('The Ray Family 5') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Jimmy', 'Ray', NULL, false, NULL, 'Family', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Kim', 'Ray', NULL, false, NULL, 'Family', 'Jeff', 'Maybe');

  -- ── The Pauly Family (1 guest)
  INSERT INTO households (name) VALUES ('The Pauly Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Bill', 'Pauly', NULL, false, NULL, 'Family', 'Jeff', 'No');

  -- ── The Cornelison Family (2 guests)
  INSERT INTO households (name) VALUES ('The Cornelison Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Heather', 'Cornelison', NULL, false, NULL, 'Family', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Alan', 'Cornelison', NULL, false, NULL, 'Family', 'Jeff', 'Maybe');

  -- ── The Mitchell Family (1 guest)
  INSERT INTO households (name) VALUES ('The Mitchell Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Becky', 'Mitchell', NULL, false, NULL, 'Family', 'Jeff', 'Maybe');

  -- ── The Muldoon Family (1 guest)
  INSERT INTO households (name) VALUES ('The Muldoon Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Janice', 'Muldoon', NULL, false, NULL, 'Family', 'Jeff', 'No');

  -- ── The Renz Family (2 guests)
  INSERT INTO households (name) VALUES ('The Renz Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Kate', 'Renz', NULL, false, NULL, 'Their Friends', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Sam', 'Renz', NULL, false, NULL, 'Their Friends', 'Jeff', 'Maybe');

  -- ── The Proulx Family (2 guests)
  INSERT INTO households (name) VALUES ('The Proulx Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Dave', 'Proulx', NULL, false, NULL, 'Their Friends', 'Jeff', 'No');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Aimee', 'Proulx', NULL, false, NULL, 'Their Friends', 'Jeff', 'No');

  -- ── The Byler McPherson Family (3 guests)
  INSERT INTO households (name) VALUES ('The Byler McPherson Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Jenny', 'Byler', NULL, false, NULL, 'Their Friends', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Katie', 'McPherson', NULL, false, NULL, 'Their Friends', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Jake', 'McPherson', NULL, false, NULL, 'Their Friends', 'Jeff', 'Maybe');

  -- ── The Handcock Family (2 guests)
  INSERT INTO households (name) VALUES ('The Handcock Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Donna', 'Handcock', NULL, false, NULL, 'Family', 'Jeff', 'No');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Rick', 'Handcock', NULL, false, NULL, 'Family', 'Jeff', 'No');

  -- ── The Ouska Family (2 guests)
  INSERT INTO households (name) VALUES ('The Ouska Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Nancy', 'Ouska', NULL, false, NULL, 'Family', 'Jeff', 'No');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Jerry', 'Ouska', NULL, false, NULL, 'Family', 'Jeff', 'No');

  -- ── The Purvis Family (2 guests)
  INSERT INTO households (name) VALUES ('The Purvis Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Jasper', 'Purvis', NULL, false, NULL, 'Their Friends', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Jessica', 'Purvis', NULL, false, NULL, 'Their Friends', 'Jeff', 'Maybe');

  -- ── The Demart Family (2 guests)
  INSERT INTO households (name) VALUES ('The Demart Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Chacory', 'Demart', NULL, false, NULL, 'Their Friends', 'Jeff', 'Maybe');

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Maliaki', 'Demart', NULL, false, NULL, 'Their Friends', 'Jeff', 'Maybe');

  -- ── The Leung Family (1 guest)
  INSERT INTO households (name) VALUES ('The Leung Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Patrick', 'Leung', NULL, false, NULL, 'Our Friends', 'Ash', 'Maybe');

  -- ── The Cheung Family (1 guest)
  INSERT INTO households (name) VALUES ('The Cheung Family') RETURNING id INTO hh_id;

  INSERT INTO guests
    (household_id, first_name, last_name, suffix, plus_one_allowed, plus_one_name, affiliation, side, likelihood)
  VALUES
    (hh_id, 'Monit', 'Cheung', NULL, false, NULL, 'Our Friends', 'Ash', 'Maybe');

END $$;

COMMIT;