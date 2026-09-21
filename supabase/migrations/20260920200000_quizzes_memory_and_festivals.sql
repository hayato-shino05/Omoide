-- クイズ・記憶ゲーム・フェスティバルパックのテーブル作成・RLS設定・シードデータ挿入

-- birthday_quizzes: クイズセット定義
create table if not exists birthday_quizzes (
  id              text primary key,
  title           text not null,
  description     text,
  celebrant_name  text,
  is_default      boolean default false,
  created_at      timestamptz default now()
);

-- quiz_questions: クイズの問題セット
create table if not exists quiz_questions (
  id              text primary key,
  quiz_id         text references birthday_quizzes(id) on delete cascade,
  question        text not null,
  options         jsonb not null,
  correct_index   int not null,
  explanation     text,
  sort_order      int default 0
);

-- memory_card_decks: 記憶ゲームのカードデッキ
create table if not exists memory_card_decks (
  id              text primary key,
  title           text not null,
  theme           text not null,
  cards           jsonb not null,
  is_default      boolean default false,
  created_at      timestamptz default now()
);

-- festival_packs: 年中行事・季節パック
create table if not exists festival_packs (
  id              text primary key,
  season          text not null,
  month_range     text not null,
  name_ja         text not null,
  name_en         text not null,
  greeting_ja     text not null,
  greeting_en     text not null,
  icon            text not null,
  theme_keys      jsonb not null,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz default now()
);

-- RLS有効化
alter table birthday_quizzes  enable row level security;
alter table quiz_questions     enable row level security;
alter table memory_card_decks  enable row level security;
alter table festival_packs     enable row level security;

-- 公開読み取り専用ポリシー
create policy "公開読み取り専用アクセスを許可" on birthday_quizzes  for select using (true);
create policy "公開読み取り専用アクセスを許可" on quiz_questions     for select using (true);
create policy "公開読み取り専用アクセスを許可" on memory_card_decks  for select using (true);
create policy "公開読み取り専用アクセスを許可" on festival_packs     for select using (true);

-- 匿名・認証ユーザーの書き込みを禁止
revoke insert, update, delete on birthday_quizzes  from anon, authenticated;
revoke insert, update, delete on quiz_questions     from anon, authenticated;
revoke insert, update, delete on memory_card_decks  from anon, authenticated;
revoke insert, update, delete on festival_packs     from anon, authenticated;

-- デフォルトクイズセットのシードデータ
insert into birthday_quizzes (id, title, description, is_default) values
  ('default-birthday-quiz', '誕生日クイズ', '登録された誕生日データからランダム生成されるクイズです', true)
on conflict (id) do update set
  title       = excluded.title,
  description = excluded.description,
  is_default  = excluded.is_default;

-- デフォルト記憶ゲームデッキのシードデータ
insert into memory_card_decks (id, title, theme, cards, is_default) values
  ('birthday-classic', '誕生日クラシック', 'birthday',
   '["🎂","🎁","🎈","🎉","🎊","🎀","🧁","🍰"]'::jsonb, true),
  ('seasons-japan', '四季の日本', 'seasons',
   '["🌸","⛄","🎆","🍂","🌺","❄️","🎇","🍁"]'::jsonb, false),
  ('animals-cute', 'かわいい動物', 'animals',
   '["🐱","🐶","🐰","🐻","🐼","🦊","🐸","🐨"]'::jsonb, false)
on conflict (id) do update set
  title      = excluded.title,
  theme      = excluded.theme,
  cards      = excluded.cards,
  is_default = excluded.is_default;

-- フェスティバルパックのシードデータ（13パック）
insert into festival_packs (id, season, month_range, name_ja, name_en, greeting_ja, greeting_en, icon, theme_keys) values
  ('shogatsu',  '冬', '1/1〜1/7',    '正月',    'Shogatsu',      '新年おめでとうございます',        'Happy New Year',                '🎍', '["shogatsu"]'::jsonb),
  ('setsubun',  '冬', '2/3',          '節分',    'Setsubun',      '鬼は外、福は内',                  'Drive away evil, welcome luck', '👹', '["setsubun"]'::jsonb),
  ('hinamatsuri','春','3/3',          'ひな祭り','Hinamatsuri',   'お雛様に願いを込めて',            'Wishing on Hina Dolls',         '🎎', '["hinamatsuri"]'::jsonb),
  ('hanami',    '春', '3/20〜5/10',   '花見',    'Hanami',        '桜の花の下でお祝いを',            'Celebrate under the cherry blossoms', '🌸', '["hanami"]'::jsonb),
  ('kodomo',    '春', '5/1〜5/5',     'こどもの日','Children''s Day','子どもの健やかな成長を願って', 'Wishing for children''s healthy growth', '🎏', '["kodomo"]'::jsonb),
  ('tanabata',  '夏', '7/1〜7/7',     '七夕',    'Tanabata',      '願いが星に届きますように',        'May your wishes reach the stars','🎋', '["tanabata"]'::jsonb),
  ('obon',      '夏', '8/13〜8/16',   'お盆',    'Obon',          'ご先祖様への感謝を込めて',        'With gratitude to our ancestors','🏮', '["obon"]'::jsonb),
  ('tsukimi',   '秋', '9月中旬',      '月見',    'Tsukimi',       '美しい月をご覧ください',          'Enjoy the beautiful moon',      '🌕', '["tsukimi"]'::jsonb),
  ('halloween', '秋', '10/28〜10/31', 'ハロウィン','Halloween',   'Trick or Treat！',               'Trick or Treat!',               '🎃', '["halloween"]'::jsonb),
  ('bunka',     '秋', '11/1〜11/7',   '文化の日','Culture Day',   '文化と平和を祝いましょう',        'Celebrate culture and peace',   '🎨', '["bunka"]'::jsonb),
  ('shichigosan','秋','11/15',        '七五三',  'Shichi-Go-San', '健やかな成長をお祝いします',      'Celebrating healthy growth',    '👘', '["shichigosan"]'::jsonb),
  ('christmas', '冬', '12/20〜12/25', 'クリスマス','Christmas',   'メリークリスマス！',              'Merry Christmas!',              '🎄', '["christmas"]'::jsonb),
  ('omisoka',   '冬', '12/31',        '大晦日',  'New Year''s Eve','良いお年をお迎えください',      'Wishing you a Happy New Year',  '🔔', '["omisoka"]'::jsonb)
on conflict (id) do update set
  season      = excluded.season,
  month_range = excluded.month_range,
  name_ja     = excluded.name_ja,
  name_en     = excluded.name_en,
  greeting_ja = excluded.greeting_ja,
  greeting_en = excluded.greeting_en,
  icon        = excluded.icon,
  theme_keys  = excluded.theme_keys;
