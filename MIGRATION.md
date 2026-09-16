# 模具信息管理系统 - 迁移说明 / Migration Guide

## 包内容 / Package Contents

本压缩包含完整系统源码（Next.js 16 + React 19 + TypeScript），不含 node_modules（部署时自动安装）。

- `.coze` - 启动配置（已预设 build/run 命令）
- `src/` - 全部源码（主页、后台管理、数据分析、双语字典、模拟数据）
- `AGENTS.md` / `DESIGN.md` - 项目规范文档

## 迁移步骤 / Migration Steps

### 1. 部署系统 / Deploy
1. 在目标扣子账号创建新项目（Next.js 模板或空项目）
2. 将本压缩包解压并覆盖到项目根目录
3. 直接启动即可，`.coze` 配置已就绪（依赖自动 `pnpm install`）

### 2. 迁移运行时数据 / Migrate Runtime Data

系统数据存储在浏览器 localStorage 中，随源码迁移的是**初始演示数据**。如需迁移实际业务数据：

**旧环境（导出）：**
1. 进入「后台管理」→「数据备份」
2. 点击「导出备份文件」，得到 `mold-system-backup-xxxxxx.json`
3. 查看页面上方的「当前数据概览」确认备份覆盖范围

**新环境（恢复）：**
1. 部署完成后进入「后台管理」→「数据备份」
2. 点击「立即恢复」选择刚才导出的 JSON 文件
3. 页面自动刷新，数据即完整迁移

### 3. 备份范围 / Backup Scope

- 模具台账（molds）
- 申请审批单（mold_requests）
- 未提交草稿（mold_draft_edits）
- 全部下拉配置项（工厂/产品/流道/材料/所在地/供应商/资产归属/月工作天数）
- 管理员口令（默认 admin）

> 登录会话不在备份范围内，迁移后需重新登录后台（用户名 admin / 123456，口令以备份为准）。
