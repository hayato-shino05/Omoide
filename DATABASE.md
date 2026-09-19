# データベース

## 正本

データベーススキーマ、RLS、Storage、Realtime の正本は次のマイグレーションです。`supabase/migrations/` 配下の SQL ファイルをバージョン管理の正本とし、`database/database.sql` は全テーブル・関数・RLS を一括定義した統合スキーマファイルです。

- [`supabase/migrations/20260812163000_reset_and_create_anonymous_community.sql`](./supabase/migrations/20260812163000_reset_and_create_anonymous_community.sql)
- [`supabase/migrations/20260817000000_add_bulletin_post_likes.sql`](./supabase/migrations/20260817000000_add_bulletin_post_likes.sql)
- [`supabase/migrations/20260820000000_add_full_storage_buckets.sql`](./supabase/migrations/20260820000000_add_full_storage_buckets.sql)
- [`supabase/migrations/20260820000001_add_photo_album_storage.sql`](./supabase/migrations/20260820000001_add_photo_album_storage.sql)
- [`supabase/migrations/20260821000000_add_time_capsules_table.sql`](./supabase/migrations/20260821000000_add_time_capsules_table.sql)
- [`supabase/migrations/20260823000000_harden_avatar_storage_mime_types.sql`](./supabase/migrations/20260823000000_harden_avatar_storage_mime_types.sql)
- [`supabase/migrations/20260824000000_expand_time_capsule_security.sql`](./supabase/migrations/20260824000000_expand_time_capsule_security.sql)
- [`supabase/migrations/20260824000001_contract_time_capsule_security.sql`](./supabase/migrations/20260824000001_contract_time_capsule_security.sql)
- [`supabase/migrations/20260824000002_rename_time_capsule_photo_constraint.sql`](./supabase/migrations/20260824000002_rename_time_capsule_photo_constraint.sql)
- [`supabase/migrations/20260824000003_remove_direct_time_capsule_access.sql`](./supabase/migrations/20260824000003_remove_direct_time_capsule_access.sql)
- [`supabase/migrations/20260825000000_limit_time_capsule_uploads.sql`](./supabase/migrations/20260825000000_limit_time_capsule_uploads.sql)
- [`supabase/migrations/20260825000001_add_time_capsule_access_codes.sql`](./supabase/migrations/20260825000001_add_time_capsule_access_codes.sql)
- [`supabase/migrations/20260825235454_add_time_capsule_private_access_boundary.sql`](./supabase/migrations/20260825235454_add_time_capsule_private_access_boundary.sql)
- [`supabase/migrations/20260825235535_harden_time_capsule_rpc_execute_privileges.sql`](./supabase/migrations/20260825235535_harden_time_capsule_rpc_execute_privileges.sql)
- [`supabase/migrations/20260826000000_add_time_capsule_access_attempt_buckets.sql`](./supabase/migrations/20260826000000_add_time_capsule_access_attempt_buckets.sql)
- [`supabase/migrations/20260826000001_add_time_capsule_private_access_boundary.sql`](./supabase/migrations/20260826000001_add_time_capsule_private_access_boundary.sql)
- [`supabase/migrations/20260826000002_harden_time_capsule_rpc_execute_privileges.sql`](./supabase/migrations/20260826000002_harden_time_capsule_rpc_execute_privileges.sql)
- [`supabase/migrations/20260827000000_add_time_capsule_open_tracking.sql`](./supabase/migrations/20260827000000_add_time_capsule_open_tracking.sql)
- [`supabase/migrations/20260827000002_remove_private_time_capsule_deny_policies.sql`](./supabase/migrations/20260827000002_remove_private_time_capsule_deny_policies.sql)
- [`supabase/migrations/20260827000003_add_notification_logs.sql`](./supabase/migrations/20260827000003_add_notification_logs.sql)
- [`supabase/migrations/20260827000004_harden_notification_claims.sql`](./supabase/migrations/20260827000004_harden_notification_claims.sql)
- [`supabase/migrations/20260831000000_restore_anonymous_public_privileges.sql`](./supabase/migrations/20260831000000_restore_anonymous_public_privileges.sql)
- [`supabase/migrations/20260901000000_add_community_submission_rpc.sql`](./supabase/migrations/20260901000000_add_community_submission_rpc.sql)
- [`supabase/migrations/20260902000000_add_curated_music_track_to_messages.sql`](./supabase/migrations/20260902000000_add_curated_music_track_to_messages.sql)
- [`supabase/migrations/20260904000000_add_music_track_to_community_submission_rpc.sql`](./supabase/migrations/20260904000000_add_music_track_to_community_submission_rpc.sql)
- [`supabase/migrations/20260904000001_revoke_anonymous_music_upload.sql`](./supabase/migrations/20260904000001_revoke_anonymous_music_upload.sql)
- [`supabase/migrations/20260905000000_add_birthday_thread_and_reply_music.sql`](./supabase/migrations/20260905000000_add_birthday_thread_and_reply_music.sql)
- [`supabase/migrations/20260914000000_add_metadata_and_lyrics_to_music_tracks.sql`](./supabase/migrations/20260914000000_add_metadata_and_lyrics_to_music_tracks.sql)
- [`supabase/migrations/20260917000000_create_study_rooms_and_members.sql`](./supabase/migrations/20260917000000_create_study_rooms_and_members.sql)
- [`supabase/migrations/20260919000000_harden_study_room_security.sql`](./supabase/migrations/20260919000000_harden_study_room_security.sql)
- [`supabase/migrations/20260920000000_study_room_requests_and_lifecycle.sql`](./supabase/migrations/20260920000000_study_room_requests_and_lifecycle.sql)
- 初期データ: [`supabase/seed.sql`](./supabase/seed.sql) / [`database/seed.sql`](./database/seed.sql)
- 統合 SQL スキーマ: [`database/database.sql`](./database/database.sql)

