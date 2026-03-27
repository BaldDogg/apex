// Базовый адрес сервера
const SERVER_URL = 'http://localhost:5000/api';

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const login = document.getElementById('adminLogin').value;
    const password = document.getElementById('adminPassword').value;
    const errorMsg = document.getElementById('loginError');

    try {
        // Отправляем логин и пароль на сервер для проверки
        const response = await fetch(`${SERVER_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            localStorage.setItem('adminToken', data.token);

            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('dashboardScreen').style.display = 'block';
            errorMsg.style.display = 'none';

            loadDashboardData();
        } else {
            errorMsg.innerText = data.error || 'Неверный логин или пароль!';
            errorMsg.style.display = 'block';
        }
    } catch (err) {
        errorMsg.innerText = 'Ошибка соединения с сервером!';
        errorMsg.style.display = 'block';
    }
});

function logout() {
    localStorage.removeItem('adminToken');
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('dashboardScreen').style.display = 'none';
    document.getElementById('adminPassword').value = '';
    document.getElementById('loginError').style.display = 'none';
}

async function loadDashboardData() {
    const token = localStorage.getItem('adminToken');
    if (!token) return logout();

    const headers = { 'Authorization': `Bearer ${token}` };

    try {
        // заявки
        const leadsRes = await fetch(`${SERVER_URL}/admin/leads`, { headers });
        if (leadsRes.ok) {
            const leads = await leadsRes.json();
            const tbody = document.getElementById('leadsTableBody');
            tbody.innerHTML = '';

            if (leads.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6">Пока нет заявок.</td></tr>';
            } else {
                leads.forEach(lead => {
                    const date = new Date(lead.date).toLocaleString('ru-RU');
                    tbody.innerHTML += `
                                <tr>
                                    <td>${date}</td>
                                    <td><strong>${lead.name}</strong><br><small>${lead.position || ''}</small></td>
                                    <td>${lead.company}</td>
                                    <td><a href="tel:${lead.phone}">${lead.phone}</a></td>
                                    <td><a href="mailto:${lead.email}">${lead.email}</a></td>
                                    <td>${lead.message || '-'}</td>
                                </tr>
                            `;
                });
            }
        }

        // статистика опросов
        const surveysRes = await fetch(`${SERVER_URL}/admin/surveys`, { headers });
        if (surveysRes.ok) {
            const stats = await surveysRes.json();

            const totalEl = document.getElementById('totalSurveys');
            if (totalEl) totalEl.innerText = stats.total || 0;

            const tbody = document.getElementById('surveyTableBody');
            if (tbody) {
                if (stats.total > 0) {
                    tbody.innerHTML = `
                                <tr><td>1. Часто ли вы сталкиваетесь с ситуацией, когда информация о ходе проекта поступает с опозданием?</td><td><b>${stats.avg_q1 || 0}</b> / 5</td></tr>
                                <tr><td>2. Считаете ли вы, что ваши руководители перегружены рутиной в ущерб стратегическим задачам?</td><td><b>${stats.avg_q2 || 0}</b> / 5</td></tr>
                                <tr><td>3. Случалось ли, что уход ключевого сотрудника приводил к потере критически важной информации о проекте?</td><td><b>${stats.avg_q3 || 0}</b> / 5</td></tr>
                                <tr><td>4. Возникают ли на ваших проектах конфликты между участниками из-за несогласованности данных?</td><td><b>${stats.avg_q4 || 0}</b> / 5</td></tr>
                                <tr><td>5. Приходится ли вам регулярно тушить "пожары" вместо того, чтобы работать на опережение?</td><td><b>${stats.avg_q5 || 0}</b> / 5</td></tr>
                                <tr><td>6. Уверены ли вы, что текущие инструменты планирования (MS Project, Excel) справляются со сложностью ваших проектов?</td><td><b>${stats.avg_q6 || 0}</b> / 5</td></tr>
                                <tr><td>7. Оцените, насколько точно вы можете спрогнозировать сроки завершения проекта сегодня?</td><td><b>${stats.avg_q7 || 0}</b> / 5</td></tr>
                                <tr><td>8. Часто ли возникают простои из-за несвоевременной поставки материалов или недоступности ресурсов?</td><td><b>${stats.avg_q8 || 0}</b> / 5</td></tr>
                                <tr><td>9. Внедрены ли у вас BIM-технологии, и используют ли их для управления строительством?</td><td><b>${stats.avg_q9 || 0}</b> / 3</td></tr>
                                <tr><td>10. Заинтересованы ли вы в симтемах, которые автоматически предлагают корректирующие решения при отклонениях от плана?</td><td><b>${stats.avg_q10 || 0}</b> / 5</td></tr>
                            `;
                } else {
                    tbody.innerHTML = '<tr><td colspan="2">Никто еще не прошел опрос.</td></tr>';
                }
            }
        }
    } catch (err) {
        console.error('Ошибка загрузки данных:', err);
    }
}