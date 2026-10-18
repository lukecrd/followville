-- Shared garden artwork was credited to the final donor; it belongs to the neighborhood.
UPDATE `garden_decorations` SET `username` = 'quartiere' WHERE `id` LIKE 'project-%';