export const QUESTIONS = [
  "Q1: 今日は何をしていましたか？どんな一日でしたか？\n(What did you do today? How was your day?)",
  "Q2: 今日一番印象に残ったことや、うまくいったことは何ですか？\n(What went well or stood out most today?)",
  "Q3: 難しかったこと、うまくいかなかったことはありましたか？\n(What was difficult or didn't go as planned?)",
  "Q4: 今日、何か学んだことや気づいたことはありましたか？\n(Did you learn or notice anything today?)",
  "Q5: 明日に向けて、何か持ち越したいことや試したいことはありますか？\n(Anything you want to carry over or try tomorrow?)",
]

export const SYNTHESIS_PROMPT = `You are synthesizing a daily reflection.
Given the user's answers to 5 questions, create a structured reflection in the exact format below.

Rules:
- Write each section in the same language the user used for that answer
- Use bullet points for Wins, Challenges, Learnings, Tomorrow sections
- Keep summary to 2-4 sentences
- If an answer is empty or "nothing", write "特になし / None"
- Do not invent or embellish — faithfully capture what was said
- Do not add encouragement or evaluation — just organize the content

Output ONLY the Markdown content starting with ## 今日の概要, not the full file header.`
