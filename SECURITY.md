# セキュリティポリシー

`Omoide` のセキュリティ問題の報告手順と、このプロジェクトが守っている情報の取り扱い方針です。

## サポート対象

このプロジェクトは継続的に更新する Web アプリケーションです。サポート対象は `main` ブランチの最新状態で、個別バージョンの長期サポートは行いません。利用するときは最新の状態へ追従してください。

## 脆弱性の報告

セキュリティ上の問題を発見した場合は、GitHub Issues から報告してください。

1. [新しい Issue](https://github.com/hayato-shino05/Omoide/issues/new) を開きます。
2. タイトルの先頭に `[セキュリティ]` を付けます。
3. 次の情報を添えます。
   - 問題の種類と想定される影響
   - 再現手順（最小の構成で）
   - 確認したブランチ、コミット、またはデプロイ環境
   - 可能であれば修正の提案

報告はメンテナー（[@hayato-shino05](https://github.com/hayato-shino05)）が確認し、対応方針を同じ Issue 上で案内します。

このリポジトリは公開リポジトリで、Issue の本文も公開されます。現時点では非公開の専用窓口を用意していないため、次の内容は Issue に含めないでください。

- API キー、シークレット、トークンなどの実値
- 個人情報
- 本番環境の接続情報

## 情報の取り扱い方針

公開してよい情報と公開しない情報を、環境変数の命名で分けています。

### `NEXT_PUBLIC_*` で始まる変数

`NEXT_PUBLIC_` で始まる変数はブラウザへ配信される client bundle に含まれるため、値は公開情報として扱います。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BASE_URL`

`NEXT_PUBLIC_SUPABASE_ANON_KEY` はフロントエンドから使う公開キーです。このキーだけで任意のデータへアクセスできないよう、後述の RLS でアクセスを制御します。

### `NEXT_PUBLIC_` を付けない変数

`NEXT_PUBLIC_` を付けない変数はサーバー実行コンテキスト（API Route など）でのみ参照し、クライアントのコードや client bundle には含めません。

- `BIRTHDAY_SCHEDULER_SECRET`
- `JAMENDO_CLIENT_ID`
- `SOUNDCLOUD_CLIENT_ID`
- `SOUNDCLOUD_CLIENT_SECRET`

実値は `.env` またはデプロイ先のシークレット管理に置きます。`.env` はリポジトリへ commit せず、新しく変数を追加するときは `.env.example` にプレースホルダだけを追加します。

### データアクセス

ブラウザからのデータアクセスは Supabase の RLS（Row Level Security）と Storage のポリシーで制御します。認証を伴わないアクセスでも、RLS が公開してよい行だけを返す構成です。スキーマとポリシーの詳細は [DATABASE.md](./DATABASE.md) を参照してください。

### ログとクライアントへの出力

シークレット、トークン、個人情報はログやクライアントへの出力に含めません。
