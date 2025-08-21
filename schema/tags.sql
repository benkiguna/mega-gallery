-- Tags table to store unique tag names
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#3b82f6', -- hex color for tag display
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image tags junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS image_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID NOT NULL REFERENCES gallery_files(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(image_id, tag_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_image_tags_image_id ON image_tags(image_id);
CREATE INDEX IF NOT EXISTS idx_image_tags_tag_id ON image_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- RLS policies (if using Row Level Security)
-- ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE image_tags ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on your authentication needs)
-- CREATE POLICY "Tags are viewable by everyone" ON tags FOR SELECT USING (true);
-- CREATE POLICY "Image tags are viewable by everyone" ON image_tags FOR SELECT USING (true);