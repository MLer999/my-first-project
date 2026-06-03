# GitHub/Google OAuth 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GitHub OAuth ログインのコールバック URL を修正し、Google OAuth ログインを追加する

**Architecture:** Supabase の既存 OAuth 機能をそのまま使う。設定変更（GitHub/Google/Supabase ダッシュボード）と UI コード変更（`app/page.tsx` のみ）の2種類の作業からなる。

**Tech Stack:** Next.js 15, Supabase Auth, Tailwind CSS, TypeScript

---

## Task 1: Supabase の Callback URL を確認する

**Files:**
- 変更なし（確認のみ）

- [ ] **Step 1: Supabase ダッシュボードで Callback URL を確認する**

  1. https://supabase.com/dashboard にアクセス
  2. 自分のプロジェクトを選択
  3. 左メニュー → Authentication → Providers → GitHub をクリック
  4. 画面に表示されている **「Callback URL (for OAuth)」** をコピーして手元に控える

  控える URL の形式:
  ```
  https://xxxxxxxxxxxxxx.supabase.co/auth/v1/callback
  ```

  ※ この URL を次のタスクで GitHub と Google の両方に設定する

---

## Task 2: GitHub OAuth App のコールバック URL を修正する

**Files:**
- 変更なし（GitHub の設定変更）

- [ ] **Step 1: GitHub の OAuth Apps 設定を開く**

  https://github.com/settings/developers にアクセス → 「OAuth Apps」タブ → アプリ名をクリック

- [ ] **Step 2: Authorization callback URL を更新する**

  `Authorization callback URL` フィールドを以下に変更:
  ```
  https://xxxxxxxxxxxxxx.supabase.co/auth/v1/callback
  ```
  （Task 1 で控えた Supabase の Callback URL）

  `Update application` ボタンで保存する

- [ ] **Step 3: Client ID と Client Secret を控える**

  同画面に表示されている:
  - **Client ID**: `Ov23li...` のような値
  - **Client Secret**: 「Generate a new client secret」で生成して控える

---

## Task 3: Supabase の URL 設定を修正する

**Files:**
- 変更なし（Supabase ダッシュボードの設定変更）

- [ ] **Step 1: Site URL を設定する**

  Supabase ダッシュボード → Authentication → URL Configuration

  - **Site URL** を以下に設定:
    ```
    https://my-first-project-beta-hazel.vercel.app
    ```

- [ ] **Step 2: Redirect URLs を追加する**

  同画面の **Redirect URLs** に以下を追加:
  ```
  https://my-first-project-beta-hazel.vercel.app/**
  ```

  Save ボタンで保存する

- [ ] **Step 3: GitHub プロバイダーに Client ID / Secret を設定する**

  Authentication → Providers → GitHub

  - Enabled: ON
  - Client ID: Task 2 Step 3 で控えた値を入力
  - Client Secret: Task 2 Step 3 で控えた値を入力
  - Save ボタンで保存

- [ ] **Step 4: GitHub ログインの動作確認**

  https://my-first-project-beta-hazel.vercel.app/ を開き、「GitHubでログイン」ボタンを押す。
  GitHub の認証画面が開き、ログイン後に `/reflect` へ遷移すれば成功。

---

## Task 4: Google Cloud Console で OAuth 認証情報を作成する

**Files:**
- 変更なし（Google Cloud の設定）

- [ ] **Step 1: Google Cloud Console を開く**

  https://console.cloud.google.com/ にアクセス

- [ ] **Step 2: プロジェクトを作成する**

  画面上部のプロジェクト選択 → 「新しいプロジェクト」→ 任意の名前（例: `reflection-app`）→ 作成

- [ ] **Step 3: OAuth 同意画面を設定する**

  左メニュー → 「APIとサービス」→「OAuth 同意画面」
  - User Type: **外部** を選択 → 作成
  - アプリ名: `振り返りアプリ`（任意）
  - ユーザーサポートメール: 自分のメールアドレス
  - デベロッパーの連絡先: 自分のメールアドレス
  - 「保存して次へ」を3回クリックして完了

- [ ] **Step 4: OAuth クライアント ID を作成する**

  左メニュー → 「APIとサービス」→「認証情報」→「認証情報を作成」→「OAuth クライアント ID」

  - アプリケーションの種類: **ウェブアプリケーション**
  - 名前: 任意（例: `reflection-app-web`）
  - **承認済みのリダイレクト URI** に以下を追加:
    ```
    https://xxxxxxxxxxxxxx.supabase.co/auth/v1/callback
    ```
    （Task 1 で控えた Supabase の Callback URL）
  - 「作成」をクリック

- [ ] **Step 5: クライアント ID と Secret を控える**

  ポップアップに表示される:
  - **クライアント ID**: `xxxxxx.apps.googleusercontent.com`
  - **クライアントシークレット**: `GOCSPX-...`

  両方コピーして手元に保存する

---

## Task 5: Supabase に Google プロバイダーを追加する

**Files:**
- 変更なし（Supabase ダッシュボードの設定）

- [ ] **Step 1: Supabase で Google プロバイダーを有効化する**

  Authentication → Providers → Google

  - Enabled: ON
  - Client ID: Task 4 Step 5 の「クライアント ID」を入力
  - Client Secret: Task 4 Step 5 の「クライアントシークレット」を入力
  - Save ボタンで保存

