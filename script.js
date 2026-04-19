// script.js

document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('nav a');

    navLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href');
            const targetSection = document.querySelector(sectionId);

            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Active link highlighting on scroll
    const sections = document.querySelectorAll('section, header');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            // Reveal effect trigger could go here too, but simple highlighting for now
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Intersection Observer for graceful scroll reveals
    const revealElements = document.querySelectorAll('.card, .alwar-profile, .acharya-card, section h2, .intro-p, .lineage-chart');

    // Add base reveal class
    revealElements.forEach(el => el.classList.add('reveal'));

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: Stop observing once revealed to only animate once
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // Add sticky navbar background effect on scroll
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Divya Desam Map Logic & Data (India Map Background)
    // Coordinates (x, y) are percentages relative to an India map bounding box.
    // Tamil Nadu is roughly bottom right (x: 55-65, y: 75-95)
    // Kerala is bottom left (x: 45-50, y: 80-92)
    // North is top (x: 40-60, y: 15-40)

    const mapContainer = document.getElementById('map-visual');
    const listBody = document.getElementById('divya-desams-list-body');

    if (mapContainer && listBody && typeof divyaDesams !== 'undefined') {
        // Clear containers
        mapContainer.innerHTML = '';
        listBody.innerHTML = '';

        // 1. Populate Master Table
        divyaDesams.forEach(dd => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dd.nadu}</td>
                <td><strong>${dd.name}</strong></td>
                <td>${dd.deity}</td>
                <td>${dd.alwars}</td>
            `;
            listBody.appendChild(tr);
        });

        // 2. Draw D3 Map
        const width = mapContainer.clientWidth || 800;
        const height = mapContainer.clientHeight || 500;

        const svg = d3.select('#map-visual').append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('display', 'block');

        // Setup Zoom
        const g = svg.append('g');
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        svg.call(zoom);

        // Geolocation projection - will be auto-fitted when data loads
        const projection = d3.geoMercator();

        const path = d3.geoPath().projection(projection);

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'map-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('pointer-events', 'none')
            .style('z-index', '1000'); // Ensure it is above everything

        // Load official GeoJSON for India Map with detailed J&K
        d3.json('assets/india_states_jk.geojson').then(india => {

            // Auto-scale the projection to perfectly fit the Portrait map bounds
            projection.fitSize([width, height], india);

            // Draw states map
            g.selectAll('path')
                .data(india.features)
                .enter().append('path')
                .attr('d', path)
                .attr('fill', '#f5ebd9') // Lighter fill for contrast
                .attr('stroke', '#5c2a12') // Strong contrasting dark brown stroke
                .attr('stroke-width', '1.5')
                .attr('opacity', '1');

            // Filter out Vinnulagam (no worldly coordinates) and place pins
            const earthlyDesams = divyaDesams.filter(d => d.lat !== null && d.lon !== null);

            g.selectAll('circle')
                .data(earthlyDesams)
                .enter().append('circle')
                .attr('cx', d => projection([d.lon, d.lat])[0])
                .attr('cy', d => projection([d.lon, d.lat])[1])
                .attr('r', 5)
                .attr('fill', '#d14900')
                .attr('stroke', '#fff')
                .attr('stroke-width', '1.5')
                .style('cursor', 'pointer')
                .on('mouseover', (event, d) => {
                    d3.select(event.currentTarget)
                        .attr('r', 8)
                        .attr('fill', '#b30000');

                    tooltip.transition()
                        .duration(200)
                        .style('opacity', 1);
                    tooltip.html(`
                        <h4 style="margin:0 0 5px 0; color:var(--primary-color);">${d.name}</h4>
                        <p style="margin:2px 0;"><strong>Deity:</strong> ${d.deity}</p>
                        <p style="margin:2px 0;"><strong>Region:</strong> ${d.nadu}</p>
                        <p style="margin:2px 0;"><strong>Alwars:</strong> ${d.alwars}</p>
                    `)
                        .style('left', (event.pageX + 15) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', (event, d) => {
                    d3.select(event.currentTarget)
                        .attr('r', 5)
                        .attr('fill', '#d14900');

                    tooltip.transition()
                        .duration(500)
                        .style('opacity', 0);
                });

        }).catch(err => {
            console.error('Error loading map data: ', err);
            mapContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: red;">Failed to load Map Geometry.</p>';
        });
    }
});

// Alwar Modal Functions
function openAlwarModal(name, desc) {
    const modal = document.getElementById('alwarModal');
    const title = document.getElementById('modal-title');
    const descEl = document.getElementById('modal-desc');
    const placeholder = document.getElementById('modal-img');

    title.textContent = name;
    descEl.textContent = desc;

    // Reset class and content
    placeholder.className = 'modal-img-placeholder';
    placeholder.style = ''; // clear programmatic inline styles

    const nameKey = name.split(' ')[0].toLowerCase();
    const alwarsWithImages = ['poigai', 'bhoothath', 'pey', 'thirumazhisai', 'nammalwar', 'madhurakavi', 'kulasekhara', 'periyalwar', 'andal', 'thondaradippodi', 'thiruppaan', 'thirumangai'];
    const hasImage = alwarsWithImages.includes(nameKey);

    if (hasImage) {
        placeholder.classList.add(`placeholder-${nameKey}`);
        placeholder.textContent = '';
    } else {
        // Set first letter as placeholder text in the modal image
        placeholder.textContent = name.charAt(0);
        placeholder.style.display = 'flex';
        placeholder.style.alignItems = 'center';
        placeholder.style.justifyContent = 'center';
        placeholder.style.fontSize = '4rem';
        placeholder.style.color = 'white';
        placeholder.style.fontFamily = "'Cinzel', serif";
        placeholder.style.background = "linear-gradient(135deg, var(--primary-color), var(--secondary-color))";
    }

    modal.classList.add('show');
}

function closeAlwarModal() {
    const modal = document.getElementById('alwarModal');
    modal.classList.remove('show');
}

// Close modal if clicked outside of modal-content
window.onclick = function (event) {
    const modal = document.getElementById('alwarModal');
    if (event.target == modal) {
        closeAlwarModal();
    }
}
