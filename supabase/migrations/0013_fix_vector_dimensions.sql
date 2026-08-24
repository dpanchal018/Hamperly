ALTER TABLE public.chat_sessions ALTER COLUMN embedding TYPE vector(3072);

CREATE OR REPLACE FUNCTION match_chat_sessions (
  query_embedding vector(3072),
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
