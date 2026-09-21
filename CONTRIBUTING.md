# コントリビューションガイド

`Omoide`（想い出箱）への貢献に関心をお寄せいただき、ありがとうございます。
バグ報告、機能提案、コードおよびドキュメントの改善を行う際の手順と規約をまとめます。

## 目次

1. [参加方法](#参加方法)
2. [開発環境の構築](#開発環境の構築)
3. [開発ワークフロー](#開発ワークフロー)
4. [コーディング規約](#コーディング規約)
5. [コミット規約](#コミット規約)
6. [Pull Request の作成](#pull-request-の作成)
7. [行動規範](#行動規範)

## 参加方法

- **バグ報告**: 不具合の再現手順、環境情報、期待される動作を明記して Issue を作成します。
- **機能提案**: 大きな機能追加や UI の変更を行う場合は、実装前に Issue で方針を相談します。
- **ドキュメント改善**: 誤字脱字の修正、説明の追加、英語/日本語の表記ゆれの修正を歓迎します。
- **テストの追加**: 新機能やエッジケースに対する Vitest テストコードの追加を歓迎します。

## 開発環境の構築

### 前提条件

- Node.js 20.9.0 以上
- npm（Node.js に同梱されるバージョン）
- Supabase プロジェクト（ローカルまたはクラウド）

### 手順

1. リポジトリを Fork してローカルに clone します。

   ```bash
   git clone https://github.com/<your-username>/happy-birthday-website.git
   cd happy-birthday-website
   ```

2. 依存パッケージをインストールします。

   ```bash
   npm install
   ```

3. 環境変数を設定します。

   ```bash
   cp .env.example .env.local
   ```

   `.env.local` を開き、Supabase の接続情報を設定します。

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

4. 静的データマニフェストを生成します。

   ```bash
   npm run generate:data
   ```

5. 開発サーバーを起動します。
   ```bash
   npm run dev
   ```
   ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 開発ワークフロー

### ブランチ規約

`main` ブランチに直接 push せず、目的ごとの作業ブランチを作成して作業します。

| 種類             | 命名規則        | 例                            |
| ---------------- | --------------- | ----------------------------- |
| 新機能           | `feat/機能名`   | `feat/interactive-3d-omikuji` |
| バグ修正         | `fix/内容`      | `fix/mobile-dock-zindex`      |
| ドキュメント     | `docs/内容`     | `docs/update-architecture`    |
| リファクタリング | `refactor/内容` | `refactor/music-store`        |

### データベースとマイグレーション

データベーススキーマの変更は、直接 Supabase ダッシュボードで行わず、`supabase/migrations/` に SQL マイグレーションファイルとして追加します。詳細は [DATABASE.md](./DATABASE.md) を参照してください。

### 多言語（i18n）データの更新

UI のテキストや祝祭日データを追加・修正した場合は、以下の手順を実行します。

1. `data/i18n/en.json` および `data/i18n/ja.json` にキーと翻訳を追加します。
2. `npm run generate:data` を実行し、`data/generated/locales.ts` を再生成します。

## コーディング規約

### TypeScript / React

- `any` の使用を避け、厳格な型定義（`types/` 配下）を作成します。
- UI コンポーネントは表示責務に集中させ、ビジネスロジックはカスタムフック（`lib/hooks/`）または Zustand ストア（`lib/stores/`）に切り離します。
- ユーザーに表示されるすべての文言は `useLanguage()` を通して多言語対応します。

### 3D / WebGL（Three.js）

- コンポーネントのアンマウント時に、Geometries、Materials、Textures、Controls、PMREMGenerator などの WebGL リソースを確実に dispose します。
- リサイズ処理およびポインターイベント（ドラッグとクリックの閾値判定）を実装します。

### スタイリング

- Tailwind CSS 4 のユーティリティクラスを優先します。
- テーマカラー、surface、text、border、shadow、font は `app/globals.css` の CSS 変数および `@theme` トークンを使用します。
- 既存の inline style と固定値は一括置換せず、変更対象の機能やアクセシビリティ修正に触れる範囲で段階的に token 化します。
- 色の意味やコントラストを変える広範な visual redesign は、個別 Issue で方針を確認してから実施します。

## コミット規約

Conventional Commits に準拠した明確なメッセージを推奨します。

```text
feat(fortune): 3D おみくじ筒のシェイク演出と運勢データセットを追加
fix(ui): モバイルドックの z-index 重なりを修正
docs: STRUCTURE.md に 3D コンポーネント構成を追加
test: omikujiData の整合性テストケースを追加
```

## Pull Request の作成

1. 変更を実装し、ローカルでテストとビルドを実行します。

   ```bash
   # リントチェック
   npm run lint

   # 型検査
   npm run typecheck

   # テスト実行
   npm run test

   # 本番ビルド検証
   npm run build
   ```

2. 変更をコミットしてリモートブランチに push します。

   ```bash
   git push origin feat/your-feature-name
   ```

3. GitHub 上で Pull Request を作成します。
   - 変更内容の概要と背景（関連する Issue 番号を `Closes #123` 形式で記載）
   - 動作確認手順とスクリーンショット

4. CI チェックの通過を確認し、レビューに対応します。

## 行動規範

本プロジェクトでは、すべての参加者が安心して協力できる環境を重視しています。詳細は [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) を確認してください。