## 適用時の注意

正本 migration は `auth.users` を削除し、`public` スキーマを `CASCADE` で再作成します。既存のユーザー、テーブル、データを消去するため、開発用または明示的に初期化してよい環境だけで実行してください。

migration の適用後に `supabase/seed.sql`（または `database/seed.sql`）を実行すると、誕生日、メッセージ、ギフト、チャット、掲示板、および LRC 歌詞付きキュレーション楽曲のサンプルデータを投入できます。

## public スキーマ一覧

| テーブル | 用途 | 主な列 |
|---|---|---|
| `birthdays` | 誕生日情報 | `name`, `month`, `day`, `year`, `message` |
| `messages` | お祝いメッセージ | `sender`, `message`, `birthday_person`, `media_object_path`, `music_track_id` |
| `media_submissions` | Storage 上のメディア投稿メタデータ | `object_path`, `media_kind`, `mime_type`, `size_bytes`, `original_name` |
| `virtual_gifts` | バーチャルギフト | `sender`, `gift_emoji`, `gift_name`, `birthday_person` |
| `chat_messages` | コミュニティチャット | `sender`, `message` |
| `bulletin_posts` | 掲示板投稿・システム生成の誕生日スレッド | `sender`, `message`, `media_object_path`, `birthday_person`, `likes`, `celebration_date`, `timezone`, `is_system_generated` |
| `post_replies` | 掲示板への返信（誕生日スレッドへの返信を含む） | `post_id`, `sender`, `message`, `music_track_id`, `moderation_status` |
| `music_tracks` | キュレーション済み & カスタム音楽トラック | `name`, `title`, `artist`, `duration`, `url`, `file_name`, `file_size`, `cover_url`, `lyrics_url`, `lyrics_lrc`, `is_preset`, `sort_order` |
| `time_capsules` | タイムカプセル本体 | `sender`, `recipient`, `message`, `photo_url`, `photo_object_path`, `unlock_date`, `owner_id`, `idempotency_key`, `invite_token_hash`, `invite_token_expires_at`, `invite_revoked_at`, `opened_at`, `created_at` |
| `time_capsule_access_codes` | 招待コードのハッシュ・派生情報 | `capsule_id`, `code_hash`, `derivation_attempt`, `revoked_at`, `failed_attempts`, `locked_until`, `last_used_at` |
| `time_capsule_access_attempt_buckets` | 招待コード入力のレート制限バケット | `bucket_fingerprint`, `failed_attempts`, `locked_until` |
| `notification_logs` | 通知ワーカーが処理するジョブ | `id`, `event_id`, `event_type`, `recipient_ref`, `channel`, `scheduled_at`, `timezone`, `idempotency_key`, `opted_in`, `status`, `attempt_count`, `last_error_code`, `next_attempt_at`, `expires_at`, `sent_at`, `leased_by`, `lease_until`, `created_at`, `updated_at` |
| `study_rooms` | 勉強部屋（コワーキング）ルーム本体 | `id`, `name`, `description`, `host_id`, `host_token_hash`, `current_track_id`, `playback_state`, `epoch_started_at`, `is_private`, `passcode_hash`, `queue`, `current_index`, `is_shuffled`, `repeat_mode`, `song_requests`, `created_at`, `updated_at` |
| `study_room_members` | 勉強部屋の参加者ステータス | `id`, `room_id`, `user_identifier`, `member_token_hash`, `display_name`, `avatar_url`, `status`, `streak_minutes`, `joined_at`, `last_heartbeat_at` |

