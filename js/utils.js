// Utility functions

export const Utils = {
    // Distance calculation using Haversine formula
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    deg2rad(deg) {
        return deg * (Math.PI/180);
    },

    // Format distance
    formatDistance(distance, unit = 'miles') {
        if (unit === 'miles') {
            distance *= 0.621371; // Convert km to miles
        }
        return `${Math.round(distance * 10) / 10} ${unit}`;
    },

    // Format time duration
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins} minutes`;
        return `${hours} hours ${mins} minutes`;
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Show loading overlay
    showLoading() {
        document.getElementById('loading-overlay').classList.add('active');
    },

    // Hide loading overlay
    hideLoading() {
        document.getElementById('loading-overlay').classList.remove('active');
    },

    // Show error notification
    showError(message) {
        const errorElement = document.getElementById('error-notification');
        errorElement.textContent = message;
        errorElement.classList.add('active');
        setTimeout(() => {
            errorElement.classList.remove('active');
        }, 5000);
    },

// Format station data from API response
formatStationData(apiStation) {
    return {
        type: 'Feature',
        properties: {
            id: apiStation.id,
            name: apiStation.station_name,
            state: apiStation.state,
            fuelTypes: apiStation.fuel_type_code,
            status: apiStation.status_code,
            connectorTypes: apiStation.ev_connector_types || [],
            power: apiStation.ev_power_level || 'unknown',
            availability: apiStation.access_days_time || '24/7',
            amenities: this.parseAmenities(apiStation.facility_type || ''),
            lastUpdated: apiStation.updated_at,
            distance: apiStation.distance
        },
        geometry: {
            type: 'Point',
            coordinates: [
                apiStation.longitude,
                apiStation.latitude
            ]
        }
    };
},

// Format corridor data from API response
formatCorridorData(apiCorridor) {
    return {
        type: 'Feature',
        properties: {
            id: apiCorridor.corridor_id,
            name: apiCorridor.corridor_name,
            states: apiCorridor.states,
            fuelTypes: apiCorridor.fuel_types,
            status: apiCorridor.status,
            highway: apiCorridor.highway_name,
            length: apiCorridor.length_miles,
            stationCount: apiCorridor.station_count
        },
        geometry: {
            type: 'LineString',
            coordinates: apiCorridor.route_coordinates
        }
    };
},

// Parse amenities string into array
parseAmenities(facilityType) {
    const amenityMap = {
        'CONVENIENCE_STORE': 'convenience store',
        'RESTAURANT': 'restaurant',
        'RESTROOM': 'restroom',
        'SHOPPING': 'shopping',
        'ATM': 'ATM'
    };
    
    return facilityType.split(',')
        .map(type => amenityMap[type.trim()] || type.trim().toLowerCase())
        .filter(Boolean);
},

// Create popup content for stations
createStationPopupContent(station) {
    const props = station.properties;
    let content = `
        <div class="station-popup">
            <h3>${props.name}</h3>
            <p><strong>Status:</strong> ${props.status}</p>
            <p><strong>Fuel Types:</strong> ${props.fuelTypes.join(', ')}</p>
    `;

    if (props.connectorTypes && props.connectorTypes.length) {
        content += `<p><strong>Connectors:</strong> ${props.connectorTypes.join(', ')}</p>`;
    }

    if (props.power !== 'unknown') {
        content += `<p><strong>Power Level:</strong> ${props.power}kW</p>`;
    }

    if (props.amenities.length) {
        content += `<p><strong>Amenities:</strong> ${props.amenities.join(', ')}</p>`;
    }

    if (props.distance) {
        content += `<p><strong>Distance:</strong> ${this.formatDistance(props.distance)}</p>`;
    }

    content += `
            <p><strong>Hours:</strong> ${props.availability}</p>
            <p class="text-sm text-gray-500">Last updated: ${new Date(props.lastUpdated).toLocaleDateString()}</p>
        </div>
    `;

    return content;
},

// Create popup content for corridors
createCorridorPopupContent(corridor) {
    const props = corridor.properties;
    return `
        <div class="corridor-popup">
            <h3>${props.name}</h3>
            <p><strong>Highway:</strong> ${props.highway}</p>
            <p><strong>Status:</strong> ${props.status}</p>
            <p><strong>Length:</strong> ${props.length} miles</p>
            <p><strong>Stations:</strong> ${props.stationCount}</p>
            <p><strong>States:</strong> ${props.states.join(', ')}</p>
            <p><strong>Fuel Types:</strong> ${props.fuelTypes.join(', ')}</p>
        </div>
    `;
}
};

// Export Utils object
export { Utils };