-- Rollback: 011-fighter-cards-minute-given-varchar
-- Revert minute_given to TIME (valeurs non conformes seront tronquees)

ALTER TABLE fighter_cards
  ALTER COLUMN minute_given TYPE TIME
  USING minute_given::time;
