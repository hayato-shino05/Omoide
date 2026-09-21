# Secret Boundary

> 本ドキュメントは Omoide リポジトリ (Happy Birthday Website) における **secret handling pattern** の正本である。production secret 値・token・credential 自体は記載せず、**保管場所と参照経路** のみを集約する。新規 env / secret を追加・変更する場合は本ドキュメントを同時に更新する。

最終更新: 2026-08-30 (Issue #65 着手時点)

## 1. Env 命名規約

| Prefix | 公開範囲 | バンドル含有 | 用途 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_*` | クライアント・サーバ両方から参照可 | クライアント bundle に埋め込まれる | 公開前提の URL・anon key など |
| 上記以外 | server-side のみ | サーバ実行環境でのみ解決 | 秘密鍵・サービスロール・署名鍵など |

Next.js の規約に従い、`NEXT_PUBLIC_*` で始まる環境変数は静的解析によりクライアントバンドルへ埋め込まれる。それ以外の変数は server runtime / API Route / `getServerSideProps` などのサーバ実行コンテキストでのみ参照可能。本リポジトリはこの規約を厳格に運用し、**秘密値は必ず `NEXT_PUBLIC_*` 以外の名前で参照する**。

## 2. `NEXT_PUBLIC_*` 一覧

リポジトリ全体 (production / development / test) で参照されている `NEXT_PUBLIC_*` 環境変数は次の 3 種のみ。

| 変数名 | 参照箇所 | 用途 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/client.ts`, `lib/healthcheck.ts`, `lib/time-capsule/server.ts`, `app/sitemap.ts` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase/client.ts`, `lib/healthcheck.ts`, `lib/time-capsule/server.ts` | Supabase anon (公開) キー |
| `NEXT_PUBLIC_BASE_URL` | `app/sitemap.ts` | sitemap 生成時の canonical base URL |

> 上記 3 変数は anon キーおよび公開 URL であり、Supabase 上の RLS によりアクセス範囲が制御されることを前提とする。RLS ポリシーの詳細は `DATABASE.md` を参照。

## 3. Server-side only env 一覧 (秘密値を含む)

`NEXT_PUBLIC_*` 以外の環境で `process.env.*` 経由で参照されている変数は次の 1 種のみ。

| 変数名 | 参照箇所 | 用途 | 値の性質 |
| --- | --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/time-capsule/server.ts` (`getServiceKey`, `createAccessCode`, `createInviteToken`, `hashAccessCode`) | service role クライアント生成・HMAC 署名鍵 (招待トークン / アクセスコード) | **secret** — 絶対にクライアントへ渡さない、anon キーとは別物 |

`SUPABASE_SERVICE_ROLE_KEY` は RLS を bypass する権限を持つため、サーバ実行コンテキスト (API Route / Server Action / `getServerSideProps`) 以外で参照してはならない。本リポジトリでは `lib/time-capsule/server.ts` からのみ参照される。

> その他の潜在 env 変数 (例: `VERCEL_URL`, `NODE_ENV`) は Next.js / Vercel runtime が自動注入するもので、本リポジトリのコードから `process.env.*` で明示的に参照していない。追加する場合は本セクションへ追記する。

## 4. `.env.example` / `.env.local.example`

`/.env.example` はリポジトリに含まれており、以下のテンプレートを公開している (`.gitignore` で `.env` 自体は ignore されている)。

```text
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

`.env.local.example` は現状存在しない。**`SUPABASE_SERVICE_ROLE_KEY` の template 案** は次のとおり (本 Issue スコープでは追加しない — 別 PR で `.env.example` への追記を提案する)。

```text
# Server-side only (DO NOT commit real value)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> 運用ルール: `.env` および `.env.local` は絶対にコミットしない。`.gitignore` で除外されているが、誤追跡を防ぐため PR レビュー時に diff 確認する。

## 5. `lib/supabase/client.ts` の lazy fallback 動作

`lib/supabase/client.ts` は **環境変数未設定でもアプリがクラッシュしない** よう lazy fallback パターンで実装されている。挙動の正本は次のとおり。

1. **判定**: `isSupabaseConfigured()` は `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` の両方が truthy かつ URL が `https://placeholder.supabase.co` 以外であることを返す。
2. **遅延シングルトン**: `getSupabase()` は初回呼び出し時に Supabase クライアントを生成し、以降は同一インスタンスを返す。import 時には副作用を実行しない。
3. **フォールバック URL / Key**: 環境変数が未設定の場合、`https://placeholder.supabase.co` と `placeholder-anon-key` を一時的に使用して `createClient` を呼び出す。実 Supabase への通信は失敗するが、**プロセス起動は成功** する。
4. **警告ログ**: ブラウザ側 (`typeof window !== 'undefined'`) でフォールバックが発動した場合のみ `console.warn('[Supabase] 環境変数が未設定のため、オフライン／フォールバックモードで動作します')` を出力する。サーバ側ではログを出さない (ビルド時の誤警告を避けるため)。
5. **後方互換 export**: `supabase.from(...)` / `supabase.storage.from(...)` の 2 つのラッパーも公開され、既存コードは import を変更せずに利用できる。

この設計により、**ローカル開発で Supabase を立てないまま UI 確認だけ行う**、**Storybook / 静的ビルドで env を渡さずに preview を取る** といった運用が可能。

## 6. GitHub Actions での `secrets.*` 参照箇所

リポジトリの `.github/workflows/*.yml` で `secrets.*` を参照しているのは次の 1 ファイルのみ。

| Workflow | 参照箇所 | 参照 secret |
| --- | --- | --- |
| `.github/workflows/supabase-healthcheck.yml` (job `readonly-healthcheck`, step `Validate Supabase configuration`) | `env:` ブロック | `secrets.NEXT_PUBLIC_SUPABASE_URL`, `secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY`, `secrets.SUPABASE_READONLY_DATABASE_URL` |
| `.github/workflows/supabase-healthcheck.yml` (job `readonly-healthcheck`, step `Run read-only REST healthcheck`) | `env:` ブロック | `secrets.NEXT_PUBLIC_SUPABASE_URL`, `secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `.github/workflows/supabase-healthcheck.yml` (job `readonly-healthcheck`, step `Attest read-only PostgreSQL access`) | `env:` ブロック | `secrets.SUPABASE_READONLY_DATABASE_URL` |

`.github/workflows/ci.yml` は secrets を参照しない (lint / typecheck / test / build のみ)。Workflow 内で参照している secret は **Supabase URL、anon キー、read-only PostgreSQL 接続 URL の 3 種** であり、service role key は workflow から **一切参照していない**。REST healthcheck は読み取り専用 (`GET /rest/v1/`) であり、PostgreSQL attestation も read-only query のみを実行する。

## 7. 失敗時の通知経路

リポジトリの workflow files を再走査した結果、**失敗時の外部通知経路は現状実装されていない**。

- `if: failure()` ブロックは両 workflow ともに存在しない
- `actions/github-script` での issue / discussion 自動作成は存在しない
- `notify-*` 系の action も存在しない

`supabase-healthcheck.yml` は失敗時、ステップ内の `echo ... >&2` と `exit 1` で CI 履歴に失敗を残すのみ。`ci.yml` も同様に GitHub Actions の実行ログに失敗が残る。

> 通知経路の追加は本 Issue のスコープ外である。必要になった場合は別 Issue / PR で `if: failure()` ブロックと notification action (例: Slack webhook, GitHub Issue 自動起票) を追加する。

## 8. 運用ルール (production secret 取り扱い)

production 環境では次のルールを厳格に運用する。

1. **GitHub には production secret 値を含めない** — コード、Issue、PR、コミットメッセージ、ログ、スクリーンショットいずれにも書かない。
2. **Vercel / Supabase Dashboard** などの管理画面で値を管理し、リポジトリの `.env.example` には placeholder (`your_supabase_*`) のみ記載する。
3. **`process.env.*` を追加する場合は** `NEXT_PUBLIC_*` 接頭辞の可否を設計時に判断し、本ドキュメント (セクション 2 / 3) を必ず更新する。
4. **service role key などの server-side secret** は、参照箇所を限定 (本リポジトリでは `lib/time-capsule/server.ts` のみ) し、レビュー時に全参照箇所を `grep` で再確認する。
5. **`.env` ファイルを絶対にコミットしない** — `.gitignore` で除外されているが、誤追跡を PR レビューで検出する。
6. **GitHub Actions secret の rotation** 時は、`.github/workflows/*.yml` 内の参照名と一致するよう Vercel / Supabase 側の値も同時に更新する。
7. **本ドキュメントは env / secret の Single Source of Truth (SSOT)** として扱い、変更時は PR 説明に変更理由と参照 diff を明記する。

## 9. 変更履歴

| 日付 | 変更者 | 内容 |
| --- | --- | --- |
| 2026-08-30 | Issue #65 着手 (chore/production-boundary-followup) | 初版作成。`NEXT_PUBLIC_*` 3 種、server-only 1 種、workflow secrets 2 種を列挙。lazy fallback pattern を文書化。 |
