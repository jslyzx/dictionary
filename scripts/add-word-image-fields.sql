-- Migration: Add word image columns
-- Date: 2025-01-05
-- Description: Adds optional image metadata support to the words table
-- Rollback: Manual - ALTER TABLE words DROP COLUMN has_image, DROP COLUMN image_type, DROP COLUMN image_value;

-- Add has_image flag (NOT NULL with default 0 for backward compatibility)
ALTER TABLE words ADD COLUMN has_image TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否有图片(0-无 1-有)' AFTER sentence;

-- Add image_type enum (NULL when has_image=0)
ALTER TABLE words ADD COLUMN image_type ENUM('url','iconfont','emoji') DEFAULT NULL COMMENT '图片类型(url-链接 iconfont-图标字体 emoji-表情)' AFTER has_image;

-- Add image_value field (NULL when has_image=0)
ALTER TABLE words ADD COLUMN image_value VARCHAR(512) DEFAULT NULL COMMENT '图片值(根据type存储URL/类名/emoji)' AFTER image_type;