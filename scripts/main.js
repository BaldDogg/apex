// Кнопка (прокрутка до формы заявки)
const scrollBtn = document.getElementById('scrollToFormBtn');
const targetSection = document.getElementById('contacts');

if (scrollBtn && targetSection) {
    scrollBtn.addEventListener('click', function (e) {
        e.preventDefault();

        targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
}

// Контактная форма
document.getElementById('leadForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('leadName').value,
        company: document.getElementById('leadCompany').value,
        position: document.getElementById('leadPosition').value,
        phone: document.getElementById('leadPhone').value,
        email: document.getElementById('leadEmail').value,
        message: document.getElementById('leadMessage').value
    };

    try {
        const response = await fetch('http://localhost:5000/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            alert('Супер! Заявка успешно отправлена.');
            this.reset();
        } else {
            alert('Ошибка при отправке: ' + result.error);
        }
    } catch (error) {
        alert('Не удалось связаться с сервером. Проверьте, запущен ли он.');
        console.error(error);
    }
});

// Survey
document.getElementById('surveyForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('http://localhost:5000/api/surveys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            alert('Спасибо за ваши ответы! Опрос сохранен.');
            this.reset();
        } else {
            alert('Ошибка при сохранении опроса: ' + result.error);
        }
    } catch (error) {
        alert('Не удалось связаться с сервером.');
        console.error(error);
    }
});