すべての ID は `bigint generated always as identity`（`time_capsule_access_codes` のみ `generated by default as identity`、`study_rooms` は `uuid default gen_random_uuid()`、`study_room_members` は `uuid default gen_random_uuid()`）です。日時は `timestamptz` で保存します（`time_capsules.unlock_date` と `bulletin_posts.celebration_date` のみ `date`）。

`post_replies.post_id` は `bulletin_posts.id` を参照し、親投稿を削除すると返信も削除されます。`time_capsule_access_codes.capsule_id` は `time_capsules.id` を参照し、親カプセルを削除するとコード行も削除されます。`bulletin_posts.likes` は `0` 以上を `CHECK` 制約で強制し、直接の `UPDATE` を許可せず `increment_bulletin_post_likes` 経由でのみ加算します。

楽曲参照（`messages.music_track_id`, `post_replies.music_track_id`）は `<provider>:<trackId>` 形式の文字列です。provider は `jamendo`、`soundcloud`、または `omoide` で、それぞれ正規の保存形式は `jamendo:<id>` / `soundcloud:<id>` / `omoide:<id>` です。

---

## 音楽と歌詞の追加・管理手順

Omoide の音楽システムは、Cloudflare R2（オーディオ・カバーアート・LRC ファイルのホスティング）と Supabase `music_tracks` テーブルを連携して動作します。

### 1. 音楽・歌詞データの仕様

- **オーディオファイル**: MP3 形式（320kbps 推奨）、WAV、FLAC、OGG
- **カバーアート**: JPEG / PNG / WebP（300×300px 正方形推奨）
- **歌詞データ（LRC）**: 標準タイムタグ付き LRC 形式（例: `[00:12.34]歌詞テキスト`）。ミリ秒または秒単位のタイムスタンプに対応。

### 2. スクリプトを使った自動一括同期

ローカルディレクトリに楽曲・カバー画像・`.lrc` 歌詞を配置し、スクリプトを実行して Cloudflare R2 と Supabase へ一括登録できます。

1. `.env` に以下の環境変数を設定します:
   ```env
   LOCAL_MUSIC_DIR="D:\\Music\\shino.hayato05"
   CLOUDFLARE_R2_BUCKET_NAME="omoide-music"
   CLOUDFLARE_R2_PUBLIC_DOMAIN="https://pub-xxxx.r2.dev"
   CLOUDFLARE_R2_ACCOUNT_ID="your_account_id"
   CLOUDFLARE_R2_ACCESS_KEY_ID="your_access_key"
   CLOUDFLARE_R2_SECRET_ACCESS_KEY="your_secret_key"
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
   ```

2. 楽曲と歌詞の一括同期スクリプトを実行します:
   ```bash
   node scripts/sync-local-music-to-r2-and-supabase.mjs
   ```
   - FLAC を自動的に MP3 (320kbps) に変換
   - 音声、カバー画像、`.lrc` を R2 へアップロード
   - `music_tracks` テーブルへ `title`, `artist`, `duration`, `cover_url`, `lyrics_lrc` を登録

3. 表示順序を更新する場合:
   ```bash
   node scripts/reorder-music-tracks.mjs
   ```

### 3. SQL による手動登録例

```sql
insert into public.music_tracks (
  name, title, artist, duration, url, file_name, file_size, cover_url, lyrics_lrc, is_preset, sort_order
) values (
  'Birthday Celebration - Happy Birthday Accordion',
  'Happy Birthday Accordion',
  'Birthday Celebration',
  64,
  'https://pub-xxx.r2.dev/audio/happy_birthday.mp3',
  'happy_birthday.mp3',
  1024000,
  'https://pub-xxx.r2.dev/covers/happy_birthday.jpg',
  '[00:00.00]Happy Birthday to You♪\n[00:06.00]Happy Birthday to You♪\n[00:12.00]Happy Birthday Dear Friend♪\n[00:18.00]Happy Birthday to You♪',
  true,
  1
);
```

---

## 匿名アクセスと RLS

すべての `public` テーブルで RLS を有効にしています。`anon` ロールは次の表を閲覧できます。`birthdays` と `music_tracks` は SELECT 専用で、それ以外は匿名 INSERT も許可されています。

- `birthdays` (SELECT のみ)
- `messages`
- `media_submissions`
- `virtual_gifts`
- `chat_messages`
- `bulletin_posts`
- `post_replies`
- `music_tracks` (SELECT のみ)

