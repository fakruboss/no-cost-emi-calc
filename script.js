document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('emi-form');
    const results = document.getElementById('results');
    
    // Add formatting to loan amount input
    const loanAmountInput = document.getElementById('loanAmount');
    const processingFeeInput = document.getElementById('processingFee');
    
    // Format number with Indian comma separators
    function formatIndianNumber(num) {
        if (!num || num === '' || isNaN(num)) return '';
        
        // Handle decimal numbers
        const parts = num.toString().split('.');
        const integerPart = parts[0];
        const decimalPart = parts[1] ? '.' + parts[1] : '';
        
        // Format integer part only
        if (integerPart.length <= 3) {
            return integerPart + decimalPart;
        }
        
        const lastThree = integerPart.substring(integerPart.length - 3);
        const otherNumbers = integerPart.substring(0, integerPart.length - 3);
        
        const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
        return formatted + decimalPart;
    }
    
    // Remove commas from formatted number
    function unformatNumber(str) {
        return str.replace(/,/g, '');
    }
    
    // Format input on blur (when user finishes typing)
    function formatInputOnBlur(input) {
        input.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value && value !== '') {
                const unformatted = unformatNumber(value);
                const numValue = parseFloat(unformatted);
                
                // Only format if it's a valid positive number
                if (!isNaN(numValue) && numValue > 0) {
                    const formatted = formatIndianNumber(unformatted);
                    this.value = formatted;
                }
            }
        });
        
        input.addEventListener('focus', function() {
            // Remove formatting when focusing to allow editing
            const value = this.value.trim();
            if (value && value !== '') {
                const unformatted = unformatNumber(value);
                const numValue = parseFloat(unformatted);
                
                // Only update if it's a valid number
                if (!isNaN(numValue) && numValue >= 0) {
                    this.value = unformatted;
                }
            }
        });
    }
    
    // Temporarily disable input formatting to prevent issues
    // formatInputOnBlur(loanAmountInput);
    // formatInputOnBlur(processingFeeInput);
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateEMI();
    });
    
    function calculateEMI() {
        // Get input values directly (no formatting issues)
        const loanAmount = parseFloat(document.getElementById('loanAmount').value || '0');
        const annualRate = parseFloat(document.getElementById('interestRate').value || '0');
        const tenure = parseInt(document.getElementById('loanTenure').value || '0');
        const processingFee = parseFloat(document.getElementById('processingFee').value || '0');
        
        // Validate inputs
        if (isNaN(loanAmount) || loanAmount <= 0) {
            alert('Please enter a valid loan amount');
            return;
        }
        if (isNaN(annualRate) || annualRate < 0) {
            alert('Please enter a valid interest rate');
            return;
        }
        if (isNaN(tenure) || tenure <= 0) {
            alert('Please enter a valid tenure');
            return;
        }
        
        // Convert annual rate to monthly rate
        const monthlyRate = annualRate / (12 * 100);
        const gstRate = 0.18; // 18% GST
        
        // Calculate base EMI using the formula: EMI = L * r / (1 - (1+r)^-N)
        const baseEMI = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -tenure));
        
        let totalInterest = 0;
        let totalGST = 0;
        let totalProcessingFee = processingFee;
        let totalGSTOnFee = processingFee * gstRate;
        let outstanding = loanAmount;
        
        const amortizationSchedule = [];
        
        // Calculate month-wise breakdown
        for (let month = 1; month <= tenure; month++) {
            const interest = outstanding * monthlyRate;
            const principal = baseEMI - interest;
            const gstOnInterest = interest * gstRate;
            
            // Processing fee and GST only in first month
            const monthlyProcessingFee = month === 1 ? processingFee : 0;
            const monthlyGSTOnFee = month === 1 ? processingFee * gstRate : 0;
            
            const monthlyPayment = baseEMI + gstOnInterest + monthlyProcessingFee + monthlyGSTOnFee;
            
            amortizationSchedule.push({
                month: month,
                outstanding: outstanding,
                interest: interest,
                principal: principal,
                gstOnInterest: gstOnInterest,
                processingFee: monthlyProcessingFee,
                gstOnFee: monthlyGSTOnFee,
                totalPayment: monthlyPayment
            });
            
            totalInterest += interest;
            totalGST += gstOnInterest;
            outstanding -= principal;
        }
        
        const totalInterestPlusGST = totalInterest + totalGST;
        const totalAmount = loanAmount + totalInterest + totalGST + totalProcessingFee + totalGSTOnFee;
        const merchantDiscount = totalInterest + totalGST + totalProcessingFee + totalGSTOnFee;
        const effectiveAmount = totalAmount; // In no-cost EMI, this is the total amount you actually pay
        
        // Display results
        displayResults(baseEMI, totalInterestPlusGST, totalAmount, merchantDiscount, effectiveAmount, amortizationSchedule, {
            loanAmount: loanAmount,
            totalInterest: totalInterest,
            totalGST: totalGST,
            totalProcessingFee: totalProcessingFee,
            totalGSTOnFee: totalGSTOnFee
        });
    }
    
    function displayResults(baseEMI, totalInterest, totalAmount, merchantDiscount, effectiveAmount, schedule, breakdown) {
        document.getElementById('monthlyEMI').textContent = `₹${formatIndianNumber(baseEMI.toFixed(2))}`;
        document.getElementById('totalInterest').textContent = `₹${formatIndianNumber(totalInterest.toFixed(2))}`;
        document.getElementById('merchantDiscount').textContent = `₹${formatIndianNumber(merchantDiscount.toFixed(2))}`;
        document.getElementById('effectiveAmount').textContent = `₹${formatIndianNumber(effectiveAmount.toFixed(2))}`;
        
        // Create amortization table
        const tableBody = document.getElementById('amortizationBody');
        tableBody.innerHTML = '';
        
        schedule.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.month}</td>
                <td>₹${formatIndianNumber(row.outstanding.toFixed(2))}</td>
                <td>₹${formatIndianNumber(row.interest.toFixed(2))}</td>
                <td>₹${formatIndianNumber(row.principal.toFixed(2))}</td>
                <td>₹${formatIndianNumber(row.gstOnInterest.toFixed(2))}</td>
                <td>₹${formatIndianNumber(row.processingFee.toFixed(2))}</td>
                <td>₹${formatIndianNumber(row.gstOnFee.toFixed(2))}</td>
                <td>₹${formatIndianNumber(row.totalPayment.toFixed(2))}</td>
            `;
            tableBody.appendChild(tr);
        });
        
        // Create pie chart
        createPieChart(breakdown);
        
        // Trigger layout transition
        triggerLayoutTransition();
    }
    
    function triggerLayoutTransition() {
        const container = document.querySelector('.container');
        const calculator = document.querySelector('.calculator');
        
        // Add calculated classes for layout transition
        container.classList.add('calculated');
        calculator.classList.add('calculated');
    }
    
    function createPieChart(breakdown) {
        const canvas = document.getElementById('pieChart');
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 100;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Data for pie chart with playful, vibrant colors
        const data = [
            { label: 'Principal Amount', value: breakdown.loanAmount, color: '#e91e63' },
            { label: 'Interest', value: breakdown.totalInterest, color: '#9c27b0' },
            { label: 'GST on Interest', value: breakdown.totalGST, color: '#3f51b5' },
            { label: 'Processing Fee', value: breakdown.totalProcessingFee, color: '#00bcd4' },
            { label: 'GST on Fee', value: breakdown.totalGSTOnFee, color: '#4caf50' }
        ];
        
        // Filter out zero values
        const filteredData = data.filter(item => item.value > 0);
        
        // Calculate total
        const total = filteredData.reduce((sum, item) => sum + item.value, 0);
        
        // Draw pie slices
        let currentAngle = -Math.PI / 2; // Start from top
        
        filteredData.forEach(item => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            
            // Draw slice
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.lineTo(centerX, centerY);
            ctx.fillStyle = item.color;
            ctx.fill();
            
            // Draw border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            currentAngle += sliceAngle;
        });
        
        // Create legend
        const legendContainer = document.getElementById('chartLegend');
        legendContainer.innerHTML = '';
        
        filteredData.forEach(item => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            
            const percentage = ((item.value / total) * 100).toFixed(1);
            
            legendItem.innerHTML = `
                <div class="legend-color" style="background-color: ${item.color}"></div>
                <div class="legend-text">${item.label}: ₹${formatIndianNumber(item.value.toFixed(2))} (${percentage}%)</div>
            `;
            
            legendContainer.appendChild(legendItem);
        });
    }
});