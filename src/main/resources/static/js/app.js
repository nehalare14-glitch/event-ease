function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('open');
}

function openModal() {
    document.getElementById('eventModal').hidden = false;
}

function closeModal() {
    document.getElementById('eventModal').hidden = true;
}

function filterEvents() {
    const query = document.getElementById('search').value.toLowerCase();
    const cards = document.querySelectorAll('.event-card');
    let visible = 0;

    cards.forEach(card => {
        const matches = card.textContent.toLowerCase().includes(query);
        card.hidden = !matches;
        if (matches) visible++;
    });

    const emptyMessage = document.getElementById('emptyMessage');

    if (emptyMessage && cards.length > 0) {
        emptyMessage.hidden = visible !== 0;
    }
}
