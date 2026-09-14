# Production boundary follow-up

このファイルは、コード/CI に実装済みだが、production の実行証跡（scheduled run・適用確認）が未完了の項目を追跡する。

## 実装済み（コード・CI 上の事実）

- `.github/workflows/supabase-healthcheck.yml` は cron `5 0 * * *`（timezone `Asia/Tokyo`）と `workflow_dispatch` で実行され、read-only REST healthcheck・read-only PostgreSQL attestation に加え、`POST /api/internal/birthday-scheduler` を実行する。
- `app/api/internal/birthday-scheduler/route.ts` は `x-birthday-scheduler-secret` ヘッダで認証し、service client 経由で当日分の誕生日スレッドを生成する。`(birthday_person, celebration_date)` の部分ユニークにより再実行・同時実行の重複を抑止する。
- 楽曲つき投稿（`messages` / `post_replies` の `music_track_id`）と誕生日スレッド返信 RPC `create_birthday_reply`、匿名の `music_tracks` INSERT 撤回（`20260904000001_revoke_anonymous_music_upload.sql`）は、コード・migration 上は実装済み。

> 上記はリポジトリ上の実装・workflow の状態であり、production の scheduled run・適用確認・証跡が完了したことを意味しない。

## 未完了項目（production 実行証跡）

- [ ] 独立した read-only database session で `current_user`、`session_user`、role attributes、effective privileges、`SET ROLE` 到達可能 role を確認する
- [ ] production の RLS、table grants、Storage visibility、Storage policy、RPC execute grants、migration history を確認し、必要な差分を承認済み scope で扱う
- [ ] default branch `main` の daily healthcheck workflow が cron `5 0 * * *`、timezone `Asia/Tokyo` で稼働することを確認する（read-only REST / PostgreSQL 検証と `POST /api/internal/birthday-scheduler` を含む）
- [ ] `POST /api/internal/birthday-scheduler` の production scheduled run が誕生日スレッドを生成し、成功/失敗がログに残ることを確認する
- [ ] GitHub Actions Secrets の保管、公開防止、失敗時の確認経路を確認する
- [ ] healthcheck の production run、ログ、失敗時の可視性を確認する
- [ ] Issue #2、#51、#55、#58 と関連 PR の checklist、証跡、最終 review を同期する

## 確認済みの範囲

- PR #60 で read-only healthcheck の timeout、secret validation、REST GET、table/schema/function/sequence privilege、`SET ROLE` 到達可能 role の検証を実装した
- PR #61 で workflow を default branch `main` に同期した
- 誕生日スレッド生成・楽曲つき返信・匿名音楽アップロードの撤回はコード・migration・CI 上は実装済み（production 適用・実行は上記の未完了項目として追跡）
- production data、RLS、Storage policy、database grants、secret value はこの follow-up では変更しない

## 保留理由

production workflow の手動 dispatch は、現在の GitHub CLI account に Repository Admin 権限がないため実行できない。証跡が揃うまで、この項目と関連 Issue は open のまま維持する。
