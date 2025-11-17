## 目标
- 将拼写模式实现为参考图片的交互与布局：左侧为输入横线+释义+音标+发音按钮，右侧为字母按钮网格；不使用选择题。
- 正确与错误分别给出视觉与音效反馈；错误记录到数据库并可继续下一题。
- 与当前学习窗口架构（LearningApp）无缝对接，题目切换时状态彻底重置。

## 页面结构与交互
1. 左侧（输入区）
- 顶部显示若干短横线输入槽，对应目标英文单词长度；已选择的字母按顺序填入槽位。
- 输入槽下方显示中文释义与音标；提供发音按钮播放目标词发音。
- 错误或正确时在左侧显示提示条（绿色=正确，红色=错误），并播放对应音效。

2. 右侧（字母区）
- 显示若干字母按钮：目标词字母+随机干扰字母；点击追加到输入槽；已用字母可点击回退到可选区。
- 提供“清空”按钮重置已选择字母。
- 底部有“提交答案”“跳过”按钮。

3. 题目切换
- 进入下一题时：重新生成字母集合；清空已用字母与用户答案；复位结果状态与提示条；重新计算输入槽。

## 事件与数据流
- 组件接受 `word`（`WordPlanWord`）与 `onAnswer(isCorrect, userAnswer)`、`onSkip()`、`progress`。
- 点击“提交答案”：
  - 对比 `userAnswer.trim().toLowerCase()` 与目标词 `word.word.word.toLowerCase()`；
  - 设置 `showResult` 与 `isCorrect`；播放音效；
  - 延迟回调 `onAnswer(isCorrect, userAnswer)`（父层 `LearningApp` 调用 `recordLearning(planId, wordId, isCorrect, userAnswer)`，错误弹窗“继续”进入下一题）。
- 点击“跳过”：调用 `onSkip()`，父层进入下一题。

## 技术实现
- 组件位置：更新现有 `client/src/components/learning/SpellingModeNew.tsx`（已具备基本形态）。
- 关键点：
  - 生成字母：`generateSpellingLetters(word)`（目标词字母+随机干扰，打散）。已存在；确保在 `useEffect([targetWord])` 中重建并清空状态（文件已实现：SpellingModeNew.tsx:22-31）。
  - 输入槽：按目标词长度渲染；高亮已填字母；未填显示横线；现有实现基础上优化样式与对齐（SpellingModeNew.tsx:169-197）。
  - 字母按钮：可选字母与已用字母列表互相移动（SpellingModeNew.tsx:243-319）；按钮样式改为参考图的扁平方块，颜色与圆角优化。
  - 发音按钮：沿用 Web Speech API（SpellingModeNew.tsx:207-225；playPronunciation:117-140）。
  - 音效反馈：保留并优化正确/错误音效（SpellingModeNew.tsx:89-115）。
  - 错误记录：父层 `LearningApp.tsx` 中 `handleAnswerSubmit` 已调用 `recordLearning(...)`（LearningApp.tsx:57-84）；保持该路径不变以满足“错误记录数据库”。
  - 结果提示：当前组件已内置结果提示条与“下一个单词”按钮（SpellingModeNew.tsx:228-241, 360-377）；与父层错误弹窗并存，保持一致体验。
  - 题目切换：确保 `useEffect([targetWord])` 与 `nextWord()`双重清理（SpellingModeNew.tsx:22-31, 142-148）。

## UI/样式细化
- 输入槽：宽 40px、高 50px、底部 3px 主题色边线；字母加粗；未填字母淡灰（已有：SpellingModeNew.tsx:171-196）。
- 字母按钮：45px 方块、2px 边框、圆角 8px、主色描边；悬停与按下过渡。
- 提示条：线性渐变背景（绿/红），白色文字，圆角 12px（SpellingModeNew.tsx:228-241）。
- 进度条：继续使用父层顶部进度显示（LearningApp.tsx:148-156）。若需左侧纵向进度条样式，可后续补充装饰性 UI。

## 验收标准
- 拼写模式不出现选择题；整个交互为“字母拼写”。
- 切换到下一题时，输入槽、字母集合、结果状态均重置；不再显示上一题内容。
- 正确/错误分别出现明显视觉提示与音效反馈；错误通过接口记录到数据库。
- UI与参考图一致的左右布局与元素风格；在桌面与平板视口表现良好。

## 改动文件
- `client/src/components/learning/SpellingModeNew.tsx`（主要改动：样式与交互优化、细节一致化）。
- 如需统一错误提示为组件内弹层，可轻量调整 `client/src/LearningApp.tsx` 的错误弹窗显示逻辑，但仍保留 `recordLearning` 记录路径。

## 测试计划
- 手动测试：
  - 拼写正确与错误各一次，观察音效与提示条；数据库记录成功。
  - 连续多题：确认每题状态重置、字母重新生成、输入槽正确。
  - 跳过与提交的组合；移动端触控点击响应。
- 日志验证：后端 `recordLearning` 请求返回 200；前端无控制台错误。

---
请确认以上实现方案。确认后我会开始更新 `SpellingModeNew.tsx` 的样式与交互，使拼写模式完全按参考 UI 工作，并保持与现有学习流程与数据记录一致。