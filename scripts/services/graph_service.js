// graph service
function graph_service() {
    this.create_bar_graph = function() {
        // Data
        const data = {
            x_label: 'Sales',
            y_label: '2014',
            points: [
                { label: 'January', yValue: 1, xValue: 36 },
                { label: 'February', yValue: 2, xValue: 54 },
                { label: 'March', yValue: 3, xValue: 62 },
                { label: 'April', yValue: 4, xValue: 82 }
            ]
        };

        let maxX = Math.max(...data.points.map(p => p.xValue));
        let maxY = Math.max(...data.points.map(p => p.yValue));

        let bars = "";
        data.points.forEach(point => {
            const barHeight = (point.yValue / maxY) * 100; // percentage height
            bars += `
                <div class="bar" style="height: ${barHeight}%;" title="${point.label}: (${point.xValue}, ${point.yValue})"></div>
            `;
        });

        let html="";
        html+=`
            <div class='graph'>
                <div class="x">${data.x_label}</div>
                <div class="y">${data.y_label}</div>
                <div class="bars">${bars}</div>
                
            <div>
        `;



        return html;
    }
};
