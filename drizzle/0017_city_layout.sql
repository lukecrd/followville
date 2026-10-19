ALTER TABLE town_settings ADD COLUMN layout_revision integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE town_settings ADD COLUMN layout_token text;
--> statement-breakpoint
CREATE TABLE road_cuts (x integer NOT NULL, y integer NOT NULL, PRIMARY KEY (x,y));
--> statement-breakpoint
CREATE TRIGGER buildings_layout_insert AFTER INSERT ON buildings BEGIN UPDATE town_settings SET layout_revision=layout_revision+1 WHERE id=1; END;
--> statement-breakpoint
CREATE TRIGGER buildings_layout_update AFTER UPDATE OF x,y,kind,bridge_axis,bridge_span ON buildings BEGIN UPDATE town_settings SET layout_revision=layout_revision+1 WHERE id=1; END;
--> statement-breakpoint
CREATE TRIGGER buildings_layout_delete AFTER DELETE ON buildings BEGIN UPDATE town_settings SET layout_revision=layout_revision+1 WHERE id=1; END;
--> statement-breakpoint
CREATE TRIGGER road_cuts_layout_insert AFTER INSERT ON road_cuts BEGIN UPDATE town_settings SET layout_revision=layout_revision+1 WHERE id=1; END;
--> statement-breakpoint
CREATE TRIGGER projects_layout_insert AFTER INSERT ON neighborhood_projects BEGIN UPDATE town_settings SET layout_revision=layout_revision+1 WHERE id=1; END;
--> statement-breakpoint
CREATE TRIGGER projects_layout_update AFTER UPDATE OF x,y,completed_at ON neighborhood_projects BEGIN UPDATE town_settings SET layout_revision=layout_revision+1 WHERE id=1; END;
--> statement-breakpoint
ALTER TABLE buildings ADD COLUMN plot_span integer;
--> statement-breakpoint
UPDATE buildings SET plot_span=2 WHERE kind IN ('zoo','amusement');
