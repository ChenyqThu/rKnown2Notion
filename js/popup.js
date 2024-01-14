document.addEventListener('DOMContentLoaded', function() {    // 检查参数设置

    // 设置按钮链接
    document.getElementById('goToOptions').addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
    });

});
