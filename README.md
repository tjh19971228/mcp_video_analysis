# 视频分析与思维导图生成 MCP 服务

这是一个基于Model Context Protocol (MCP)的服务，用于视频内容分析和思维导图生成。

## 功能特点

- **视频分析**：从视频URL中提取关键词、摘要和关键时间点
- **思维导图生成**：基于视频分析结果生成结构化的思维导图
  - 生成JSON格式的思维导图数据（兼容jsMind库）
  - 生成静态PNG图片格式的思维导图
  - 生成交互式HTML格式的思维导图

## 环境要求

- Node.js >= 14.0.0
- 所需API密钥
  - BILIGPT_API_KEY：用于视频内容分析
  - DEEPSEEK_API_KEY：用于思维导图JSON生成

## 安装

```bash
# 安装依赖
pnpm install
```

## 配置

创建`.env`文件并设置必要的API密钥：

```
BILIGPT_API_KEY=your_biligpt_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```

## 使用方法

### 启动服务

```bash
# 启动MCP服务
node src/index.js
```

### 与Claude集成

要在Claude桌面版中使用此MCP服务，编辑`claude_desktop_config.json`文件：

```json
{
  "mcpServers": {
    "video-analysize": {
      "command": "node",
      "args": ["your_project_path/src/index.js"]
    }
  }
}
```

### API使用示例

#### 视频分析

```javascript
// 调用视频分析服务
const result = await videoAnalysis.analyzeVideo({
  url: "https://www.bilibili.com/video/BVxxxxxx"
});

// 返回结果包含：
// - keywords: 关键词列表
// - summary: 视频摘要
// - keyTimepoints: 关键时间点列表
```

#### 生成思维导图

```javascript
// 生成思维导图JSON
const json = await mindmap.generateMindmapJson({
  keywords: result.keywords,
  summary: result.summary,
  keyTimepoints: result.keyTimepoints
});

// 生成思维导图图片
const imagePath = await mindmap.generateMindmapImage({
  json: json,
  outputPath: "./output/mindmap.png" // 可选，指定输出路径
});

// 生成思维导图HTML
const htmlPath = await mindmap.generateMindmapHtml({
  json: json,
  outputPath: "./output/mindmap.html", // 可选，指定输出路径
  title: "视频思维导图" // 可选，指定标题
});
```

## 开发者指南

服务使用官方的Model Context Protocol SDK实现，主要组件包括：

- `src/index.js`：服务入口，使用MCP SDK创建和启动服务
- `src/services/videoAnalysis.js`：视频分析服务实现
- `src/services/mindmap.js`：思维导图生成服务实现

## 许可证

MIT