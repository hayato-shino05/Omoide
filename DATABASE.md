# データベース

## 正本

データベーススキーマ、RLS、Storage、Realtime の正本は次のマイグレーションです。`supabase/migrations/` 配下の SQL ファイルだけを信頼し、`database/database.sql` は正本へのポインターです。DDL を追加しないでください。スキーマを変更するときは、新しい Supabase migration を追加します。

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
- 初期データ: [`supabase/seed.sql`](./supabase/seed.sql)

`20260825235454` と `20260825235535` は直後の `20260826000001` / `20260826000002` に同じ目的語句で上書きされますが、Supabase CLI のタイムスタンプ順で順次実行されるため両方を正本として残します。

## 適用時の注意

正本 migration は `auth.users` を削除し、`public` スキーマを `CASCADE` で再作成します。既存のユーザー、テーブル、データを消去するため、開発用または明示的に初期化してよい環境だけで実行してください。

migration の適用後に `supabase/seed.sql` を実行すると、誕生日、メッセージ、ギフト、チャット、掲示板のサンプルデータを投入できます。

## public スキーマ

| テーブル | 用途 | 主な列 |
|---|---|---|
| `birthdays` | 誕生日情報 | `name`, `month`, `day`, `year`, `message` |
| `messages` | お祝いメッセージ | `sender`, `message`, `birthday_person`, `media_object_path`, `music_track_id` |
| `media_submissions` | Storage 上のメディア投稿のメタデータ | `object_path`, `media_kind`, `mime_type`, `size_bytes` |
| `virtual_gifts` | バーチャルギフト | `sender`, `gift_emoji`, `gift_name`, `birthday_person` |
| `chat_messages` | コミュニティチャット | `sender`, `message` |
| `bulletin_posts` | 掲示板投稿・システム生成の誕生日スレッド | `sender`, `message`, `media_object_path`, `birthday_person`, `likes`, `celebration_date`, `timezone`, `is_system_generated` |
| `post_replies` | 掲示板への返信（誕生日スレッドへの返信を含む） | `post_id`, `sender`, `message`, `music_track_id`, `moderation_status` |
| `music_tracks` | カスタム音楽トラック | `name`, `url`, `file_name`, `file_size` |
| `time_capsules` | タイムカプセル本体 | `sender`, `recipient`, `message`, `photo_url`, `photo_object_path`, `unlock_date`, `owner_id`, `idempotency_key`, `invite_token_hash`, `invite_token_expires_at`, `invite_revoked_at`, `opened_at`, `created_at` |
| `time_capsule_access_codes` | 招待コードのハッシュ・派生情報 | `capsule_id`, `code_hash`, `derivation_attempt`, `revoked_at`, `failed_attempts`, `locked_until`, `last_used_at` |
| `time_capsule_access_attempt_buckets` | 招待コード入力のレート制限バケット | `bucket_fingerprint`, `failed_attempts`, `locked_until` |
| `notification_logs` | 通知ワーカーが処理するジョブ | `id`, `event_id`, `event_type`, `recipient_ref`, `channel`, `scheduled_at`, `timezone`, `idempotency_key`, `opted_in`, `status`, `attempt_count`, `last_error_code`, `next_attempt_at`, `expires_at`, `sent_at`, `leased_by`, `lease_until`, `created_at`, `updated_at` |

すべての ID は `bigint generated always as identity` (`time_capsule_access_codes` のみ `generated by default as identity`) です。日時は `timestamptz` で保存します (`time_capsules.unlock_date` と `bulletin_posts.celebration_date` のみ `date`)。

`post_replies.post_id` は `bulletin_posts.id` を参照し、親投稿を削除すると返信も削除されます。`time_capsule_access_codes.capsule_id` は `time_capsules.id` を参照し、親カプセルを削除するとコード行も削除されます。`bulletin_posts.likes` は `0` 以上を `CHECK` 制約で強制し、直接の `UPDATE` を許可せず `increment_bulletin_post_likes` 経由でのみ加算します。

