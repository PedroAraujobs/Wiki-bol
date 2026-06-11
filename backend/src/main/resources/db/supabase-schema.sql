create table if not exists users (
	id uuid primary key,
	name varchar(255) not null,
	email varchar(255) not null unique,
	provider varchar(255) not null,
	role varchar(50) not null default 'USER',
	provider_id varchar(255) not null,
	avatar_url text,
	created_at timestamp(6) not null,
	updated_at timestamp(6) not null
);

alter table users
	add column if not exists role varchar(50) not null default 'USER';

create index if not exists idx_users_email on users (email);
create index if not exists idx_users_provider_provider_id on users (provider, provider_id);

create table if not exists pages (
	id uuid primary key,
	title varchar(255) not null,
	slug varchar(255) not null unique,
	content text not null,
	current_version integer not null,
	author_id uuid not null references users(id),
	created_at timestamp(6) not null,
	updated_at timestamp(6) not null,
	deleted_at timestamp(6)
);

create index if not exists idx_pages_slug on pages (slug);
create index if not exists idx_pages_deleted_at on pages (deleted_at);

create table if not exists page_keywords (
	page_id uuid not null references pages(id) on delete cascade,
	keyword varchar(50) not null,
	constraint uk_page_keywords_page_keyword primary key (page_id, keyword)
);

create index if not exists idx_page_keywords_keyword on page_keywords (keyword);

create table if not exists page_history (
	id uuid primary key,
	page_id uuid not null references pages(id),
	version integer not null,
	title varchar(255) not null,
	content text not null,
	edited_by_id uuid not null references users(id),
	change_summary varchar(255),
	created_at timestamp(6) not null,
	constraint uk_page_history_page_version unique (page_id, version)
);

create index if not exists idx_page_history_page_version on page_history (page_id, version);

create table if not exists page_history_keywords (
	history_id uuid not null references page_history(id) on delete cascade,
	keyword varchar(50) not null,
	constraint uk_page_history_keywords_history_keyword primary key (history_id, keyword)
);

create index if not exists idx_page_history_keywords_keyword on page_history_keywords (keyword);
