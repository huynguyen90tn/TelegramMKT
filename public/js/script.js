document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const navItems = document.querySelectorAll('.nav-item[data-tab]');
  const contentSections = document.querySelectorAll('.content-section');
  const messageForm = document.getElementById('message-form');
  const previewBtn = document.getElementById('preview-btn');
  const messagePreview = document.getElementById('message-preview');
  const resultDiv = document.getElementById('result');
  const groupList = document.getElementById('groupList');
  const groupsListDisplay = document.getElementById('groupsListDisplay');
  const scheduledMessages = document.getElementById('scheduledMessages');
  const addGroupBtn = document.getElementById('addGroupBtn');
  const addGroupBtnAlt = document.getElementById('addGroupBtnAlt');
  const saveGroupBtn = document.getElementById('saveGroupBtn');
  const addGroupModal = document.getElementById('addGroupModal');
  const closeButtons = document.querySelectorAll('[data-dismiss="modal"]');
  const scheduleTypeInputs = document.querySelectorAll('input[name="scheduleType"]');
  const scheduleOptions = document.getElementById('scheduleOptions');
  
  // Khởi tạo ứng dụng
  init();
  
  function init() {
    // Thiết lập điều hướng
    setupNavigation();
    
    // Thiết lập modal
    setupModals();
    
    // Thiết lập tùy chọn lên lịch
    setupScheduleOptions();
    
    // Tải danh sách nhóm
    loadGroups();
    
    // Tải thông tin bot
    loadBotInfo();
    
    // Tải tin nhắn đã lên lịch
    loadScheduledMessages();
    
    // Thiết lập form gửi tin nhắn
    setupForm();
  }
  
  // Thiết lập điều hướng
  function setupNavigation() {
    navItems.forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Xóa lớp active từ tất cả các tab và nội dung
        navItems.forEach(nav => nav.classList.remove('active'));
        contentSections.forEach(section => section.classList.remove('active'));
        
        // Thêm lớp active cho tab được chọn
        this.classList.add('active');
        
        // Hiển thị nội dung tương ứng
        const tabId = this.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
      });
    });
  }
  
  // Thiết lập modal
  function setupModals() {
    // Mở modal thêm nhóm
    addGroupBtn.addEventListener('click', () => {
      openModal('addGroupModal');
    });
    
    if (addGroupBtnAlt) {
      addGroupBtnAlt.addEventListener('click', () => {
        openModal('addGroupModal');
      });
    }
    
    // Đóng modal
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        closeModal(modal.id);
      });
    });
    
    // Click bên ngoài để đóng
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        const modal = e.target.closest('.modal');
        closeModal(modal.id);
      }
    });
    
    // Xử lý form thêm nhóm
    saveGroupBtn.addEventListener('click', addGroup);
  }
  
  // Thiết lập tùy chọn lên lịch
  function setupScheduleOptions() {
    scheduleTypeInputs.forEach(input => {
      input.addEventListener('change', () => {
        if (input.value === 'scheduled') {
          scheduleOptions.style.display = 'block';
          
          // Đặt thời gian mặc định là 30 phút từ bây giờ
          const now = new Date();
          now.setMinutes(now.getMinutes() + 30);
          document.getElementById('scheduleTime').value = formatDateTimeLocal(now);
          document.getElementById('scheduleTime').min = formatDateTimeLocal(new Date());
        } else {
          scheduleOptions.style.display = 'none';
        }
      });
    });
  }
  
  // Mở modal
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
  }
  
  // Đóng modal
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
  }
  
  // Thiết lập form gửi tin nhắn
  function setupForm() {
    // Form gửi tin nhắn
    messageForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Lấy tất cả các nhóm được chọn
      const selectedGroups = getSelectedGroups();
      
      if (selectedGroups.length === 0) {
        showToast('Vui lòng chọn ít nhất một nhóm để gửi tin nhắn', 'error');
        return;
      }
      
      const title = document.getElementById('title').value;
      const content = document.getElementById('content').value;
      const imageUrl = document.getElementById('image-url').value;
      const buttonText = document.getElementById('button-text').value;
      const buttonUrl = document.getElementById('button-url').value;
      const isScheduled = document.querySelector('input[name="scheduleType"]:checked').value === 'scheduled';
      
      // Tạo dữ liệu gửi đi
      const messageData = {
        id: Date.now().toString(),
        selectedGroups: selectedGroups,
        title: title,
        content: content,
        imageUrl: imageUrl || '',
        buttonText: buttonText || '',
        buttonUrl: buttonUrl || ''
      };
      
      if (isScheduled) {
        const scheduleTime = document.getElementById('scheduleTime').value;
        const scheduledTime = new Date(scheduleTime);
        const now = new Date();
        
        if (scheduledTime <= now) {
          showToast('Thời gian lên lịch phải ở tương lai', 'error');
          return;
        }
        
        messageData.scheduleTime = scheduleTime;
        
        // Lưu tin nhắn đã lên lịch
        saveScheduledMessage(messageData);
      } else {
        // Gửi tin nhắn ngay lập tức
        sendMessage(messageData);
      }
    });
    
    // Nút xem trước tin nhắn
    previewBtn.addEventListener('click', function() {
      const title = document.getElementById('title').value || 'Tiêu đề mẫu';
      const content = document.getElementById('content').value || 'Nội dung mẫu';
      const imageUrl = document.getElementById('image-url').value || '';
      const buttonText = document.getElementById('button-text').value || '';
      const buttonUrl = document.getElementById('button-url').value || '#';
      
      let previewHTML = `
        <div class="telegram-message">
      `;
      
      if (imageUrl) {
        previewHTML += `<img src="${escapeHTML(imageUrl)}" alt="Preview" onerror="this.src='https://via.placeholder.com/400x300?text=Lỗi+hình+ảnh'">`;
      }
      
      previewHTML += `
          <div class="telegram-message-title">${escapeHTML(title)}</div>
          <div class="telegram-message-content">${formatMessageContent(content)}</div>
      `;
      
      if (buttonText) {
        previewHTML += `<a href="${escapeHTML(buttonUrl)}" class="telegram-button" target="_blank">${escapeHTML(buttonText)}</a>`;
      }
      
      previewHTML += `</div>`;
      
      messagePreview.innerHTML = previewHTML;
      messagePreview.classList.add('show');
      
      showToast('Xem trước đã được cập nhật', 'success');
    });
  }
  
  // Tải danh sách nhóm
  function loadGroups() {
    fetch('/api/groups')
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          updateGroupsUI(result.data);
        } else {
          showToast('Không thể tải danh sách nhóm: ' + result.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error loading groups:', error);
        showToast('Lỗi khi tải danh sách nhóm', 'error');
      });
  }
  
  // Tải tin nhắn đã lên lịch
  function loadScheduledMessages() {
    // Lấy dữ liệu từ localStorage
    const storedMessages = JSON.parse(localStorage.getItem('scheduled_messages') || '[]');
    
    // Cập nhật giao diện
    updateScheduledMessagesUI(storedMessages);
    
    // Kiểm tra và gửi tin nhắn đã đến thời gian
    checkScheduledMessages();
  }
  
  // Cập nhật giao diện danh sách nhóm
  function updateGroupsUI(groups) {
    // Xóa danh sách nhóm hiện tại
    groupList.innerHTML = '';
    groupsListDisplay.innerHTML = '';
    
    if (groups.length === 0) {
      // Hiển thị thông báo không có nhóm
      groupList.innerHTML = `
        <div class="no-groups">
          Chưa có nhóm nào. Vui lòng thêm nhóm mới để bắt đầu gửi tin nhắn.
        </div>
      `;
      
      groupsListDisplay.innerHTML = `
        <div class="no-groups">
          Chưa có nhóm nào. Vui lòng thêm nhóm mới.
        </div>
      `;
      return;
    }
    
    // Thêm nhóm vào danh sách để chọn
    groups.forEach(group => {
      // Thêm vào danh sách chọn nhóm
      const groupItem = document.createElement('div');
      groupItem.className = 'group-item';
      groupItem.innerHTML = `
        <input type="checkbox" class="group-checkbox" id="group-${group.id}" value="${group.id}" data-name="${escapeHTML(group.title)}">
        <label for="group-${group.id}" class="group-name">${escapeHTML(group.title)}</label>
        <span class="group-id">${escapeHTML(group.id)}</span>
      `;
      groupList.appendChild(groupItem);
      
      // Thêm vào danh sách hiển thị nhóm
      const groupDisplayItem = document.createElement('div');
      groupDisplayItem.className = 'group-item';
      groupDisplayItem.innerHTML = `
        <div class="group-name">${escapeHTML(group.title)}</div>
        <div class="group-id">${escapeHTML(group.id)}</div>
        <button class="delete-group" data-id="${escapeHTML(group.id)}">
          <i class="fas fa-trash"></i>
        </button>
      `;
      groupsListDisplay.appendChild(groupDisplayItem);
    });
    
    // Thêm sự kiện xóa nhóm
    document.querySelectorAll('.delete-group').forEach(button => {
      button.addEventListener('click', function() {
        const groupId = this.getAttribute('data-id');
        if (confirm('Bạn có chắc chắn muốn xóa nhóm này?')) {
          deleteGroup(groupId);
        }
      });
    });
  }
  
  // Cập nhật giao diện tin nhắn đã lên lịch
  function updateScheduledMessagesUI(messages) {
    scheduledMessages.innerHTML = '';
    
    if (messages.length === 0) {
      scheduledMessages.innerHTML = `
        <div class="no-scheduled-messages">
          Chưa có tin nhắn nào được lên lịch.
        </div>
      `;
      return;
    }
    
    // Sắp xếp tin nhắn theo thời gian
    messages.sort((a, b) => new Date(a.scheduleTime) - new Date(b.scheduleTime));
    
    // Hiển thị danh sách tin nhắn đã lên lịch
    messages.forEach(message => {
      const scheduledItem = document.createElement('div');
      scheduledItem.className = 'scheduled-item';
      
      const groupNames = message.selectedGroups.map(groupId => {
        const checkbox = document.querySelector(`.group-checkbox[value="${groupId}"]`);
        return checkbox ? checkbox.getAttribute('data-name') : groupId;
      });
      
      scheduledItem.innerHTML = `
        <div class="scheduled-time">${formatDateTime(new Date(message.scheduleTime))}</div>
        <div class="scheduled-info">
          <div class="scheduled-title">${escapeHTML(message.title)}</div>
          <div class="scheduled-content">${escapeHTML(message.content.substr(0, 100))}${message.content.length > 100 ? '...' : ''}</div>
          <div class="scheduled-groups">Đến ${message.selectedGroups.length} nhóm: ${escapeHTML(groupNames.join(', '))}</div>
        </div>
        <div class="scheduled-actions">
          <button class="scheduled-action delete" data-id="${message.id}" title="Xóa tin nhắn này">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      
      scheduledMessages.appendChild(scheduledItem);
    });
    
    // Thêm sự kiện xóa tin nhắn đã lên lịch
    document.querySelectorAll('.scheduled-action.delete').forEach(button => {
      button.addEventListener('click', function() {
        const messageId = this.getAttribute('data-id');
        if (confirm('Bạn có chắc chắn muốn xóa tin nhắn đã lên lịch này?')) {
          deleteScheduledMessage(messageId);
        }
      });
    });
  }
  
  // Lấy danh sách nhóm đã chọn
  function getSelectedGroups() {
    const checkboxes = document.querySelectorAll('.group-checkbox:checked');
    return Array.from(checkboxes).map(checkbox => checkbox.value);
  }
  
  // Thêm nhóm mới
  function addGroup() {
    const groupId = document.getElementById('groupId').value;
    const groupTitle = document.getElementById('groupTitle').value;
    
    if (!groupId) {
      showToast('Vui lòng nhập ID nhóm', 'error');
      return;
    }
    
    // Gửi yêu cầu thêm nhóm
    fetch('/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        groupId,
        groupTitle
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        showToast(result.message, 'success');
        closeModal('addGroupModal');
        
        // Làm mới form
        document.getElementById('groupId').value = '';
        document.getElementById('groupTitle').value = '';
        
        // Tải lại danh sách nhóm
        loadGroups();
      } else {
        showToast(result.message, 'error');
      }
    })
    .catch(error => {
      console.error('Error adding group:', error);
      showToast('Lỗi khi thêm nhóm mới', 'error');
    });
  }
  
  // Xóa nhóm
  function deleteGroup(groupId) {
    fetch(`/api/groups/${groupId}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        showToast(result.message, 'success');
        loadGroups();
      } else {
        showToast(result.message, 'error');
      }
    })
    .catch(error => {
      console.error('Error deleting group:', error);
      showToast('Lỗi khi xóa nhóm', 'error');
    });
  }
  
  // Lưu tin nhắn đã lên lịch
  function saveScheduledMessage(messageData) {
    // Lấy tin nhắn đã lên lịch hiện có
    const messages = JSON.parse(localStorage.getItem('scheduled_messages') || '[]');
    
    // Thêm tin nhắn mới
    messages.push(messageData);
    
    // Lưu lại vào localStorage
    localStorage.setItem('scheduled_messages', JSON.stringify(messages));
    
    // Cập nhật giao diện
    updateScheduledMessagesUI(messages);
    
    // Thông báo
    showToast('Tin nhắn đã được lên lịch thành công', 'success');
    
    // Làm mới form
    resetForm();
    
    // Chuyển đến tab lịch trình
    const scheduledTab = document.querySelector('.nav-item[data-tab="scheduled-section"]');
    scheduledTab.click();
  }
  
  // Xóa tin nhắn đã lên lịch
  function deleteScheduledMessage(messageId) {
    // Lấy tin nhắn đã lên lịch hiện có
    let messages = JSON.parse(localStorage.getItem('scheduled_messages') || '[]');
    
    // Lọc ra tin nhắn cần xóa
    messages = messages.filter(message => message.id !== messageId);
    
    // Lưu lại vào localStorage
    localStorage.setItem('scheduled_messages', JSON.stringify(messages));
    
    // Cập nhật giao diện
    updateScheduledMessagesUI(messages);
    
    // Thông báo
    showToast('Đã xóa tin nhắn đã lên lịch', 'success');
  }
  
  // Kiểm tra và gửi tin nhắn đã đến thời gian
  function checkScheduledMessages() {
    // Lấy tin nhắn đã lên lịch hiện có
    let messages = JSON.parse(localStorage.getItem('scheduled_messages') || '[]');
    const now = new Date();
    const messagesToSend = [];
    const remainingMessages = [];
    
    // Phân loại tin nhắn
    messages.forEach(message => {
      const scheduleTime = new Date(message.scheduleTime);
      
      if (scheduleTime <= now) {
        messagesToSend.push(message);
      } else {
        remainingMessages.push(message);
      }
    });
    
    // Cập nhật danh sách tin nhắn
    if (messagesToSend.length > 0) {
      localStorage.setItem('scheduled_messages', JSON.stringify(remainingMessages));
      updateScheduledMessagesUI(remainingMessages);
      
      // Gửi từng tin nhắn
      messagesToSend.forEach(message => {
        sendMessage(message);
      });
    }
    
    // Đặt lịch kiểm tra tiếp theo sau 1 phút
    setTimeout(checkScheduledMessages, 60000);
  }
  
  // Tải thông tin bot
  function loadBotInfo() {
    fetch('/api/bot-info')
      .then(response => response.json())
      .then(result => {
        if (result.success) {
          const botInfo = result.data;
          document.getElementById('botName').textContent = botInfo.first_name || 'Bot Telegram';
          
          // Hiển thị bot đang hoạt động
          document.getElementById('botStatus').innerHTML = `
            <span class="status-indicator online"></span>
            <span class="status-text">Đang hoạt động</span>
          `;
        }
      })
      .catch(error => {
        console.error('Error loading bot info:', error);
        // Hiển thị bot không hoạt động
        document.getElementById('botStatus').innerHTML = `
          <span class="status-indicator offline"></span>
          <span class="status-text">Không hoạt động</span>
        `;
      });
  }
  
  // Gửi tin nhắn
  function sendMessage(data) {
    const isImageMessage = data.imageUrl ? true : false;
    const endpoint = isImageMessage ? '/api/send-image' : '/api/send-message';
    
    // Tạo mảng promise cho mỗi nhóm đã chọn
    const sendPromises = data.selectedGroups.map(groupId => {
      // Chuẩn bị dữ liệu cho mỗi nhóm
      const messageData = {
        groupId: groupId,
        title: data.title,
        content: data.content,
        buttonText: data.buttonText,
        buttonUrl: data.buttonUrl
      };
      
      // Thêm URL hình ảnh nếu có
      if (isImageMessage) {
        messageData.imageUrl = data.imageUrl;
        messageData.caption = data.content;
        delete messageData.content;
      }
      
      // Gửi yêu cầu API
      return fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      })
      .then(response => response.json());
    });
    
    // Xử lý tất cả các promise
    Promise.all(sendPromises)
      .then(results => {
        // Đếm số lượng gửi thành công và thất bại
        const success = results.filter(result => result.success).length;
        const failed = results.length - success;
        
        if (failed === 0) {
          showResult(true, `Đã gửi tin nhắn thành công đến ${success} nhóm.`);
        } else if (success === 0) {
          showResult(false, `Không thể gửi tin nhắn đến ${failed} nhóm.`);
        } else {
          showResult(true, `Đã gửi tin nhắn thành công đến ${success} nhóm. Thất bại: ${failed} nhóm.`);
        }
        
        // Làm mới form nếu có ít nhất một tin nhắn được gửi thành công
        if (success > 0) {
          resetForm();
        }
      })
      .catch(error => {
        console.error('Error sending messages:', error);
        showResult(false, 'Lỗi khi gửi tin nhắn');
      });
  }
  
  // Hiển thị kết quả
  function showResult(success, message) {
    resultDiv.className = success ? 'result success' : 'result error';
    resultDiv.textContent = message;
    resultDiv.style.display = 'block';
    
    // Cuộn đến kết quả
    resultDiv.scrollIntoView({ behavior: 'smooth' });
  }
  
  // Làm mới form
  function resetForm() {
    messageForm.reset();
    messagePreview.classList.remove('show');
    scheduleOptions.style.display = 'none';
    
    // Bỏ chọn tất cả các nhóm
    document.querySelectorAll('.group-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
  }
  
  // Hiển thị thông báo toast
  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Tự động xóa toast sau 3 giây
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toastContainer.removeChild(toast);
      }, 300);
    }, 3000);
  }
  
  // Định dạng date-time cho input datetime-local
  function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  
  // Định dạng date-time hiển thị
  function formatDateTime(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month} ${hours}:${minutes}`;
  }
  
  // Hàm hỗ trợ định dạng nội dung tin nhắn (thay thế xuống dòng bằng <br>)
  function formatMessageContent(content) {
    return escapeHTML(content).replace(/\n/g, '<br>');
  }
  
  // Hàm hỗ trợ thoát HTML
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});