楽曲参照 (`messages.music_track_id`, `post_replies.music_track_id`) は `<provider>:<trackId>` 形式の文字列です。provider は `jamendo` または `soundcloud` で、それぞれ ID は `[0-9]{1,12}` / `[0-9]{1,20}` に制限します (`^(?:jamendo:)?[0-9]{1,12}$|^soundcloud:[0-9]{1,20}$`)。旧クライアント互換のため数字のみの値は `jamendo` として解釈しますが、正規の保存形式は `jamendo:<id>` / `soundcloud:<id>` です。楽曲付き `messages` は `(sender, birthday_person)` の部分ユニーク制約 (`music_track_id is not null`) により同一入力の再送を DB レベルで防ぎます。

誕生日スレッドは `bulletin_posts` の `is_system_generated = true` 行として持ち、`celebration_date` と `timezone` を保持します。`(birthday_person, celebration_date)` の部分ユニーク インデックス (`is_system_generated` のみ) がスレッドの重複生成を防ぎます。`post_replies` はテキストのみの従来型に加え、テキストと楽曲参照の少なくとも一方を必須とする楽曲付き返信 (`message is not null or music_track_id is not null`) と、`moderation_status` (`visible` / `hidden`) を持ちます。

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

匿名の更新・削除ポリシーは定義していません。`music_tracks` と Storage `music` バケットへの匿名 INSERT は `20260904000001_revoke_anonymous_music_upload.sql` で取り消し、`__tests__/integration/revoke-anonymous-music-upload-migration.test.ts` で回帰確認しています。`bulletin_posts.likes` は直接更新できず、`increment_bulletin_post_likes(bigint)` RPC だけが原子的に 1 件加算し、更新後の件数を返します。この RPC は `anon` にだけ実行権限を付与し、関数内の `search_path` は `''` に固定しています。入力の文字数、メディア種別、サイズなどの制約は migration の `CHECK` 制約を正本として確認してください。

### 認証必須・所有者境界のテーブル

次のテーブルは `anon` および `authenticated` ロールからすべての権限を剥奪し、`service_role` のみが操作します。アプリケーションは RPC 経由、または Supabase Functions などのサービスワーカー経由でアクセスします。

- `time_capsules`
- `time_capsule_access_codes`
- `time_capsule_access_attempt_buckets`
- `notification_logs`

`time_capsules.owner_id` は `auth.users(id)` を参照し、認証ユーザーが本人カプセルを所有していることを境界とします。`time_capsule_access_codes` は `capsule_id` で親カプセルに紐付き、招待コードのハッシュ (`code_hash`) を一意制約で管理します。`time_capsule_access_attempt_buckets` は 64 文字のフィンガープリントを主キーとし、`failed_attempts` と `locked_until` でレート制限を表現します。`notification_logs.idempotency_key` は `UNIQUE` で重複配送を防ぎ、`status` (`pending` / `processing` / `sent` / `retryable` / `failed` / `cancelled` / `expired`) をワーカーが遷移させます。

### タイムカプセル RPC

- `public.create_time_capsule_with_access_code(uuid, text, text, ...)` — `service_role` 専用。`time_capsules` と `time_capsule_access_codes` を 1 つのトランザクションで作成し、`owner_id` + `idempotency_key` の組み合わせで重複作成を防ぎます。
- `public.consume_time_capsule_access_code(text, text)` — `service_role` 専用。招待コードの照合、ロック判定、招待コードの revocation 状態 (`revoked_at is null`) と rate limit lockout (`locked_until <= now()`) を確認し、失敗カウンタをリセットしたうえで `capsule_id bigint` を返却します。
- `public.claim_notification_logs(text, timestamptz, integer)` — `service_role` 専用。`status` が `pending` / `retryable` の行を `processing` にリース (5 分間) して返却します。`search_path = public` に固定しています。

回帰確認は `__tests__/integration/production-snapshot-regression.test.ts` に固定しています。`birthdays`、`messages`、`media_submissions`、`virtual_gifts`、`chat_messages`、`bulletin_posts` の匿名 read/create-only 境界と `ThemeProvider` の render smoke を、Production の allowlist 統合とは独立に検証します。

### コミュニティ投稿・誕生日スレッド RPC

