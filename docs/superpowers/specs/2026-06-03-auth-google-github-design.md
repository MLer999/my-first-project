# Auth: GitHub 修正 + Google ログイン追加

**日付:** 2026-06-03  
**対象アプリ:** https://my-first-project-beta-hazel.vercel.app/

---

## 背景・目的

- GitHub OAuth ログインボタンを押すと「このサイトにアクセスできません」エラーが発生している
- 原因: Supabase / GitHub OAuth App のコールバック URL がデプロイ先 URL に合っていない
- 合わせて Google OAuth ログインも追加する

---

## アーキテクチャ

既存の Supabase OAuth の仕組みをそのまま使う。コード変更は UI のみ。

```
ユーザー
  ↓ ボタンクリック（GitHub or Google）
app/page.tsx
  ↓ supabase.auth.signInWithOAuth({ provider: "github" | "google" })
Supabase Auth
  ↓ プロバイダーへリダイレクト
GitHub / Google
  ↓ 認証完了後コールバック
https://my-first-project-beta-hazel.vercel.app/api/auth/callback
  ↓ セッション確立
/reflect ページへ遷移
```

---

## 変更内容

### 設定変更（コードなし）

#### 1. GitHub OAuth App
- URL: https://github.com/settings/developers → OAuth Apps
- `Authorization callback URL` を以下に設定:
  ```
  https://[supabase-project-id].supabase.co/auth/v1/callback
  ```
  ※ Supabase ダッシュボード → Authentication → Providers → GitHub に表示される URL を使う

#### 2. Google Cloud Console
- 新規プロジェクト作成（または既存）
- 「APIとサービス」→「認証情報」→「OAuth 2.0 クライアント ID」を作成
- アプリケーション種別: ウェブアプリケーション
- 承認済みリダイレクト URI:
  ```
  https://[supabase-project-id].supabase.co/auth/v1/callback
  ```
- クライアント ID と クライアントシークレットを控える

#### 3. Supabase ダッシュボード
- Authentication → URL Configuration:
  - Site URL: `https://my-first-project-beta-hazel.vercel.app`
  - Redirect URLs に追加: `https://my-first-project-beta-hazel.vercel.app/**`
- Authentication → Providers → GitHub:
  - Enabled: ON
  - Client ID / Secret を GitHub OAuth App のものに設定
  - Callback URL（Supabase 側）を確認してコピーする
- Authentication → Providers → Google:
  - Enabled: ON
  - Client ID / Secret を Google Cloud Console のものに設定

---

### コード変更

**対象ファイル: `app/page.tsx` のみ**

1. `handleGoogle` 関数を追加（`handleGitHub` と同パターン、`provider: "google"`）
2. `loading` state を `loadingProvider: "github" | "google" | null` に変更（どちらがローディング中か区別）
3. UI をカード2枚（GitHub / ゲスト）から3枚（GitHub / Google / ゲスト）に変更
   - GitHub カード: 既存デザインを維持
   - Google カード: 新規追加、Google カラー（白ベース）
   - ゲストカード: 既存デザインを維持

---

## エラーハンドリング

- OAuth 失敗時: Supabase が自動的に `/` にリダイレクトするため、追加対応不要
- ネットワークエラー: `disabled` 状態のボタンとスピナーで二重クリック防止

---

## スコープ外

- メールアドレス・パスワード認証の追加
- Twitter / Apple など他プロバイダーの追加
- ログイン状態の永続化ロジック変更
