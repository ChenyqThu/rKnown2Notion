document.addEventListener('DOMContentLoaded', function() {
    const settingsSection = document.querySelector('.settings');
    const actionsSection = document.querySelector('.actions');
    const saveBtn = document.getElementById('saveBtn');
    const syncAllBtn = document.getElementById('syncAll');
    const syncCurrentBtn = document.getElementById('syncCurrent');
    const settingsBtn = document.getElementById('settingsBtn');

    // 检查是否已存储初始参数
    chrome.storage.sync.get(['notionToken', 'databaseId', 'apiKey'], function(items) {
        if (items.notionToken && items.databaseId && items.apiKey) {
            // 如果已设置，显示功能页面
            settingsSection.style.display = 'none';
            actionsSection.style.display = 'block';
        } else {
            // 如果未设置，显示设置页面
            settingsSection.style.display = 'block';
            actionsSection.style.display = 'none';
        }
    });

    // 检查是否readknown摘要文章页面，并获取文章uuid
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var urlPattern = new RegExp('https://readknown.cn/dashboard/.*');
        if (!urlPattern.test(tabs[0].url)) {
            syncCurrentBtn.setAttribute("disabled", true);
            syncCurrentBtn.style.backgroundColor = "#cecece";
        } else {
            chrome.tabs.sendMessage(tabs[0].id, { message: "GetUUID" }, function(response) {
                let articleUuid = response.articleUuid;
                // 这里可以根据articleUuid做后续处理
                // 例如显示信息，或者其他操作
                console.log(articleUuid); // 仅作为示例
            });
        }
    });
    // 保存按钮的点击事件
    saveBtn.addEventListener('click', function() {
        const notionToken = document.getElementById('notionToken').value;
        const databaseId = document.getElementById('databaseId').value;
        const apiKey = document.getElementById('apiKey').value;

        let isValid = true;

        // 清除旧的错误消息
        document.getElementById('notionTokenError').textContent = '';
        document.getElementById('databaseIdError').textContent = '';
        document.getElementById('apiKeyError').textContent = '';

        // Notion Token 非空校验
        if (!notionToken) {
            document.getElementById('notionTokenError').textContent = 'Notion Token 是必填的';
            isValid = false;
        }

        // Database ID 非空校验
        if (!databaseId) {
            document.getElementById('databaseIdError').textContent = 'Database ID 是必填的';
            isValid = false;
        }

        // API Key 非空校验
        if (!apiKey) {
            document.getElementById('apiKeyError').textContent = 'ReadKnown API Key 是必填的';
            isValid = false;
        }

        if (isValid) {
            // 保存设置
            chrome.storage.sync.set({
                notionToken: notionToken,
                databaseId: databaseId,
                apiKey: apiKey
            }, function() {
                // 更新界面
                settingsSection.style.display = 'none';
                actionsSection.style.display = 'block';
            });
        }
    });


    // 添加其他按钮的事件监听器
    // 设置按钮事件
    settingsBtn.addEventListener('click', function() {
        // 显示设置界面，隐藏功能界面
        chrome.storage.sync.get(['notionToken', 'databaseId', 'apiKey'], function(items) {
            document.getElementById('notionToken').value = items.notionToken || '';
            document.getElementById('databaseId').value = items.databaseId || '';
            document.getElementById('apiKey').value = items.apiKey || '';
            settingsSection.style.display = 'block';
            actionsSection.style.display = 'none';
        });
    });

    // 返回按钮事件
    document.getElementById('cancelBtn').addEventListener('click', function() {
        // 清除错误消息
        document.getElementById('notionTokenError').textContent = '';
        document.getElementById('databaseIdError').textContent = '';
        document.getElementById('apiKeyError').textContent = '';
        // 放弃更改，返回功能页面
        settingsSection.style.display = 'none';
        actionsSection.style.display = 'block';
    });
    // ...
    // 这里您可以添加调用后端服务的逻辑，比如同步文章到 Notion

    // 一键同步知识库按钮事件
    syncAllBtn.addEventListener('click', function() {
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
                    console.error('Error syncing articles:', error);
                }
            } else {
                alert('请先设置初始参数！');
            }
        });
    }

    async function getAllArticlesFromReadknown(apiKey) {
        let articles = [];
        let lastId = 0;
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


// let send2Notion = document.getElementById("post")
// var book = {};
// chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     var url = new RegExp('https://book.douban.com/subject/.*?/');
//     if(url.test(tabs[0].url)=== false){
//         send2Notion.setAttribute("disabled", true);
//         send2Notion.style.backgroundColor = "#cecece";
//     }
//     else {
//         chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//             chrome.tabs.sendMessage(tabs[0].id, {message: "Preview"}, function(response) {
//                 book = response.book;
//                 book["豆瓣链接"] = tabs[0].url;
//                 showPreview(book)
//             });
//           });
//     }
// });

// send2Notion.addEventListener("click", ()=>{
//     send2Notion.style.backgroundColor = "#3264B7";
//     send2Notion.setAttribute("disabled", true);
//     createItem(book)
// });

// function showPreview(book) {

//     // preTitle
//     var preTitle= document.getElementById("pretitle");
//     var title = document.createElement("p");
//     title.setAttribute("id","preTitle");
//     title.innerText = book['title'];
//     preTitle.appendChild(title);
    
//     // preCover
//     var preCover= document.getElementById("cover");
//     var cover = document.createElement("img");
//     cover.setAttribute("src",book["封面"]);
//     preCover.appendChild(cover);

//     var pre = document.getElementById("pre");
//     var preInfos = ["作者","评分","出版社","出版年","页数","ISBN"]
//     for(let info of preInfos){
//         var p = document.createElement("p");
//         p.innerText = info + ":" + book[info];
//         pre.appendChild(p);
//     }
//     // pre.appendChild(document.createElement("hr"));

// }

// function createItem(book) {
//     let options, body;
//     chrome.storage.local.get("databaseID", (data)=> {
//         body = {
//             "parent": { "type": "database_id", "database_id": data.databaseID },
//             "properties": {
//                 "书名": {
//                     "type": "title",
//                     "title": [{ "type": "text", "text": { "content": book["title"] } }]
//                 },
//                 "豆瓣链接": {
//                     "url": book["豆瓣链接"]
//                 },
//                 "ISBN": {
//                     "type": "rich_text",
//                     "rich_text": [{ "type": "text", "text": { "content": book["ISBN"] } }]
//                 },
//                 "页数": {
//                     "number": parseInt(book["页数"])
//                 },
//                 "出版社": {
//                     "type": "rich_text",
//                     "rich_text": [{ "type": "text", "text": { "content": book["出版社"] } }]
//                 },
//                 "出版年月": {
//                     "type": "rich_text",
//                     "rich_text": [{ "type": "text", "text": { "content": book["出版年"] } }]
//                 },
//                 "评分": {
//                     "number": parseFloat(book["评分"])
//                 },
//                 "作者": {
//                     "type": "rich_text",
//                     "rich_text": [{ "type": "text", "text": { "content": book["作者"]} }]
//                 },
//                 "封面": {
//                     "files": [
//                         {
//                             "type": "external",
//                             "name": "cover",
//                             "external": { "url": book["封面"]}
//                         }
//                     ]
//                 },
//             },
//         };
//         chrome.storage.local.get("nToken", (data)=> {
//             options = {
//                 method: 'POST',
//                 headers: {
//                     Authorization: "Bearer " + data.nToken,
//                     "Notion-Version": "2022-02-22",
//                     "Content-Type": 'application/json'
//                 },
//                 body: JSON.stringify(body)
//             }
        
//             fetch("https://api.notion.com/v1/pages",options)
//             .then((response) => { return response.json() })
//             .then((response) => {
//                 if (response.object === "error") {
//                     alert(response.message);
//                     return false;
//                 } else {
//                     alert("书籍信息保存到Notion!")
//                     return true;
//                 }
//             })
//             .then(()=>{
//                 send2Notion.style.backgroundColor = "#cecece";
//             });
//         });
//     });

// }

