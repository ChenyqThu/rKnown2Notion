//console.log("rknown2notion插件注入成功!!!");
let syncNotification = null;

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => updateButton());
} else {
    updateButton();
}

window.addEventListener('popstate', function(event) {
    updateButton();
});

const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
            updateButton();
        }
    });
});

const config = { childList: true, subtree: true };
observer.observe(document.body, config);

function updateButton() {
    setTimeout(() => {
        const targetDiv = document.querySelector('.absolute.right-4.bottom-8 .text-center.pt-2.flex');
        if (targetDiv) {
            let newSvg = document.getElementById('sync2notion');
            let tooltipSpan = document.getElementById('sync2notionTooltip');

            if (!newSvg) {
                // 创建一个新的SVG元素
                newSvg = createSvg('text-xl text-primary cursor-pointer mr-2','sync2notion', handleSvgButtonClick);
                targetDiv.insertBefore(newSvg, targetDiv.firstChild);
                // 创建工具提示元素
                const tooltipSpan = document.createElement('span');
                tooltipSpan.textContent = "同步到Notion";
                tooltipSpan.setAttribute('class', 'tooltip-text bg-primary text-white text-xs rounded py-1 px-2 shadow-md absolute hidden');
                tooltipSpan.setAttribute('id', 'sync2notionTooltip');
                tooltipSpan.style.left = '-50%'; 
                tooltipSpan.style.top = '-80%'; 

                // 添加 hover 事件
                newSvg.addEventListener('mouseover', () => {
                    tooltipSpan.classList.remove('hidden');
                });
                newSvg.addEventListener('mouseout', () => {
                    tooltipSpan.classList.add('hidden');
                });
                targetDiv.insertBefore(tooltipSpan, newSvg.nextSibling);
            }

            const uuid = getUuidFromUrl();
            chrome.storage.sync.get({syncedArticles: []}, function(result) {
                const syncedArticles = new Set(result.syncedArticles);
                if (syncedArticles.has(uuid)) {
                    //console.log('文章已同步过');
                    // 如果这篇文章已经同步，更改按钮的图标或添加标记
                    newSvg.classList.replace('text-primary', 'text-gray-300');
                    tooltipSpan.textContent = "已同步Notion";
                } else {
                    //console.log('文章未同步');
                    // 如果文章未同步，确保使用原始颜色
                    newSvg.classList.replace('text-gray-300', 'text-primary');
                    tooltipSpan.textContent = "同步到Notion";
                }
            });

        }

        const targetElement = document.querySelector('.flex.items-center.px-4 h1.font-primary.font-bold.py-4');
        if (targetElement && targetElement.textContent === '知识库') {
            let syncButton = document.getElementById('syncButton');
            // 创建同步按钮
            if (!syncButton){
                const syncButton = document.createElement('button');
                const buttonText = document.createTextNode('同步知识库');
                syncButton.appendChild(buttonText);
                const svg = createSvg('text-xl text-white ml-1');
                syncButton.appendChild(svg);
                syncButton.className = 'mr-4 bg-primary text-white font-bold py-2 px-3 rounded flex';
                syncButton.id = 'syncButton';

                // 为按钮添加点击事件
                syncButton.addEventListener('click', syncNotion);

                // 将按钮添加到页面中
                targetElement.parentNode.appendChild(syncButton);
            }
            
        }
    }, 100); 
}

// 这是同步知识库按钮点击时的处理函数
function syncNotion() {
    // 发送消息到后台脚本以开始同步过程
    chrome.runtime.sendMessage({ type: 'startSync' });
    // 修改按钮的状态
    const syncButton = document.getElementById('syncButton');
    syncButton.textContent = '🔄 同步中...';
    syncButton.classList.replace('bg-primary', 'bg-slate-300');
    syncButton.disabled = true;
}

function createSvg(style, id = null, func = null){
    const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    newSvg.setAttribute('stroke','currentColor');
    newSvg.setAttribute('fill','currentColor');
    newSvg.setAttribute('stroke-width','0');
    newSvg.setAttribute('viewBox', '0 0 1024 1024');
    newSvg.setAttribute('class', style)
    newSvg.setAttribute('width', '0.9em');
    newSvg.setAttribute('height', '0.9em');
    if (id) {
        newSvg.setAttribute('id',id);
    }
    if (func){
        newSvg.addEventListener('click', func);
    }
    newSvg.innerHTML = '<path d="M647.165837 2.332635L78.85493 44.179432C33.04873 48.138835 17.074585 78.005024 17.074585 113.810318v621.148461c0 27.886487 9.966774 51.745305 33.893858 83.625329l133.595729 173.189762c21.947382 27.886487 41.88093 33.859725 83.795993 31.880024l659.957441-39.832963c55.807107-3.959403 71.781251-29.866189 71.781251-73.658555V211.361824c0-22.630038-8.976923-29.1494-35.3957-48.468558a1594.683818 1594.683818 0 0 1-4.505528-3.276748L778.781865 32.198823C734.8871 0.387066 716.967387-3.640603 647.165837 2.332635zM283.310326 199.92734c-53.895671 3.618075-66.115209 4.437262-96.732319-20.377274l-77.822755-61.712079c-7.918807-7.987072-3.925271-17.953846 15.974144-19.933548l546.363525-39.79883c45.840333-3.993536 69.767417 11.946476 87.721263 25.872653l93.728634 67.71945c3.993536 1.979702 13.926177 13.892044 1.979702 13.892044l-564.249106 33.859725-6.963088 0.477859zM220.471864 904.189138V310.961297c0-25.906785 7.952939-37.853261 31.880024-39.867096l648.010965-37.819128c21.981515-1.979702 31.948289 11.946476 31.948289 37.819128v589.268439c0 25.906785-3.993536 47.820035-39.935361 49.799736l-620.090346 35.839427c-35.873559 1.979702-51.813571-9.932641-51.813571-41.812665z m612.171539-561.416084c3.959403 17.919713 0 35.839427-17.987979 37.887394l-29.900321 5.904972v437.991926c-25.940918 13.926177-49.833869 21.879117-69.767417 21.879116-31.914156 0-39.935361-9.966774-63.828313-39.79883l-195.444339-306.580694v296.613921l61.84861 13.96031s0 35.839427-49.902135 35.839426l-137.555132 7.95294c-3.959403-7.987072 0-27.886487 13.994443-31.845891l35.839426-9.932641v-392.185725l-49.833869-4.027669c-3.959403-17.919713 5.973238-43.792366 33.92799-45.772068l147.55604-9.966773 203.397279 310.608363v-274.768937l-51.881837-5.939105c-3.959403-21.947382 11.946476-37.853261 31.914156-39.832962l137.623398-7.987073z"></path>';
    return newSvg
}

