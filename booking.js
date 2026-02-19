document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('bookingSimpleForm');
    const bookingSuccess = document.getElementById('bookingSuccess');
    const bookingName = document.getElementById('bookingName');
    const bookingPhone = document.getElementById('bookingPhone');
    const bookingComment = document.getElementById('bookingComment');
    const agreementCheckbox = document.getElementById('agreementCheckbox');
    const submitBtn = document.getElementById('submitBookingBtn');
    const newBookingBtn = document.getElementById('newBookingBtn');
    
    const selectedServiceDisplay = document.getElementById('selectedServiceDisplay');
    const serviceNameText = document.getElementById('serviceNameText');
    const clearServiceBtn = document.getElementById('clearServiceBtn');
    
    bookingPhone.addEventListener('input', function(e) {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
        
        if (x) {
            e.target.value = !x[2] ? x[1] : '+7 (' + x[2] + ') ' + x[3] + (x[4] ? '-' + x[4] : '') + (x[5] ? '-' + x[5] : '');
        }
    });
    
    function getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
    
    const serviceParam = getUrlParameter('service');
    
    const serviceNames = {
        'diagnostics': 'Комплексная диагностика (4 500 руб)',
        'express_testing': 'Экспресс-тестирование (2 500 руб)',
        'vacuum_massage': 'Вакуумный массаж (3 500 руб / 3 сеанса)',
        'ishoukan': 'Комплексный массаж Ишоукан (1 800 руб)',
        'isyugui': 'Массаж Исюгуи (1 300 руб)',
        'general_massage': 'Общий оздоровительный массаж (2 000 руб)',
        'cilvaris_face': 'Массаж лица CILVARIS (1 200 - 2 500 руб)'
    };
    
    if (serviceParam && serviceNames[serviceParam]) {
        selectedServiceDisplay.style.display = 'block';
        serviceNameText.textContent = serviceNames[serviceParam];
    }
    
    clearServiceBtn.addEventListener('click', function() {
        selectedServiceDisplay.style.display = 'none';
        const url = new URL(window.location);
        url.searchParams.delete('service');
        window.history.replaceState({}, '', url);
    });
    
    function saveBookingRequest(bookingData) {
        let bookings = JSON.parse(localStorage.getItem('partnerLeads')) || [];
        
        bookings.push({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('ru-RU'),
            time: new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'}),
            name: bookingData.name,
            phone: bookingData.phone,
            comment: bookingData.comment || '',
            service: bookingData.service || 'Не указана',
            source: 'Сайт',
            status: 'Новая'
        });
        
        localStorage.setItem('partnerLeads', JSON.stringify(bookings));
        
        let leads = JSON.parse(localStorage.getItem('partnerLeadsList')) || [];
        leads.push({
            id: Date.now(),
            name: bookingData.name,
            phone: bookingData.phone,
            comment: bookingData.comment || '',
            service: bookingData.service || 'Не указана',
            date: new Date().toLocaleString('ru-RU'),
            status: 'Новая'
        });
        localStorage.setItem('partnerLeadsList', JSON.stringify(leads));
        
        return bookingData.id;
    }
    
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = bookingName.value.trim();
        const phone = bookingPhone.value.trim();
        const comment = bookingComment.value.trim();
        const service = serviceNameText ? serviceNameText.textContent : 'Не указана';
        
        if (!name) {
            showNotification('Пожалуйста, введите ваше имя', 'error');
            return;
        }
        
        if (!phone || phone.length < 16) { 
            showNotification('Пожалуйста, введите корректный номер телефона', 'error');
            return;
        }
        
        if (!agreementCheckbox.checked) {
            showNotification('Необходимо согласие на обработку персональных данных', 'error');
            return;
        }
        
        const bookingData = {
            name: name,
            phone: phone,
            comment: comment,
            service: service,
            timestamp: new Date().toISOString()
        };
        
        const bookingId = saveBookingRequest(bookingData);
        
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            sendToServer(bookingData);
        }
        
        bookingForm.style.display = 'none';
        bookingSuccess.style.display = 'block';
        
        document.getElementById('successDetails').innerHTML = `
            <p><strong>Имя:</strong> ${name}</p>
            <p><strong>Телефон:</strong> ${phone}</p>
            ${comment ? `<p><strong>Комментарий:</strong> ${comment}</p>` : ''}
            <p><strong>Услуга:</strong> ${service}</p>
        `;
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'submit_lead', {
                'event_category': 'forms',
                'event_label': service
            });
        }
        
        if (typeof ym !== 'undefined') {
            ym('reachGoal', 'submit_booking');
        }
    });
    
    newBookingBtn.addEventListener('click', function() {
        bookingSuccess.style.display = 'none';
        bookingForm.style.display = 'block';
        bookingForm.reset();
    });
    
    function sendToServer(data) {
        fetch('/api/save-lead.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        }).catch(error => {
            console.log('Серверная запись не настроена, данные сохранены локально');
        });
    }
    
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `booking-notification ${type}`;
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
    
    const style = document.createElement('style');
    style.textContent = `
        .booking-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 16px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
            border-left: 4px solid #4a6fa5;
            transform: translateX(120%);
            transition: transform 0.3s ease;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            max-width: 400px;
        }
        .booking-notification.error { border-left-color: #e53e3e; }
        .booking-notification.show { transform: translateX(0); }
        .notification-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #a0aec0;
            cursor: pointer;
            margin-left: 16px;
            padding: 0 4px;
        }
        .notification-close:hover { color: #4a5568; }
    `;
    document.head.appendChild(style);
});