export const FRAMEWORKS = [
  {
    id: 'super-thinking',
    name: 'Super Thinking',
    description: '用於複雜問題、策略決策、系統分析、槓桿點、取捨、風險與誘因檢查。',
    bestFor: ['複雜問題', '策略決策', '系統分析', '風險取捨', '誘因設計', '專案預演'],
    avoidWhen: ['單純查詢事實', '已有明確公式或專業指引', '問題很小且直接行動成本低'],
    coreQuestions: [
      '真正要優化的是什麼？',
      '目前限制整體結果的瓶頸在哪裡？',
      '這個選擇的二階效果是什麼？',
      '哪些誘因會讓行為偏離目標？',
      '如果核心假設錯了，安全邊際在哪裡？',
    ],
    promptGuide: '先跑 First Pass Checklist，再依情境選模型群，最後輸出具體下一步。',
  },
  {
    id: 'thinking-fast-and-slow',
    name: 'Thinking, Fast and Slow',
    description: '用於分析直覺判斷、認知偏誤、風險框架、預測錯誤、專家直覺與不確定選擇。',
    bestFor: ['快速判斷', '預測與估期', 'base rate', 'framing effect', 'loss aversion', '專家直覺檢查'],
    avoidWhen: ['沒有判斷或決策', '已有高品質公式或演算法', '只是想把所有錯誤硬套成偏誤'],
    coreQuestions: [
      '我現在是在快速直覺，還是在慢速檢查？',
      '是否只根據眼前資訊判斷？',
      '是否有人先給出 anchor？',
      '類似案例的 base rate 是什麼？',
      '換一種 framing 後選擇會不會改變？',
    ],
    promptGuide: '先辨識 System 1/System 2 狀態，再檢查 WYSIATI、anchoring、base rate、framing 與 loss aversion。',
  },
];
