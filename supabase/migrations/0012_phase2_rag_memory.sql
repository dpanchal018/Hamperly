-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Chat Sessions Table
CREATE TABLE public.chat_sessions (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_summary TEXT,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Chat Messages Table 
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (which the API uses)
CREATE POLICY "Service role full access to sessions" ON public.chat_sessions FOR ALL USING (true);
CREATE POLICY "Service role full access to messages" ON public.chat_messages FOR ALL USING (true);

-- Match function for pgvector similarity search
CREATE OR REPLACE FUNCTION match_chat_sessions (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  session_summary TEXT,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    chat_sessions.id,
    chat_sessions.session_summary,
    1 - (chat_sessions.embedding <=> query_embedding) AS similarity
  FROM chat_sessions
  WHERE session_summary IS NOT NULL 
    AND 1 - (chat_sessions.embedding <=> query_embedding) > match_threshold
  ORDER BY chat_sessions.embedding <=> query_embedding
  LIMIT match_count;
$$;
