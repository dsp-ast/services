document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    const closeMobileMenuBtn = document.querySelector('.close-mobile-menu');
    
    mobileMenuBtn.addEventListener('click', function() {
        mobileNav.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    closeMobileMenuBtn.addEventListener('click', function() {
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
            mobileNav.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    const bookingForm = document.getElementById('bookingForm');
    
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('clientName').value.trim();
        const phone = document.getElementById('clientPhone').value.trim();
        const service = document.getElementById('serviceType').value;
        const date = document.getElementById('preferredDate').value;
        
        if (!name || !phone || !service) {
            showNotification('Пожалуйста, заполните все обязательные поля', 'error');
            return;
        }
        
        const serviceText = document.getElementById('serviceType').selectedOptions[0].text;
        
        const booking = {
            id: Date.now(),
            name: name,
            phone: phone,
            service: service,
            serviceText: serviceText,
            date: date || new Date().toLocaleDateString('ru-RU'),
            timestamp: new Date().toISOString(),
            status: 'new'
        };
        
        saveBooking(booking);
        
        showNotification(`Спасибо, ${name}! Вы записаны на ${serviceText}. Мы свяжемся с вами для подтверждения.`);
        
        bookingForm.reset();
    });
    
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
            
            if (x) {
                e.target.value = !x[2] ? x[1] : '+7 (' + x[2] + ') ' + x[3] + (x[4] ? '-' + x[4] : '') + (x[5] ? '-' + x[5] : '');
            }
        });
    });
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        if (anchor.getAttribute('href') === '#') return;
        
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    function saveBooking(booking) {
        let bookings = JSON.parse(localStorage.getItem('partnerBookings')) || [];
        bookings.push(booking);
        localStorage.setItem('partnerBookings', JSON.stringify(bookings));
        console.log('Запись сохранена:', booking);
    }
    
    function showNotification(message, type = 'success') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
    
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
            border-left: 4px solid #4a6fa5;
            transform: translateX(120%);
            transition: transform 0.3s ease;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            max-width: 400px;
        }
        
        .notification.error {
            border-left-color: #e53e3e;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: #a0aec0;
            cursor: pointer;
            margin-left: 16px;
            padding: 0 4px;
        }
        
        .notification-close:hover {
            color: #4a5568;
        }
    `;
    document.head.appendChild(notificationStyles);
    
    console.log('Сайт Делового Центра "Партнер" загружен');
});