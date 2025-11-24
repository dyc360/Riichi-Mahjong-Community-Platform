# Git 开发规范

本文档定义了项目团队的 Git 工作流程和规范，旨在提高代码质量、协作效率和版本控制的可维护性。

## 分支管理策略

### 分支命名规范
有需要开发的功能时，请从 `dev` 分支 checkout 出新的功能分支。分支命名规则遵循：

- `feature/` 分支（开发新功能）：`feature/login-page`、`feature/auth-api`
- `bugfix/` 分支（修复线上或测试 bug）：`bugfix/token-expire`、`bugfix/memory-leak`
- `hotfix/` 分支（紧急修复线上严重问题）：`hotfix/security-patch`
- `release/` 分支（准备上线）：`release/v1.2.0`
- `refactor/` 分支（代码重构）：`refactor/user-service`

### 分支生命周期
1. **创建分支**：从 `dev` 分支创建新分支
2. **开发过程**：在分支上进行开发，定期推送代码到远程
3. **代码审查**：开发完成后发起 Pull Request (PR)
4. **合并**：通过代码审查后，由维护者合并到目标分支
5. **清理**：合并后删除功能分支

### 保护策略
- **main/master 分支**：严禁直接推送，只能通过 PR 合并
- **dev 分支**：作为主要开发分支，定期从 main 同步最新代码（但也尽量少修改main分支）
- **release 分支**：从 dev 创建，用于预发布测试

## 本地开发规范

### 开发环境准备
1. 克隆项目：`git clone <repository-url>`
2. 创建并切换到开发分支：`git checkout -b feature/your-feature dev`（dev表示从dev分支checkout出一个分支）
3. 定期同步上游分支：`git pull origin dev`（最好是每次开发前都同步一次）

### 提交规范

#### Commit Message 格式
遵循 [Conventional Commits](https://conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### 常用 Type
| Type     | 含义                     | 示例 |
| -------- | ---------------------- | ---- |
| feat     | 新功能                    | feat(auth): add OAuth2 login |
| fix      | 修复 bug                 | fix(api): handle null response |
| docs     | 文档修改                   | docs(readme): update setup guide |
| style    | 代码格式调整（不影响功能）     | style: format code with prettier |
| refactor | 代码重构（不修复bug、不加功能） | refactor: simplify user validation |
| test     | 测试相关                   | test: add unit tests for auth |
| chore    | 构建、依赖、工具变更         | chore: update dependencies |
| perf     | 性能优化                   | perf: optimize database queries |
| ci       | CI/CD 配置变更            | ci: add GitHub Actions workflow |
| build    | 构建系统更新               | build: update webpack config |
| revert   | 撤销某次提交               | revert: undo login feature |

#### Subject 规范
- 控制在 50 个字符以内
- 使用英文书写（允许中文但不推荐）
- 首字母小写，不以句号结尾
- 简洁明了，说明本次提交的主要内容

#### Body 规范
- 可选，用于详细说明变更内容
- 解释为什么要做这个变更
- 描述影响范围和可能的副作用

#### Footer 规范
- 可选，用于关联 Issue 或标记重大变更
- 格式：`Closes #123` 或 `BREAKING CHANGE: ...`

#### 示例
```
feat(auth): implement JWT token authentication

- Add JWT token generation and validation
- Implement middleware for automatic authentication
- Add refresh token functionality

Closes #42
```

### 开发习惯
- **原子提交**：每个 commit 只做一件事
- **频繁提交**：不要积累太多未提交的代码
- **清晰历史**：使用 `git rebase` 整理提交历史
- **同步上游**：开发前先同步 dev 分支

## Pull Request (PR) 流程

### 创建 PR
1. 确保代码已推送至远程分支
2. 在 GitHub/GitLab 创建 PR
3. 填写清晰的标题和描述
4. 关联相关 Issue（如适用）

### PR 模板
```
## 描述
简要说明这个 PR 的目的和内容

## 变更类型
- [ ] 新功能 (feat)
- [ ] 修复 (fix)
- [ ] 文档 (docs)
- [ ] 样式 (style)
- [ ] 重构 (refactor)
- [ ] 测试 (test)
- [ ] 构建 (build)
- [ ] CI (ci)
- [ ] 其他 (chore)

## 影响范围
描述这个变更可能影响的功能或模块

## 测试
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试通过

## 相关 Issue
Closes #123
```

### 代码审查规范
#### 审查者职责
- 检查代码质量和规范性
- 验证功能正确性
- 评估性能影响
- 确认测试覆盖率

#### 审查要点
- **功能完整性**：代码是否实现了需求
- **代码质量**：是否符合编码规范
- **测试覆盖**：是否有足够的测试
- **文档更新**：README 和注释是否更新
- **安全考虑**：是否存在安全漏洞

#### 审查意见
- ✅ **Approve**：同意合并
- 💬 **Comment**：提出问题或建议
- 🚫 **Request Changes**：需要修改后重新审查

### 合并策略
- **Squash and Merge**：将多个 commit 压缩为一个
- **Merge Commit**：保留完整的历史记录
- **Rebase and Merge**：保持线性的提交历史

## 冲突解决

### 预防冲突
1. 定期从上游分支同步代码
2. 保持分支生命周期短
3. 及时处理 PR 反馈

### 解决冲突
1. 同步上游分支：`git pull origin dev`
2. 解决冲突文件
3. 测试修改后的代码
4. 提交解决结果

## 标签管理

### 版本标签
- **主版本**：`v1.0.0`、`v2.1.3`
- **预发布**：`v1.0.0-alpha`、`v1.0.0-beta`
- **补丁**：`v1.0.1`、`v1.0.2`

### 打标签流程
```bash
# 创建标签
git tag -a v1.0.0 -m "Release version 1.0.0"

# 推送标签
git push origin v1.0.0
```

## 紧急情况处理

### Hotfix 流程
1. 从 `main` 分支创建 `hotfix/` 分支
2. 修复问题并测试
3. 同时合并到 `main` 和 `dev` 分支
4. 删除 hotfix 分支

### 回滚策略
```bash
# 软回滚（保留更改）
git revert <commit-hash>

# 硬回滚（完全撤销）
git reset --hard <commit-hash>
git push --force-with-lease
```

## 完整开发流程实例

假设要新开发一个A功能，那么正确的流程应该是
- 同步本地dev分支和远端dev分支
```php
git checkout dev
git pull origin dev
```
- 新建一个本地开发分支
```php
git checkout -b feature/A dev
```
如果是已有的分支，请用
```php
git checkout feature/A
git rebase dev
```

- 开发完成，确认无误后commit
```php
git add .
git commit -m "feat(A): implement A"
```

- 将分支推送到远端
```php
git push origin feature/A
```

- 确认无误后发起PR到dev分支


## 常见问题


---

**最后更新**：2025年11月21日
**维护者**： [MajHub](https://github.com/dyc360/Riichi-Mahjong-Community-Platform#)项目团队