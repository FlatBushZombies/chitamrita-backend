-- Create messages table with additional fields for React Native
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image', 'file')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE NULL,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Create user_status table for online/offline tracking
CREATE TABLE IF NOT EXISTS user_status (
  user_id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away', 'busy')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender ON messages(receiver_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_status_updated ON user_status(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;

-- Create policies for messages table (more permissive for mobile app)
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
CREATE POLICY "Users can insert their own messages" ON messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (true);

-- Create policies for follows table
DROP POLICY IF EXISTS "Users can view follows" ON follows;
CREATE POLICY "Users can view follows" ON follows
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own follows" ON follows;
CREATE POLICY "Users can manage their own follows" ON follows
  FOR ALL USING (true);

-- Create policies for user_status table
DROP POLICY IF EXISTS "Users can view status" ON user_status;
CREATE POLICY "Users can view status" ON user_status
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own status" ON user_status;
CREATE POLICY "Users can update their own status" ON user_status
  FOR ALL USING (true);

-- Create function to get user conversations
CREATE OR REPLACE FUNCTION get_user_conversations(user_id TEXT, conversation_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  other_user_id TEXT,
  last_message_content TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  last_message_type TEXT,
  unread_count BIGINT,
  last_message_sender_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_messages AS (
    SELECT DISTINCT ON (
      CASE 
        WHEN m.sender_id = user_id THEN m.receiver_id 
        ELSE m.sender_id 
      END
    )
    CASE 
      WHEN m.sender_id = user_id THEN m.receiver_id 
      ELSE m.sender_id 
    END as other_user,
    m.content,
    m.created_at,
    m.message_type,
    m.sender_id
    FROM messages m
    WHERE m.sender_id = user_id OR m.receiver_id = user_id
    ORDER BY 
      CASE 
        WHEN m.sender_id = user_id THEN m.receiver_id 
        ELSE m.sender_id 
      END,
      m.created_at DESC
  ),
  unread_counts AS (
    SELECT 
      m.sender_id as other_user,
      COUNT(*) as unread_count
    FROM messages m
    WHERE m.receiver_id = user_id 
      AND m.read_at IS NULL
    GROUP BY m.sender_id
  )
  SELECT 
    lm.other_user,
    lm.content,
    lm.created_at,
    lm.message_type,
    COALESCE(uc.unread_count, 0),
    lm.sender_id
  FROM latest_messages lm
  LEFT JOIN unread_counts uc ON lm.other_user = uc.other_user
  ORDER BY lm.created_at DESC
  LIMIT conversation_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to update message timestamps
CREATE OR REPLACE FUNCTION update_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message updates
DROP TRIGGER IF EXISTS update_message_timestamp_trigger ON messages;
CREATE TRIGGER update_message_timestamp_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_timestamp();

-- Create function to update user status timestamp
CREATE OR REPLACE FUNCTION update_user_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'offline' THEN
    NEW.last_seen = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user status updates
DROP TRIGGER IF EXISTS update_user_status_timestamp_trigger ON user_status;
CREATE TRIGGER update_user_status_timestamp_trigger
  BEFORE UPDATE ON user_status
  FOR EACH ROW
  EXECUTE FUNCTION update_user_status_timestamp();
