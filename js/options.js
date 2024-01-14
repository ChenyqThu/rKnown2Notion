document.addEventListener('DOMContentLoaded', function() {
    // 给眼睛图标添加点击事件
    document.getElementById('toggleNotionTokenVisibility').addEventListener('click', function() {
        togglePasswordVisibility('notionToken', 'notionEyeIcon');
    });

    document.getElementById('toggleapiKeyVisibility').addEventListener('click', function() {
        togglePasswordVisibility('apiKey', 'apiKeyEyeIcon');
    });


    // 保存按钮
    document.getElementById('saveBtn').addEventListener('click', saveOptions);
    // 重置按钮
    document.getElementById('resetBtn').addEventListener('click', resetOptions);

    // 恢复选项
    restoreOptions();
});

function togglePasswordVisibility(fieldId, iconId) {
    var field = document.getElementById(fieldId);
    var icon = document.getElementById(iconId);
    var fieldType = field.getAttribute("type");

    if (fieldType === "password") {
        field.setAttribute("type", "text");
        // 更新为眼睛关闭图标
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/>';
    } else {
        field.setAttribute("type", "password");
        // 更新为眼睛打开图标
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>';
    }
}


function validateInput() {
    let isValid = true;

    // Validate Notion Token
    const notionTokenInput = document.getElementById('notionToken');
    const notionTokenError = document.getElementById('notionTokenError');
    if (!notionTokenInput.value.startsWith('secret_')) {
        notionTokenError.style.display = 'block';
        isValid = false;
    } else {
        notionTokenError.style.display = 'none';
    }

    // Validate DatabaseId
    const databaseIdInput = document.getElementById('databaseId');
    const databaseIdError = document.getElementById('databaseIdError');
    const databaseIdRegex = /^[a-zA-Z0-9]{32}$/;

    if (!databaseIdRegex.test(databaseIdInput.value)) {
        databaseIdError.style.display = 'block';
        isValid = false;
    } else {
        databaseIdError.style.display = 'none';
    }


    // Validate ReadKnown apiKey
    const apiKeyInput = document.getElementById('apiKey');
    const apiKeyError = document.getElementById('apiKeyError');
    if (!apiKeyInput.value.startsWith('osk-')) {
        apiKeyError.style.display = 'block';
        isValid = false;
    } else {
        apiKeyError.style.display = 'none';
    }

    return isValid;
}

function restoreOptions() {
    // 使用浏览器的存储API读取数据
    chrome.storage.sync.get({
        notionToken: '',
        databaseId: '',
        apiKey: ''
    }, function(items) {
        // 设置输入框的值
        document.getElementById('notionToken').value = items.notionToken;
        document.getElementById('databaseId').value = items.databaseId;
        document.getElementById('apiKey').value = items.apiKey;
    });
}

function saveOptions() {
    if (!validateInput()) {
        console.log('Validation failed. Options not saved.');
        return; // 校验失败时，停止执行后续的保存操作
    }

    // 获取输入框的值
    var notionToken = document.getElementById('notionToken').value;
    var databaseId = document.getElementById('databaseId').value;
    var apiKey = document.getElementById('apiKey').value;

    // 使用浏览器的存储API保存数据
    chrome.storage.sync.set({
        notionToken: notionToken,
        databaseId: databaseId,
        apiKey: apiKey
    }, function() {
        // 显示浮窗提示
        showAlert('✅ 保存成功！');

        // 可选：几秒后自动隐藏提示
        setTimeout(function() {
            hideAlert();
        }, 3000);
    });
}

function resetOptions() {
    // 使用浏览器的存储API重置数据
    chrome.storage.sync.set({
        notionToken: '',
        databaseId: '',
        apiKey: '',
        syncedArticles:[]
    }, function() {
        // 显示浮窗提示
        showAlert('✅ 重置成功！');

        // 可选：几秒后自动隐藏提示
        setTimeout(function() {
            hideAlert();
        }, 2000);

        // 重置输入框的值
        document.getElementById('notionToken').value = '';
        document.getElementById('databaseId').value = '';
        document.getElementById('apiKey').value = '';
    });
}


function showAlert(message) {
    const alertBox = document.getElementById('alertBox');
    alertBox.textContent = message;
    alertBox.classList.remove('hidden');
}

function hideAlert() {
    const alertBox = document.getElementById('alertBox');
    alertBox.classList.add('hidden');
}