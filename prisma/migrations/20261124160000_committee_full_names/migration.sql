-- Give SCMA, JA A and JA B their full names, unless the secretariat already renamed them on the site.
UPDATE "Committee" SET "name" = 'Secret Council of Mysterious Affairs' WHERE "code" = 'SCMA' AND "name" = 'SCMA';
UPDATE "Committee" SET "name" = 'Junior Assembly A' WHERE "code" = 'JA A' AND "name" = 'JA A';
UPDATE "Committee" SET "name" = 'Junior Assembly B' WHERE "code" = 'JA B' AND "name" = 'JA B';
