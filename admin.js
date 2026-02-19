document.addEventListener('DOMContentLoaded', function() {
    // Пароль для админ-панели (по умолчанию: admin123)
    const ADMIN_PASSWORD = 'admin123';
    const LEADS_STORAGE_KEY = 'partnerLeadsList';
    
    // Элементы
    const loginScreen = document.getElementById('loginScreen');
    const adminContent = document.getElementById('adminContent');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    // Проверка авторизации при загрузке
    checkAuth();
    
    // Форма входа
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = document.getElementById('adminPassword').value;
        
        if (password === ADMIN_PASSWORD) {
            // Сохраняем время входа
            localStorage.setItem('adminLastLogin', new Date().toLocaleString('ru-RU'));
            localStorage.setItem('adminLoggedIn', 'true');
            
            // Показываем админ-панель
            showAdminPanel();
        } else {
            showNotification('Неверный пароль', 'error');
        }
    });
    
    // Выход из админ-панели
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('adminLoggedIn');
        showLoginScreen();
    });
    
    // Обновление данных
    refreshBtn.addEventListener('click', function() {
        loadLeads();
        showNotification('Данные обновлены');
    });
    
    // Экспорт данных
    exportBtn.addEventListener('click', function() {
        exportToExcel();
    });
    
    // Загрузка заявок
    function loadLeads() {
        let leads = JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY)) || [];
        
        // Если старый формат, конвертируем
        if (leads.length === 0) {
            const oldBookings = JSON.parse(localStorage.getItem('partnerBookings')) || [];
            const oldLeads = JSON.parse(localStorage.getItem('partnerLeads')) || [];
            leads = [...oldBookings, ...oldLeads];
            
            // Сохраняем в новом формате
            localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
        }
        
        const tableBody = document.getElementById('bookingsTableBody');
        
        // Очищаем таблицу
        tableBody.innerHTML = '';
        
        // Фильтры
        const filterService = document.getElementById('filterService')?.value || '';
        const filterDate = document.getElementById('filterDate')?.value || '';
        const filterStatus = document.getElementById('filterStatus')?.value || '';
        
        // Применяем фильтры
        let filteredLeads = leads;
        
        if (filterService) {
            filteredLeads = filteredLeads.filter(l => 
                l.service && l.service.includes(filterService)
            );
        }
        
        if (filterDate) {
            filteredLeads = filteredLeads.filter(l => {
                const leadDate = l.timestamp ? 
                    new Date(l.timestamp).toISOString().split('T')[0] : 
                    new Date(l.date).toISOString().split('T')[0];
                return leadDate === filterDate;
            });
        }
        
        if (filterStatus) {
            filteredLeads = filteredLeads.filter(l => 
                (l.status || 'Новая') === filterStatus
            );
        }
        
        // Сортируем по дате (новые сверху)
        filteredLeads.sort((a, b) => {
            const dateA = a.timestamp ? new Date(a.timestamp) : new Date(a.date);
            const dateB = b.timestamp ? new Date(b.timestamp) : new Date(b.date);
            return dateB - dateA;
        });
        
        // Обновляем счетчики
        document.getElementById('shownCount').textContent = filteredLeads.length;
        document.getElementById('totalCount').textContent = leads.length;
        
        // Заполняем таблицу
        if (filteredLeads.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="7" style="text-align: center; padding: 40px; color: #a0aec0;">
                <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 16px; display: block;"></i>
                Нет заявок
            </td>`;
            tableBody.appendChild(emptyRow);
        } else {
            filteredLeads.forEach(lead => {
                const row = document.createElement('tr');
                
                // Форматируем дату
                let formattedDate = '';
                if (lead.timestamp) {
                    const date = new Date(lead.timestamp);
                    formattedDate = date.toLocaleDateString('ru-RU') + ' ' + 
                                   date.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
                } else if (lead.date) {
                    formattedDate = lead.date;
                }
                
                // Получаем статус
                const status = lead.status || 'Новая';
                const statusClass = getStatusClass(status);
                
                // Получаем услугу
                const service = lead.service || lead.serviceText || 'Не указана';
                
                // Получаем телефон
                const phone = lead.phone || '—';
                
                // Получаем комментарий
                const comment = lead.comment || '—';
                
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${lead.name || '—'}</td>
                    <td>${phone}</td>
                    <td>${service}</td>
                    <td><span class="status ${statusClass}">${status}</span></td>
                    <td class="comment-cell" title="${comment}">${comment.substring(0, 30)}${comment.length > 30 ? '...' : ''}</td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn" onclick="changeStatus(${lead.id}, 'Подтверждена')" title="Подтвердить">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="action-btn" onclick="changeStatus(${lead.id}, 'Выполнена')" title="Выполнена">
                                <i class="fas fa-flag-checkered"></i>
                            </button>
                            <button class="action-btn" onclick="changeStatus(${lead.id}, 'Отменена')" title="Отменить">
                                <i class="fas fa-times"></i>
                            </button>
                            <button class="action-btn" onclick="deleteLead(${lead.id})" title="Удалить">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        }
        
        // Обновляем статистику
        updateStatistics(leads);
    }
    
    // Получить класс статуса
    function getStatusClass(status) {
        const classes = {
            'Новая': 'status-new',
            'Подтверждена': 'status-confirmed',
            'Выполнена': 'status-completed',
            'Отменена': 'status-cancelled'
        };
        return classes[status] || 'status-new';
    }
    
    // Обновление статистики
    function updateStatistics(leads) {
        // Всего заявок
        document.getElementById('totalClients').textContent = leads.length;
        
        // Заявки сегодня
        const today = new Date().toLocaleDateString('ru-RU');
        const todayLeads = leads.filter(l => {
            if (l.timestamp) {
                const leadDate = new Date(l.timestamp).toLocaleDateString('ru-RU');
                return leadDate === today;
            } else if (l.date) {
                return l.date.includes(today);
            }
            return false;
        });
        document.getElementById('todayBookings').textContent = todayLeads.length;
        
        // Популярная услуга
        if (leads.length > 0) {
            const serviceCounts = {};
            leads.forEach(lead => {
                const service = lead.service || lead.serviceText || 'Не указана';
                serviceCounts[service] = (serviceCounts[service] || 0) + 1;
            });
            
            let popularService = '—';
            let maxCount = 0;
            
            Object.entries(serviceCounts).forEach(([service, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    popularService = service;
                }
            });
            
            document.getElementById('popularService').textContent = popularService;
        }
        
        // Последний вход
        const lastLogin = localStorage.getItem('adminLastLogin');
        if (lastLogin) {
            document.getElementById('lastLogin').textContent = lastLogin;
        }
    }
    
    // Экспорт в Excel
    function exportToExcel() {
        const leads = JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY)) || [];
        
        if (leads.length === 0) {
            showNotification('Нет данных для экспорта', 'error');
            return;
        }
        
        // Создаем CSV
        let csv = 'Дата,Имя,Телефон,Услуга,Комментарий,Статус\n';
        
        leads.forEach(lead => {
            let date = '';
            if (lead.timestamp) {
                date = new Date(lead.timestamp).toLocaleString('ru-RU');
            } else if (lead.date) {
                date = lead.date;
            }
            
            const name = lead.name || '';
            const phone = lead.phone || '';
            const service = (lead.service || lead.serviceText || '').replace(/,/g, ';');
            const comment = (lead.comment || '').replace(/,/g, ';');
            const status = lead.status || 'Новая';
            
            csv += `"${date}","${name}","${phone}","${service}","${comment}","${status}"\n`;
        });
        
        // Создаем и скачиваем файл
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `заявки_партнер_${new Date().toLocaleDateString('ru-RU')}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Данные экспортированы в CSV');
    }
    
    // Глобальные функции для кнопок в таблице
    window.changeStatus = function(id, newStatus) {
        let leads = JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY)) || [];
        const index = leads.findIndex(l => l.id === id);
        
        if (index !== -1) {
            leads[index].status = newStatus;
            localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
            loadLeads();
            showNotification(`Статус изменен на "${newStatus}"`);
        }
    };
    
    window.deleteLead = function(id) {
        if (confirm('Вы уверены, что хотите удалить эту заявку?')) {
            let leads = JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY)) || [];
            leads = leads.filter(l => l.id !== id);
            localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
            loadLeads();
            showNotification('Заявка удалена');
        }
    };
    
    // Проверка авторизации
    function checkAuth() {
        const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        
        if (isLoggedIn) {
            showAdminPanel();
        } else {
            showLoginScreen();
        }
    }
    
    // Показать админ-панель
    function showAdminPanel() {
        loginScreen.style.display = 'none';
        adminContent.style.display = 'block';
        loadLeads();
        
        // Настройка фильтров
        const filterService = document.getElementById('filterService');
        const filterDate = document.getElementById('filterDate');
        const filterStatus = document.getElementById('filterStatus');
        
        if (filterService) {
            filterService.addEventListener('change', loadLeads);
        }
        if (filterDate) {
            filterDate.addEventListener('change', loadLeads);
        }
        if (filterStatus) {
            filterStatus.addEventListener('change', loadLeads);
        }
        
        // Настройка смены пароля
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const newPass = document.getElementById('newPassword').value;
                const confirmPass = document.getElementById('confirmPassword').value;
                
                if (newPass !== confirmPass) {
                    showNotification('Пароли не совпадают', 'error');
                    return;
                }
                
                if (newPass.length < 6) {
                    showNotification('Пароль должен быть не менее 6 символов', 'error');
                    return;
                }
                
                // В реальном проекте здесь был бы запрос к серверу
                // Сохраняем в localStorage (только для демонстрации)
                localStorage.setItem('adminPassword', newPass);
                showNotification('Пароль успешно изменен');
                this.reset();
            });
        }
        
        // Настройка уведомлений
        const emailNotifications = document.getElementById('emailNotifications');
        const smsNotifications = document.getElementById('smsNotifications');
        
        if (emailNotifications) {
            emailNotifications.addEventListener('change', function() {
                localStorage.setItem('emailNotifications', this.checked);
            });
            emailNotifications.checked = localStorage.getItem('emailNotifications') !== 'false';
        }
        
        if (smsNotifications) {
            smsNotifications.addEventListener('change', function() {
                localStorage.setItem('smsNotifications', this.checked);
            });
            smsNotifications.checked = localStorage.getItem('smsNotifications') !== 'false';
        }
        
        // Backup данных
        const backupBtn = document.getElementById('backupBtn');
        if (backupBtn) {
            backupBtn.addEventListener('click', function() {
                const leads = JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY)) || [];
                const backup = {
                    timestamp: new Date().toISOString(),
                    data: leads,
                    version: '1.0'
                };
                
                const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                
                link.setAttribute('href', url);
                link.setAttribute('download', `backup_${new Date().toLocaleDateString('ru-RU')}.json`);
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showNotification('Backup создан');
            });
        }
        
        // Очистка старых записей
        const clearOldBtn = document.getElementById('clearOldBtn');
        if (clearOldBtn) {
            clearOldBtn.addEventListener('click', function() {
                if (confirm('Удалить записи старше 30 дней?')) {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    
                    let leads = JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY)) || [];
                    const oldCount = leads.length;
                    
                    leads = leads.filter(lead => {
                        const leadDate = lead.timestamp ? new Date(lead.timestamp) : new Date(lead.date);
                        return leadDate > thirtyDaysAgo;
                    });
                    
                    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
                    loadLeads();
                    
                    showNotification(`Удалено ${oldCount - leads.length} старых записей`);
                }
            });
        }
    }
    
    function showLoginScreen() {
        loginScreen.style.display = 'flex';
        adminContent.style.display = 'none';
    }
    
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        
        notification.querySelector('.notification-close').addEventListener('click', function() {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
});