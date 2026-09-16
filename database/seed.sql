begin;

-- 1. Sample Birthdays
insert into public.birthdays (name, month, day, year, message, created_at) values
  ('佐藤美咲', 3, 14, 1996, 'いつも笑顔をありがとう。これからの一年も素敵な毎日になりますように。', '2026-01-08T09:00:00+09:00'),
  ('高橋蓮', 7, 7, 1994, '新しい挑戦が実を結ぶ一年になりますように。誕生日おめでとう。', '2026-01-08T09:05:00+09:00'),
  ('中村葵', 10, 31, 1998, '好きなことを思いきり楽しめる一年にしよう。お誕生日おめでとう。', '2026-01-08T09:10:00+09:00'),
  ('山本陽一', 12, 24, 1992, 'いつもみんなを支えてくれてありがとう。心あたたまる一年を。', '2026-01-08T09:15:00+09:00')
on conflict do nothing;

-- 2. Sample Messages
insert into public.messages (sender, message, birthday_person, media_object_path, created_at) values
  ('鈴木花', '美咲ちゃん、お誕生日おめでとう！今年も一緒にたくさん笑おうね。', '佐藤美咲', null, '2026-03-10T18:20:00+09:00'),
  ('伊藤直樹', '蓮さんの新しい一年が、実り多いものになりますように。応援しています。', '高橋蓮', null, '2026-07-03T12:15:00+09:00'),
  ('小林由佳', '葵ちゃん、いつも明るい空気を作ってくれてありがとう。素敵な誕生日を！', '中村葵', null, '2026-10-28T20:05:00+09:00'),
  ('加藤健太', '陽一さん、メリークリスマス！そしてお誕生日おめでとうございます。', '山本陽一', null, '2026-12-20T21:30:00+09:00'),
  ('森七海', 'みんなの誕生日をお祝いできてうれしいです。これからも仲良く過ごそうね。', null, null, '2026-01-15T10:45:00+09:00')
on conflict do nothing;

-- 3. Sample Virtual Gifts
insert into public.virtual_gifts (sender, gift_emoji, gift_name, birthday_person, created_at) values
  ('鈴木花', '🎂', 'いちごの誕生日ケーキ', '佐藤美咲', '2026-03-14T08:10:00+09:00'),
  ('伊藤直樹', '🎁', 'お祝いギフトボックス', '高橋蓮', '2026-07-07T09:00:00+09:00'),
  ('小林由佳', '🌷', '季節の花束', '中村葵', '2026-10-31T11:25:00+09:00'),
  ('森七海', '✨', 'きらきら星のお守り', null, '2026-01-15T11:00:00+09:00'),
  ('加藤健太', '☕', 'あたたかいコーヒー', '山本陽一', '2026-12-24T07:45:00+09:00')
on conflict do nothing;

-- 4. Sample Chat Messages
insert into public.chat_messages (sender, message, created_at) values
  ('佐藤美咲', '今日はお祝いしてくれてありがとう！とても嬉しいです。', '2026-03-14T19:00:00+09:00'),
  ('高橋蓮', 'みんなのメッセージを読んで元気が出ました。ありがとう！', '2026-07-07T19:12:00+09:00'),
  ('中村葵', '次のお祝い会では、みんなで写真も撮ろうね。', '2026-10-31T18:40:00+09:00'),
  ('山本陽一', '今年も穏やかで楽しい一年にしたいと思います。', '2026-12-24T20:15:00+09:00'),
  ('森七海', 'お祝いの気持ちはいつでも投稿して大丈夫です。', '2026-01-15T11:20:00+09:00')
on conflict do nothing;

-- 5. Sample Bulletin Posts
insert into public.bulletin_posts (sender, message, media_object_path, birthday_person, created_at) values
  ('鈴木花', '3月14日は美咲ちゃんの誕生日です。みんなでお祝いメッセージを届けよう！', null, '佐藤美咲', '2026-03-01T09:30:00+09:00'),
  ('伊藤直樹', '蓮さんへのサプライズ企画を考えています。参加できる人は返信してください。', null, '高橋蓮', '2026-06-25T18:00:00+09:00'),
  ('小林由佳', '葵ちゃんへの寄せ書きメッセージを募集します。短い一言でも大歓迎です。', null, '中村葵', '2026-10-15T13:10:00+09:00'),
  ('森七海', '誕生日を迎える人へのお祝いアイデアを自由に共有しましょう。', null, null, '2026-01-10T16:45:00+09:00')
