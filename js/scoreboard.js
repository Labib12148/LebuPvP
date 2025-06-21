export class Scoreboard {
    constructor() {
        this.container = document.getElementById('scoreboard');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'scoreboard';
            this.container.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0,0,0,0.7);
                padding: 10px 14px;
                border: 2px solid #0ff;
                border-radius: 8px;
                font-family: 'Orbitron', sans-serif;
                color: #0ff;
                font-size: 12px;
                z-index: 10002;
                max-width: 220px;
            `;
            document.body.appendChild(this.container);
        }
    }

    update(scoreData) {
        // scoreData = { id: {kills, deaths}, ... }
        let html = `<strong>Scoreboard</strong><br/><table style="width:100%; text-align:left; margin-top:4px;">`;
        html += `<tr><th>ID</th><th>K</th><th>D</th></tr>`;
        for (const id in scoreData) {
            const { kills, deaths } = scoreData[id];
            html += `<tr><td>${id.slice(0,4)}</td><td>${kills}</td><td>${deaths}</td></tr>`;
        }
        html += `</table>`;
        this.container.innerHTML = html;
    }
}