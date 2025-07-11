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
    topology_kind TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS feeder_infos (
    id TEXT PRIMARY KEY,
    component_type TEXT NOT NULL,
    equipment_id TEXT NOT NULL,
    side TEXT
);

CREATE TABLE IF NOT EXISTS sld_metadata (
    id TEXT PRIMARY KEY,
    feeder_info_id TEXT NOT NULL,
    parent_id TEXT NOT NULL,
    parent_type TEXT NOT NULL CHECK (parent_type IN ('voltage_level', 'substation')),
    FOREIGN KEY (feeder_info_id) REFERENCES feeder_infos(id)
);

-- Création d'un index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_metadata_parent
ON sld_metadata(parent_id, parent_type);

CREATE TABLE IF NOT EXISTS dynawo_game_master_outputs (
    id TEXT PRIMARY KEY,
    dynawo_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    graphical_id TEXT,
    equipment_id TEXT,
    side TEXT,
    component_type TEXT,
    unit TEXT
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSON NOT NULL
);
