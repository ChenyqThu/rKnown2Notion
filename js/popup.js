document.addEventListener('DOMContentLoaded', function() {    // 检查参数设置
    chrome.storage.sync.get(['notionToken', 'databaseId', 'apiKey'], function(items) {
        const contentDiv = document.getElementById('content');

        if (!items.notionToken || !items.databaseId || !items.apiKey) {
            // 参数未正确设置
            contentDiv.innerHTML = `
                <p class="text-base">请先前往设置进行参数配置</p>
                <button id="goToOptions" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mt-2 rounded">设置</button>
            `;

            document.getElementById('goToOptions').addEventListener('click', function() {
                chrome.runtime.openOptionsPage();
            });
        } else {
            // 参数已正确设置
            contentDiv.innerHTML = `
                <button id="syncButton" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">一键同步知识库</button>
            `;

            // 您可以在这里添加syncButton的点击事件处理逻辑
            // 一键同步知识库按钮事件
            document.getElementById('syncButton').addEventListener('click', function() {
                syncAllArticles();
            });

            function syncAllArticles() {
                chrome.storage.sync.get(['notionToken', 'databaseId', 'apiKey'], async function(items) {
                    if (items.notionToken && items.databaseId && items.apiKey) {
                        try {
                            let articles = await getAllArticlesFromReadknown(items.apiKey);
                            for (let article of articles) {
                                let notionBody = createNotionBody(article, items.databaseId);
                                // 发送请求到 Notion API（需要实现）
                                await sendToNotion(notionBody, items.notionToken);
                            }
                        } catch (error) {
                            console.error('从Readknown获取文章列表失败:', error);
                        }
                    } else {
                        alert('请先设置初始参数！');
                    }
                });
            }
        }
    });

    // 设置页脚链接
    document.getElementById('optionsLink').addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
    });

    async function getAllArticlesFromReadknown(apiKey) {
        let articles = [];
        let page = 1;
        const limit = 20;
    
        while (true) {
            const url = `https://api.readknown.cn/v1/articles?last_id=${lastId}&limit=${limit}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
    
            if (response.status !== 200) {
                console.error('Failed to fetch articles:', response.status);
                break;
            }
    
            const data = await response.json();
            if (data.code !== 0 || !data.data || data.data.length === 0) {
                break;
            }
    
            articles = articles.concat(data.data);
            lastId = data.data[data.data.length - 1].id;
    
            // Check if we received less than 'limit' articles, which means we reached the end
            if (data.data.length < limit) {
                break;
            }
        }
        console.log(articles)
        return articles;
    }
    
    

    function createNotionBody(article, databaseId) {
        // 将文章数据转换为 Notion API 所需格式的逻辑（需要实现）
    }

    async function sendToNotion(body, token) {
        // 发送数据到 Notion 的逻辑（需要实现）
        // 注意：需要处理 Notion API 的认证和请求格式
    }
    
});
