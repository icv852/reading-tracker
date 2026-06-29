--
-- PostgreSQL database dump
--

\restrict WpUyqSjvndrPlc8Gf1it9imBlRN3W6nDR0Alo6dWa6D26IdEhoFZFocyipvG8Cb

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: read_status; Type: TYPE; Schema: public; Owner: vic
--

CREATE TYPE public.read_status AS ENUM (
    'want_to_read',
    'reading',
    'finished'
);


ALTER TYPE public.read_status OWNER TO vic;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: books; Type: TABLE; Schema: public; Owner: vic
--

CREATE TABLE public.books (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    author text,
    status public.read_status DEFAULT 'want_to_read'::public.read_status NOT NULL,
    rating integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT books_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.books OWNER TO vic;

--
-- Name: books_id_seq; Type: SEQUENCE; Schema: public; Owner: vic
--

CREATE SEQUENCE public.books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.books_id_seq OWNER TO vic;

--
-- Name: books_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vic
--

ALTER SEQUENCE public.books_id_seq OWNED BY public.books.id;


--
-- Name: notes; Type: TABLE; Schema: public; Owner: vic
--

CREATE TABLE public.notes (
    id integer NOT NULL,
    book_id integer NOT NULL,
    content text NOT NULL,
    page integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notes OWNER TO vic;

--
-- Name: notes_id_seq; Type: SEQUENCE; Schema: public; Owner: vic
--

CREATE SEQUENCE public.notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notes_id_seq OWNER TO vic;

--
-- Name: notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vic
--

ALTER SEQUENCE public.notes_id_seq OWNED BY public.notes.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: vic
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO vic;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: vic
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO vic;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: vic
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: books id; Type: DEFAULT; Schema: public; Owner: vic
--

ALTER TABLE ONLY public.books ALTER COLUMN id SET DEFAULT nextval('public.books_id_seq'::regclass);


--
-- Name: notes id; Type: DEFAULT; Schema: public; Owner: vic
--

ALTER TABLE ONLY public.notes ALTER COLUMN id SET DEFAULT nextval('public.notes_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: vic
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: books books_pkey; Type: CONSTRAINT; Schema: public; Owner: vic
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: vic
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: vic
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: vic
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: books books_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vic
--

ALTER TABLE ONLY public.books
    ADD CONSTRAINT books_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notes notes_book_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: vic
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict WpUyqSjvndrPlc8Gf1it9imBlRN3W6nDR0Alo6dWa6D26IdEhoFZFocyipvG8Cb