次の関数は `service_role` 専用です。アプリケーションは `app/api/community/*` の API ルートを経由して呼び出します。各関数は `search_path` を `pg_catalog, public` に固定し、`anon` / `authenticated` には実行権限を与えません。

- `public.create_community_submission(text, text, text, text, text, text, text, text, text, bigint, text)` — `messages` / `bulletin_posts` を作成し、メディアがある場合は `media_submissions` も同一トランザクションで登録します。`p_kind` は `message` / `post`。楽曲参照 (`p_music_track_id`) は message のみ許容し、`provider:trackId` 形式を検証します。楽曲付きメッセージは `(sender, birthday_person)` の部分ユニーク制約に衝突した場合に `music_track_id` を更新するため、再送しても重複しません。
- `public.create_birthday_reply(bigint, text, text, text)` — `is_system_generated` の誕生日スレッド (`bulletin_posts`) への返信を `post_replies` に作成します。テキストと楽曲参照の少なくとも一方を必須とし、送信者名と楽曲参照形式を検証します。

migration の整合性は `__tests__/integration/community-submission-rpc-migration.test.ts` と `__tests__/integration/birthday-thread-reply-migration.test.ts` に固定しています。

## Storage

次の 6 つのバケットを使用します。`time-capsules` と `time-capsules-private` は `public = false` です。現行 migration では、Time Capsule bucket に対する `anon` / `authenticated` の Storage 直接アクセス policy は作成せず、service_role 経由で扱います。

| バケット名 | 用途 | 公開 | 1 ファイル上限 | 許可する MIME type |
|---|---|---|---|---|
| `photo-album` | フォトアルバム・思い出ギャラリー写真/動画 | public | 50 MiB | 画像全般 (HEIC/HEIF 含む), MP4, WebM, QuickTime |
| `community-media` | 掲示板・チャットの写真・動画・音声メッセージ | public | 50 MiB | 画像, MP4, WebM, 音声各種 |
| `music` | カスタム BGM 音楽トラック | public | 15 MiB | MP3, WAV, OGG, WebM, FLAC, AAC |
| `avatars` | アバター・スタンプ画像 | public | 5 MiB | JPEG, PNG, WebP, GIF |
| `time-capsules` | タイムカプセル添付メディア (後方互換) | private | 50 MiB | 画像, MP4, WebM, 音声各種 |
| `time-capsules-private` | 認証ユーザー所有のタイムカプセル添付 | private | 50 MiB | `time-capsules` 設定を継承 |

`photo-album` / `community-media` / `avatars` では、`anon` ロールに `SELECT` と `INSERT` だけ許可し、`UPDATE` / `DELETE` は許可していません。`music` は `anon` の `SELECT` (閲覧) のみで、匿名からの新規アップロード (`INSERT`) は `20260904000001_revoke_anonymous_music_upload.sql` で取り消しました。`music_tracks` テーブルも同じく anon の `INSERT` を取り消しており、楽曲はプリセット (`lib/music/presets.ts`) と Jamendo / SoundCloud の参照 (`provider:trackId`) で扱います。`time-capsules` と `time-capsules-private` では、`anon` / `authenticated` の Storage 直接アクセスを許可していません。`avatars` の MIME type は `20260823000000_harden_avatar_storage_mime_types.sql` で `image/svg+xml` を除外しています。

アプリケーションは URL ではなく Storage の object path を `media_object_path` または `object_path` に保存します。`time_capsules.photo_url` は `text` で外部 URL も許容しますが、`photo_object_path` は Storage のバケット内パスを保存する正規のフィールドです。

## Realtime

Realtime publication に追加するテーブルは `public.chat_messages` のみです。ほかのテーブルを購読対象にする場合は、対応する migration で publication とアクセス設計を同時に変更してください。

## 変更手順

1. `supabase/migrations/` に新しい migration を追加します。
2. テーブル、制約、インデックス、RLS、Storage、Realtime の変更を同じ migration に記述します。
3. 必要なら `supabase/seed.sql` を新しい schema に合わせます。
4. この文書のテーブル一覧とアクセス契約を更新します。
