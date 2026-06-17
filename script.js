const form = document.getElementById("expense-form");
const list = document.getElementById("expense-list");

const searchInput = document.getElementById("search");
const filter = document.getElementById("filter");
const sort = document.getElementById("sort");
const budgetInput = document.getElementById("budget");
const remaining = document.getElementById("remaining");

const themeBtn = document.querySelector('#themeBtn');

let pieChartObj = null,
    barChartObj = null,
    trendChartObj = null;
    // store the currently edited item id 

let expenses = JSON.parse(
    localStorage.getItem("expenses")
) || [];

budgetInput.value =
    localStorage.getItem("budget") || "";

budgetInput.addEventListener(
    "input",
    () => {
        localStorage.setItem(
            "budget",
            budgetInput.value
        );
        render();
    });

// Dark mode

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeBtn.innerHTML = '🌞 Light Mode';
}
else {
    themeBtn.innerHTML = '🌙 Dark Mode';
}

themeBtn.onclick = () => {
    document.body.classList.toggle("dark");

    if (themeBtn.innerHTML.includes('Dark Mode')) {
        themeBtn.innerHTML = '🌞 Light Mode';
    }else{
        themeBtn.innerHTML = '🌙 Dark Mode';
    }

    localStorage.setItem(
        "theme",
        document.body.classList.contains("dark")
            ? "dark" : "light"
    );

};


render();

// Add/Edit
form.addEventListener("submit", e => {
    e.preventDefault();
    let obj = {

        desc: description.value.trim(),
        amt: parseFloat(amount.value),
        date: date.value,
        category: category.value,
        id: Date.now()
    };

    if (!obj.desc || isNaN(obj.amt))
        return;

    expenses.push(obj);
    save();
    form.reset();

    render();
});

function save() {
    localStorage.setItem(
        "expenses",
        JSON.stringify(expenses)
    );
}


function render() {
    list.innerHTML = '';
    let filtered = [...expenses]
        .filter(e =>
            e.desc.toLowerCase()
                .includes(
                    searchInput.value.toLowerCase()
                )
        );
    if (filter.value !== "all") {
        filtered = filtered.filter(
            e => e.category === filter.value
        );
    }
    if (sort.value === "high")
        filtered.sort((a, b) => b.amt - a.amt);
    else if (sort.value === "low")
        filtered.sort((a, b) => a.amt - b.amt);
    else if (sort.value === "oldest")
        filtered.reverse();
    let total = 0;
    filtered.forEach(e => {
        total += e.amt;
        list.innerHTML += `
<li class="list-group-item d-flex justify-content-between align-items-center">
<div>
<b>${e.desc}</b><br>
${e.category}<br>
${e.date}<br>
₹${e.amt}
</div>

<div>
<button
class="btn btn-danger btn-sm"
onclick="deleteExpense(${e.id})">
Delete
</button>

<button
class="btn btn-primary btn-sm ms-2 px-3"
onclick="editExpense(${e.id})">
Edit
</button>

</div>
</li>
`;
    });
    totalExpense.innerText = "₹" + total;
    transactionCount.innerText = filtered.length;
    highestExpense.innerText =
        "₹" +
        Math.max(
            ...filtered.map(x => x.amt),
            0
        );
    budgetCheck(total);
    createProgress();
    createCategoryTotals();
    drawCharts();
}

// ================ edit feature start =============

let currentEditBtnId = null; 

const editExpense = (id) => { 
  currentEditBtnId = id; 
  let data = localStorage.getItem('expenses') || "[]"; 
  const myExpenseList = JSON.parse(data); 
  
  let targetExpense = null; 
  for(let i=0; i<myExpenseList.length; i++){ 
    if(myExpenseList[i].id == id){ 
      targetExpense = myExpenseList[i]; 
      break; 
    } 
  } 
  
  if(!targetExpense) { 
    console.error("Expense not found for editing"); 
    return; 
  } 

  const modalHTML = ` 
    <div class="modal fade show" id="bootstrapEditModal" tabindex="-1" style="display: block; background: rgba(0,0,0,0.6);" aria-modal="true" role="dialog"> 
      <div class="modal-dialog modal-dialog-centered modal-sm"> 
        <div class="modal-content shadow"> 
          <div class="modal-header py-2"> 
            <h6 class="modal-title fw-bold">Edit Item</h6> 
            <button type="button" class="btn-close" onclick="closeModal()"></button> 
          </div> 
          <div class="modal-body py-2" style="font-size: 14px;"> 
            
            <div class="mb-2"> 
              <label class="form-label small fw-bold mb-1">Description</label> 
              <input type="text" id="mDescription" class="form-control form-control-sm" value="${targetExpense.desc || ''}"> 
            </div> 
            
            <div class="mb-2"> 
              <label class="form-label small fw-bold mb-1">Amount</label> 
              <input type="number" id="mAmount" class="form-control form-control-sm" value="${targetExpense.amt || ''}"> 
            </div>

            <div class="mb-2"> 
              <label class="form-label small fw-bold mb-1">Date</label> 
              <input type="date" id="mDate" class="form-control form-control-sm" value="${targetExpense.date || ''}"> 
            </div>

            <div class="mb-2"> 
              <label class="form-label small fw-bold mb-1">Category</label> 
              <select id="mCategory" class="form-select form-select-sm">
                <option value="Shopping" ${targetExpense.category === 'Shopping' ? 'selected' : ''}>Shopping</option>
                <option value="Food" ${targetExpense.category === 'Food' ? 'selected' : ''}>Food</option>
                <option value="Bills" ${targetExpense.category === 'Bills' ? 'selected' : ''}>Bills</option>
                <option value="Travel" ${targetExpense.category === 'Travel' ? 'selected' : ''}>Travel</option>
                <option value="Others" ${targetExpense.category === 'Others' ? 'selected' : ''}>Others</option>
              </select>
            </div>

          </div> 
          <div class="modal-footer py-2"> 
            <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal()">Cancel</button> 
            <button type="button" class="btn btn-sm btn-primary" onclick="saveChanges()">Save</button> 
          </div> 
        </div> 
      </div> 
    </div> `; 
    
  document.body.insertAdjacentHTML('beforeend', modalHTML); 
}; 

