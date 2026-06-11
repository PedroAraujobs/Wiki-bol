select
	table_name,
	column_name,
	data_type,
	is_nullable
from information_schema.columns
where table_schema = 'public'
	and table_name in ('users', 'pages', 'page_keywords', 'page_history', 'page_history_keywords')
order by table_name, ordinal_position;

select
	tc.table_name,
	tc.constraint_name,
	tc.constraint_type
from information_schema.table_constraints tc
where tc.table_schema = 'public'
	and tc.table_name in ('users', 'pages', 'page_keywords', 'page_history', 'page_history_keywords')
order by tc.table_name, tc.constraint_type, tc.constraint_name;

select
	tablename,
	indexname,
	indexdef
from pg_indexes
where schemaname = 'public'
	and tablename in ('users', 'pages', 'page_keywords', 'page_history', 'page_history_keywords')
order by tablename, indexname;
