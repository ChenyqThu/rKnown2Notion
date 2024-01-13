chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === "install") {
        // 这表示这是扩展的首次安装
        // 打开选项页面
        chrome.runtime.openOptionsPage();
    }
});

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
                    const notionBody = createNotionBody(articleData.data, items.databaseId);
                    const content = getContent(articleData.data);

                    createPageInNotion(items.notionToken, notionBody, content, sender.tab.id, request.uuid)
                })
                .catch(error => {
                    console.error('获取文章数据失败:', error);
                    chrome.tabs.sendMessage(sender.tab.id, { type: 'ERROR', message: '获取文章数据失败，请检查api_key是否配置正确。' });
                });
        });
    }
    return true; // 异步响应
});

function createPageInNotion(nToken, notionBody, blocks, tabId, uuid) {
    const options = {
        method: 'POST',
        headers: {
            Authorization: "Bearer " + nToken,
            "Notion-Version": "2022-06-28",
            "Content-Type": 'application/json'  
        },
        body: JSON.stringify(notionBody)
    }

    console.log(notionBody)
        
    fetch("https://api.notion.com/v1/pages", options)
    .then(response => response.json())
    .then(async (response) => {
        if (response.object === "error") {
            if (response.status === 404) {
                console.log("页面未找到，请确认Database ID正确，并且已经在connections中添加了对应token的应用的权限。");
                chrome.tabs.sendMessage(tabId, { type: 'ERROR', message: '页面未找到，请确认Database ID正确，并且已经在connections中添加了对应token的应用的权限。' });
            } else {
                console.log("error创建notion页面出错!" + response.message);
                chrome.tabs.sendMessage(tabId, { type: 'ERROR', message: '创建Notion页面出错，请检查Database字段是否正确。' });
            }
            return false;
        } else {
            //chrome.tabs.sendMessage(sender.tab.id, { type: 'INFO', message: '成功创建Notion页面！' });
            console.log("成功创建Notion页面!,响应：",response)
            const pageId = response.id;
            const batchSize = 100;
            console.log(pageId)
            for (let i = 0; i < blocks.length; i += batchSize) {
                let batch = blocks.slice(i, i + batchSize);
                console.log("正在添加blocks批次:", i / batchSize + 1);
                try {
                    const batchResponse = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${nToken}`,
                            'Notion-Version': '2022-06-28',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ "children": batch })
                    });
                    
                    const batchResponseData = await batchResponse.json(); // 解析响应数据
                    if (!batchResponse.ok) {
                        console.log("向页面添加内容出错!", batchResponseData);
                        chrome.tabs.sendMessage(tabId, { type: 'ERROR', message: '向页面添加内容时出错！' });
                    }
        
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch (error) {
                    console.error("Notion 连接异常！添加blocks时出错:", error);
                    chrome.tabs.sendMessage(tabId, { type: 'ERROR', message: '向页面添加内容时出错, Notion连接异常！' });
                }
            }
            chrome.tabs.sendMessage(tabId, { type: 'INFO', message: '成功同步到Notion页面！' });
            saveSyncedArticle(uuid); //保存该UUID
            return true;
        }
    })
    .catch(error => {
        console.error('请求Notion API时出错:', error);
        chrome.tabs.sendMessage(tabId, { type: 'ERROR', message: '请求Notion API时出错！' });
        return false; // 处理网络请求错误
    });;
}

function saveSyncedArticle(uuid) {
    chrome.storage.local.get({syncedArticles: []}, function(result) {
        const syncedArticles = new Set(result.syncedArticles);
        syncedArticles.add(uuid);
        chrome.storage.local.set({syncedArticles: Array.from(syncedArticles)});
    });
}

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

function createNotionBody(data, databaseId) {
    // 确认data是对象
    if (typeof data !== 'object' || data === null) {
        throw new Error("Data should be an object.");
    }

    // 确认data包含必要的键
    const requiredKeys = ['id', 'aid', 'read_time', 'created_at', 'link', 'title', 'author', 'words_count', 'one_word', 'category', 'tags', 'is_collect', 'thumb', 'source'];
    requiredKeys.forEach(key => {
        if (!(key in data)) {
            throw new Error(`Key '${key}' is missing in data.`);
        }
    });

    // 构建Notion页面数据结构
    // 注意：这里的实现取决于您的Notion数据库结构和字段
    // 下面的代码仅为示例，可能需要根据您的具体情况调整
    const notionBody = {
        // ...构建Notion页面所需的数据结构...
        "icon":{'type':'external','external':{'url':'https://www.notion.so/icons/'+'document_gray.svg'}},
        "parent":{'type':'database_id','database_id':databaseId},
        "properties":{
            "ID":{'number':data['id']},
            "aID":{"rich_text": [{"type": "text","text": {"content": data['aid'] }}]},
            "创建时间":{'date':{'start':new Date(data['created_at'] * 1000).toISOString()}},
            "链接":{'url':data['link']},
            "标题":{'title':[{'type':'text','text':{'content':data['title']}}]},
            "作者":{ "rich_text": [{"type": "text","text": {"content": data['author'] }}]},
            "文章字数":{'number':data['words_count']},
            "阅读时间":{ "rich_text": [{"type": "text","text": {"content": data['read_time'] }}]},
            "一句话总结":{ "rich_text": [{"type": "text","text": {"content": data['one_word'] }}]},
            "类别":{'type':'select','select':{'name':data['category']}},
            "标签":{'type':'multi_select','multi_select': data['tags'].map(tag => ({ name: tag }))},
            "星标":{'checkbox':Boolean(data['is_collect'])},
            "封面":{"files":[{"name":"testname","type":"external","external":{"url":data['thumb'].replace('?wx_fmt=','.') }}]},
            "文章来源":{'type':'select','select':{'name':data['source']}}, 
        }
    };
    return notionBody;
}

function getContent(data) {
    if (typeof data !== 'object' || data === null) {
        throw new Error("Data should be an object.");
    }

    // 初始化内容数组
    const content = [
        {
            "type": "callout",
            "callout": {
                "rich_text": [{"type": "text","text": {"content": "AI总结","link": null}}],
                "icon": {"emoji": "⚛️"},
                "color": "blue_background"
             }
        },
        {
            type: "quote",
            quote: {
                rich_text: [{ type: "text", text: { content: "一句话总结" } }],
                color: "default"
            }
        },
        {
            type: 'paragraph',
            paragraph: {
                rich_text: [{ type: 'text', text: { content: data['one_word'] } }]
            }
        }
    ];

    // 添加关键信息点和推荐语
    if (data['key_points']) {
        content.push({
            type: "quote",
            quote: {
                rich_text: [{ type: "text", text: { content: "关键信息点" } }],
                color: "default"
            }
        });
        content.push(...data['key_points'].map(point => ({
            type: "numbered_list_item",
            numbered_list_item: {
                rich_text: [{ type: "text", text: { content: point } }]
            }
        })));
    }

    if (data['recommendations']) {
        content.push({
            type: "quote",
            quote: {
                rich_text: [{ type: "text", text: { content: "推荐语" } }],
                color: "default"
            }
        });
        content.push(...data['recommendations'].map(rec => ({
            type: "bulleted_list_item",
            bulleted_list_item: {
                rich_text: [{ type: "text", text: { content: rec } }]
            }
        })));
    }

    // 添加摘要卡片（图文）
    if (data['post_url']) {
        content.push({
            type: "toggle",
            toggle: {
                rich_text: [{ type: "text", text: { content: "摘要卡片（图文）" } }],
                children: [{
                    type: "image",
                    image: {
                        type: "external",
                        external: { url: data['post_url'] }
                    }
                }]
            }
        });
    }

    // 添加文章来源
    content.push({
        type: "paragraph",
        paragraph: {
            rich_text: [
                { type: "text", text: { content: "内容来源：" } },
                {
                    type: "text",
                    text: {
                        content: data['source'],
                        link: { url: data['link'] }
                    }
                }
            ]
        }
    });

    // 添加分割线
    content.push({ type: "divider", divider: {} });

    // 添加文章结构化导读和Markdown转换的Notion块
    if (data['toc']) {
        content.push(
            {
                "type": "callout",
                "callout": {
                    "rich_text": [{"type": "text","text": {"content": "文章结构化导读","link": null}}],
                    "icon": {"emoji": "📄"},
                    "color": "blue_background"
                 }
            });
        // 假设 markdownToBlocks 是一个将Markdown文本转换为Notion块的函数
        const markdownBlocks = markdownToBlocks(data['toc']);
        content.push(...markdownBlocks);
    }
    
    // 添加分割线
    content.push({ type: "divider", divider: {} });
    
    // 处理问答对
    if (data['questions']) {
        content.push({
            "type": "callout",
            "callout": {
                "rich_text": [{"type": "text","text": {"content": "文章结构化导读","link": null}}],
                "icon": {"emoji": "💬"},
                "color": "blue_background"
             }
        });
    
        data['questions'].forEach(qa => {
            const question = qa['question'] || '';
            const answer = qa['answer'] || '';
    
            content.push({
                type: "toggle",
                toggle: {
                    rich_text: [{ type: "text", text: { content: question } }],
                    children: [
                        {
                            type: "paragraph",
                            paragraph: {
                                rich_text: [{ type: "text", text: { content: answer } }]
                            }
                        }
                    ]
                }
            });
        });
    }
    
    // 添加引导提问
    if (data['curious']) {
        data['curious'].forEach(question => {
            content.push({
                type: "bulleted_list_item",
                bulleted_list_item: {
                    rich_text: [{ type: "text", text: { content: question } }]
                }
            });
        });
    }
    
    return content;
}

function markdownToBlocks(markdownText) {
    // 将 Markdown 分割成行并处理每一行
    var lines = markdownText.split('\n');
    var notionBlocks = [];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.startsWith('# ')) {  // 一级标题
            notionBlocks.push({"type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": line.slice(2)}}]}});
        } else if (line.startsWith('## ')) {  // 二级标题
            notionBlocks.push({"type": "heading_3", "heading_3": {"rich_text": [{"type": "text", "text": {"content": line.slice(3)}}]}});
        } else if (line.startsWith('### ')) {  // 三级标题
            notionBlocks.push({"type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": line.slice(4)}}]}});
        } else if (line.startsWith('- ')) {  // 无序列表
            notionBlocks.push({"type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [{"type": "text", "text": {"content": line.slice(2)}}]}});
        } else if (/\[.+\]\(.+\)/.test(line)) {  // 链接
            var matches = line.match(/\[(.+)\]\((.+)\)/);
            var text = matches[1];
            var url = matches[2];
            notionBlocks.push({"type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": text, "link": {"url": url}}}]}});
        } else if (line) {  // 普通段落
            notionBlocks.push({"type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": line}}]}});
        }
    }

    return notionBlocks;
}