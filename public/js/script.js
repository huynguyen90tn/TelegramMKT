document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-pane');
    const textForm = document.getElementById('text-form');
    const imageForm = document.getElementById('image-form');
    const previewTextBtn = document.getElementById('preview-text-btn');
    const previewImageBtn = document.getElementById('preview-image-btn');
    const textPreview = document.getElementById('text-preview');
    const imagePreview = document.getElementById('image-preview');
    const resultDiv = document.getElementById('result');
    const groupSelect = document.getElementById('groupSelect');
    const imageGroupSelect = document.getElementById('imageGroupSelect');
    const groupList = document.getElementById('groupList');
    const addGroupBtn = document.getElementById('addGroupBtn');
    const saveGroupBtn = document.getElementById('saveGroupBtn');
    const addGroupModal = document.getElementById('addGroupModal');
    const closeButtons = document.querySelectorAll('[data-dismiss="modal"]');
    
    // Initialize the app
    init();
    
    function init() {
      // Setup tabs
      setupTabs();
      
      // Setup modals
      setupModals();
      
      // Load groups
      loadGroups();
      
      // Load bot info
      loadBotInfo();
      
      // Setup form submissions
      setupForms();
    }
    
    // Setup tabs
    function setupTabs() {
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          // Remove active class from all tabs
          tabs.forEach(t => t.classList.remove('active'));
          tabContents.forEach(c => c.classList.remove('active'));
          
          // Add active class to the clicked tab
          tab.classList.add('active');
          const targetId = tab.getAttribute('data-tab');
          document.getElementById(targetId).classList.add('active');
          
          // Hide result
          resultDiv.style.display = 'none';
        });
      });
    }
    
    // Setup modals
    function setupModals() {
      // Open add group modal
      addGroupBtn.addEventListener('click', () => {
        openModal('addGroupModal');
      });
      
      // Close modals
      closeButtons.forEach(button => {
        button.addEventListener('click', () => {
          const modal = button.closest('.modal');
          closeModal(modal.id);
        });
      });
      
      // Click outside to close
      window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
          const modal = e.target.closest('.modal');
          closeModal(modal.id);
        }
      });
      
      // Add group form submission
      saveGroupBtn.addEventListener('click', addGroup);
    }
    
    // Open modal
    function openModal(modalId) {
      const modal = document.getElementById(modalId);
      modal.classList.add('show');
    }
    
    // Close modal
    function closeModal(modalId) {
      const modal = document.getElementById(modalId);
      modal.classList.remove('show');
    }
    
    // Setup form submissions
    function setupForms() {
      // Text message form
      textForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const groupId = groupSelect.value;
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const buttonText = document.getElementById('button-text').value;
        const buttonUrl = document.getElementById('button-url').value;
        
        if (!groupId) {
          showToast('Vui lòng chọn nhóm để gửi tin nhắn', 'error');
          return;
        }
        
        const data = {
          groupId,
          title,
          content,
          buttonText,
          buttonUrl
        };
        
        // Send message
        sendTextMessage(data);
      });
      
      // Image message form
      imageForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const groupId = imageGroupSelect.value;
        const imageUrl = document.getElementById('image-url').value;
        const caption = document.getElementById('caption').value;
        const buttonText = document.getElementById('image-button-text').value;
        const buttonUrl = document.getElementById('image-button-url').value;
        
        if (!groupId) {
          showToast('Vui lòng chọn nhóm để gửi tin nhắn', 'error');
          return;
        }
        
        const data = {
          groupId,
          imageUrl,
          caption,
          buttonText,
          buttonUrl
        };
        
        // Send image
        sendImageMessage(data);
      });
      
      // Preview text message
      previewTextBtn.addEventListener('click', function() {
        const title = document.getElementById('title').value || 'Tiêu đề mẫu';
        const content = document.getElementById('content').value || 'Nội dung mẫu';
        const buttonText = document.getElementById('button-text').value;
        const buttonUrl = document.getElementById('button-url').value || '#';
        
        let previewHTML = `
          <div class="telegram-message">
            <div class="telegram-message-title">${escapeHTML(title)}</div>
            <div class="telegram-message-content">${formatMessageContent(content)}</div>
        `;
        
        if (buttonText) {
          previewHTML += `<a href="${escapeHTML(buttonUrl)}" class="telegram-button" target="_blank">${escapeHTML(buttonText)}</a>`;
        }
        
        previewHTML += `</div>`;
        
        textPreview.innerHTML = previewHTML;
        textPreview.classList.add('show');
        
        showToast('Xem trước đã được cập nhật', 'success');
      });
      
      // Preview image message
      previewImageBtn.addEventListener('click', function() {
        const imageUrl = document.getElementById('image-url').value;
        
        if (!imageUrl) {
          showToast('Vui lòng nhập URL hình ảnh để xem trước', 'error');
          return;
        }
        
        const caption = document.getElementById('caption').value || '';
        const buttonText = document.getElementById('image-button-text').value;
        const buttonUrl = document.getElementById('image-button-url').value || '#';
        
        let previewHTML = `
          <div class="telegram-message">
            <img src="${escapeHTML(imageUrl)}" alt="Preview" onerror="this.src='https://via.placeholder.com/400x300?text=Lỗi+hình+ảnh'">
        `;
        
        if (caption) {
          previewHTML += `<div class="telegram-message-content">${formatMessageContent(caption)}</div>`;
        }
        
        if (buttonText) {
          previewHTML += `<a href="${escapeHTML(buttonUrl)}" class="telegram-button" target="_blank">${escapeHTML(buttonText)}</a>`;
        }
        
        previewHTML += `</div>`;
        
        imagePreview.innerHTML = previewHTML;
        imagePreview.classList.add('show');
        
        showToast('Xem trước đã được cập nhật', 'success');
      });
    }
    
    // Load groups
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
    
    // Update groups UI
    function updateGroupsUI(groups) {
      // Clear existing options
      groupSelect.innerHTML = '<option value="">-- Chọn nhóm --</option>';
      imageGroupSelect.innerHTML = '<option value="">-- Chọn nhóm --</option>';
      
      // Clear group list
      groupList.innerHTML = '';
      
      if (groups.length === 0) {
        // Show no groups message
        groupList.innerHTML = `
          <div class="no-groups">
            Chưa có nhóm nào. Vui lòng thêm nhóm mới để bắt đầu gửi tin nhắn.
          </div>
        `;
        return;
      }
      
      // Add groups to select elements and group list
      groups.forEach(group => {
        // Add to group select
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.title;
        groupSelect.appendChild(option);
        
        // Clone for image group select
        const imageOption = option.cloneNode(true);
        imageGroupSelect.appendChild(imageOption);
        
        // Add to group list
        const groupItem = document.createElement('div');
        groupItem.className = 'group-item';
        groupItem.innerHTML = `
          <div class="group-name">${escapeHTML(group.title)}</div>
          <div class="group-id">${escapeHTML(group.id)}</div>
          <button class="btn btn-sm btn-danger delete-group" data-id="${escapeHTML(group.id)}">
            <i class="fas fa-trash"></i>
          </button>
        `;
        groupList.appendChild(groupItem);
      });
      
      // Add delete event handlers
      document.querySelectorAll('.delete-group').forEach(button => {
        button.addEventListener('click', function() {
          const groupId = this.getAttribute('data-id');
          if (confirm('Bạn có chắc chắn muốn xóa nhóm này?')) {
            deleteGroup(groupId);
          }
        });
      });
    }
    
    // Add a new group
    function addGroup() {
      const groupId = document.getElementById('groupId').value;
      const groupTitle = document.getElementById('groupTitle').value;
      
      if (!groupId) {
        showToast('Vui lòng nhập ID nhóm', 'error');
        return;
      }
      
      // Send request to add group
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
          
          // Reset form
          document.getElementById('groupId').value = '';
          document.getElementById('groupTitle').value = '';
          
          // Reload groups
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
    
    // Delete a group
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
    
    // Load bot info
    function loadBotInfo() {
      fetch('/api/bot-info')
        .then(response => response.json())
        .then(result => {
          if (result.success) {
            const botInfo = result.data;
            document.getElementById('botName').textContent = botInfo.first_name || 'Bot Telegram';
            
            // Show bot is online
            document.getElementById('botStatus').innerHTML = `
              <span class="status-indicator online"></span>
              <span class="status-text">Đang hoạt động</span>
            `;
          }
        })
        .catch(error => {
          console.error('Error loading bot info:', error);
          // Show bot is offline
          document.getElementById('botStatus').innerHTML = `
            <span class="status-indicator offline"></span>
            <span class="status-text">Không hoạt động</span>
          `;
        });
    }
    
    // Send text message
    function sendTextMessage(data) {
      fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => response.json())
      .then(result => {
        showResult(result.success, result.message);
        
        if (result.success) {
          // Reset form after successful send
          textForm.reset();
          textPreview.classList.remove('show');
        }
      })
      .catch(error => {
        console.error('Error sending message:', error);
        showResult(false, 'Lỗi khi gửi tin nhắn');
      });
    }
    
    // Send image message
    function sendImageMessage(data) {
      fetch('/api/send-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => response.json())
      .then(result => {
        showResult(result.success, result.message);
        
        if (result.success) {
          // Reset form after successful send
          imageForm.reset();
          imagePreview.classList.remove('show');
        }
      })
      .catch(error => {
        console.error('Error sending image:', error);
        showResult(false, 'Lỗi khi gửi hình ảnh');
      });
    }
    
    // Show result message
    function showResult(success, message) {
      resultDiv.className = success ? 'result success' : 'result error';
      resultDiv.textContent = message;
      resultDiv.style.display = 'block';
      
      // Scroll to result
      resultDiv.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Show toast notification
    function showToast(message, type = 'info') {
      const toastContainer = document.getElementById('toastContainer');
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = message;
      
      toastContainer.appendChild(toast);
      
      // Auto remove toast after 3 seconds
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
          toastContainer.removeChild(toast);
        }, 300);
      }, 3000);
    }
    
    // Helper function to format message content (replace newlines with <br>)
    function formatMessageContent(content) {
      return escapeHTML(content).replace(/\n/g, '<br>');
    }
    
    // Helper function to escape HTML
    function escapeHTML(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  });
  
  // Add missing CSS for status indicators
  document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
      .bot-status {
        display: flex;
        align-items: center;
        font-size: 14px;
        color: var(--text-secondary);
      }
      
      .status-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 8px;
      }
      
      .status-indicator.online {
        background-color: var(--secondary);
      }
      
      .status-indicator.offline {
        background-color: var(--danger);
      }
    `;
    document.head.appendChild(style);
  });