import axios from 'axios';

/**
 * 视频分析服务
 * 
 * 从视频URL中提取关键信息，包括关键词、摘要信息和关键时间点
 */
export const videoAnalysisService = {
  name: 'videoAnalysis',
  description: '视频分析服务 - 从视频中提取关键信息',
  
  /**
   * 分析视频
   * 
   * @param {Object} params 参数对象
   * @param {string} params.url 视频URL
   * @returns {Promise<Object>} 视频分析结果
   */
  async analyzeVideo(params) {
    try {
      const { url } = params;
      
      if (!url) {
        throw new Error('缺少视频URL参数');
      }
      
      // 获取API密钥
      const apiKey = process.env.BILIGPT_API_KEY;
      if (!apiKey) {
        throw new Error('未设置BILIGPT_API_KEY环境变量');
      }
      console.error(apiKey);
      
      // 发送请求到BiliGPT API
      const encodedUrl = encodeURIComponent(url);
      const response = await axios.get(
        `https://api.bibigpt.co/api/open/${apiKey}/chapter-summary?url=${encodedUrl}`,
        { method: 'GET' }
      );
      
      const data = response.data;
      console.error(data);
      
      if (!data.success) {
        throw new Error('API请求失败');
      }
      
      // 处理视频分析结果
      return processVideoAnalysisResult(data);
    } catch (error) {
      console.error('视频分析失败:', error.message);
      throw new Error(`视频分析失败: ${error.message}`);
    }
  }
};

/**
 * 处理视频分析结果
 * 
 * @param {Object} data API响应数据
 * @returns {Object} 处理后的视频分析结果
 */
function processVideoAnalysisResult(data) {
  // 提取摘要信息
  const summary = data.overallSummary || '';
  
  // 提取关键词
  const keywords = extractKeywords(summary);
  
  // 提取关键时间点及内容
  const keyTimepoints = extractKeyTimepoints(data.chapters || []);
  
  return {
    keywords,
    summary,
    keyTimepoints
  };
}

/**
 * 从摘要中提取关键词
 * 
 * @param {string} summary 摘要信息
 * @returns {Array} 关键词数组
 */
function extractKeywords(summary) {
  // 这里使用简单的方法提取关键词
  // 实际应用中可以使用更复杂的算法
  const words = summary.split(/\s+/);
  const filteredWords = words
    .filter(word => word.length > 1)
    .filter(word => !/^[,.;:!?。，、；：！？]/.test(word));
  
  // 获取出现频率较高的词作为关键词
  const wordCounts = {};
  filteredWords.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // 按出现频率排序
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0]);
  
  return sortedWords;
}

/**
 * 提取关键时间点及内容
 * 
 * @param {Array} chapters 章节数据
 * @returns {Array} 关键时间点数组
 */
function extractKeyTimepoints(chapters) {
  return chapters.map(chapter => {
    return {
      title: chapter.title || '',
      summary: chapter.summary || '',
      start: chapter.start || 0,
      end: chapter.end || 0
    };
  });
} 