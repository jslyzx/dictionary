-- Migration: Add sentence field and modify notes field to TEXT type
-- Date: 2024-11-04

-- Add sentence field (TEXT type for longer content)
ALTER TABLE words ADD COLUMN sentence TEXT COMMENT '例句(可选)' AFTER notes;

-- Modify notes field from VARCHAR(255) to TEXT for longer content
ALTER TABLE words MODIFY COLUMN notes TEXT COMMENT '笔记(可选)';