---

## Task 6: app/page.tsx に Google ログインボタンを追加する

**Files:**
- Modify: `app/page.tsx`（全体を以下の内容に差し替える）

- [ ] **Step 1: app/page.tsx を以下の内容に差し替える**

  `app/page.tsx` を開き、内容を全て以下に差し替える:

  ```tsx
  "use client"

  import { createClient } from "@/lib/supabase/client"
  import { useRouter } from "next/navigation"
  import { useEffect, useState } from "react"

  export default function Home() {
    const router = useRouter()
    const [checking, setChecking] = useState(true)
    const [loadingProvider, setLoadingProvider] = useState<"github" | "google" | null>(null)

    useEffect(() => {
      if (sessionStorage.getItem("reflection-guest") === "1") {
        router.push("/reflect")
        return
      }
      createClient().auth.getUser().then(({ data: { user } }) => {
        if (user) router.push("/reflect")
        else setChecking(false)
      })
    }, [router])

    async function handleGitHub() {
      setLoadingProvider("github")
      await createClient().auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: `${window.location.origin}/api/auth/callback` },
      })
    }

    async function handleGoogle() {
      setLoadingProvider("google")
      await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/api/auth/callback` },
      })
    }

    function handleGuest() {
      sessionStorage.setItem("reflection-guest", "1")
      router.push("/reflect")
    }

    if (checking) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-3xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-6 text-3xl">
              🌙
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              振り返りアプリ
            </h1>
            <p className="mt-3 text-slate-400 text-lg">
              AIと一緒に、今日の気づきを記録しよう
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* GitHub login card */}
              <div className="bg-gradient-to-b from-slate-800/60 to-slate-900/60 backdrop-blur border border-white/10 rounded-2xl p-7 flex flex-col ring-1 ring-indigo-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-base">
                    💾
                  </div>
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">記録を残す</span>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">GitHubでログイン</h2>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                  振り返りが蓄積されていきます。<br />GitHubアカウントで即ログイン。
                </p>
                <ul className="space-y-2 mb-8">
                  {["ワンクリックでログイン", "振り返りの履歴を保存", "いつでも読み返せる"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-slate-400">
                      <span className="text-indigo-400">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleGitHub}
                  disabled={loadingProvider !== null}
                  className="mt-auto w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
                >
                  {loadingProvider === "github" ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <GitHubIcon />
                  )}
                  {loadingProvider === "github" ? "リダイレクト中..." : "GitHubでログイン →"}
                </button>
              </div>

              {/* Google login card */}
              <div className="bg-gradient-to-b from-slate-800/60 to-slate-900/60 backdrop-blur border border-white/10 rounded-2xl p-7 flex flex-col ring-1 ring-blue-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-base">
                    💾
                  </div>
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">記録を残す</span>
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Googleでログイン</h2>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                  振り返りが蓄積されていきます。<br />Googleアカウントで即ログイン。
                </p>
                <ul className="space-y-2 mb-8">
                  {["ワンクリックでログイン", "振り返りの履歴を保存", "いつでも読み返せる"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-slate-400">
                      <span className="text-blue-400">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleGoogle}
                  disabled={loadingProvider !== null}
                  className="mt-auto w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  {loadingProvider === "google" ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  {loadingProvider === "google" ? "リダイレクト中..." : "Googleでログイン →"}
                </button>
              </div>
            </div>

            {/* Guest card */}
            <div className="bg-slate-900/40 backdrop-blur border border-white/[0.06] rounded-2xl p-7 flex flex-col sm:flex-row sm:items-center sm:gap-8">
              <div className="flex-1 mb-6 sm:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-700/50 border border-white/10 flex items-center justify-center text-base">
                    👤
                  </div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">記録なし</span>
                </div>
                <h2 className="text-xl font-semibold text-white mb-1">ゲストで試す</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  登録不要でAIとの振り返りを体験。ブラウザを閉じるとデータは消えます。
                </p>
              </div>
              <button
                onClick={handleGuest}
                className="w-full sm:w-auto sm:whitespace-nowrap px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-all"
              >
                ゲストとして始める →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function GitHubIcon() {
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    )
  }

  function GoogleIcon() {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="white"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white"/>
      </svg>
    )
  }
  ```

- [ ] **Step 2: コードをコミットする**

  ```bash
  git add app/page.tsx
  git commit -m "feat: Google ログインボタン追加、loadingProvider state に変更"
  ```

- [ ] **Step 3: Vercel にデプロイする**

  ```bash
  git push origin main
  ```

  Vercel が自動デプロイする（通常1〜2分）

- [ ] **Step 4: 動作確認**

  https://my-first-project-beta-hazel.vercel.app/ を開く

  確認項目:
  - [ ] GitHub カードと Google カードが横並びで表示される
  - [ ] ゲストカードが下段に横長で表示される
  - [ ] 「Googleでログイン」ボタンを押すと Google の認証画面が開く
  - [ ] Google 認証後に `/reflect` へ遷移する
  - [ ] GitHub ボタンを押している間、Google ボタンが無効化（薄くなる）される
