// Enhanced tracking functionality
function trackPackage(trackingNumber) {
    if (!trackingNumber || !trackingNumber.trim()) {
        alert('Please enter a tracking number');
        return;
    }

    // Show loading state
    setTrackingLoading(true);
    
    // Clear previous results
    const resultsDiv = document.getElementById('trackingResults');
    if (resultsDiv) {
        resultsDiv.remove();
    }

    // FIXED: Use relative path instead of localhost:3000
    fetch(`/api/packages/track/${trackingNumber.trim()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            setTrackingLoading(false);
            if (data.success) {
                displayTrackingResults(data.package);
            } else {
                alert('Package not found. Please check your tracking number.');
            }
        })
        .catch(error => {
            setTrackingLoading(false);
            console.error('Tracking error:', error);
            
            // More specific error messages
            if (error.message.includes('Failed to fetch')) {
                alert('Cannot connect to tracking service. Please check your internet connection and ensure the server is running.');
            } else if (error.message.includes('404')) {
                alert('Tracking service not found. Please contact support.');
            } else {
                alert('Error tracking package. Please try again.');
            }
        });
}

// Loading state function
function setTrackingLoading(isLoading) {
    // FIXED: Use IDs instead of classes for more reliable selection
    const trackButton = document.getElementById('trackButton');
    const trackInput = document.getElementById('trackingInput');
    
    if (trackButton && trackInput) {
        if (isLoading) {
            trackButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Tracking...';
            trackButton.disabled = true;
            trackInput.disabled = true;
        } else {
            trackButton.innerHTML = 'Track';
            trackButton.disabled = false;
            trackInput.disabled = false;
        }
    }
}

function displayTrackingResults(packageData) {
    // Create or update tracking results display
    let resultsDiv = document.getElementById('trackingResults');
    if (!resultsDiv) {
        resultsDiv = document.createElement('div');
        resultsDiv.id = 'trackingResults';
        resultsDiv.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px auto;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #D40511;
            max-width: 800px;
            width: 95%;
        `;
        
        // FIXED: Insert after the hero section instead of inside it
        const heroSection = document.querySelector('.hero');
        if (heroSection && heroSection.parentNode) {
            heroSection.parentNode.insertBefore(resultsDiv, heroSection.nextSibling);
        }
    }

    const statusClass = `status-${packageData.status.toLowerCase().replace(' ', '-')}`;
    
    // FIXED: Reverse history to show chronological order (oldest first)
    const chronologicalHistory = [...packageData.history].reverse();
    
    resultsDiv.innerHTML = `
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
            <h3 style="color: #D40511; font-size: 20px; display: flex; align-items: center; margin: 0;">
                <i class="fas fa-box" style="margin-right: 10px;"></i>
                ${packageData.trackingNumber}
            </h3>
            <div class="package-status ${statusClass}" style="padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                ${packageData.status}
            </div>
        </div>

        <!-- Main Info Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <!-- Package Info -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #e9ecef;">
                <h4 style="color: #D40511; margin: 0 0 12px 0; font-size: 14px; display: flex; align-items: center;">
                    <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                    Package Details
                </h4>
                <div style="display: grid; gap: 6px; color: #333; font-size: 13px;">
                    <div><strong style="color: #555;">Description:</strong> ${packageData.packageDescription}</div>
                    <div><strong style="color: #555;">Weight:</strong> ${packageData.weight} kg</div>
                    <div><strong style="color: #555;">Dimensions:</strong> ${packageData.dimensions}</div>
                </div>
            </div>
            
            <!-- Recipient Info -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #e9ecef;">
                <h4 style="color: #D40511; margin: 0 0 12px 0; font-size: 14px; display: flex; align-items: center;">
                    <i class="fas fa-user" style="margin-right: 8px;"></i>
                    Recipient Info
                </h4>
                <div style="display: grid; gap: 6px; color: #333; font-size: 13px;">
                    <div><strong style="color: #555;">Name:</strong> ${packageData.recipientName}</div>
                    <div><strong style="color: #555;">Address:</strong> ${packageData.recipientAddress}</div>
                </div>
            </div>
        </div>

        <!-- Package Image & Last Updated -->
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 20px; margin-bottom: 20px; align-items: start;">
            ${packageData.imageUrl ? `
                <div style="text-align: center;">
                    <img src="${packageData.imageUrl}" 
                         style="width: 120px; height: 120px; object-fit: cover; border-radius: 6px; border: 2px solid #f0f0f0;">
                    <div style="font-size: 11px; color: #666; margin-top: 6px;">Package Image</div>
                </div>
            ` : `
                <div style="text-align: center;">
                    <div style="width: 120px; height: 120px; background: #f9f9f9; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 2px solid #f0f0f0;">
                        <i class="fas fa-box" style="font-size: 30px; color: #ccc;"></i>
                    </div>
                    <div style="font-size: 11px; color: #666; margin-top: 6px;">No Image</div>
                </div>
            `}
            
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="background: #fff3e0; padding: 12px; border-radius: 6px; border-left: 3px solid #FFCC00;">
                    <div style="font-size: 13px; color: #333;">
                        <strong>Last Updated:</strong> ${new Date(packageData.updatedAt).toLocaleDateString()} at ${new Date(packageData.updatedAt).toLocaleTimeString()}
                    </div>
                </div>
                <div style="font-size: 12px; color: #666;">
                    <strong>Sender:</strong> ${packageData.senderName}
                </div>
            </div>
        </div>

        <!-- Shipping History -->
        <div style="margin-top: 20px;">
            <h4 style="color: #D40511; margin: 0 0 15px 0; font-size: 16px; display: flex; align-items: center;">
                <i class="fas fa-history" style="margin-right: 8px;"></i>
                Shipping History
            </h4>
            
            <div style="border-left: 2px solid #FFCC00; margin-left: 8px; padding-left: 8px;">
                ${chronologicalHistory.map((event, index) => `
                    <div style="margin-bottom: 16px; position: relative;">
                        <div style="position: absolute; left: -10px; top: 6px; width: 8px; height: 8px; border-radius: 50%; background: #D40511; border: 2px solid white;"></div>
                        
                        <div style="background: white; border: 1px solid #e9ecef; border-radius: 6px; padding: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
                                <div style="font-weight: bold; color: #333; font-size: 13px;">${event.status}</div>
                                <div style="font-size: 11px; color: #999; background: #f8f9fa; padding: 3px 6px; border-radius: 4px;">
                                    ${new Date(event.timestamp).toLocaleDateString()}
                                </div>
                            </div>
                            
                            <div style="font-size: 12px; color: #666; margin-bottom: 6px; display: flex; align-items: center;">
                                <i class="fas fa-map-marker-alt" style="margin-right: 5px; color: #D40511; font-size: 11px;"></i>
                                ${event.location}
                            </div>
                            
                            <div style="font-size: 12px; color: #555; background: #f8f9fa; padding: 8px; border-radius: 4px; border-left: 2px solid #D40511;">
                                ${event.description}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Help Section -->
        <div style="margin-top: 20px; padding: 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #FFCC00;">
            <div style="display: flex; align-items: center;">
                <i class="fas fa-info-circle" style="color: #D40511; margin-right: 8px; font-size: 14px;"></i>
                <div>
                    <strong style="color: #333; font-size: 13px;">Need Help?</strong>
                    <div style="font-size: 12px; color: #666; margin-top: 3px;">
                        Contact DHL Support at 1-800-CALL-DHL
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // FIXED: Scroll to results for better user experience
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Single DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // FIXED: Use IDs for more reliable element selection
    const trackButton = document.getElementById('trackButton');
    const trackInput = document.getElementById('trackingInput');
    
    if (trackButton && trackInput) {
        trackButton.addEventListener('click', function() {
            const trackingNumber = trackInput.value;
            trackPackage(trackingNumber);
        });
        
        // Allow Enter key to submit
        trackInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                trackPackage(trackInput.value);
            }
        });
    }
    
    // Add status styles to the main page
    const style = document.createElement('style');
    style.textContent = `
        .package-status {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
        }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-shipped { background: #cce7ff; color: #004085; }
        .status-in-transit { background: #d1ecf1; color: #0c5460; }
        .status-on-hold { background: #f8d7da; color: #721c24; }
        .status-out-for-delivery { background: #d4edda; color: #155724; }
        .status-delivered { background: #28a745; color: white; }
        
        /* Responsive design for tracking results */
        @media (max-width: 768px) {
            #trackingResults {
                padding: 15px !important;
                margin: 15px auto !important;
            }
            
            #trackingResults [style*="grid-template-columns: 1fr 1fr"] {
                grid-template-columns: 1fr !important;
                gap: 15px !important;
            }
            
            #trackingResults [style*="grid-template-columns: auto 1fr"] {
                grid-template-columns: 1fr !important;
                gap: 15px !important;
                text-align: center;
            }
            
            #trackingResults [style*="justify-content: space-between"] {
                flex-direction: column !important;
                align-items: flex-start !important;
                gap: 10px !important;
            }
        }
    `;
    document.head.appendChild(style);

    // Auto-focus on tracking input
    if (trackInput) {
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
            trackInput.focus();
        }, 500);
    }
});

// Mobile menu functionality
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Enhanced error handling for image loading
document.addEventListener('DOMContentLoaded', function() {
    // Handle broken images in tracking results
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG' && e.target.closest('#trackingResults')) {
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            if (parent) {
                parent.innerHTML = `
                    <div style="width: 120px; height: 120px; background: #f9f9f9; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 2px solid #f0f0f0; margin: 0 auto;">
                        <i class="fas fa-box" style="font-size: 30px; color: #ccc;"></i>
                    </div>
                    <div style="font-size: 11px; color: #666; margin-top: 6px; text-align: center;">Image Not Available</div>
                `;
            }
        }
    }, true);
});
