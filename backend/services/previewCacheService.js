const NodeCache = require("node-cache");

class PreviewCacheService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
  }

  getCacheKey(courseId, lessonId) {
    return `preview_${courseId}_${lessonId}`;
  }

  get(courseId, lessonId) {
    const key = this.getCacheKey(courseId, lessonId);
    return this.cache.get(key) || null;
  }

  set(courseId, lessonId, videoUrl) {
    const key = this.getCacheKey(courseId, lessonId);
    this.cache.set(key, videoUrl);
  }
}

module.exports = new PreviewCacheService();