const saveChanges = () => { 
  let mDescription = document.getElementById('mDescription').value.trim(); 
  let mAmount = parseFloat(document.getElementById('mAmount').value); 
  let mDate = document.getElementById('mDate').value; 
  let mCategory = document.getElementById('mCategory').value; 
  
  if(!mDescription || isNaN(mAmount) || !mDate) { 
    alert("Please enter valid details"); 
    return; 
  } 
  let data = localStorage.getItem('expenses') || "[]"; 
  let expenseList = JSON.parse(data); 
  for (let i = 0; i < expenseList.length; i++) { 
    if (expenseList[i].id == currentEditBtnId) { 
      expenseList[i].desc = mDescription; 
      expenseList[i].amt = mAmount; 
      expenseList[i].date = mDate; 
      expenseList[i].category = mCategory; 
      break; 
    } 
  } 
  localStorage.setItem('expenses', JSON.stringify(expenseList)); 
  expenses = expenseList; 
  closeModal(); 
  render(); 
};

function closeModal() { 
  const modal = document.getElementById('bootstrapEditModal'); 
  if (modal) { 
    modal.remove(); 
  } 
}

// ============= edit feature end =============


window.deleteExpense = function (id) {
    expenses = expenses.filter(
        e => e.id !== id
    );
    save();
    render();
}



function budgetCheck(total) {
    let budget =
        parseFloat(
            budgetInput.value
        ) || 0;
    remaining.innerText =
        budget - total;
    remaining.style.color =
        budget > 0 && total > budget
            ? "red" : "green";
}

function createProgress() {
    let categories = {};
    expenses.forEach(e => {
        categories[e.category] =
            (categories[e.category] || 0)
            + e.amt;
    });

    progressContainer.innerHTML =
        Object.keys(categories)
            .map(key => `
<p>${key}</p>
<div class="progress">
<div
class="progress-bar"
style="width:${categories[key] / 10}%">
₹${categories[key]}
</div>
</div>
`)
            .join('');
}

function createCategoryTotals() {
    let categories = {};
    expenses.forEach(e => {
        categories[e.category] =
            (categories[e.category] || 0)
            + e.amt;
    });
    categoryTotals.innerHTML =
        Object.keys(categories)
            .map(key =>
                `<p>${key}: ₹${categories[key]}</p>`
            )
            .join('');
}

function drawCharts() {

    if (pieChartObj) pieChartObj.destroy();
    if (barChartObj) barChartObj.destroy();
    if (trendChartObj) trendChartObj.destroy();
    let categoryData = {};
    let monthData = {};

    expenses.forEach(e => {

        categoryData[e.category] =
            (categoryData[e.category] || 0)
            + e.amt;
        if (e.date) {
            let month =
                new Date(e.date)
                    .toLocaleString(
                        'default',
                        { month: 'short' }
                    );

            monthData[month] =
                (monthData[month] || 0)
                + e.amt;
        }
    });

    pieChartObj = new Chart(
        pieChart,
        {
            type: 'pie',
            data: {
                labels: Object.keys(categoryData),
                datasets: [{
                    data: Object.values(categoryData)
                }]
            }
        }
    );

    barChartObj = new Chart(
        barChart,
        {
            type: 'bar',
            data: {
                labels: Object.keys(monthData),
                datasets: [{
                    label: 'Monthly Spending',
                    data: Object.values(monthData)
                }]
            }
        }
    );

    trendChartObj = new Chart(
        trendChart,
        {
            type: 'line',
            data: {
                labels: expenses.map(
                    e => e.date || "No Date"
                ),
                datasets: [{
                    label: 'Expense Trend',
                    data: expenses.map(
                        e => e.amt
                    ),
                    fill: false
                }]
            }
        }
    );

}


searchInput.addEventListener(
    "input",
    render
);

filter.addEventListener(
    "change",
    render
);

sort.addEventListener(
    "change",
    render
);


// CSV Export
csvBtn.onclick = () => {

    let csv = "Description,Amount,Date,Category\n";

    expenses.forEach(e => {

        csv +=
            `"${e.desc}","${e.amt}","${e.date}","${e.category}"\n`;

    });

    let blob = new Blob(
        [csv],
        { type: "text/csv;charset=utf-8;" }
    );

    let link =
        document.createElement("a");

    link.href =
        URL.createObjectURL(blob);

    link.download =
        "expenses.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

}

// PDF Export

pdfBtn.onclick = () => {

    const { jsPDF } = window.jspdf;

    let doc =
        new jsPDF();

    doc.text(
        "Expense Report",
        20,
        20
    );

    let y = 40;

    expenses.forEach(e => {

        doc.text(
            `${e.desc} ₹${e.amt} ${e.date} ${e.category}`,
            20,
            y
        );

        y += 10;

        if (y > 270) {

            doc.addPage();

            y = 20;

        }

    });

    doc.save(
        "expenses.pdf"
    );

};