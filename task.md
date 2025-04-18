[中文](#chinese) | [English](#english)

<a name="chinese"></a>
## 中文版本

# 需求
---

1. 帮我分析这个[视频](https://www.bilibili.com/video/BV1RrZHYqEvm/?spm_id_from=333.1007.tianma.5-4-18.click&vd_source=e708021282dc99e56579d60ed1e204a8)
2. 保存分析结果到当前目录下的outputs目录下
    - 保存的filePath是当前目录下的outputs目录
    - **不能是MCP服务的当前运行路径**
3. 分析结果包括：
    - 1. 先分析视频，生成视频总结json[analyzeVideo]
        - **需保证视频总结json的video_summary.json格式正确**
        - 保存到当前目录下的outputs目录下 (outputs/video_summary.json)
        - **JSON格式要求：**
          - 确保JSON结构完整，不被截断
          - 使用正确的缩进格式（可使用Tab缩进）
          - 正确处理内部引号（如需在字符串中包含引号，应使用适当的转义或替换为单引号）
          - 使用JSON.stringify()确保格式有效
          - 写入文件前验证JSON结构的有效性
          - keywords字段应为数组格式，内容应合理切分
    - 2. 再根据视频总结json生成思维导图json[generateMindmapJson]
        - **需保证思维导图json的mindmap.json格式正确**
        - 保存到当前目录下的outputs目录下 (outputs/mindmap.json)
    - 3. 再根据思维导图json生成思维导图html[generateMindmapHtml]
        - 保存到当前目录下的outputs目录下 (outputs/mindmap.html)

---

<a name="english"></a>
## English Version

# Requirements
---

1. Analyze this [video](https://www.bilibili.com/video/BV1RrZHYqEvm/?spm_id_from=333.1007.tianma.5-4-18.click&vd_source=e708021282dc99e56579d60ed1e204a8)
2. Save the analysis results to the `outputs` directory under the current directory
    - The `filePath` for saving should be the `outputs` directory under the current directory
    - **Must not be the current running path of the MCP service**
3. The analysis results should include:
    - 1. First, analyze the video to generate a video summary JSON [analyzeVideo]
        - **Ensure the format of the video summary JSON (`video_summary.json`) is correct**
        - Save to the `outputs` directory under the current directory (`outputs/video_summary.json`)
        - **JSON Format Requirements:**
          - Ensure the JSON structure is complete and not truncated
          - Use correct indentation format (Tab indentation can be used)
          - Handle internal quotes correctly (if quotes need to be included in a string, use appropriate escaping or replace with single quotes)
          - Use `JSON.stringify()` to ensure the format is valid
          - Validate the JSON structure's validity before writing to the file
          - The `keywords` field should be an array format, and the content should be reasonably segmented
    - 2. Then, generate the mind map JSON based on the video summary JSON [generateMindmapJson]
        - **Ensure the format of the mind map JSON (`mindmap.json`) is correct**
        - Save to the `outputs` directory under the current directory (`outputs/mindmap.json`)
    - 3. Then, generate the mind map HTML based on the mind map JSON [generateMindmapHtml]
        - Save to the `outputs` directory under the current directory (`outputs/mindmap.html`)