// 这是SVG按钮点击时的处理函数
function handleSvgButtonClick() {
    const uuid = getUuidFromUrl();
    if (uuid) {
        // 显示悬浮提示
        showFloatingNotification("🔄 正在同步Notion...");
        // 发送消息到后台脚本
        chrome.runtime.sendMessage({ type: 'SYNC_TO_NOTION', uuid: uuid }, function(response) {
            // 根据后台脚本的响应更新提示
            // ...
        });
    } else {
        console.error('No UUID found to sync.');
    }
}

function showFloatingNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    // 设置样式
    notification.style.position = 'fixed';
    notification.style.top = '20px'; // 从顶部20px的位置开始显示
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = 'white'; // 背景颜色改为白色
    notification.style.color = 'black'; // 文字颜色改为黑色
    notification.style.padding = '10px 20px'; // 内部填充
    notification.style.borderRadius = '5px'; // 圆角
    notification.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'; // 阴影效果
    notification.style.zIndex = '1000'; // 确保在最顶层
    notification.style.fontSize = '16px'; // 字体大小
    notification.style.fontWeight = 'bold'; // 字体加粗
    notification.style.border = '1px solid #ddd'; // 边框颜色

    // 自动消失
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000); // 3秒后消失

    document.body.appendChild(notification);
}

function getUuidFromUrl() {
    const regex = /dashboard\/a\/([0-9a-fA-F-]+)/;
    const match = window.location.href.match(regex);
    return match ? match[1] : null;
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type === 'SYNC') {
        // 显示或更新同步状态
        showSyncNotification("🔄 " + message.message);
    } else if (message.type === 'SYNC SUCC' || message.type === 'SYNC FAIL') {
        // 关闭同步浮窗
        showSyncNotification("", true);
        // 显示同步完成的提示
        showFloatingNotification(message.message);
        // 更新并恢复同步按钮状态
        setTimeout(updateButton, 1000);
        const syncButton = document.getElementById('syncButton');
        if (syncButton) {
            syncButton.textContent = '同步知识库';
            const svg = createSvg('text-xl text-white ml-1');
            syncButton.appendChild(svg);
            syncButton.disabled = false;
            syncButton.classList.replace('bg-slate-300','bg-primary');
        }
    } else 
    if (message.type === 'ERROR') {
        // 显示错误提示
        showFloatingNotification("❌ " + message.message);
    } else if (message.type === 'INFO') {
        // 显示信息提示
        showFloatingNotification("✅ " + message.message);
        //console.log('成功后更新按钮状态！')
        setTimeout(updateButton, 1000);
    }
});

function showSyncNotification(message, shouldClose = false) {
    if (shouldClose && syncNotification) {
        // 如果需要关闭浮窗且浮窗存在
        document.body.removeChild(syncNotification);
        syncNotification = null;
        return;
    }
    if (!syncNotification) {
        // 如果同步浮窗不存在，则创建一个
        syncNotification = document.createElement("div");
        syncNotification.style.position = "fixed";
        syncNotification.style.top = "10px";
        syncNotification.style.right = "10px";
        syncNotification.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        syncNotification.style.color = "white";
        syncNotification.style.padding = "10px";
        syncNotification.style.borderRadius = "5px";
        syncNotification.style.zIndex = "1000";
        document.body.appendChild(syncNotification);
    } 
    // 更新浮窗内容
    syncNotification.textContent = message;

    // 设置超时以移除浮窗
    clearTimeout(syncNotification.timeout);
    syncNotification.timeout = setTimeout(() => {
        if (syncNotification){
            document.body.removeChild(syncNotification);
        }
        // 恢复同步按钮状态
        const syncButton = document.getElementById('syncButton');
        if (syncButton) {
            syncButton.textContent = '同步知识库';
            const svg = createSvg('text-xl text-white ml-1');
            syncButton.appendChild(svg);
            syncButton.disabled = false;
            syncButton.classList.replace('bg-slate-300','bg-primary');
        }
        syncNotification = null;
    }, 10000); // 10秒后自动移除浮窗
}
