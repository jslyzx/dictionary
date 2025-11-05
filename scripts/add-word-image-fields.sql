-- Migration: Add word image metadata fields
-- Date: 2025-01-05

-- Add image metadata fields to words table
ALTER TABLE words 
ADD COLUMN has_image TINYINT(1) DEFAULT 0 NOT NULL COMMENT '是否有图片(1有 0无)',
ADD COLUMN image_type ENUM('url', 'iconfont', 'emoji') NULL COMMENT '图片类型(url/iconfont/emoji)',
ADD COLUMN image_value VARCHAR(500) NULL COMMENT '图片值(URL/图标类名/emoji)';

-- Add index for performance on has_image field
ALTER TABLE words ADD INDEX idx_has_image (has_image);