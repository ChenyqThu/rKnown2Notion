chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'SYNC_TO_NOTION') {
        // 首先从chrome.storage.sync获取所需的参数
        chrome.storage.sync.get(['notionToken', 'databaseId', 'apiKey'], function(items) {
            if (chrome.runtime.lastError || !items.notionToken || !items.databaseId || !items.apiKey) {
                // 缺失参数，发送警告消息回content.js
                chrome.tabs.sendMessage(sender.tab.id, { type: 'ERROR', message: '缺少必要的配置参数。' });
                return;
            }
            // 所有参数都存在，可以调用ReadKnown API
            getArticleFromReadknown(request.uuid, items.apiKey)
                .then(articleData => {
                    // TODO: 处理获取到的文章摘要数据，并与Notion API进行交互
                    console.log(articleData.data)
                    //
                    //已经获取到数据，接下来就是解析数据，并将其传输到Notion中，
                    //
                    //
                })
                .catch(error => {
                    console.error('Error fetching article data:', error);
                    // 可以选择发送消息回content.js处理错误
                    chrome.tabs.sendMessage(sender.tab.id, { type: 'ERROR', message: '获取文章数据失败，请检查api_key是否配置正确。' });
                });
        });
    }
    return true; // 异步响应
});

function getArticleFromReadknown(uuid, apiKey) {
    // 构建请求的API地址
    const apiURL = `https://api.readknown.cn/v1/article/info`;

    // 构建请求参数
    const params = {
        aid: uuid // 根据实际的文章链接格式修改
    };

    // 发送POST请求到ReadKnown API
    return fetch(apiURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(params)
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        return response.json();
    }).then(data => {
        // 处理返回的数据
        if (data.code !== 0) {
            throw new Error(data.message);
        }
        return data;
    });
}
