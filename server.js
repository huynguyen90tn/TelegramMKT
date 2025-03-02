require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');

// Cấu hình
const token = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;

// Khởi tạo bot Telegram
const bot = new TelegramBot(token, { polling: true });

// File lưu trữ danh sách nhóm
const groupsFilePath = path.join(__dirname, 'groups.json');

// Khởi tạo ứng dụng Express
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Hàm đọc danh sách nhóm
function getGroups() {
  if (!fs.existsSync(groupsFilePath)) {
    // Tạo file mặc định nếu chưa tồn tại
    const initialGroups = [];
    fs.writeFileSync(groupsFilePath, JSON.stringify(initialGroups, null, 2));
    return initialGroups;
  }
  
  const data = fs.readFileSync(groupsFilePath, 'utf8');
  return JSON.parse(data);
}

// Hàm lưu danh sách nhóm
function saveGroups(groups) {
  fs.writeFileSync(groupsFilePath, JSON.stringify(groups, null, 2));
}

// Định tuyến cơ bản
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API để lấy thông tin bot
app.get('/api/bot-info', (req, res) => {
  bot.getMe()
    .then(info => {
      res.json({ success: true, data: info });
    })
    .catch(error => {
      res.status(500).json({ success: false, message: error.message });
    });
});

// API để lấy danh sách nhóm
app.get('/api/groups', (req, res) => {
  try {
    const groups = getGroups();
    res.json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API để thêm nhóm mới
app.post('/api/groups', (req, res) => {
  try {
    const { groupId, groupTitle } = req.body;
    
    if (!groupId) {
      return res.status(400).json({ success: false, message: 'ID nhóm là bắt buộc' });
    }
    
    const groups = getGroups();
    
    // Kiểm tra nhóm đã tồn tại
    const existingGroup = groups.find(group => group.id === groupId);
    if (existingGroup) {
      return res.status(400).json({ success: false, message: 'Nhóm này đã được thêm vào danh sách' });
    }
    
    // Kiểm tra thông tin nhóm qua Telegram API
    bot.getChat(groupId)
      .then(chatInfo => {
        // Thêm nhóm mới
        groups.push({
          id: groupId,
          title: groupTitle || chatInfo.title || `Nhóm ${groupId}`,
          isActive: true
        });
        
        // Lưu danh sách
        saveGroups(groups);
        
        res.json({ 
          success: true, 
          message: 'Đã thêm nhóm thành công', 
          data: groups 
        });
      })
      .catch(error => {
        res.status(400).json({ 
          success: false, 
          message: `Không thể kết nối với nhóm: ${error.message}. Vui lòng đảm bảo bot đã được thêm vào nhóm.` 
        });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API để xóa nhóm
app.delete('/api/groups/:groupId', (req, res) => {
  try {
    const { groupId } = req.params;
    let groups = getGroups();
    
    const initialLength = groups.length;
    groups = groups.filter(group => group.id !== groupId);
    
    if (groups.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhóm' });
    }
    
    saveGroups(groups);
    res.json({ success: true, message: 'Đã xóa nhóm thành công', data: groups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API để gửi tin nhắn văn bản với nút
app.post('/api/send-message', (req, res) => {
  const { groupId, title, content, buttonText, buttonUrl } = req.body;
  
  // Kiểm tra dữ liệu đầu vào
  if (!groupId || !title || !content) {
    return res.status(400).json({ 
      success: false, 
      message: 'Vui lòng điền đầy đủ thông tin: nhóm, tiêu đề và nội dung' 
    });
  }
  
  // URL mặc định nếu không được cung cấp
  const url = buttonUrl || 'https://t.me/';
  
  // Cấu hình nút nếu được cung cấp
  const options = {
    parse_mode: 'HTML'
  };
  
  if (buttonText) {
    options.reply_markup = {
      inline_keyboard: [
        [
          {
            text: buttonText,
            url: url
          }
        ]
      ]
    };
  }
  
  // Gửi tin nhắn đến nhóm Telegram
  bot.sendMessage(groupId, `<b>${title}</b>\n\n${content}`, options)
    .then(() => {
      res.json({ success: true, message: `Tin nhắn đã được gửi thành công đến nhóm!` });
    })
    .catch((error) => {
      console.error('Lỗi khi gửi tin nhắn:', error);
      res.status(500).json({ success: false, message: `Lỗi: ${error.message}` });
    });
});

// API để gửi hình ảnh với nút
app.post('/api/send-image', (req, res) => {
  const { groupId, imageUrl, caption, buttonText, buttonUrl } = req.body;
  
  // Kiểm tra dữ liệu đầu vào
  if (!groupId || !imageUrl) {
    return res.status(400).json({ 
      success: false, 
      message: 'Vui lòng điền đầy đủ thông tin: nhóm và URL hình ảnh' 
    });
  }
  
  // URL mặc định nếu không được cung cấp
  const url = buttonUrl || 'https://t.me/';
  
  // Cấu hình nút nếu được cung cấp
  const options = {
    parse_mode: 'HTML',
    caption: caption || ''
  };
  
  if (buttonText) {
    options.reply_markup = {
      inline_keyboard: [
        [
          {
            text: buttonText,
            url: url
          }
        ]
      ]
    };
  }
  
  // Gửi hình ảnh đến nhóm Telegram
  bot.sendPhoto(groupId, imageUrl, options)
    .then(() => {
      res.json({ success: true, message: `Hình ảnh đã được gửi thành công đến nhóm!` });
    })
    .catch((error) => {
      console.error('Lỗi khi gửi hình ảnh:', error);
      res.status(500).json({ success: false, message: `Lỗi: ${error.message}` });
    });
});

// Lắng nghe sự kiện bot được thêm vào chat mới
bot.on('message', (msg) => {
  if (msg.new_chat_members && msg.new_chat_members.some(member => member.id === bot.botInfo.id)) {
    console.log(`Bot đã được thêm vào nhóm: ${msg.chat.title} (ID: ${msg.chat.id})`);
  }
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});