on conflict do nothing;

-- 6. Sample Post Replies
insert into public.post_replies (post_id, sender, message, created_at)
select p.id, r.sender, r.message, r.created_at::timestamptz
from public.bulletin_posts p
join (values
  ('鈴木花', '3月14日は美咲ちゃんの誕生日です。みんなでお祝いメッセージを届けよう！', '高橋蓮', '当日は朝からメッセージを送ります！', '2026-03-05T10:00:00+09:00'),
  ('鈴木花', '3月14日は美咲ちゃんの誕生日です。みんなでお祝いメッセージを届けよう！', '中村葵', '素敵な一日にしようね。', '2026-03-06T12:20:00+09:00'),
  ('伊藤直樹', '蓮さんへのサプライズ企画を考えています。参加できる人は返信してください。', '森七海', '参加します。飾り付けを担当したいです。', '2026-06-27T17:30:00+09:00'),
  ('伊藤直樹', '蓮さんへのサプライズ企画を考えています。参加できる人は返信してください。', '加藤健太', 'プレゼントの準備を手伝います。', '2026-06-28T08:15:00+09:00'),
  ('小林由佳', '葵ちゃんへの寄せ書きメッセージを募集します。短い一言でも大歓迎です。', '佐藤美咲', '葵ちゃんの優しさにいつも助けられています！', '2026-10-18T19:05:00+09:00'),
  ('森七海', '誕生日を迎える人へのお祝いアイデアを自由に共有しましょう。', '山本陽一', '好きな音楽を流すと盛り上がりそうです。', '2026-01-11T09:40:00+09:00')
) as r(post_sender, post_message, sender, message, created_at)
  on p.sender = r.post_sender and p.message = r.post_message
on conflict do nothing;

-- 7. Sample Curated Music Tracks with Lyrics
insert into public.music_tracks (name, title, artist, duration, url, file_name, file_size, cover_url, lyrics_lrc, is_preset, sort_order) values
  (
    'Birthday Celebration - Happy Birthday Accordion',
    'Happy Birthday Accordion',
    'Birthday Celebration',
    64,
    'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
    'happy_birthday_accordion.mp3',
    1024000,
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=300&h=300&fit=crop',
    '[00:00.00]Happy Birthday to You♪\n[00:06.00]Happy Birthday to You♪\n[00:12.00]Happy Birthday Dear Friend♪\n[00:18.00]Happy Birthday to You♪\n[00:25.00]May your day be filled with joy\n[00:32.00]And wonderful memories forever\n[00:40.00]Happy Birthday to You♪',
    true,
    1
  ),
  (
    'Acoustic Melody - Gentle Acoustic Guitar',
    'Gentle Acoustic Guitar',
    'Acoustic Melody',
    92,
    'https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3',
    'gentle_acoustic_guitar.mp3',
    1450000,
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop',
    '[00:00.00]そっと流れるアコースティックの音色\n[00:15.00]懐かしい日々の想い出を乗せて\n[00:30.00]優しく包み込む穏やかな光\n[00:45.00]いつまでも変わらない温もりを\n[01:00.00]心からありがとう',
    true,
    2
  ),
  (
    'Piano Peace - Celebration Piano',
    'Celebration Piano',
    'Piano Peace',
    85,
    'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
    'celebration_piano.mp3',
    1320000,
    'https://images.unsplash.com/photo-1520523839898-507127053e14?w=300&h=300&fit=crop',
    '[00:00.00]響き渡るピアノの音\n[00:12.00]祝福の風が吹き抜ける\n[00:24.00]新たな始まりに拍手を\n[00:38.00]笑顔あふれる未来へ\n[00:52.00]お誕生日おめでとう',
    true,
    3
  )
on conflict do nothing;

commit;