匿名の更新・削除ポリシーは定義していません。`music_tracks` と Storage `music` バケットへの匿名 INSERT は `20260904000001_revoke_anonymous_music_upload.sql` で取り消し、キュレーション楽曲は管理者またはシード経由で登録します。

### 認証必須・所有者境界のテーブル

次のテーブルは `anon` および `authenticated` ロールからすべての権限を剥奪し、`service_role` のみが操作します。

- `time_capsules`
- `time_capsule_access_codes`
- `time_capsule_access_attempt_buckets`
- `notification_logs`

### RPC 一覧

- `public.increment_bulletin_post_likes(post_id bigint)` — 掲示板投稿のいいね数を原子的に 1 加算し、最新件数を返却。`anon`, `authenticated` 実行可。
- `public.create_community_submission(...)` — メッセージまたは掲示板投稿をメディア添付とともに 1 トランザクションで作成。`service_role` 専用。
- `public.create_birthday_reply(...)` — 誕生日スレッドへの返信（楽曲参照対応）を作成。`service_role` 専用。
- `public.create_time_capsule_with_access_code(...)` — タイムカプセルと招待アクセスコードを作成。`service_role` 専用。
- `public.consume_time_capsule_access_code(...)` — 招待コードを検証しカプセル ID を返却。`service_role` 専用。
- `public.claim_notification_logs(...)` — 通知ワーカー向けジョブリース関数。`service_role` 専用。
- `public.create_study_room(...)` — 勉強部屋を新規作成し、ホスト参加者レコードおよびセキュリティハッシュトークンを発行。`service_role` 専用。
- `public.join_study_room(...)` — 勉強部屋へメンバーとして参加し、メンバー認証トークンを発行。`service_role` 専用。
- `public.verify_study_room_passcode(...)` — 非公開勉強部屋のパスコード（bcrypt / sha256）を検証。`service_role` 専用。
- `public.update_study_room_playback(...)` — ホスト認証トークンを検証の上、楽曲再生タイムライン（曲ID・エポック・キュー・シャッフル・リピート状態）をアトミックに同期更新。`service_role` 専用。
- `public.update_study_room_member_status(...)` — メンバーの集中状態（`focus` / `break` / `idle`）・Streak 分数・ハートビートを更新。`service_role` 専用。
- `public.leave_study_room(...)` / `public.leave_study_room_with_migration(...)` — 部屋退出処理。ホスト退出時は最も古く参加したアクティブメンバーへホスト権限を自動移譲。`service_role` 専用。
- `public.request_study_room_song(...)` — メンバーからの楽曲リクエストを部屋の `song_requests` JSONB キュー（上限10件）へ追加。`service_role` 専用。
- `public.respond_study_room_song_request(...)` — ホストが楽曲リクエストを承認（部屋の再生キューへ追加）または却下。`service_role` 専用。
- `public.cleanup_stale_study_rooms()` — 24時間以上更新のない放置部屋や無人部屋を自動パージ。`service_role` 専用。

## Storage バケット

| バケット名 | 用途 | 公開 | 1 ファイル上限 | 許可する MIME type |
|---|---|---|---|---|
| `photo-album` | フォトアルバム・思い出ギャラリー写真/動画 | public | 50 MiB | 画像全般 (HEIC/HEIF 含む), MP4, WebM, QuickTime |
| `community-media` | 掲示板・チャットの写真・動画・音声メッセージ | public | 50 MiB | 画像, MP4, WebM, 音声各種 |
| `music` | カスタム BGM 音楽トラック | public | 15 MiB | MP3, WAV, OGG, WebM, FLAC, AAC |
| `avatars` | アバター・スタンプ画像 | public | 5 MiB | JPEG, PNG, WebP, GIF |
| `time-capsules` | タイムカプセル添付メディア (後方互換) | private | 50 MiB | 画像, MP4, WebM, 音声各種 |
| `time-capsules-private` | 認証ユーザー所有のタイムカプセル添付 | private | 50 MiB | `time-capsules` 設定を継承 |

## Realtime

Realtime publication (`supabase_realtime`) に登録されているテーブル:
- `public.chat_messages`: コミュニティチャットのリアルタイム送受信
- `public.study_rooms`: 勉強部屋の楽曲再生・キュー・ホスト変更の同期
- `public.study_room_members`: 勉強部屋の参加者一覧・集中状態・ハートビート同期

Realtime Broadcast チャンネル:
- `study_room:{roomId}`: 非言語応援（Silent Cheer: ☕, 🔥, ✨, 📖）のリアルタイムブロードキャスト
