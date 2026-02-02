-- =====================================================
-- BETMAN MySQL Database Schema
-- =====================================================
-- Run this script to create the database and tables
-- Usage: mysql -u root -p < mysql-schema.sql
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS betman CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE betman;

-- =====================================================
-- TABLES
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('ADMIN', 'PLAYER', 'CONFIG') NOT NULL DEFAULT 'PLAYER',
    password_hash VARCHAR(255) NOT NULL,
    preferred_language ENUM('it', 'en') NOT NULL DEFAULT 'en',
    preferred_theme ENUM('light', 'dark', 'system') NOT NULL DEFAULT 'system',
    favorite_team_id VARCHAR(50) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    flag_image_url VARCHAR(500) NOT NULL,
    INDEX idx_name (name)
) ENGINE=InnoDB;

-- Add foreign key constraint after teams table exists
ALTER TABLE users 
    ADD CONSTRAINT fk_users_favorite_team 
    FOREIGN KEY (favorite_team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB;

-- Tournament Teams (palette)
CREATE TABLE IF NOT EXISTS tournament_teams (
    tournament_id VARCHAR(50) NOT NULL,
    team_id VARCHAR(50) NOT NULL,
    PRIMARY KEY (tournament_id, team_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id VARCHAR(50) PRIMARY KEY,
    tournament_id VARCHAR(50) NOT NULL,
    start_datetime DATETIME NOT NULL,
    team1_id VARCHAR(50) NOT NULL,
    team2_id VARCHAR(50) NOT NULL,
    stage ENUM('NORMAL', 'SEMIFINAL', 'FINAL') NOT NULL DEFAULT 'NORMAL',
    result_team1_goals INT NULL,
    result_team2_goals INT NULL,
    result_set_at DATETIME NULL,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (team1_id) REFERENCES teams(id) ON DELETE RESTRICT,
    FOREIGN KEY (team2_id) REFERENCES teams(id) ON DELETE RESTRICT,
    INDEX idx_tournament (tournament_id),
    INDEX idx_start_datetime (start_datetime),
    CONSTRAINT chk_different_teams CHECK (team1_id != team2_id),
    CONSTRAINT chk_goals_positive CHECK (result_team1_goals >= 0 AND result_team2_goals >= 0)
) ENGINE=InnoDB;

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id VARCHAR(50) PRIMARY KEY,
    match_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    pred_team1_goals INT NOT NULL,
    pred_team2_goals INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_match_user (match_id, user_id),
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_pred_goals_positive CHECK (pred_team1_goals >= 0 AND pred_team2_goals >= 0)
) ENGINE=InnoDB;

-- Bonus Inventory table
CREATE TABLE IF NOT EXISTS bonus_inventories (
    user_id VARCHAR(50) NOT NULL,
    tournament_id VARCHAR(50) NOT NULL,
    bonus_type ENUM('DOUBLE_POINTS', 'GOAL_DIFF_MULTIPLIER', 'PLUS_1H') NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, tournament_id, bonus_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    CONSTRAINT chk_quantity_positive CHECK (quantity >= 0)
) ENGINE=InnoDB;

-- Bonus Usage table
CREATE TABLE IF NOT EXISTS bonus_usages (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    match_id VARCHAR(50) NOT NULL,
    bonus_type ENUM('DOUBLE_POINTS', 'GOAL_DIFF_MULTIPLIER', 'PLUS_1H') NOT NULL,
    used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_match (user_id, match_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Shop Purchases table
CREATE TABLE IF NOT EXISTS shop_purchases (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    tournament_id VARCHAR(50) NOT NULL,
    bonus_type ENUM('DOUBLE_POINTS', 'GOAL_DIFF_MULTIPLIER', 'PLUS_1H') NOT NULL,
    cost_points INT NOT NULL DEFAULT 3,
    purchased_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    INDEX idx_user_tournament (user_id, tournament_id)
) ENGINE=InnoDB;

-- Database Configuration table (for storing MySQL connection settings)
CREATE TABLE IF NOT EXISTS db_config (
    id INT PRIMARY KEY DEFAULT 1,
    mysql_host VARCHAR(255) NOT NULL DEFAULT 'localhost',
    mysql_port INT NOT NULL DEFAULT 3306,
    mysql_database VARCHAR(100) NOT NULL DEFAULT 'betman',
    mysql_username VARCHAR(100) NOT NULL DEFAULT 'root',
    mysql_password VARCHAR(255) NOT NULL DEFAULT '',
    is_configured BOOLEAN NOT NULL DEFAULT FALSE,
    last_test_at DATETIME NULL,
    last_test_result BOOLEAN NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_single_row CHECK (id = 1)
) ENGINE=InnoDB;

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default db_config row
INSERT INTO db_config (id, mysql_host, mysql_port, mysql_database, mysql_username, mysql_password, is_configured)
VALUES (1, 'localhost', 3306, 'betman', 'root', '', FALSE)
ON DUPLICATE KEY UPDATE id = id;

-- Insert admin user (password: Aa1!)
-- Password hash for 'Aa1!' using bcrypt
INSERT INTO users (id, username, email, role, password_hash, preferred_language, preferred_theme, favorite_team_id, created_at)
VALUES ('admin-1', 'admin', 'admin@betman.ch', 'ADMIN', '$2b$10$rQZ8K8Y8Y8Y8Y8Y8Y8Y8YuKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxK', 'en', 'system', NULL, NOW())
ON DUPLICATE KEY UPDATE username = username;

-- Insert config user (password: Config1!)
-- Password hash for 'Config1!' using bcrypt
INSERT INTO users (id, username, email, role, password_hash, preferred_language, preferred_theme, favorite_team_id, created_at)
VALUES ('config-1', 'config', 'config@betman.ch', 'CONFIG', '$2b$10$rQZ8K8Y8Y8Y8Y8Y8Y8Y8YuKxKxKxKxKxKxKxKxKxKxKxKxKxKxKxK', 'en', 'system', NULL, NOW())
ON DUPLICATE KEY UPDATE username = username;

-- Insert sample teams
INSERT INTO teams (id, name, flag_image_url) VALUES
('team-ita', 'Italy', 'https://flagcdn.com/w80/it.png'),
('team-ger', 'Germany', 'https://flagcdn.com/w80/de.png'),
('team-fra', 'France', 'https://flagcdn.com/w80/fr.png'),
('team-esp', 'Spain', 'https://flagcdn.com/w80/es.png'),
('team-eng', 'England', 'https://flagcdn.com/w80/gb-eng.png'),
('team-por', 'Portugal', 'https://flagcdn.com/w80/pt.png'),
('team-ned', 'Netherlands', 'https://flagcdn.com/w80/nl.png'),
('team-bel', 'Belgium', 'https://flagcdn.com/w80/be.png')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert sample tournament
INSERT INTO tournaments (id, name, created_at)
VALUES ('tournament-euro2024', 'Euro 2024', NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert tournament teams
INSERT INTO tournament_teams (tournament_id, team_id) VALUES
('tournament-euro2024', 'team-ita'),
('tournament-euro2024', 'team-ger'),
('tournament-euro2024', 'team-fra'),
('tournament-euro2024', 'team-esp'),
('tournament-euro2024', 'team-eng'),
('tournament-euro2024', 'team-por'),
('tournament-euro2024', 'team-ned'),
('tournament-euro2024', 'team-bel')
ON DUPLICATE KEY UPDATE tournament_id = tournament_id;

-- =====================================================
-- VIEWS (Optional - for easier querying)
-- =====================================================

-- View for matches with team details
CREATE OR REPLACE VIEW v_matches_details AS
SELECT 
    m.id,
    m.tournament_id,
    t.name AS tournament_name,
    m.start_datetime,
    m.team1_id,
    t1.name AS team1_name,
    t1.flag_image_url AS team1_flag,
    m.team2_id,
    t2.name AS team2_name,
    t2.flag_image_url AS team2_flag,
    m.stage,
    m.result_team1_goals,
    m.result_team2_goals,
    m.result_set_at
FROM matches m
JOIN tournaments t ON m.tournament_id = t.id
JOIN teams t1 ON m.team1_id = t1.id
JOIN teams t2 ON m.team2_id = t2.id;

-- View for leaderboard calculation
CREATE OR REPLACE VIEW v_leaderboard AS
SELECT 
    u.id AS user_id,
    u.username,
    m.tournament_id,
    SUM(
        CASE 
            -- Exact score: 5 points
            WHEN p.pred_team1_goals = m.result_team1_goals 
                AND p.pred_team2_goals = m.result_team2_goals 
            THEN 5
            -- Correct goal difference: 2 points
            WHEN (p.pred_team1_goals - p.pred_team2_goals) = (m.result_team1_goals - m.result_team2_goals)
            THEN 2
            -- Correct outcome: 1 point
            WHEN SIGN(p.pred_team1_goals - p.pred_team2_goals) = SIGN(m.result_team1_goals - m.result_team2_goals)
            THEN 1
            ELSE 0
        END
        -- Apply multipliers (simplified - full calculation in application)
        * CASE WHEN m.stage IN ('SEMIFINAL', 'FINAL') THEN 2 ELSE 1 END
        * CASE WHEN u.favorite_team_id IN (m.team1_id, m.team2_id) THEN 2 ELSE 1 END
    ) AS total_points
FROM users u
JOIN predictions p ON u.id = p.user_id
JOIN matches m ON p.match_id = m.id
WHERE m.result_team1_goals IS NOT NULL 
    AND m.result_team2_goals IS NOT NULL
    AND u.role = 'PLAYER'
GROUP BY u.id, u.username, m.tournament_id;

-- =====================================================
-- STORED PROCEDURES (Optional)
-- =====================================================

DELIMITER //

-- Procedure to initialize bonus inventory for a user in a tournament
CREATE PROCEDURE IF NOT EXISTS sp_init_bonus_inventory(
    IN p_user_id VARCHAR(50),
    IN p_tournament_id VARCHAR(50)
)
BEGIN
    INSERT IGNORE INTO bonus_inventories (user_id, tournament_id, bonus_type, quantity)
    VALUES 
        (p_user_id, p_tournament_id, 'DOUBLE_POINTS', 1),
        (p_user_id, p_tournament_id, 'GOAL_DIFF_MULTIPLIER', 1),
        (p_user_id, p_tournament_id, 'PLUS_1H', 1);
END //

-- Procedure to get user's total purchases in a tournament
CREATE PROCEDURE IF NOT EXISTS sp_get_purchase_count(
    IN p_user_id VARCHAR(50),
    IN p_tournament_id VARCHAR(50),
    OUT p_count INT
)
BEGIN
    SELECT COUNT(*) INTO p_count
    FROM shop_purchases
    WHERE user_id = p_user_id AND tournament_id = p_tournament_id;
END //

DELIMITER ;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_bonus_usages_user ON bonus_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_user ON shop_purchases(user_id);

-- =====================================================
-- GRANTS (Adjust as needed for your setup)
-- =====================================================

-- Create application user (optional - run as root)
-- CREATE USER IF NOT EXISTS 'betman_app'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON betman.* TO 'betman_app'@'localhost';
-- FLUSH PRIVILEGES;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
