# Production boundary follow-up & Operational Attestation

このファイルは、本番環境（Production / Supabase / GitHub Actions）におけるセキュリティ境界、RLS、スケジューラー、および Durable Notification の検証・運用仕様を記録・追跡する。

## 1. 検証済み境界とセキュリティ仕様（Attestation）

### A. Time Capsule アクセス境界 & RLS (#55, #51)
- **RLS 有効化**: `time_capsules`, `time_capsule_access_codes`, `time_capsule_access_attempt_buckets` の 3 テーブルはすべて RLS が有効であり、`anon` および `authenticated` からの直接テーブル権限は完全に剥奪（`REVOKE ALL`）。
- **Storage バケット**: `time-capsules` および `time-capsules-private` バケットは非公開（`public: false`）に設定され、署名付き URL または `service_role` 経由でのみアクセス可能。
- **SECURITY DEFINER RPC**: `create_time_capsule_with_access_code` および `consume_time_capsule_access_code` は `service_role` 専用であり、匿名クライアントからの直接実行は遮断。

### B. Time Capsule オープントラッキング & プライバシー契約 (#44)
- **最小限の記録**: `opened_at` タイムスタンプのみを記録し、閲覧者の IP アドレスや不要な PII は保持しない。
- **Idempotency 保証**: `recordFirstOpen` は初回開封時のみ `opened_at IS NULL` を条件に更新し、再試行や重複アクセスによる値の書き換えを防止。
- **招待トークン境界**: 通常のプレビュー GET アクセスではトラッキングを実行せず、認証コードまたはトークン検証を伴う POST アクセス時のみ記録。

### C. Durable Notification & Scheduler 境界 (#54)
- **Durable State**: `notification_logs` テーブルにより通知ジョブの状態遷移（`pending` $\rightarrow$ `leased` $\rightarrow$ `sent` / `failed`）を管理。
- **二重送信防止**: `idempotency_key` と `lease_until` による分散ロック機構により、複数ワーカーの同時実行時でも重複通知を遮断。
- **障害通知**: 失敗時は `attempt_count` の加算と `last_error_code` の記録を行い、指数バックオフで再試行。

### D. スケジューラー & ヘルスチェック (#58, #51)
- **定期実行**: `.github/workflows/supabase-healthcheck.yml` が JST 00:05（`5 0 * * *` / `Asia/Tokyo`）に自動実行。
- **REST & SQL 検証**:
  - `GET /rest/v1/birthdays` による匿名 REST エンドポイントの疎通確認。
  - `SUPABASE_READONLY_DATABASE_URL` を用いた PostgreSQL セッション属性検証（非 superuser、書き込み権限・シーケンス変更・セキュリティ定義関数実行権限の排除を検証）。
- **誕生日スレッド定期生成**: `POST /api/internal/birthday-scheduler` を `x-birthday-scheduler-secret` 認証ヘッダー付きで呼び出し、当日分のスレッドを自動生成。

---

## 2. 運用ガイドライン & シークレット管理

1. **GitHub Actions Secrets**:
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase プロジェクト URL（`https://*.supabase.co`）
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 匿名クライアント用 API キー
   - `SUPABASE_READONLY_DATABASE_URL`: 読み取り専用権限ロールの接続文字列
   - `NEXT_PUBLIC_BASE_URL`: アプリケーションの公開 URL
   - `BIRTHDAY_SCHEDULER_SECRET`: スケジューラー実行用の暗号シークレット

2. **障害対応フロー**:
   - ワークフロー失敗時は GitHub Actions のログから `validate_config` / `rest_healthcheck` / `readonly_postgres` / `birthday_scheduler` の該当ステップを確認し、シークレットまたは Supabase サービスの死活状態を点検する。

---

## 3. 関連 Issue & PR

- Issue #44: Time Capsule の open tracking プライバシー契約
- Issue #51: 残存課題の統合管理と運用品質向上
- Issue #54: Reminder の durable delivery state と scheduler 境界
- Issue #55: Supabase production の Time Capsule boundary read-only 検証
- Issue #58: PR #52 の未完了タスク追跡

