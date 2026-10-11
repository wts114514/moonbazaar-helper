# MoonBazaar Helper API 文档

所有接口基础地址：`https://api.moonbazaar.de5.net`

**注意**：写接口需要 HMAC-SHA256 签名，签名算法未开源。

---

## 系统类

### GET /api/version

返回最新版本信息。

**响应**

```json
{
  "version": "1.0.5",
  "downloadUrl": "https://github.com/.../releases/latest",
  "proxyUrl": "https://gh-proxy.com/..."
}
GET /api/config
返回云端配置（公告、赞助者、功能开关、minVersion）。

响应

json
{
  "config": {
    "announcement": { "text": "...", "enabled": true },
    "sponsorList": [{ "name": "xxx", "level": "gold" }],
    "minVersion": "1.0.0",
    "dailySecret": "xxx",
    "serverTime": 1234567890
  }
}
卡密类
POST /api/activate
激活卡密。

请求体

json
{ "code": "MB-PRO-XXXX-XXXX", "deviceId": "dev_xxxxx" }
响应

json
{ "success": true, "level": "pro", "message": "激活成功" }
POST /api/check
检查激活状态。

请求体

json
{ "deviceId": "dev_xxxxx" }
响应

json
{ "activated": true, "level": "pro", "cached": false }
AI 类
POST /api/ai
AI 代理请求（内置模式）。

请求体

json
{
  "deviceId": "dev_xxxxx",
  "prompt": "问题内容",
  "systemPrompt": "人设",
  "model": "glm-4-flash",
  "provider": "zhipu"
}
响应

json
{
  "content": "AI 回答",
  "used": 1,
  "limit": 3,
  "isPro": false,
  "provider": "zhipu",
  "model": "glm-4-flash"
}
GET /api/ai/usage?deviceId=xxx
查询今日 AI 用量。

GET /api/ai/providers
返回已配置的 AI 提供商列表。

问卷 / 被踢 / 回声洞 / 举报 / 成就 / GC
接口	方法	用途
/api/survey/upload	POST	上传问卷答案
/api/survey/lookup?code=xxx	GET	查询问卷答案
/api/survey/kickout	POST	上传被踢位置
/api/survey/kickout-list?code=xxx	GET	查询被踢记录
/api/survey/kickout-stats?code=xxx	GET	被踢概率统计
/api/attention/upload	POST	上传注意力题
/api/attention/lookup?q=xxx	GET	查询注意力题
/api/echo/list	GET	回声洞列表
/api/echo/post	POST	发布留言
/api/report	POST	举报
/api/achievements	GET	用户成就
/api/achievements/unlock	POST	解锁成就
/api/gc/record	POST	记录余额
/api/gc/history?deviceId=xxx&days=30	GET	GC 历史
详细结构见源码中的 worker-demo.js。

后台管理类
所有 /api/admin/* 接口需要 ADMIN_TOKEN。

GET /api/admin/stats — 用户统计

GET /api/admin/licenses — 卡密列表

POST /api/admin/unbind-device — 解绑设备

POST /api/admin/generate — 生成卡密

GET /api/admin/crashes — 崩溃日志

GET /api/admin/feedback — 用户反馈

POST /api/admin/set-config — 修改配置

POST /api/admin/clear-cache — 清 KV 缓存

签名机制
所有 POST 请求需要以下头：

头	说明
X-Timestamp	毫秒时间戳
X-Nonce	16 字节随机 hex
X-Signature	HMAC-SHA256 签名
签名算法未开源。