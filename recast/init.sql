drop table if exists conditions;
drop table if exists messages;
drop table if exists threads;

create table conditions (
    id      serial PRIMARY KEY,
    domain  varchar(40),
    board   varchar(40),
    keyword varchar(40),
    active  boolean
);

insert into conditions (domain, board, keyword, active) values ('eagle', 'livejupiter', '博衣こより', true);
insert into conditions (domain, board, keyword, active) values ('rio2016', 'jasmine', 'hololive有実況スレ', true);

create table threads (
    id              varchar(40) PRIMARY KEY,
    active          boolean,
    count           integer,
    url             text,
    title           text,
    condition_id    integer references conditions(id)
);

create table messages (
    num         integer,
    thread_id   varchar(40) references threads(id),
    name        text,
    date        text,
    uid         varchar(40),
    mes         text,
    PRIMARY KEY (num, thread_id)
);

create role api_user nologin;
grant usage on schema public to api_user;
grant all on public.conditions to api_user;
grant all on public.threads to api_user;
grant all on public.messages to api_user;
