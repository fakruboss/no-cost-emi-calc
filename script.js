document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('emi-form');
    const results = document.getElementById('results');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateEMI();
    });
    
    function calculateEMI() {
        // Get input values
        const loanAmount = parseFloat(document.getElementById('loanAmount').value);
        const annualRate = parseFloat(document.getElementById('interestRate').value);
        const tenure = parseInt(document.getElementById('loanTenure').value);
        const processingFee = parseFloat(document.getElementById('processingFee').value) || 0;
        
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
        
        const totalAmount = loanAmount + totalInterest + totalGST + totalProcessingFee + totalGSTOnFee;
        const merchantDiscount = totalInterest + totalGST + totalProcessingFee + totalGSTOnFee;
        const effectiveAmount = totalAmount - merchantDiscount; // In no-cost EMI, this equals loan amount
        
        // Display results
        displayResults(baseEMI, totalInterest, totalAmount, merchantDiscount, effectiveAmount, amortizationSchedule);
    }
    
    function displayResults(baseEMI, totalInterest, totalAmount, merchantDiscount, effectiveAmount, schedule) {
        document.getElementById('monthlyEMI').textContent = `₹${baseEMI.toFixed(2)}`;
        document.getElementById('totalInterest').textContent = `₹${totalInterest.toFixed(2)}`;
        document.getElementById('totalAmount').textContent = `₹${totalAmount.toFixed(2)}`;
        document.getElementById('merchantDiscount').textContent = `₹${merchantDiscount.toFixed(2)}`;
        document.getElementById('effectiveAmount').textContent = `₹${effectiveAmount.toFixed(2)}`;
        
        // Create amortization table
        const tableBody = document.getElementById('amortizationBody');
        tableBody.innerHTML = '';
        
        schedule.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.month}</td>
                <td>₹${row.outstanding.toFixed(2)}</td>
                <td>₹${row.interest.toFixed(2)}</td>
                <td>₹${row.principal.toFixed(2)}</td>
                <td>₹${row.gstOnInterest.toFixed(2)}</td>
                <td>₹${row.processingFee.toFixed(2)}</td>
                <td>₹${row.gstOnFee.toFixed(2)}</td>
                <td>₹${row.totalPayment.toFixed(2)}</td>
            `;
            tableBody.appendChild(tr);
        });
        
        results.classList.add('show');
    }
});