CREATE TABLE IF NOT EXISTS substations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    geo_tags TEXT NOT NULL,
    tso TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS voltage_levels (
    id TEXT PRIMARY KEY,
    nominal_v FLOAT NOT NULL,
    topology_kind TEXT NOT NULL,
);

CREATE TABLE IF NOT EXISTS feeder_infos (
    id TEXT PRIMARY KEY,
    component_type TEXT NOT NULL,
    equipment_id TEXT NOT NULL,
    side TEXT,
);

CREATE TABLE IF NOT EXISTS sld_metadata (
    id TEXT PRIMARY KEY AUTO_INCREMENT,
    feeder_info_id TEXT NOT NULL,
    parent_id TEXT NOT NULL,
    parent_type TEXT NOT NULL CHECK (parent_type IN ('voltage_level', 'substation')),
    FOREIGN KEY (feeder_info_id) REFERENCES feeder_infos(id),
    FOREIGN KEY (parent_id) REFERENCES voltage_levels(id) 
        WHEN parent_type = 'voltage_level'
        ELSE REFERENCES substations(id)
);

-- Création d'un index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_metadata_parent 
ON metadata(parent_id, parent_type);


CREATE TABLE IF NOT EXISTS dynawo_game_master_outputs (
    id TEXT PRIMARY KEY,
    dynawo_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    equipment_id TEXT,
    side TEXT,
    component_type TEXT,
    unit TEXT,
);
