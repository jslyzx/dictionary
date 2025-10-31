# 修复 undefined 参数绑定错误

## 问题描述
编辑单词提交时出现数据库参数绑定错误：`Bind parameters must not contain undefined. To pass SQL NULL specify JS null`

## 错误原因
在 `wordController.js` 中的多个函数执行 SQL 查询时，绑定参数数组中包含了 `undefined` 值。MySQL2 驱动要求如果要传递 SQL NULL，必须使用 JavaScript 的 `null` 而不是 `undefined`。

## 修复方案

### 1. 添加参数清理函数
```javascript
const sanitizeDbParams = (params) => params.map(param => param === undefined ? null : param);
```

### 2. 修复的函数

#### updateWord 函数 (第588行附近)
- 为每个字段添加了 `undefined` 检查：`body.field === undefined ? null : body.field`
- 使用 `sanitizeDbParams` 清理所有参数

#### createWord 函数
- 为主要字段（word、phonetic、meaning）添加了 `undefined` 检查
- 使用 `sanitizeDbParams` 清理所有参数

#### getWordById 和 deleteWord 函数
- 添加了 `wordId` 验证，防止 `undefined` ID 被传递
- 使用 `sanitizeDbParams` 清理参数

#### 其他查询函数
- `getWords`、`getWordStats`、`exportWordsCsv` 函数中的查询都使用了 `sanitizeDbParams`
- CSV 导入功能中的 `connection.execute` 也使用了 `sanitizeDbParams`

## 验收标准
✅ 编辑单词时不再出现 `undefined` 参数绑定错误
✅ 可选字段未填写时能够正确传递 `null` 到数据库
✅ 单词更新操作成功执行
✅ 添加了适当的参数验证和错误处理
✅ 所有数据库查询都使用了参数清理

## 测试验证
创建了测试脚本验证 `sanitizeDbParams` 函数的正确性，所有测试用例均通过。

## 影响范围
- `controllers/wordController.js` 文件
- 所有涉及单词 CRUD 操作的函数
- CSV 导入功能

## 防御性编程
- 添加了通用的参数清理函数，便于未来维护
- 为所有可能接收 `undefined` 参数的数据库查询添加了保护
- 增强了 ID 验证逻辑，防止无效 ID 导致的错误