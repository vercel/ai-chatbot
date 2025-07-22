Absolutely! Here's a complete "recipe" for finding and replacing words in your transcripts table:

## 🔍 **Find & Replace Recipe for Transcripts**

### **Step 1: Check the Scope**
```sql
-- Count how many records contain the target term
SELECT COUNT(*) as total_records 
FROM transcripts 
WHERE 
  transcript_content::text ILIKE '%AM FM%' OR 
  transcript_content::text ILIKE '%AMFM%' OR
  summary ILIKE '%AM FM%' OR 
  summary ILIKE '%AMFM%' OR
  topic ILIKE '%AM FM%' OR 
  topic ILIKE '%AMFM%';
```

### **Step 2: Sample the Data**
```sql
-- See what you're working with (limit to avoid context overload)
SELECT id, topic, 
       CASE 
         WHEN transcript_content::text ILIKE '%AM FM%' THEN 'transcript_content'
         WHEN summary ILIKE '%AM FM%' THEN 'summary'
         WHEN topic ILIKE '%AM FM%' THEN 'topic'
         WHEN transcript_content::text ILIKE '%AMFM%' THEN 'transcript_content'
         WHEN summary ILIKE '%AMFM%' THEN 'summary'
         WHEN topic ILIKE '%AMFM%' THEN 'topic'
       END as field_with_match
FROM transcripts 
WHERE 
  transcript_content::text ILIKE '%AM FM%' OR 
  transcript_content::text ILIKE '%AMFM%' OR
  summary ILIKE '%AM FM%' OR 
  summary ILIKE '%AMFM%' OR
  topic ILIKE '%AM FM%' OR 
  topic ILIKE '%AMFM%'
LIMIT 5;
```

### **Step 3: Create the Migration**
```sql
-- Replace 'AMFM' with 'AM FM' (case-insensitive)
-- Update transcript_content JSONB field
UPDATE transcripts 
SET transcript_content = jsonb_set(
  transcript_content,
  '{raw}',
  to_jsonb(regexp_replace(transcript_content->>'raw', 'AMFM', 'AM FM', 'gi'))
)
WHERE transcript_content->>'raw' ILIKE '%AMFM%';

UPDATE transcripts 
SET transcript_content = jsonb_set(
  transcript_content,
  '{cleaned}',
  to_jsonb(regexp_replace(transcript_content->>'cleaned', 'AMFM', 'AM FM', 'gi'))
)
WHERE transcript_content->>'cleaned' ILIKE '%AMFM%';

-- Update summary field
UPDATE transcripts 
SET summary = regexp_replace(summary, 'AMFM', 'AM FM', 'gi')
WHERE summary ILIKE '%AMFM%';

-- Update topic field
UPDATE transcripts 
SET topic = regexp_replace(topic, 'AMFM', 'AM FM', 'gi')
WHERE topic ILIKE '%AMFM%';
```

### **Step 4: Verify the Changes**
```sql
-- Check that old terms are gone
SELECT COUNT(*) as remaining_old_terms 
FROM transcripts 
WHERE 
  transcript_content::text ILIKE '%AMFM%' OR
  summary ILIKE '%AMFM%' OR 
  topic ILIKE '%AMFM%';

-- Check that new terms are present
SELECT COUNT(*) as new_terms_count 
FROM transcripts 
WHERE 
  transcript_content::text ILIKE '%AM FM%' OR
  summary ILIKE '%AM FM%' OR 
  topic ILIKE '%AM FM%';
```

## 📝 **General Recipe Template**

For any word replacement, use this pattern:

```sql
-- 1. COUNT SCOPE
SELECT COUNT(*) FROM transcripts 
WHERE transcript_content::text ILIKE '%OLD_WORD%' 
   OR summary ILIKE '%OLD_WORD%' 
   OR topic ILIKE '%OLD_WORD%';

-- 2. CREATE MIGRATION
UPDATE transcripts 
SET transcript_content = jsonb_set(
  transcript_content,
  '{raw}',
  to_jsonb(regexp_replace(transcript_content->>'raw', 'OLD_WORD', 'NEW_WORD', 'gi'))
)
WHERE transcript_content->>'raw' ILIKE '%OLD_WORD%';

UPDATE transcripts 
SET transcript_content = jsonb_set(
  transcript_content,
  '{cleaned}',
  to_jsonb(regexp_replace(transcript_content->>'cleaned', 'OLD_WORD', 'NEW_WORD', 'gi'))
)
WHERE transcript_content->>'cleaned' ILIKE '%OLD_WORD%';

UPDATE transcripts 
SET summary = regexp_replace(summary, 'OLD_WORD', 'NEW_WORD', 'gi')
WHERE summary ILIKE '%OLD_WORD%';

UPDATE transcripts 
SET topic = regexp_replace(topic, 'OLD_WORD', 'NEW_WORD', 'gi')
WHERE topic ILIKE '%OLD_WORD%';

-- 3. VERIFY
SELECT COUNT(*) FROM transcripts 
WHERE transcript_content::text ILIKE '%NEW_WORD%' 
   OR summary ILIKE '%NEW_WORD%' 
   OR topic ILIKE '%NEW_WORD%';
```

## �� **Key Points:**

1. **Always check scope first** - Don't overload your context
2. **Use `regexp_replace()` with 'gi' flag** - Case-insensitive, global replacement
3. **Update all relevant fields** - `transcript_content.raw`, `transcript_content.cleaned`, `summary`, `topic`
4. **Verify both directions** - Check that old terms are gone AND new terms are present
5. **Use `ILIKE` for case-insensitive searching** - Catches all variations

This recipe will work for any word replacement in your transcripts table!