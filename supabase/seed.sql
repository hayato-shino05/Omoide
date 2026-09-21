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

-- 8. Daily Fortunes (12 Omikuji Master Records)
insert into public.daily_fortunes (id, rank, rank_name_ja, rank_name_en, poem_ja, poem_en, general_ja, general_en, bond_ja, bond_en, health_ja, health_en, wish_ja, wish_en, blessing_ja, blessing_en, lucky_color_ja, lucky_color_en, lucky_item_ja, lucky_item_en, lucky_number, sort_order)
values
  (1, 'daikichi', '大吉', 'Great Blessing',
   '花ひらき 笑顔あふれる 祝いの日 光あまねく 道を照らさん',
   'Blossoms unfold on this joyful day of celebration; radiant light illuminates your path ahead.',
   '至高の幸運に恵まれる一日。心からの願いが次々と実を結び、周囲からの温かな祝福と笑顔に包まれます。',
   'A magnificent day blessed with supreme good fortune. Your heartfelt wishes bear fruit surrounded by warmth and smiles.',
   '大切な人との絆が一段と深まります。感謝の言葉を素直に伝えて吉。',
   'Cherished bonds grow even deeper. Expressing sincere gratitude brings immense joy.',
   '気力・体力ともに充実。爽やかな風を感じて散歩すると良い閃きが。',
   'Vitality and energy at their peak. A gentle stroll in the breeze sparks fresh inspiration.',
   '長年温めてきた夢や目標に大きな前進あり。自信を持って進みましょう。',
   'Great strides in long-held dreams and goals. Move forward with confidence.',
   'あなたの生まれたこの特別な日に、世界中から優しい光が降り注ぎます。',
   'On this special day of your birth, gentle light pours down from across the world.',
   '桜色（さくらいろ）', 'Cherry Blossom Pink',
   'バースデーケーキと金箔', 'Birthday Cake & Gold Leaf',
   7, 1),

  (2, 'daikichi', '大吉', 'Great Blessing',
   '雲晴れて 富士の嶺照らす 初日の出 志遥かに 夢羽ばたけり',
   'Clouds part to reveal Mount Fuji bathed in morning sunrise; your noble aspirations take flight.',
   '運気は最高潮。迷いを捨てて新しい挑戦へ踏み出す絶好の契機です。周囲の協力にも恵まれます。',
   'Fortune reaches its zenith. An ideal moment to embark on bold new adventures with supportive allies.',
   '旧友や家族との再会・語らいが、かけがえのない宝物になります。',
   'Reconnecting and talking with old friends or family becomes an irreplaceable treasure.',
   '快眠快食で心身健やか。お祝いのご馳走を笑顔で楽しんで吉。',
   'Great sleep and joyful meals keep spirit vibrant. Enjoy celebratory dishes with smiles.',
   '思い描いた通りの結果が得られる兆し。仲間と共に喜びを分かち合えます。',
   'Signs of achieving exactly what you envisioned. Share the joy with those around you.',
   '重ねてきた年月が美しい年輪となり、今日という日を輝かせています。',
   'The passing years have woven beautiful rings of wisdom, illuminating today with grace.',
   '黄金色（こがねいろ）', 'Imperial Gold',
   'フォトフレームと思い出の写真', 'Photo Frame & Cherished Picture',
   8, 2),

  (3, 'daikichi', '大吉', 'Great Blessing',
   '清流に 錦を映す もみじ葉の 輝く未来 ここに始まり',
   'Reflected like brocade in clear waters, radiant maple leaves mark the dawn of a bright future.',
   'あらゆる巡り合わせが調和する恵みの日。これまでの努力が素晴らしい実を結びます。',
   'A blessed day of harmonious alignment. Past efforts blossom into splendid results.',
   '心通い合う温かい会話から、生涯続く友情や縁が育まれます。',
   'Warm, heartfelt conversations nurture lifelong bonds of genuine friendship.',
   '身体が軽快で意欲満々。趣味や創作活動に没頭するのに最適です。',
   'Body feels light and spirit inspired. Perfect time to immerse in creative arts.',
   '諦めかけていたことに思わぬ好機到来。最後まで信じて吉。',
   'An unexpected breakthrough appears for what seemed challenging. Keep your faith.',
   'いつも周りを笑顔にしてくれるあなたへ、最高の幸せが訪れますように。',
   'To you who always brings smiles to others, may the greatest happiness be yours.',
   '深紅（しんく）', 'Crimson Red',
   '手書きのメッセージカード', 'Handwritten Message Card',
   1, 3),

  (4, 'chukichi', '中吉', 'Middle Blessing',
   '緑なす 若葉そよぐ 朝風に 夢紡ぐ糸 静かに強く',
   'In morning breezes swaying green young leaves, threads of dreams are quietly and strongly spun.',
   '着実な前進と穏やかな喜びに満ちた日。焦らず丁寧に物事を進めることで幸運が定着します。',
   'A day filled with steady progress and serene joy. Moving thoughtfully seals good fortune.',
   '身近な人の長所に気づき、褒め合うことで絆がさらに深まります。',
   'Noticing and praising the virtues of those close to you deepens mutual trust.',
   '温かいハーブティーや緑茶で一息入れるとリフレッシュできます。',
   'Taking a cozy break with herbal or green tea brings wonderful rejuvenation.',
   '一歩一歩の積み重ねが大きな成果へと結実します。計画を大切に。',
   'Step-by-step consistency culminates in grand achievement. Cherish your plans.',
   '新たな一年の幕開けに、たくさんの素晴らしい発見と出会いがありますように。',
   'As your new year unfolds, may it be filled with wonderful discoveries and encounters.',
   '山吹色（やまぶきいろ）', 'Golden Yellow',
   'オルゴール・音楽プレイヤー', 'Music Box & Melody Player',
   3, 4),

  (5, 'chukichi', '中吉', 'Middle Blessing',
   '水面に 映る月影 澄み渡り 静かなる心 宝を宿す',
   'Moonlight reflected on clear waters shines bright; a serene heart harbors timeless treasures.',
   '精神的な充実が得られる良き日。懐かしい思い出を振り返ることで新たな活力を見出せます。',
   'A fulfilling day for the soul. Reflecting on nostalgic memories sparks fresh vitality.',
   '言葉少なでも気持ちが通じ合える安心感に包まれます。',
   'Enveloped in comforting trust where few words are needed to understand each other.',
   'ストレッチや深呼吸でリラックス。姿勢を整えると運気アップ。',
   'Relax with light stretches and deep breathing. Good posture elevates your energy.',
   '助言を素直に受け入れることで、思わぬ近道が見つかります。',
   'Listening open-heartedly to advice reveals unexpected, pleasant shortcuts.',
   'あなたの優しさがいつも周りを温めています。特別な今日を存分に楽しんで。',
   'Your kindness always warms those around you. Enjoy every moment of this special day.',
   '浅葱色（あさぎいろ）', 'Light Azure Blue',
   '和風のしおり・本', 'Traditional Bookmark & Book',
   5, 5),

  (6, 'shokichi', '小吉', 'Small Blessing',
   '野に咲ける 名もなき花の 健気に 香りそっと 心癒やす',
   'Wildflowers blooming gently in the field soothe the heart with their delicate fragrance.',
   '日常の小さな幸せに恵まれる日。ささやかな出来事の中に温かい感動を見つけられます。',
   'A day touched by gentle, everyday joys. Warm inspiration is found in simple moments.',
   'ちょっとしたおすそ分けや気配りが喜ばれ、笑顔が広がります。',
   'Small thoughtful gestures and sharing bring delighted smiles to those around you.',
   'バランスの良い食事と適度な休憩を心がけると吉。',
   'Mindful meals and balanced rest keep you in great harmony.',
   '急がば回れの精神で。基礎を固めることが成功への鍵となります。',
   'Steady patience wins the race. Solid foundations unlock lasting success.',
   '小さな幸せの積み重ねが、やがて大きな喜びの花を咲かせます。',
   'The accumulation of small joys will soon bloom into grand happiness.',
   '抹茶色（まっちゃいろ）', 'Matcha Green',
   '和菓子・お茶', 'Japanese Sweets & Tea',
   6, 6),

  (7, 'shokichi', '小吉', 'Small Blessing',
   '雨上がり 虹の架け橋 空仰ぎ 新たな希望 胸に灯らん',
   'After the rain a rainbow bridges the sky; fresh hope gently kindles within the heart.',
   '停滞していたことが少しずつ動き始める兆し。前向きな気持ちで過ごすと好転します。',
   'Things in stillness begin to gently move. Maintaining an optimistic outlook brings sunny days.',
   '久しぶりの連絡が思わぬ嬉しい展開に発展する予感。',
   'A message from someone after a while sparks a wonderful, pleasant connection.',
   '目や肩を休めてリフレッシュを。お風呂にゆっくり浸かると吉。',
   'Rest your eyes and shoulders. A warm soothing bath restores your energy.',
   '周囲の意見を参考にしながら、自分のペースで進めましょう。',
   'Proceed at your own comfortable pace while taking friendly insights into account.',
   '雨のあとに虹が架かるように、あなたの未来にも輝かしい光が待っています。',
   'Just as rainbows follow the rain, radiant light awaits your bright future.',
   '藤色（ふじいろ）', 'Wisteria Purple',
   '折り紙の花・手紙', 'Origami Flower & Letter',
   2, 7),

  (8, 'kichi', '吉', 'Blessing',
   '松の緑 幾代経ても 変わらじと 変わらぬ愛の 尊きを知る',
   'Evergreen pines remain steadfast through generations, teaching the timeless value of enduring love.',
   '安定した平和な運気。いつも通りの日常がかけがえのない宝物であると実感できる日です。',
   'A peaceful and grounded day. Everyday moments reveal themselves as true treasures.',
   '昔からの親しい間柄の人と、変わらない安心感を分かち合えます。',
   'Share comforting, unchanging warmth with longtime close companions.',
   '規則正しい生活リズムを守ることで、体調良好をキープ。',
   'Maintaining a regular daily rhythm keeps health and vitality well-balanced.',
   '現状を丁寧に維持・改善していくことで、確実な実りへとつながります。',
   'Polishing and nurturing present efforts leads to certain, fruitful rewards.',
   '変わらない絆と温かい愛情に包まれて、穏やかな一年をお過ごしください。',
   'Surrounded by enduring bonds and heartfelt love, may your year be peaceful and bright.',
   '萌黄色（もえぎいろ）', 'Fresh Sprout Green',
   '記念切手・ノート', 'Commemorative Stamp & Journal',
   4, 8),

  (9, 'kichi', '吉', 'Blessing',
   '竹の節 伸びゆくごとに 節固く 試練も糧に 強く育たん',
   'With each joint bamboo grows taller and sturdier; every trial becomes strength for growth.',
   '節目の日を迎えて気持ちを新たにする好機。過去の経験がすべて力になっていると実感できます。',
   'A milestone moment to renew spirit. You will feel that all past experiences are your strength.',
   '互いに切磋琢磨し合える良き仲間に恵まれます。',
   'Blessed with wonderful peers who inspire and elevate each other.',
   '適度な運動を取り入れると活力が湧いてきます。',
   'Incorporating moderate exercise brings an invigorating surge of vitality.',
   '初心を忘れずに取り組むことで、確実な道が開けていきます。',
   'Remembering your initial passion opens a steady and dependable path forward.',
   '一つ歳を重ねるごとに、あなたの魅力と深みがいっそう増していきます。',
   'With every passing year, your charm, depth, and beauty grow even brighter.',
   '瑠璃色（るりいろ）', 'Lapis Lazuli Blue',
   'お気に入りの万年筆・ペン', 'Favorite Pen & Stationery',
   9, 9),

  (10, 'suekichi', '末吉', 'Future Blessing',
   '冬枯れの 枝にもやがて 春立ちて 蕾ふくらみ 花咲く日待つ',
   'On winter branches spring will soon arrive; buds swell quietly, waiting for the day of bloom.',
   'これから徐々に運気が上向いていく吉兆。今はじっくり種を蒔き、準備を整える時期です。',
   'An auspicious sign of rising fortunes ahead. A rewarding time for quiet preparation and planting seeds.',
   '時間をかけて少しずつ信頼を育むことで、強固な関係が築けます。',
   'Taking time to gently nurture trust builds unbreakable, long-lasting relationships.',
   '体を冷やさないように温かくして過ごすと調子が整います。',
   'Staying warm and cozy helps keep your body and mind in optimal balance.',
   '焦りは禁物。時が満ちれば自然と良い結果に結びつきます。',
   'Patience is your ally. When the time is ripe, things will naturally flourish.',
   '未来のあなたが笑顔で振り返ることができるよう、今日の一歩を大切に。',
   'Cherish today''s step so that your future self can look back with a radiant smile.',
   '撫子色（なでしこいろ）', 'Dianthus Pink',
   'あたたかいブランケット', 'Cozy Warm Blanket',
   10, 10),

  (11, 'suekichi', '末吉', 'Future Blessing',
   '小川ゆく 水の流れは 淀みなく やがて大海 辿り着くらむ',
   'The stream flows forward without hesitation, destined in time to meet the grand ocean.',
   '今は小さな一歩でも、やがて大きな海へと注ぐように成果が広がっていきます。',
   'Even small steps today will widen into vast oceans of achievement over time.',
   '相手の話にじっくり耳を傾けることで、誤解が解けて和やかになります。',
   'Listening patiently to others dissolves misunderstandings and restores harmony.',
   '無理をせず、自分のペースを崩さないことが健康の秘訣。',
   'Not overexerting yourself and honoring your natural pace is the key to well-being.',
   '後半に向けて運気上昇。粘り強さが大きな武器となります。',
   'Fortunes rise as days progress. Resilience and perseverance are your greatest assets.',
   'あなたの歩んできた道はすべて未来の輝く宝物につながっています。',
   'Every step of your journey leads to radiant treasures in the future.',
   '茜色（あかねいろ）', 'Sunset Madder Orange',
   'ランタン・キャンドル', 'Lantern & Candle',
   11, 11),

  (12, 'hankichi', '半吉', 'Half Blessing',
   '半ば咲く 花も風情の ありにけり 満ちゆく月を 楽しむ心地',
   'Half-bloomed blossoms possess their own poetic elegance, like watching the waxing moon grow full.',
   '伸びしろと可能性に満ちた状態。完璧を求めすぎず、途中のプロセスを楽しむと吉。',
   'A state filled with boundless potential and growth. Savor the process rather than seeking perfection.',
   'お互いの違いを認め合うことで、新しい発見と面白さが生まれます。',
   'Embracing each other''s differences brings fresh discoveries and delightful perspectives.',
   '気分転換にお気に入りの音楽を聴いたり、ゲームを楽しんだりして吉。',
   'Listening to favorite melodies or playing interactive mini-games refreshes your mood.',
   '半分叶ったことを喜び、残り半分をこれからの楽しみに取っておきましょう。',
   'Celebrate the half already achieved, and look forward to the other half with joyful anticipation.',
   '完璧でなくていい、ありのままのあなたが一番輝いています。お誕生日おめでとう！',
   'You do not need to be perfect—being your authentic self is what shines brightest. Happy Birthday!',
   '若竹色（わかたけいろ）', 'Young Bamboo Green',
   'パズル・おもちゃ', 'Puzzle & Wooden Toy',
   12, 12)
on conflict (id) do nothing;

-- 9. Birthday Quizzes & Questions
insert into public.birthday_quizzes (id, title, description, is_default) values
  ('default-birthday-quiz', '誕生日クイズ', '登録された誕生日データからランダム生成されるクイズです', true)
on conflict (id) do nothing;

-- 10. Memory Card Decks
insert into public.memory_card_decks (id, title, theme, cards, is_default) values
  ('birthday-classic', '誕生日クラシック', 'birthday',
   '["🎂","🎁","🎈","🎉","🎊","🎀","🧁","🍰"]'::jsonb, true),
  ('seasons-japan', '四季の日本', 'seasons',
   '["🌸","⛄","🎆","🍂","🌺","❄️","🎇","🍁"]'::jsonb, false),
  ('animals-cute', 'かわいい動物', 'animals',
   '["🐱","🐶","🐰","🐻","🐼","🦊","🐸","🐨"]'::jsonb, false)
on conflict (id) do nothing;

-- 11. Festival Packs (13 Seasonal & Traditional Festivals)
insert into public.festival_packs (id, season, month_range, name_ja, name_en, greeting_ja, greeting_en, icon, theme_keys) values
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
on conflict (id) do nothing;

commit;
