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